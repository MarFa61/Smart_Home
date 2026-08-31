/* =========================================================
   TABELLE DI SUPPORTO NON ANCORA IN "Tabelle" (TEMPORANEE)
   Avanzamento, Tipo dispositivo, Protocollo, Phisical Hub,
   Managing App, SSID, Categoria, Zona, Tipo sono ora gestiti
   dalla sezione Tabelle (vedi js/tables/TablesStore.js, che
   riusa DEV_CATEGORIES/DEV_ZONES/DEV_TYPES qui sotto come
   valori di default al primo utilizzo). Dev. Group, Connected
   to e i blocchi IP per Dev. Group restano invece fissi nel
   codice: non erano tra i campi richiesti per la gestione da
   Tabelle.
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

// "Gruppo Dispositivo" nel foglio Tabelle dell'Excel originale (colonna A):
// "NotUsed" escluso, non è mai stato un valore reale nei 66 dispositivi originali.
const DEV_GROUPS = [
  'Infrastruttura', 'Server', 'Client', 'Sonos', 'Periferiche',
  'IoT_Soggiorno', 'IoT_Studio', 'IoT_Camera', 'IoT_Altri', 'Dinamico', 'TBD', 'n/a',
];

// "Connected to" nell'Excel: usato solo per i satelliti di un gruppo (es. Sonos Home
// Theatre) per indicare il dispositivo "Main" a cui fanno riferimento — su 66
// dispositivi originali valorizzato solo per 10.
const DEV_CONNECTED_TO = ['Main', 'Satellite'];

// Blocco IP statico riservato a ciascun Dev. Group, dagli intervalli con nome del
// foglio Tabelle dell'Excel originale (usati lì in una Convalida Dati a elenco,
// origine INDIRETTO(Dev.Group), per suggerire solo gli IP del blocco giusto).
// Dinamico/TBD/n/a non hanno un blocco: per quei dispositivi l'IP resta testo libero.
const DEV_GROUP_IP_RANGES = {
  'Infrastruttura': { from: '10.0.0.1', to: '10.0.0.10' },
  'Server': { from: '10.0.0.11', to: '10.0.0.29' },
  'Sonos': { from: '10.0.0.30', to: '10.0.0.49' },
  'Client': { from: '10.0.0.50', to: '10.0.0.69' },
  'Periferiche': { from: '10.0.0.70', to: '10.0.0.89' },
  'IoT_Soggiorno': { from: '10.0.0.90', to: '10.0.0.114' },
  'IoT_Camera': { from: '10.0.0.115', to: '10.0.0.129' },
  'IoT_Studio': { from: '10.0.0.130', to: '10.0.0.139' },
  'IoT_Altri': { from: '10.0.0.140', to: '10.0.0.149' },
};

// Espande un intervallo { from, to } (stesso prefisso, solo l'ultimo ottetto cambia,
// come nei blocchi sopra) nell'elenco di IP che contiene.
function expandIpRange(range) {
  const fromParts = range.from.split('.');
  const toLast = Number(range.to.split('.').pop());
  const prefix = fromParts.slice(0, 3).join('.');
  const fromLast = Number(fromParts[3]);
  const ips = [];
  for (let n = fromLast; n <= toLast; n++) ips.push(`${prefix}.${n}`);
  return ips;
}
