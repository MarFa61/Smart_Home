/* =========================================================
   LARGHEZZE COLONNE — equivalente JS di ColumnWidthStore.swift
   Persistite in localStorage per tableID (preferenza del
   browser/device, non dato business: non va su OneDrive,
   stessa scelta di Incarichi con UserDefaults).
   ========================================================= */

class ColumnWidthStore {
  constructor(tableId) {
    this._key = `columnWidths.${tableId}`;
    try {
      this._widths = JSON.parse(localStorage.getItem(this._key)) || {};
    } catch (e) {
      this._widths = {};
    }
  }

  width(columnId, defaultWidth) {
    return this._widths[columnId] || defaultWidth;
  }

  setWidth(columnId, width) {
    this._widths[columnId] = width;
    try {
      localStorage.setItem(this._key, JSON.stringify(this._widths));
    } catch (e) {
      // localStorage non disponibile (es. modalità privata): la larghezza resta solo in memoria.
    }
  }
}
