/* =========================================================
   ICONA STATO CONNESSIONE — sostituisce il testo "Connesso/Non
   connesso a OneDrive" con un'illustrazione differenziata per
   dispositivo (Mac mini / iPad / iPhone); il testo resta come
   tooltip (attributo title) e come alternativa testuale se il
   dispositivo non è tra i 3 riconosciuti.

   Nota: Safari su iPadOS si presenta con lo stesso userAgent e lo
   stesso navigator.platform di macOS (scelta di Apple per la
   compatibilità dei siti "desktop") — la distinzione da Mac si
   basa quindi sulla presenza di uno schermo touch (maxTouchPoints),
   assente sul Mac mini, non sullo userAgent da solo.
   ========================================================= */

function detectAppleDeviceKind() {
  const ua = navigator.userAgent;
  if (/iPhone|iPod/.test(ua)) return 'iphone';
  const isTouchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iPad/.test(ua) || isTouchMac) return 'ipad';
  if (/Macintosh/.test(ua)) return 'mac-mini';
  return null;
}

const APP_DEVICE_KIND = detectAppleDeviceKind();
const CONN_STATUS_ICON_VERSION = 15;

function setConnStatusIcon(el, connected, fallbackText) {
  if (!APP_DEVICE_KIND) {
    el.textContent = fallbackText;
    return;
  }
  const state = connected ? 'connesso' : 'non-connesso';
  el.innerHTML = '';
  const img = document.createElement('img');
  img.src = `./img/conn-status/${state}-${APP_DEVICE_KIND}.png?v=${CONN_STATUS_ICON_VERSION}`;
  img.alt = connected ? 'Connected to OneDrive' : 'Not connected to OneDrive';
  img.title = fallbackText;
  img.className = 'conn-status-icon';
  el.appendChild(img);
}
