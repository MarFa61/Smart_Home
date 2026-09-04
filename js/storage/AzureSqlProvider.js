/* =========================================================
   IMPLEMENTAZIONE StorageProvider SU AZURE SQL
   Via il backend Azure Functions (github.com/MarFa61/smarthome-backend,
   GET/PUT /api/resources/{key}), autenticazione con MSAL.js verso lo
   scope esposto dall'app registration "smarthome-api-mfasani" (Easy
   Auth sul lato Function App valida lo stesso token). Stesso account
   Microsoft personale già usato per OneDrive.
   Richiede che MSAL.js (msal-browser) sia caricato in pagina prima di
   questo file (vedi index.html).
   ========================================================= */

class AzureSqlProvider extends StorageProvider {
  /**
   * @param {{clientId: string, redirectUri: string, azureSql: {apiScope: string, apiBaseUrl: string}}} config
   */
  constructor({ clientId, redirectUri, azureSql }) {
    super();
    this._scopes = [azureSql.apiScope];
    this._apiBaseUrl = azureSql.apiBaseUrl;
    this._account = null;
    this._msalApp = new msal.PublicClientApplication({
      auth: {
        clientId,
        authority: 'https://login.microsoftonline.com/consumers',
        redirectUri,
      },
      cache: { cacheLocation: 'localStorage' },
    });
  }

  get providerName() {
    return 'Azure SQL';
  }

  async connect() {
    await this._msalApp.initialize();

    const existing = this._msalApp.getAllAccounts();
    if (existing.length > 0) {
      this._account = existing[0];
      return;
    }

    const result = await this._msalApp.loginPopup({ scopes: this._scopes, prompt: 'select_account' });
    this._account = result.account;
  }

  /** Vedi OneDriveProvider.tryRestoreSession(): stessa logica, nessun popup. */
  async tryRestoreSession() {
    await this._msalApp.initialize();
    const existing = this._msalApp.getAllAccounts();
    if (existing.length > 0) {
      this._account = existing[0];
      return true;
    }
    return false;
  }

  async disconnect() {
    if (this._account) {
      await this._msalApp.logoutPopup({ account: this._account });
      this._account = null;
    }
  }

  isConnected() {
    return !!this._account;
  }

  connectedAccountEmail() {
    return this._account ? this._account.username : null;
  }

  async _getAccessToken() {
    if (!this._account) throw new Error('Not connected to Azure SQL: call connect() first.');
    try {
      const result = await this._msalApp.acquireTokenSilent({
        scopes: this._scopes,
        account: this._account,
      });
      return result.accessToken;
    } catch (error) {
      const result = await this._msalApp.acquireTokenPopup({ scopes: this._scopes });
      this._account = result.account;
      return result.accessToken;
    }
  }

  _resourceUrl(resourceKey) {
    return `${this._apiBaseUrl}/resources/${encodeURIComponent(resourceKey)}`;
  }

  async load(resourceKey) {
    const token = await this._getAccessToken();
    const response = await fetch(this._resourceUrl(resourceKey), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Error loading "${resourceKey}" (HTTP ${response.status}).`);
    }
    // Il backend risponde sempre 200 con {data: null, version: null} se la risorsa non esiste.
    return response.json();
  }

  async save(resourceKey, data, expectedVersion) {
    const token = await this._getAccessToken();
    const response = await fetch(this._resourceUrl(resourceKey), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
