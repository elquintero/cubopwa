import { connectSmartCube } from 'smartcube-web-bluetooth';

// Las cubos MoYu cifran el tráfico con una clave derivada de su dirección MAC.
// Chrome oculta la MAC, así que si la librería no la consigue sola, la pedimos una vez y la recordamos.
const macProvider = async (device, isFallback) => {
  const k = 'mac:' + (device?.id || '');
  let mac = localStorage.getItem(k);
  if (!mac || isFallback) {
    mac = prompt('Dirección MAC del cubo (formato AA:BB:CC:DD:EE:FF).\nLa encuentras en Ajustes > Bluetooth de tu móvil o en la app de MoYu:');
    if (mac) localStorage.setItem(k, mac.trim());
  }
  return mac || null;
};

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
    app.toast('No se pudo conectar: ' + err.message);
    console.error(err);
  }
};
