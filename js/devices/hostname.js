/* =========================================================
   GENERAZIONE HOST NAME
   Replica la formula Excel originale:
   TEXTJOIN(" - ", TRUE, catHost, zoneHost, typeHost, devId)
   I codici host vengono da tablesStore (sezione Tabelle): se
   l'utente cambia il codice host di un'etichetta, l'Host Name
   si aggiorna da solo ovunque, perché è calcolato al volo qui
   e non salvato come valore fisso.
   ========================================================= */

function computeHostName(devCategory, devZone, devType, devId) {
  const parts = [
    tablesStore.hostFor('devCategory', devCategory),
    tablesStore.hostFor('devZone', devZone),
    tablesStore.hostFor('devType', devType),
    (devId || '').trim(),
  ].filter(part => part !== '');

  return parts.join(' - ');
}
