/* =========================================================
   ISTANZA CONDIVISA DEL PROVIDER DI STORAGE
   Un solo provider per tutta l'app: sia il pannello Config sia
   Devices/Tables usano questa stessa istanza, con un unico stato
   di connessione.
   Il provider concreto è scelto dal selettore in Config → salvato in
   localStorage (per browser/device, come ColumnWidthStore) → richiede
   un ricaricamento pagina per cambiare, niente switch "a caldo" di due
   provider nella stessa sessione.
   Oggi l'unico provider è PostgreSQL locale sul minipc Proxmox
   (PostgresProvider.js). OneDrive e Azure SQL, usati in passato, sono
   stati rimossi dal codice (recuperabili dalla cronologia git). Per
   aggiungere un provider basta una riga in AVAILABLE_STORAGE_PROVIDERS
   e un caso in createStorageProvider(): la UI in Config (colori-ui.js)
   mostra da sola un selettore invece del solo nome quando ce n'è più
   di uno.
   ========================================================= */

const STORAGE_PROVIDER_KEY = 'smarthome.storageProvider';

// Unica voce oggi: nessuna vera scelta, quindi Config mostra il nome fisso invece di un
// tendina — vedi colori-ui.js.
const AVAILABLE_STORAGE_PROVIDERS = [
  { id: 'postgres', label: 'PostgreSQL' },
];

// Ignora un valore salvato che non è (più) tra quelli disponibili — es. "onedrive" o
// "azuresql" rimasti in localStorage da provider ormai rimossi.
function getSelectedStorageProviderId() {
  const stored = localStorage.getItem(STORAGE_PROVIDER_KEY);
  const isValid = AVAILABLE_STORAGE_PROVIDERS.some(p => p.id === stored);
  return isValid ? stored : AVAILABLE_STORAGE_PROVIDERS[0].id;
}

function setSelectedStorageProviderId(id) {
  localStorage.setItem(STORAGE_PROVIDER_KEY, id);
}

function createStorageProvider(id) {
  return new PostgresProvider(STORAGE_CONFIG);
}

const appStorage = createStorageProvider(getSelectedStorageProviderId());

// Avviato subito, prima che qualunque sezione si inizializzi: connessione automatica
// al database, senza azioni dell'utente. Ogni sezione deve attendere questa promise prima di controllare
// appStorage.isConnected().
const appStorageReady = appStorage.tryRestoreSession();

// Connessione automatica all'apertura; l'unico controllo manuale è il pulsante Retry in
// Config (colori-ui.js), visibile solo se il database non risponde. Devices e Tables
// aggiornano la loro icona di stato — e caricano/svuotano i propri dati — quando la
// connessione cambia: notifyStorageConnectionChange() è chiamata da Config dopo un
// Retry riuscito e da autoReconnectAndLoad() se il database non risponde all'apertura.
const _storageConnectionListeners = [];

function onStorageConnectionChange(callback) {
  _storageConnectionListeners.push(callback);
}

function notifyStorageConnectionChange(connected) {
  _storageConnectionListeners.forEach(callback => callback(connected));
}

// All'apertura della pagina, dopo la connessione automatica, il primo recupero dati
// vero e proprio — eventuale backend lento a rispondere — può
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
 *  RECONNECT_MODAL_DELAY_MS sopra). Se il database non risponde, nessun popup: le
 *  sezioni ricevono una sola volta notifyStorageConnectionChange(false) e mostrano lo
 *  stato "non connesso" (con il pulsante Retry in Config). */
let _unavailableNotified = false;

async function autoReconnectAndLoad(loadFn) {
  const giaConnesso = await appStorageReady;
  if (!giaConnesso && !appStorage.isConnected()) {
    if (!_unavailableNotified) {
      _unavailableNotified = true;
      notifyStorageConnectionChange(false);
    }
    return;
  }

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
