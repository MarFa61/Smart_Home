/* =========================================================
   HELP FIELDS STORE — tab "Fields & Help" di Config: testo di aiuto per campo e,
   per i campi di Devices, se sono obbligatori (bordo rosso + blocco al Save in
   devices-ui.js). Stesso pattern di ColorStore: il catalogo dei campi (chiave,
   etichetta, schermata, tab) resta hardcoded qui sotto, come già TABLE_DEFS/
   DEV_GROUPS/AVAILABLE_STORAGE_PROVIDERS altrove in questo progetto — solo i due
   valori che l'utente può davvero cambiare (testo e mandatory) sono persistiti,
   come override dentro config.json (via ConfigStore), non l'intero catalogo.
   ========================================================= */

// Catalogo dei campi del dialog Device: chiave univoca, etichetta mostrata in
// Fields & Help, tab del dialog, proprietà di editingDevice che il campo alimenta
// (usata da devices-ui.js per leggere/validare il valore) e obbligatorietà di
// default (confermata da Marco il 2026-09-06). "Host Name" c'è (per il testo di
// aiuto) ma senza editingDeviceKey: è calcolato, non compilabile — vedi il
// commento sulla sua riga più sotto.
const DEVICE_HELP_FIELDS = [
  { key: 'devices.general.nickname', label: 'Nickname', tab: 'dtab-gen', domId: 'devNickname', editingDeviceKey: 'nickname', defaultMandatory: true, defaultText: 'Friendly name shown everywhere in the app to identify this device.' },
  { key: 'devices.general.brand', label: 'Brand', tab: 'dtab-gen', domId: 'devMarca', editingDeviceKey: 'marca', defaultMandatory: true, defaultText: "Manufacturer of the device, chosen from the Brand table (Tables section)." },
  { key: 'devices.general.model', label: 'Model', tab: 'dtab-gen', domId: 'devModello', editingDeviceKey: 'modello', defaultMandatory: true, defaultText: "Manufacturer's model name or number." },
  { key: 'devices.general.deviceType', label: 'Device type', tab: 'dtab-gen', domId: 'devTipoDispositivo', editingDeviceKey: 'tipoDispositivo', defaultMandatory: true, defaultText: 'Category of device (e.g. Smart Plug, Router), chosen from the Device type table.' },
  { key: 'devices.general.managingApp', label: 'Managing App', tab: 'dtab-gen', domId: 'devManagingApp', editingDeviceKey: 'managingApp', defaultMandatory: false, defaultText: 'App used to configure or control this device (e.g. Homey, a vendor app).' },
  { key: 'devices.general.connectionHub', label: 'Connection Hub', tab: 'dtab-gen', domId: 'devPhisicalHub', editingDeviceKey: 'phisicalHub', defaultMandatory: false, defaultText: 'Other device (hub/gateway) this device connects through, if any.' },
  { key: 'devices.general.connectedTo', label: 'Connected to', tab: 'dtab-gen', domId: 'devConnectedTo', editingDeviceKey: 'connectedTo', defaultMandatory: false, defaultText: 'What this device is physically or logically connected to (e.g. router, hub).' },
  { key: 'devices.general.connectionProtocol', label: 'Connection Protocol', tab: 'dtab-gen', domId: 'devProtocolloConnessione', editingDeviceKey: 'protocolloConnessione', defaultMandatory: false, defaultText: 'Main protocol used by this device (e.g. Wi-Fi, Zigbee, Z-Wave).' },
  // Lista (editingDevice.protocolli), non un campo scalare: findMissingRequiredFields()
  // e isDeviceFieldFilled() la trattano di conseguenza.
  { key: 'devices.general.supportedProtocols', label: 'Supported protocols', tab: 'dtab-gen', domId: 'devProtocolliList', editingDeviceKey: 'protocolli', isList: true, defaultMandatory: true, defaultText: 'All protocols this device can speak, even if only one is actively used.' },

  { key: 'devices.network.ssid', label: 'SSID', tab: 'dtab-net', domId: 'devSSID', editingDeviceKey: 'ssid', defaultMandatory: true, defaultText: 'Wi-Fi network this device is connected to, chosen from the SSID table.' },
  { key: 'devices.network.connectionSpeed', label: 'Connection Speed', tab: 'dtab-net', domId: 'devConnSpeed', editingDeviceKey: 'connectionSpeed', defaultMandatory: false, defaultText: 'Connection speed or link type, chosen from the Connection Speed table.' },
  // Calcolato al volo (computeHostName in hostname.js), mai salvato su editingDevice:
  // niente editingDeviceKey, quindi né Mandatory né la validazione al Save lo
  // riguardano (vedi il filtro "f.editingDeviceKey &&" in isMandatory-consumers).
  { key: 'devices.network.hostName', label: 'Host Name', tab: 'dtab-net', domId: 'devHostNamePreview', defaultMandatory: false, defaultText: 'Generated automatically as Category code – Zone code – Type code – Dev. Id. To change it, edit the host code of the relevant entry in Tables (Category/Zone/Type) or the Dev. Id. below — it updates everywhere at once.' },
  // Spostati qui da un ex tab "Configuration & Groups", poi eliminato (richiesta di
  // Marco del 2026-09-06) — le chiavi restano "devices.config.*" invariate per non
  // perdere testo/mandatory già eventualmente salvati sotto queste chiavi.
  { key: 'devices.config.devId', label: 'Dev. Id.', tab: 'dtab-net', domId: 'devId', editingDeviceKey: 'devId', defaultMandatory: false, defaultText: "Sequential id used to build the device's Host Name, unique within Category+Zone+Type." },
  { key: 'devices.config.devGroup', label: 'Dev. Group', tab: 'dtab-net', domId: 'devGroup', editingDeviceKey: 'devGroup', defaultMandatory: true, defaultText: 'Network/IP block this device belongs to; determines which IP addresses are suggested.' },
  { key: 'devices.config.devCategory', label: 'Dev. Category', tab: 'dtab-net', domId: 'devCategory', editingDeviceKey: 'devCategory', defaultMandatory: true, defaultText: "High-level category used to build the device's Host Name." },
  { key: 'devices.config.devZone', label: 'Dev. Zone', tab: 'dtab-net', domId: 'devZone', editingDeviceKey: 'devZone', defaultMandatory: true, defaultText: "Physical zone/room used to build the device's Host Name." },
  { key: 'devices.config.devType', label: 'Dev. Type', tab: 'dtab-net', domId: 'devType', editingDeviceKey: 'devType', defaultMandatory: true, defaultText: "Functional type used to build the device's Host Name." },
  { key: 'devices.network.connections', label: 'IP Address', tab: 'dtab-net', domId: 'devConnectionsList', editingDeviceKey: 'connections', isList: true, defaultMandatory: false, defaultText: 'IP address(es) assigned to this device — usually one, more only for devices with multiple network interfaces.' },

  { key: 'devices.status.progress', label: 'Progress', tab: 'dtab-stat', domId: 'devAvanzamento', editingDeviceKey: 'avanzamento', defaultMandatory: true, defaultText: 'Setup progress of this device (e.g. Planned, Active).' },
  { key: 'devices.status.homey', label: 'Connected to Homey?', tab: 'dtab-stat', domId: 'devHomey', editingDeviceKey: 'collegatoHomey', defaultMandatory: false, defaultText: 'Whether this device is connected to the Homey hub, with optional notes.' },
  { key: 'devices.status.homeKit', label: 'Integrated in HomeKit?', tab: 'dtab-stat', domId: 'devHomeKit', editingDeviceKey: 'integratoHomeKit', defaultMandatory: false, defaultText: 'Whether this device is integrated with Apple HomeKit, with optional notes.' },
  { key: 'devices.status.automations', label: 'Used in automations?', tab: 'dtab-stat', domId: 'devAutomazioni', editingDeviceKey: 'usatoAutomazioni', defaultMandatory: false, defaultText: 'Whether this device is used in any automation, with optional notes.' },
  { key: 'devices.status.notes', label: 'Notes', tab: 'dtab-stat', domId: 'devNote', editingDeviceKey: 'note', defaultMandatory: false, defaultText: 'Free-form notes about this device.' },
];

const DEVICE_HELP_TAB_LABELS = {
  'dtab-gen': 'General',
  'dtab-net': 'Network & Connectivity',
  'dtab-stat': 'Status & Notes',
};

// Config: pochi controlli (pulsanti/switch), niente Mandatory reale — la colonna
// resta comunque presente per coerenza di tabella, ma senza alcun effetto qui.
const CONFIG_HELP_FIELDS = [
  { key: 'config.backup.download', label: 'Download Backup', group: 'Backup & Restore', defaultText: 'Downloads a JSON snapshot of Devices, Tables and Colors to your computer.' },
  { key: 'config.backup.restore', label: 'Restore from file', group: 'Backup & Restore', defaultText: 'Restores Devices, Tables and Colors from a previously downloaded backup file.' },
  { key: 'config.colors.save', label: 'Save (Colors)', group: 'Colors', defaultText: 'Saves the current color choices for the Light and Dark theme.' },
  { key: 'config.colors.resetLight', label: 'Reset defaults (Light)', group: 'Colors', defaultText: 'Restores the default colors for the Light theme, discarding any customization.' },
  { key: 'config.colors.resetDark', label: 'Reset defaults (Dark)', group: 'Colors', defaultText: 'Restores the default colors for the Dark theme, discarding any customization.' },
  { key: 'config.fieldsHelp.tooltipsEnabled', label: 'Tooltips enabled', group: 'Fields & Help', defaultText: 'Shows or hides the ⓘ help icons next to fields across the app. Does not affect which fields are mandatory.' },
];

class HelpFieldsStore {
  constructor(configStore) {
    this._configStore = configStore;
  }

  _overrides() {
    if (!this._configStore.config.helpFields) this._configStore.config.helpFields = { enabled: true, overrides: {} };
    if (!this._configStore.config.helpFields.overrides) this._configStore.config.helpFields.overrides = {};
    return this._configStore.config.helpFields.overrides;
  }

  get enabled() {
    return this._configStore.config.helpFields ? this._configStore.config.helpFields.enabled !== false : true;
  }

  set enabled(value) {
    this._overrides(); // assicura che config.helpFields esista
    this._configStore.config.helpFields.enabled = value;
  }

  // Catalogo completo: Tables è generato da TABLE_DEFS (TablesStore.js) invece di
  // essere duplicato qui a mano — letto a chiamata, non al parsing dello script, per
  // non dipendere dall'ordine di caricamento dei file (TablesStore.js/HelpFieldsStore.js).
  catalog() {
    const tablesRows = TABLE_DEFS.map(def => ({
      key: `tables.${def.id}`,
      label: def.title,
      screen: 'Tables',
      group: '',
      defaultText: `Values shown in the "${def.title}" dropdown across all devices — add, rename or remove entries here.`,
    }));
    const devicesRows = DEVICE_HELP_FIELDS.map(f => ({
      key: f.key,
      label: f.label,
      screen: 'Devices',
      group: DEVICE_HELP_TAB_LABELS[f.tab],
      tab: f.tab,
      editingDeviceKey: f.editingDeviceKey,
      isList: !!f.isList,
      defaultText: f.defaultText || '',
    }));
    const configRows = CONFIG_HELP_FIELDS.map(f => ({
      key: f.key,
      label: f.label,
      screen: 'Config',
      group: f.group,
      defaultText: f.defaultText || '',
    }));
    return [...devicesRows, ...tablesRows, ...configRows];
  }

  label(key) {
    const entry = this.catalog().find(f => f.key === key);
    return entry ? entry.label : key;
  }

  // L'override dell'utente vince se presente (anche se è stato svuotato di proposito:
  // una stringa vuota esplicita nasconde l'icona ⓘ per quel campo); altrimenti si usa
  // il testo di default del catalogo.
  text(key) {
    const override = this._overrides()[key];
    if (override && typeof override.text === 'string') return override.text;
    const entry = this.catalog().find(f => f.key === key);
    return entry ? entry.defaultText : '';
  }

  setText(key, value) {
    const overrides = this._overrides();
    if (!overrides[key]) overrides[key] = {};
    overrides[key].text = value;
  }

  isMandatory(key) {
    const override = this._overrides()[key];
    if (override && typeof override.mandatory === 'boolean') return override.mandatory;
    const entry = DEVICE_HELP_FIELDS.find(f => f.key === key);
    return entry ? !!entry.defaultMandatory : false;
  }

  setMandatory(key, value) {
    const overrides = this._overrides();
    if (!overrides[key]) overrides[key] = {};
    overrides[key].mandatory = value;
  }

  // Righe pronte per la tabella di Fields & Help: catalogo unito ai valori correnti.
  rows() {
    return this.catalog().map(entry => ({
      ...entry,
      text: this.text(entry.key),
      mandatory: this.isMandatory(entry.key),
    }));
  }

  async save() {
    await this._configStore.save();
  }
}
