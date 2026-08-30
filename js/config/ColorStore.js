/* =========================================================
   COLOR STORE — equivalente JS di AppColorStore.swift
   Overrides tenuti in ConfigStore (risorsa config.json su
   OneDrive), chiave "componente.tema.slot" come in Incarichi.
   ========================================================= */

class ColorStore {
  constructor(configStore) {
    this._configStore = configStore;
  }

  _key(componentId, tema, slot) {
    return `${componentId}.${tema}.${slot}`;
  }

  hex(componentId, tema, slot) {
    const overrides = this._configStore.config.colorOverrides || {};
    const key = this._key(componentId, tema, slot);
    if (overrides[key]) return overrides[key];

    const component = colorComponentById(componentId);
    const defaults = tema === 'chiaro' ? component.defaultChiaro : component.defaultScuro;
    return defaults[slot];
  }

  setHex(componentId, tema, slot, hex) {
    if (!this._configStore.config.colorOverrides) this._configStore.config.colorOverrides = {};
    this._configStore.config.colorOverrides[this._key(componentId, tema, slot)] = hex;
  }

  isCustomized(componentId, tema, slot) {
    const overrides = this._configStore.config.colorOverrides || {};
    return this._key(componentId, tema, slot) in overrides;
  }

  resetAll() {
    this._configStore.config.colorOverrides = {};
  }

  async save() {
    await this._configStore.save();
  }
}
