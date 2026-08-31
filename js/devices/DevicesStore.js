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
        conflicts.push(`Nickname "${candidate.nickname}" già usato da un altro dispositivo.`);
      }
      // Dev. Id. non deve essere univoco da solo (es. "meteo" è legittimo su più stazioni
      // meteo in zone diverse): a doverlo essere è l'Host Name completo (Categoria+Zona+
      // Tipo+Dev.Id), controllato subito sotto.

      const deviceHostName = computeHostName(device.devCategory, device.devZone, device.devType, device.devId);
      if (candidateHostName && deviceHostName === candidateHostName) {
        conflicts.push(`Host Name "${candidateHostName}" già generato per un altro dispositivo.`);
      }

      const deviceIps = (device.connections || []).map(c => (c.ip || '').trim()).filter(Boolean);
      for (const ip of candidateIps) {
        if (deviceIps.includes(ip)) {
          conflicts.push(`IP "${ip}" già usato da un altro dispositivo.`);
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

function makeEmptyDevice() {
  return {
    id: crypto.randomUUID(),
    nickname: '',
    marca: '',
    modello: '',
    avanzamento: tablesStore.labels('avanzamento')[0],
    tipoDispositivo: '',
    protocollo: '',
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
