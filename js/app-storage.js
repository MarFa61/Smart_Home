/* =========================================================
   ISTANZA CONDIVISA DEL PROVIDER DI STORAGE
   Un solo OneDriveProvider per tutta l'app: sia il pannello di
   test in Config sia la sezione Devices usano questa stessa
   istanza, per non avere due sessioni MSAL indipendenti.
   ========================================================= */

const appStorage = new OneDriveProvider(STORAGE_CONFIG);

// Avviato subito, prima che qualunque sezione si inizializzi: se una sessione OneDrive
// era già attiva (login precedente), la ritrova senza popup, per una connessione
// automatica. Ogni sezione deve attendere questa promise prima di controllare
// appStorage.isConnected().
const appStorageReady = appStorage.tryRestoreSession();
