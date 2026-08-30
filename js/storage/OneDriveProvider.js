/* =========================================================
   IMPLEMENTAZIONE StorageProvider SU ONEDRIVE
   Via Microsoft Graph API, autenticazione con MSAL.js (account
   Microsoft personale). I dati vivono nella cartella isolata
   dell'app (Apps/Smart Home su OneDrive, scope Files.ReadWrite.AppFolder):
   nessun altro file del Drive è mai toccato.
   Richiede che MSAL.js (msal-browser) sia caricato in pagina
   prima di questo file (vedi index.html).
   ========================================================= */

class OneDriveProvider extends StorageProvider {
  /**
   * @param {{clientId: string, redirectUri: string}} config
   */
  constructor({ clientId, redirectUri }) {
    super();
    this._scopes = ['Files.ReadWrite.AppFolder'];
    this._account = null;
    this._msalApp = new msal.PublicClientApplication({
      auth: {
        clientId,
        // "consumers": solo account Microsoft personali (coerente con l'uso previsto).
        authority: 'https://login.microsoftonline.com/consumers',
        redirectUri,
      },
      cache: { cacheLocation: 'localStorage' },
    });
  }

  async connect() {
    await this._msalApp.initialize();

    const existing = this._msalApp.getAllAccounts();
    if (existing.length > 0) {
      this._account = existing[0];
      return;
    }

    const result = await this._msalApp.loginPopup({ scopes: this._scopes });
    this._account = result.account;
  }

  /**
   * Ripristina una sessione già autenticata in precedenza (account MSAL in cache),
   * senza mai aprire un popup — a differenza di connect(). Va chiamata all'avvio
   * dell'app per rendere la connessione automatica quando possibile; se non c'è
   * nessuna sessione da ripristinare (primo utilizzo), resta necessario un click
   * esplicito su "Connetti", perché i browser bloccano i popup non originati da
   * un gesto dell'utente.
   * @returns {Promise<boolean>} true se una sessione è stata ripristinata.
   */
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

  async _getAccessToken() {
    if (!this._account) throw new Error('Non connesso a OneDrive: chiamare connect() prima.');
    try {
      const result = await this._msalApp.acquireTokenSilent({
        scopes: this._scopes,
        account: this._account,
      });
      return result.accessToken;
    } catch (error) {
      // Il token silenzioso può fallire (es. sessione scaduta): si ripete l'accesso interattivo.
      const result = await this._msalApp.acquireTokenPopup({ scopes: this._scopes });
      this._account = result.account;
      return result.accessToken;
    }
  }

  _itemUrl(resourceKey) {
    return `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${encodeURIComponent(resourceKey)}`;
  }

  _contentUrl(resourceKey) {
    return `${this._itemUrl(resourceKey)}:/content`;
  }

  async load(resourceKey) {
    const token = await this._getAccessToken();
    const authHeader = { Authorization: `Bearer ${token}` };

    // Graph non espone l'header ETag a fetch() per limiti CORS: la versione va letta
    // dal corpo JSON della risorsa driveItem, che richiede una chiamata separata dal
    // contenuto (la chiamata a :/content restituisce i byte grezzi del file, non i metadati).
    const metaResponse = await fetch(this._itemUrl(resourceKey), { headers: authHeader });
    if (metaResponse.status === 404) {
      return { data: null, version: null };
    }
    if (!metaResponse.ok) {
      throw new Error(`Errore nel caricamento di "${resourceKey}" (HTTP ${metaResponse.status}).`);
    }
    const meta = await metaResponse.json();

    const contentResponse = await fetch(this._contentUrl(resourceKey), { headers: authHeader });
    if (!contentResponse.ok) {
      throw new Error(`Errore nel caricamento di "${resourceKey}" (HTTP ${contentResponse.status}).`);
    }
    const data = await contentResponse.json();

    return { data, version: meta.cTag };
  }

  async save(resourceKey, data, expectedVersion) {
    const token = await this._getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (expectedVersion) {
      headers['If-Match'] = expectedVersion;
    }

    const response = await fetch(this._contentUrl(resourceKey), {
      method: 'PUT',
      headers,
      body: JSON.stringify(data, null, 2),
    });

    if (response.status === 412) {
      throw new StorageConflictError(resourceKey);
    }
    if (!response.ok) {
      throw new Error(`Errore nel salvataggio di "${resourceKey}" (HTTP ${response.status}).`);
    }

    // Come per load(): la versione aggiornata arriva nel corpo JSON del driveItem, non negli header.
    // cTag (non eTag) perché riflette in modo affidabile e immediato il cambio di contenuto.
    const updatedItem = await response.json();
    return { version: updatedItem.cTag };
  }
}
