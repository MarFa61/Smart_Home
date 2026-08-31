/* =========================================================
   STORE PER LE TABELLE DI SUPPORTO (Avanzamento, Tipo
   dispositivo, Protocollo, Phisical Hub, Managing App, SSID,
   Categoria, Zona, Tipo). Stessa logica di DevicesStore/
   ConfigStore: risorsa "tables.json" su OneDrive, concorrenza
   ottimistica via versione.

   Al primo utilizzo (nessun tables.json ancora salvato, o una
   singola tabella nuova non ancora presente in un tables.json
   già esistente) si parte da un set di default — per Categoria/
   Zona/Tipo/Avanzamento gli stessi valori già usati nell'Excel
   originale, per gli altri i valori distinti già presenti nei
   65 dispositivi importati — così le tendine non partono vuote.
   ========================================================= */

// "kind: labelHost" alimenta anche l'Host Name (serve un codice host oltre
// all'etichetta); "kind: label" è una tabella di sole etichette.
const TABLE_DEFS = [
  { id: 'avanzamento', title: 'Avanzamento', kind: 'label', devicesField: 'avanzamento' },
  { id: 'tipoDispositivo', title: 'Tipo dispositivo', kind: 'label', devicesField: 'tipoDispositivo' },
  { id: 'protocollo', title: 'Protocollo', kind: 'label', devicesField: 'protocollo' },
  { id: 'phisicalHub', title: 'Phisical Hub', kind: 'label', devicesField: 'phisicalHub' },
  { id: 'managingApp', title: 'Managing App', kind: 'label', devicesField: 'managingApp' },
  { id: 'ssid', title: 'SSID', kind: 'label', devicesField: 'ssid' },
  { id: 'devCategory', title: 'Categoria', kind: 'labelHost', devicesField: 'devCategory' },
  { id: 'devZone', title: 'Zona', kind: 'labelHost', devicesField: 'devZone' },
  { id: 'devType', title: 'Tipo', kind: 'labelHost', devicesField: 'devType' },
];

const TABLE_DEFAULTS = {
  avanzamento: ['Pianificato', 'In configurazione', 'Attivo', 'Da rivedere'],
  tipoDispositivo: ['Altoparlante', 'Altoparlante smart', 'Altro', 'Bilancia Smart', 'Citofono', 'Condizionatore',
    'Desktop PC', 'Door/Window Sensor', 'Hub Zigbee', 'LED', 'Lampadina', 'NAS', 'Presence Sensor', 'Printer',
    'RF Legacy', 'Robot', 'Router', 'Sleep Analyzer', 'Smart Hub', 'Smart Plug', 'Smart Switch',
    'Smart Water Valve', 'Smartphone', 'Stazione Meteo', 'Switch', 'TV', 'TV add-on', 'Tablet', 'Termostato'],
  protocollo: ['433,92 MHz', 'Ethernet (by wire)', 'N/A', 'Wi-Fi', 'Wi-Fi/Bluetooth', 'Zigbee'],
  phisicalHub: ['Homey Pro', 'Mac Mini (by wire)', 'Netgear Orbi', 'None', 'Philips Hue Bridge', 'Samsung TV (direct)'],
  managingApp: ['Alexa', 'Amazon', 'Casa', 'Control by Legrand', 'Elgato Streamdeck', 'Epson', 'Google',
    'Govee Home', 'Homey Pro', 'Hue', 'MacOS', 'Meross', 'Mova', 'Netatmo', 'None', 'Onecta Daikin', 'Orbi',
    'Ring', 'Samsung TV (itself)', 'Sonos', 'Synology DSM 7.3.2', 'Tuya', 'Withings', 'eWeLink', 'iOS', 'iPadOS'],
  ssid: ['ORBIMF', 'ORBIMF-IoT', 'ORBIMF-IoT-AP'],
  // label+host: stessi elenchi già usati per generare l'Host Name.
  devCategory: DEV_CATEGORIES,
  devZone: DEV_ZONES,
  devType: DEV_TYPES,
};

function tableDefById(id) {
  return TABLE_DEFS.find(d => d.id === id);
}

class TablesStore {
  constructor(storageProvider) {
    this._storageProvider = storageProvider;
    this._resourceKey = 'tables.json';
    this.tables = this._defaultTables();
    this._version = null;
  }

  _defaultTables() {
    const t = {};
    TABLE_DEFS.forEach(def => {
      t[def.id] = TABLE_DEFAULTS[def.id].map(v => (def.kind === 'labelHost' ? { ...v } : v));
    });
    return t;
  }

  async load() {
    const { data, version } = await this._storageProvider.load(this._resourceKey);
    this.tables = (data && data.tables) ? data.tables : this._defaultTables();
    // Tabelle introdotte dopo che qualcuno ha già salvato un tables.json: se manca, si
    // riparte dal default anche per quella singola tabella, senza perdere le altre.
    const defaults = this._defaultTables();
    TABLE_DEFS.forEach(def => {
      if (!this.tables[def.id]) this.tables[def.id] = defaults[def.id];
    });
    this._version = version;
    return this.tables;
  }

  async save() {
    const { version } = await this._storageProvider.save(this._resourceKey, { tables: this.tables }, this._version);
    this._version = version;
  }

  labels(tableId) {
    const def = tableDefById(tableId);
    const entries = this.tables[tableId] || [];
    return def.kind === 'labelHost' ? entries.map(e => e.label) : entries.slice();
  }

  hostFor(tableId, label) {
    const entries = this.tables[tableId] || [];
    const entry = entries.find(e => e.label === label);
    return entry ? (entry.host || '') : '';
  }
}
