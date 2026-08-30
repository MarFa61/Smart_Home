/* =========================================================
   STORE PER LA CONFIGURAZIONE DELL'APP (Colori, per ora)
   Stessa logica di DevicesStore ma per la risorsa "config.json":
   così le preferenze seguono l'utente su tutti i device, non
   solo sul browser in cui sono state impostate (a differenza
   di un semplice localStorage).
   ========================================================= */

class ConfigStore {
  constructor(storageProvider) {
    this._storageProvider = storageProvider;
    this._resourceKey = 'config.json';
    this.config = { colorOverrides: {} };
    this._version = null;
  }

  async load() {
    const { data, version } = await this._storageProvider.load(this._resourceKey);
    this.config = data || { colorOverrides: {} };
    if (!this.config.colorOverrides) this.config.colorOverrides = {};
    this._version = version;
    return this.config;
  }

  async save() {
    const { version } = await this._storageProvider.save(this._resourceKey, this.config, this._version);
    this._version = version;
  }
}
