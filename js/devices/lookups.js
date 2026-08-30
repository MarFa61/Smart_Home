/* =========================================================
   TABELLE DI SUPPORTO PER Devices (TEMPORANEE)
   Valori e codici host ripresi dal foglio "Tabelle" dell'Excel
   originale. Quando la sezione Tabelle dell'app sarà costruita,
   questi elenchi andranno letti da lì invece che da qui.
   ========================================================= */

// label mostrata all'utente -> codice usato nell'Host Name generato
const DEV_CATEGORIES = [
  { label: 'Network', host: 'net' },
  { label: 'Server', host: 'srv' },
  { label: 'Sonos', host: 'sonos' },
  { label: 'IoT', host: 'iot' },
  { label: 'Client', host: 'cli' },
  { label: 'Printer', host: 'prt' },
  { label: 'TBD', host: '' },
  { label: 'n/a', host: '' },
];

const DEV_ZONES = [
  { label: 'Bagno', host: 'bagn' },
  { label: 'Camera', host: 'came' },
  { label: 'Cameretta', host: 'camt' },
  { label: 'Corridoio', host: 'corr' },
  { label: 'Cucina', host: 'cuci' },
  { label: 'Giardino', host: 'giar' },
  { label: 'Soggiorno', host: 'sogg' },
  { label: 'Studio', host: 'stud' },
  { label: 'Any', host: '' },
  { label: 'TBD', host: '' },
  { label: 'n/a', host: '' },
];

const DEV_TYPES = [
  { label: 'AccessPoint', host: 'AccP' },
  { label: 'Condiz', host: 'cond' },
  { label: 'Communic', host: 'comm' },
  { label: 'Hub', host: 'hub' },
  { label: 'iPad', host: 'ipad' },
  { label: 'iPhone', host: 'ipho' },
  { label: 'Light', host: 'light' },
  { label: 'Mac', host: 'mac' },
  { label: 'NAS', host: 'nas' },
  { label: 'Plug', host: 'plug' },
  { label: 'Printer', host: 'prt' },
  { label: 'Robot', host: 'robo' },
  { label: 'Roller Driver', host: 'rdrv' },
  { label: 'Router', host: 'rtr' },
  { label: 'Satellite', host: 'sat' },
  { label: 'Sbar', host: 'sbar' },
  { label: 'Sensor', host: 'sens' },
  { label: 'Spkr', host: 'spkr' },
  { label: 'Sub', host: 'sub' },
  { label: 'Switch', host: 'swtc' },
  { label: 'TV', host: 'TV' },
  { label: 'n/a', host: '' },
];

const DEV_AVANZAMENTO = ['Pianificato', 'In configurazione', 'Attivo', 'Da rivedere'];

function hostCodeFor(list, label) {
  const entry = list.find(item => item.label === label);
  return entry ? entry.host : '';
}
