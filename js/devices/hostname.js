/* =========================================================
   GENERAZIONE HOST NAME
   Replica la formula Excel originale:
   TEXTJOIN(" - ", TRUE, catHost, zoneHost, typeHost, devId)
   ========================================================= */

function computeHostName(devCategory, devZone, devType, devId) {
  const parts = [
    hostCodeFor(DEV_CATEGORIES, devCategory),
    hostCodeFor(DEV_ZONES, devZone),
    hostCodeFor(DEV_TYPES, devType),
    (devId || '').trim(),
  ].filter(part => part !== '');

  return parts.join(' - ');
}
