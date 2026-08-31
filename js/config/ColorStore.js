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

  // Ripristina solo gli override di un tema (es. "chiaro"), lasciando intatti quelli
  // dell'altro tema — a differenza di resetAll() che li cancella entrambi insieme.
  resetTema(tema) {
    const overrides = this._configStore.config.colorOverrides || {};
    const suffix = `.${tema}.`;
    Object.keys(overrides).forEach(key => {
      if (key.includes(suffix)) delete overrides[key];
    });
  }

  async save() {
    await this._configStore.save();
  }
}
