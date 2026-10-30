import { connectSmartCube } from 'smartcube-web-bluetooth';

// Los MoYu cifran los datos con una clave derivada de la dirección MAC del cubo.
// Si la MAC es incorrecta, la librería se conecta pero no puede leer nada ("Timed out waiting for cube data").
const norm = (m) => {
  const h = (m || '').toUpperCase().replace(/[^0-9A-F]/g, '');
  return h.length === 12 ? h.match(/../g).join(':') : null;
};
const macProvider = async (device, isFallback) => {
  const k = 'mac:' + (device?.name || device?.id || '');
  let mac = isFallback ? null : localStorage.getItem(k);
  while (!mac) {
    const t = prompt(
      'Dirección MAC de tu cubo ' + (device?.name ? '(' + device.name + ')' : '') +
      '\nFormato: AA:BB:CC:DD:EE:FF\n(Cancelar = dejar que la app la intente detectar sola)',
      ''
    );
    if (t === null) return null;
    mac = norm(t);
    if (!mac) alert('MAC no válida: deben ser 12 caracteres hexadecimales.');
  }
  localStorage.setItem(k, mac);
  return mac;
};
// Según la versión de la librería, el argumento es una función o un objeto de opciones: valen ambos.
macProvider.macAddressProvider = macProvider;
macProvider.customMacAddressProvider = macProvider;

const forgetMacs = () => Object.keys(localStorage).filter((k) => k.startsWith('mac:')).forEach((k) => localStorage.removeItem(k));

let conn = null;
window.connectCube = async (app) => {
  if (!navigator.bluetooth) return app.toast('Web Bluetooth no disponible. Usa Chrome en Android u ordenador.');
  try {
    conn = await connectSmartCube(macProvider);
    app.setStatus(conn.deviceName || 'Cubo conectado', true);
    app.toast('Conectado: ' + (conn.deviceName || 'cubo') + ' (' + (conn.protocol || '?') + ')');
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
    forgetMacs(); // una MAC errónea no se vuelve a usar
    app.toast('No se pudo conectar: ' + err.message + ' · Se ha olvidado la MAC guardada.');
    app.log('ERROR ' + err.message);
    console.error(err);
  }
};
