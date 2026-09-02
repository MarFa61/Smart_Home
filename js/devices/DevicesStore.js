/* =========================================================
   STORE IN-MEMORY + PERSISTENZA DEI DEVICES
   Wrapper sopra lo StorageProvider astratto: nessun dettaglio
   OneDrive qui, solo la risorsa "devices.json" e le regole di
   unicità decise per il modello dati (Nickname, Dev. Id.,
   Host Name generato, IP di ciascuna connessione).
   ========================================================= */

class DevicesStore {
  constructor(storageProvider) {
    this._storageProvider = storageProvider;
    this._resourceKey = 'devices.json';
    this.devices = [];
    this._version = null;
  }

  async load() {
    const { data, version } = await this._storageProvider.load(this._resourceKey);
    this.devices = (data && Array.isArray(data.devices)) ? data.devices : [];
    this.devices.forEach(migrateProtocolloField);
    this.devices.forEach(migratePhisicalHubField);
    this._version = version;
    return this.devices;
  }

  async save() {
    const payload = { devices: this.devices };
    const { version } = await this._storageProvider.save(this._resourceKey, payload, this._version);
    this._version = version;
  }

  /** Elenco di messaggi di conflitto (stringa vuota = nessun conflitto). */
  findConflicts(candidate) {
    const conflicts = [];
    const candidateHostName = computeHostName(candidate.devCategory, candidate.devZone, candidate.devType, candidate.devId);
    const candidateIps = (candidate.connections || []).map(c => (c.ip || '').trim()).filter(Boolean);

    for (const device of this.devices) {
      if (device.id === candidate.id) continue;

      if (candidate.nickname && device.nickname === candidate.nickname) {
        conflicts.push(`Nickname "${candidate.nickname}" already used by another device.`);
      }
      // Dev. Id. non deve essere univoco da solo (es. "meteo" è legittimo su più stazioni
      // meteo in zone diverse): a doverlo essere è l'Host Name completo (Categoria+Zona+
      // Tipo+Dev.Id), controllato subito sotto.

      const deviceHostName = computeHostName(device.devCategory, device.devZone, device.devType, device.devId);
      if (candidateHostName && deviceHostName === candidateHostName) {
        conflicts.push(`Host Name "${candidateHostName}" already generated for another device.`);
      }

      const deviceIps = (device.connections || []).map(c => (c.ip || '').trim()).filter(Boolean);
      for (const ip of candidateIps) {
        if (deviceIps.includes(ip)) {
          conflicts.push(`IP "${ip}" already used by another device.`);
        }
      }
    }
    return conflicts;
  }

  upsert(device) {
    const idx = this.devices.findIndex(d => d.id === device.id);
    if (idx >= 0) {
      this.devices[idx] = device;
    } else {
      this.devices.push(device);
    }
  }

  remove(id) {
    this.devices = this.devices.filter(d => d.id !== id);
  }
}

// Migrazione una tantum: il vecchio campo singolo "protocollo" diventa i due nuovi
// campi "Protocolli supportati" (array) e "Protocollo di Connessione" (singolo) —
// nessun dato perso, entrambi partono dallo stesso valore già presente.
function migrateProtocolloField(device) {
  if (device.protocollo === undefined) return;
  if (!Array.isArray(device.protocolli)) device.protocolli = device.protocollo ? [device.protocollo] : [];
  if (device.protocolloConnessione === undefined) device.protocolloConnessione = device.protocollo || '';
  delete device.protocollo;
}

// Migrazione una tantum: "Phisical Hub" (etichetta libera) diventa "Connection Hub"
// (nickname di un device reale). Mappatura decisa con Marco il 2026-09-01 sui 6
// valori distinti realmente in uso — nessuno corrispondeva già a un nickname.
const PHISICAL_HUB_MIGRATION_MAP = {
  'Netgear Orbi': 'Router-Main',
  'Homey Pro': 'HomeyPro',
  'Philips Hue Bridge': 'Hue Bridge',
  'Mac Mini (by wire)': 'MF Mac',
  'None': '',
  'Samsung TV (direct)': 'Samsung TV Soggiorno',
};
function migratePhisicalHubField(device) {
  if (PHISICAL_HUB_MIGRATION_MAP.hasOwnProperty(device.phisicalHub)) {
    device.phisicalHub = PHISICAL_HUB_MIGRATION_MAP[device.phisicalHub];
  }
}

function makeEmptyDevice() {
  return {
    id: crypto.randomUUID(),
    nickname: '',
    marca: '',
    modello: '',
    avanzamento: tablesStore.labels('avanzamento')[0],
    tipoDispositivo: '',
    protocolli: [],
    protocolloConnessione: '',
    phisicalHub: '',
    managingApp: '',
    ssid: '',
    connectedTo: '',
    connectionSpeed: '',
    devGroup: '',
    devCategory: '',
    devZone: '',
    devType: '',
    devId: '',
    connections: [{ ip: '', note: '' }],
    collegatoHomey: false,
    collegatoHomeyNote: '',
    integratoHomeKit: false,
    integratoHomeKitNote: '',
    usatoAutomazioni: false,
    usatoAutomazioniNote: '',
    disponibileOra: true,
    note: '',
  };
}
