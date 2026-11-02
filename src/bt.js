import { connectSmartCube } from 'smartcube-web-bluetooth';
import pkg from '../package.json';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import './insight.js';

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

// Marca a partir del nombre Bluetooth (solo para mostrarla en Ajustes).
const brandOf = (name) => /^(GAN|MG|AiCube)/i.test(name || '') ? 'GAN' : /^WCU_MY|^MY/i.test(name || '') ? 'MoYu'
  : /^QY|^XMD/i.test(name || '') ? 'QiYi' : /^(Gi|Mi Smart|Hi-)/i.test(name || '') ? 'Giiker' : /^Go/i.test(name || '') ? 'GoCube' : '';

let conn = null;
// Se puede tener varios cubos guardados, pero solo uno conectado a la vez.
window.disconnectCube = async (app) => {
  const c = conn; conn = null;
  try { if (c) await (c.disconnect ? c.disconnect() : null); } catch (e) { console.error(e); }
  app.setStatus('Conectar', false);
};
window.connectCube = async (app) => {
  if (!navigator.bluetooth) return app.toast('Web Bluetooth no disponible. Usa Chrome en Android u ordenador.');
  if (conn) await window.disconnectCube(app); // evita recibir giros de dos cubos a la vez
  let used = null, lastName = '';
  const provider = async (device, isFallback) => {
    lastName = device?.name || lastName;
    const saved = app.getDevice(lastName);
    if (saved?.mac && !isFallback) return (used = saved.mac); // MAC ya probada con este cubo
    let def = (isFallback && used) || guessMac(lastName);
    for (;;) {
      const gan = brandOf(lastName) === 'GAN';
      const t = prompt(
        'MAC de tu cubo ' + (lastName ? '(' + lastName + ')' : '') + '\nFormato: AA:BB:CC:DD:EE:FF' +
        (def ? '\n\nSugerida a partir del nombre; si no conecta, introduce la correcta.' : '') +
        (gan && !def ? '\n\nGAN: en Chrome para Android suele detectarse sola (pulsa Cancelar). En ordenador, si el navegador no puede leerla, introdúcela: la verás en la app Cube Station o con nRF Connect.' : '') +
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
    app.registerDevice(name, used || '', [brandOf(name), conn.protocol].filter(Boolean).join(' · ')); // la MAC solo se guarda si la has escrito y ha funcionado
    app.setStatus(name, true);
    app.toast('Conectado: ' + name + ' (' + (conn.protocol || '?') + ')');
    let first = true; // el primer estado real del cubo sustituye al virtual
    conn.events$.subscribe((e) => {
      if (e.type === 'MOVE') { app.log('MOVE ' + JSON.stringify(e).slice(0, 160)); app.onMove(e.move); }
      else if (e.type === 'FACELETS') {
        // Diagnóstico: se registra cada estado para poder comparar el orden de pegatinas con URFDLB.
        app.log('FACELETS ' + e.facelets);
        // Solo el primer estado sustituye al cubo virtual. Los siguientes se ignoran: el cubo virtual
        // avanza con los giros (MOVE). Así, si la librería entrega las pegatinas en otro orden,
        // el cubo de la pantalla no se desordena tras cada giro.
        if (first) {
          first = false;
          const SOLVED = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
          if (e.facelets === SOLVED) app.setFacelets(e.facelets, true);
          else if (confirm('El cubo informa de un estado DESORDENADO.\n\n¿Está resuelto en realidad? (los GAN guardan su propio estado y a veces se descuadra)\n\nAceptar = tratarlo como resuelto\nCancelar = usar el estado que informa el cubo')) {
            app.resync(); // cubo virtual resuelto
            try { conn.sendCommand({ type: 'REQUEST_RESET' }); } catch (err) { app.log('Reset no disponible: ' + err.message); }
          } else app.setFacelets(e.facelets, true);
        }
      }
      else if (e.type === 'GYRO') {
        if (!window.__gyroLogged) { window.__gyroLogged = true; app.log('GYRO ' + JSON.stringify(e).slice(0, 140)); }
        app.gyro(e.quaternion || e.quat || e);
      }
      else if (e.type === 'DISCONNECT') app.setStatus('Desconectado', false);
      else if (e.type === 'BATTERY') { /* no se registra: llena el log y tapa los giros */ }
    });
    app.gyroWatch();
    if (conn.capabilities?.facelets) conn.sendCommand({ type: 'REQUEST_FACELETS' });
    if (conn.capabilities?.battery) conn.sendCommand({ type: 'REQUEST_BATTERY' });
  } catch (err) {
    conn = null;
    const unsupported = /unsupported|not supported|unknown|no matching|protocol/i.test(err.message || '');
    app.toast(unsupported ? 'Este cubo no se reconoce todavía. Copia el registro de Ajustes > Avanzado.' : 'No se pudo conectar: ' + err.message);
    app.log('ERROR ' + err.message);
    console.error(err);
  }
};
