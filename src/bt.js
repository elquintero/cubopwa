import { connectSmartCube } from 'smartcube-web-bluetooth';
import pkg from '../package.json';

// La versión se define una sola vez, en package.json, y se muestra en Ajustes.
window.APP_VERSION = pkg.version;
const verEl = document.getElementById('ver');
if (verEl) verEl.textContent = pkg.version;

// Los MoYu cifran los datos con una clave derivada de su MAC. Con una MAC incorrecta la librería
// conecta pero no puede leer nada ("Timed out waiting for cube data").
const norm = (m) => {
  const h = (m || '').toUpperCase().replace(/[^0-9A-F]/g, '');
  return h.length === 12 ? h.match(/../g).join(':') : null;
};
// En tu MoYu32 la MAC es CF:30:16:00 + las 4 últimas cifras del nombre (WCU_MY32_BFA0 -> CF:30:16:00:BF:A0).
const guessMac = (name) => {
  const m = /^WCU_MY32_([0-9A-F]{4})$/i.exec(name || '');
  return m ? 'CF:30:16:00:' + m[1].slice(0, 2).toUpperCase() + ':' + m[1].slice(2).toUpperCase() : '';
};

let conn = null;
window.connectCube = async (app) => {
  if (!navigator.bluetooth) return app.toast('Web Bluetooth no disponible. Usa Chrome en Android u ordenador.');
  let used = null, lastName = '';
  const provider = async (device, isFallback) => {
    lastName = device?.name || lastName;
    const saved = app.getDevice(lastName);
    if (saved?.mac && !isFallback) return (used = saved.mac); // MAC ya probada con este cubo
    let def = (isFallback && used) || guessMac(lastName);
    for (;;) {
      const t = prompt(
        'MAC de tu cubo ' + (lastName ? '(' + lastName + ')' : '') + '\nFormato: AA:BB:CC:DD:EE:FF' +
        (def ? '\n\nSugerida a partir del nombre; si no conecta, introduce la correcta.' : '') +
        (isFallback ? '\nLa anterior no funcionó.' : '') + '\n(Cancelar = intentar detectarla sola)', def);
      if (t === null) return null;
      const mac = norm(t);
      if (mac) return (used = mac);
      alert('MAC no válida: deben ser 12 caracteres hexadecimales.');
      def = t;
    }
  };
  // Según la versión de la librería, el argumento es una función o un objeto de opciones: valen ambos.
  provider.macAddressProvider = provider;
  provider.customMacAddressProvider = provider;
  try {
    conn = await connectSmartCube(provider);
    const name = conn.deviceName || lastName || 'Cubo';
    if (used) app.registerDevice(name, used); // solo se guarda una MAC que ha funcionado
    app.setStatus(name, true);
    app.toast('Conectado: ' + name + ' (' + (conn.protocol || '?') + ')');
    let first = true; // el primer estado real del cubo sustituye al virtual
    conn.events$.subscribe((e) => {
      if (e.type === 'MOVE') { app.log('MOVE ' + e.move); app.onMove(e.move); }
      else if (e.type === 'FACELETS') { app.setFacelets(e.facelets, first); first = false; }
      else if (e.type === 'DISCONNECT') app.setStatus('Desconectado', false);
      else if (e.type === 'BATTERY') app.log('Batería ' + e.batteryLevel + '%');
    });
    if (conn.capabilities?.facelets) conn.sendCommand({ type: 'REQUEST_FACELETS' });
    if (conn.capabilities?.battery) conn.sendCommand({ type: 'REQUEST_BATTERY' });
  } catch (err) {
    app.toast('No se pudo conectar: ' + err.message);
    app.log('ERROR ' + err.message);
    console.error(err);
  }
};
