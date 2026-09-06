/* =========================================================
   ISTANZA CONDIVISA DEL PROVIDER DI STORAGE
   Un solo provider per tutta l'app: sia il pannello Config sia
   Devices/Tables usano questa stessa istanza, per non avere due
   sessioni MSAL indipendenti.
   Il provider concreto è scelto dal selettore in Config → salvato in
   localStorage (per browser/device, come ColumnWidthStore) → richiede
   un ricaricamento pagina per cambiare, niente switch "a caldo" di due
   provider nella stessa sessione.
   OneDrive è stato messo da parte: OneDriveProvider.js e
   createStorageProvider() restano funzionanti nel codice, nel caso
   servisse di nuovo in futuro, ma non compare tra i provider
   disponibili (AVAILABLE_STORAGE_PROVIDERS sotto) — per riattivarlo
   basta aggiungere una riga lì, la UI in Config (colori-ui.js) mostra
   da sola un selettore invece del solo nome quando ce n'è più di uno.
   ========================================================= */

const STORAGE_PROVIDER_KEY = 'smarthome.storageProvider';

// Unica voce oggi: nessuna vera scelta, quindi Config mostra il nome fisso invece di un
// tendina — vedi colori-ui.js. Per riabilitare OneDrive: aggiungere
// { id: 'onedrive', label: 'OneDrive' } qui.
const AVAILABLE_STORAGE_PROVIDERS = [
  { id: 'azuresql', label: 'Azure SQL' },
];

// Ignora un valore salvato che non è (più) tra quelli disponibili — es. "onedrive" rimasto
// in localStorage da prima che fosse tolto dalla UI: senza questo controllo l'app tornava a
// istanziare silenziosamente OneDriveProvider nonostante non fosse più selezionabile.
function getSelectedStorageProviderId() {
  const stored = localStorage.getItem(STORAGE_PROVIDER_KEY);
  const isValid = AVAILABLE_STORAGE_PROVIDERS.some(p => p.id === stored);
  return isValid ? stored : AVAILABLE_STORAGE_PROVIDERS[0].id;
}

function setSelectedStorageProviderId(id) {
  localStorage.setItem(STORAGE_PROVIDER_KEY, id);
}

function createStorageProvider(id) {
  if (id === 'azuresql') return new AzureSqlProvider(STORAGE_CONFIG);
  return new OneDriveProvider(STORAGE_CONFIG);
}

const appStorage = createStorageProvider(getSelectedStorageProviderId());

// Avviato subito, prima che qualunque sezione si inizializzi: se una sessione
// era già attiva (login precedente), la ritrova senza popup, per una connessione
// automatica. Ogni sezione deve attendere questa promise prima di controllare
// appStorage.isConnected().
const appStorageReady = appStorage.tryRestoreSession();

// Il Connect/Disconnect vive solo in Config (unico punto di connessione per tutta
// l'app, vedi colori-ui.js): Devices e Tables non hanno più i propri pulsanti, ma
// devono comunque aggiornare la loro icona di stato — e caricare/svuotare i propri
// dati — quando la connessione cambia altrove. notifyStorageConnectionChange() va
// chiamata da Config dopo ogni connect()/disconnect() riuscito.
const _storageConnectionListeners = [];

function onStorageConnectionChange(callback) {
  _storageConnectionListeners.push(callback);
}

function notifyStorageConnectionChange(connected) {
  _storageConnectionListeners.forEach(callback => callback(connected));
}

// Ricaricando la pagina con una sessione già attiva, tryRestoreSession() la ritrova
// subito (solo lettura della cache MSAL, istantanea) ma il primo recupero dati vero e
// proprio — rinnovo silenzioso del token, eventuale risveglio del backend — può
// richiedere alcuni secondi. Senza indicazione, in quella finestra l'utente vede le
// varie sezioni con stati apparentemente incoerenti (una già "connessa", un'altra
// ancora no) e rischia di mettersi a cliccare in giro inutilmente. Le 3 sezioni
// (Devices/Tables/Config) partono tutte in parallelo allo stesso reload: un contatore
// condiviso mantiene il popup visibile finché anche l'ultima non ha finito.
let _reconnectingCount = 0;

function _showReconnectingModal() {
  const dlg = document.getElementById('reconnectingDlg');
  const iconUrl = connStatusIconUrl(true);
  const iconEl = document.getElementById('reconnectDlgIcon');
  if (iconUrl) {
    iconEl.src = iconUrl;
    iconEl.style.display = '';
  } else {
    iconEl.style.display = 'none';
  }
  document.getElementById('reconnectDlgProviderName').textContent = appStorage.providerName;
  if (!dlg.open) dlg.showModal();
}

function _hideReconnectingModal() {
  const dlg = document.getElementById('reconnectingDlg');
  if (dlg.open) dlg.close();
}

// Sotto questa soglia il ripristino è già "caldo" (token ancora valido, backend già
// sveglio): mostrare comunque il popup sarebbe un lampo fastidioso per un'attesa che
// l'utente non fa nemmeno in tempo a percepire, e darebbe l'impressione sbagliata che
// l'app si sia disconnessa quando in realtà la sessione era già valida. Il popup ha
// senso solo per l'attesa realmente percepibile (il caso dei ~10 secondi osservato).
const RECONNECT_MODAL_DELAY_MS = 300;

/** Da chiamare al posto di "appStorageReady.then(giaConnesso => ...)" nel
 *  DOMContentLoaded di ogni sezione: incapsula il controllo (unificato, prima era
 *  incoerente tra sezioni) ed espone all'utente l'attesa della riconnessione
 *  automatica, ma solo se dura abbastanza da essere percepita (vedi
 *  RECONNECT_MODAL_DELAY_MS sopra). Nessun popup se non c'era alcuna sessione da
 *  ritrovare — in quel caso la sezione resta semplicemente "Not connected". */
async function autoReconnectAndLoad(loadFn) {
  const giaConnesso = await appStorageReady;
  if (!giaConnesso && !appStorage.isConnected()) return;

  let shown = false;
  const timer = setTimeout(() => {
    shown = true;
    _reconnectingCount++;
    if (_reconnectingCount === 1) _showReconnectingModal();
  }, RECONNECT_MODAL_DELAY_MS);

  try {
    await loadFn();
  } finally {
    clearTimeout(timer);
    if (shown) {
      _reconnectingCount--;
      if (_reconnectingCount === 0) _hideReconnectingModal();
    }
  }
}
