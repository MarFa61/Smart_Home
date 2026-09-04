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
