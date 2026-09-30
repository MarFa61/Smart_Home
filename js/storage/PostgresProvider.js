/* =========================================================
   IMPLEMENTAZIONE StorageProvider SU POSTGRESQL LOCALE
   Via il backend Node sul container "dbserver" del minipc Proxmox
   (github.com/MarFa61/smarthome-backend, GET/PUT /api/resources/{key}),
   che serve anche questa stessa pagina: API sulla stessa origine,
   quindi apiBaseUrl relativo e nessun CORS.
   Nessuna autenticazione (app raggiungibile solo dalla rete di casa):
   connect()/disconnect() si limitano a verificare che il backend
   risponda e a ricordare in localStorage lo stato scelto dall'utente,
   così Connect/Disconnect in Config e la riconnessione automatica al
   reload funzionano come con i provider precedenti.
   ========================================================= */

const POSTGRES_CONNECTED_KEY = 'smarthome.postgresConnected';

class PostgresProvider extends StorageProvider {
  /**
   * @param {{postgres: {apiBaseUrl: string}}} config
   */
  constructor({ postgres }) {
    super();
    this._apiBaseUrl = postgres.apiBaseUrl;
    this._connected = false;
  }

  get providerName() {
    return 'PostgreSQL';
  }

  async connect() {
    // Una lettura qualunque: se il backend o il database non rispondono, il Connect fallisce
    // subito con un errore visibile invece di risultare "connesso" senza esserlo.
    await this.load('devices.json');
    this._connected = true;
    localStorage.setItem(POSTGRES_CONNECTED_KEY, 'true');
  }

  /** Vedi OneDriveProvider.tryRestoreSession(): stessa logica, nessuna richiesta di rete. */
  async tryRestoreSession() {
    this._connected = localStorage.getItem(POSTGRES_CONNECTED_KEY) === 'true';
    return this._connected;
  }

  async disconnect() {
    this._connected = false;
    localStorage.removeItem(POSTGRES_CONNECTED_KEY);
  }

  isConnected() {
    return this._connected;
  }

  /** Nessun account: al suo posto l'indirizzo del server, mostrato accanto all'icona di stato. */
  connectedAccountEmail() {
    return this._connected ? location.host : null;
  }

  _resourceUrl(resourceKey) {
    return `${this._apiBaseUrl}/resources/${encodeURIComponent(resourceKey)}`;
  }

  async load(resourceKey) {
    const response = await fetch(this._resourceUrl(resourceKey));
    if (!response.ok) {
      throw new Error(`Error loading "${resourceKey}" (HTTP ${response.status}).`);
    }
    // Il backend risponde sempre 200 con {data: null, version: null} se la risorsa non esiste.
    return response.json();
  }

  async save(resourceKey, data, expectedVersion) {
    const response = await fetch(this._resourceUrl(resourceKey), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, expectedVersion }),
    });

    if (response.status === 412) {
      throw new StorageConflictError(resourceKey);
    }
    if (!response.ok) {
      throw new Error(`Error saving "${resourceKey}" (HTTP ${response.status}).`);
    }

    return response.json();
  }
}
