/* =========================================================
   CONTRATTO DI STORAGE ASTRATTO
   Nessuna parte dell'app fuori da questo folder deve conoscere
   dettagli del provider concreto (OneDrive, o un domani altro).
   ========================================================= */

class StorageProvider {
  /** Nome visualizzato del provider (es. "OneDrive"), per i messaggi di stato in UI. */
  get providerName() { throw new Error('providerName non implementato'); }

  /** Avvia l'autenticazione con il provider. */
  async connect() { throw new Error('connect() non implementato'); }

  /** Termina la sessione con il provider. */
  async disconnect() { throw new Error('disconnect() non implementato'); }

  /** true se una sessione valida è attiva. */
  isConnected() { throw new Error('isConnected() non implementato'); }

  /**
   * Carica una risorsa (es. "devices.json").
   * @returns {Promise<{data: any, version: string|null}>} data è null se la risorsa non esiste ancora.
   */
  async load(resourceKey) { throw new Error('load() non implementato'); }

  /**
   * Salva una risorsa con concorrenza ottimistica.
   * @param {string} resourceKey
   * @param {any} data
   * @param {string|null} expectedVersion - versione letta dall'ultimo load(); null per una risorsa nuova.
   * @returns {Promise<{version: string}>}
   * @throws {StorageConflictError} se la risorsa è cambiata da un altro dispositivo/sessione nel frattempo.
   */
  async save(resourceKey, data, expectedVersion) { throw new Error('save() non implementato'); }
}

class StorageConflictError extends Error {
  constructor(resourceKey) {
    super(`Save conflict on "${resourceKey}": remote data changed in the meantime.`);
    this.name = 'StorageConflictError';
    this.resourceKey = resourceKey;
  }
}
