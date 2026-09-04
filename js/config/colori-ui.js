/* =========================================================
   UI "Config" — intestazione unica con stato connessione (icona
   + Connetti/Disconnetti, stesso pattern di Devices) condivisa
   dai due tab Backup & Restore e Colori: prima Colori aveva un
   proprio pulsante di connessione, mentre Backup & Restore non
   ne aveva uno proprio e contava implicitamente sui dati già
   caricati altrove (es. da Devices).

   Colori — pattern "insiemi finiti" di Incarichi/Oratori: ogni
   scena è un contesto visivo reale (non isolato), mostrato due
   volte (Chiaro poi Scuro, impilate), con sotto la griglia degli
   swatch dei componenti coinvolti.

   Prima scena: "Finestra e tabella". Il tema Chiaro, oltre a
   essere modificabile qui, si applica dal vivo a tutta l'app
   (non c'è ancora un vero switch chiaro/scuro runtime: quello
   è un passo successivo — lo Scuro qui è editabile e salvato,
   ma non ancora applicato altrove nell'app).
   ========================================================= */

const configStore = new ConfigStore(appStorage);
const colorStore = new ColorStore(configStore);

const SCENE_FINESTRA_TABELLA = COLOR_COMPONENTS.filter(c => c.categoria === 'Finestra e tabella');

// A differenza di Tabelle, qui ogni swatch scrive subito in configStore (non c'è un
// "bozza vs salvato" separato): per sapere se ci sono modifiche non salvate si tiene
// una fotografia degli override al momento dell'ultimo caricamento/salvataggio, da
// confrontare e a cui eventualmente tornare (scarto = ripristino della fotografia).
let coloriSavedSnapshot = null;

function snapshotColoriBaseline() {
  coloriSavedSnapshot = JSON.parse(JSON.stringify(configStore.config.colorOverrides || {}));
}

function coloriIsDirty() {
  if (!coloriSavedSnapshot) return false;
  return JSON.stringify(configStore.config.colorOverrides || {}) !== JSON.stringify(coloriSavedSnapshot);
}

function discardColoriChanges() {
  configStore.config.colorOverrides = JSON.parse(JSON.stringify(coloriSavedSnapshot || {}));
  applyLightThemeToApp();
  renderColoriScena();
  document.getElementById('coloriSaveStatus').textContent = '';
}

function checkColoriUnsavedChanges() {
  if (!coloriIsDirty()) return null;
  return { message: 'There are unsaved changes in Colors.', save: saveColori, discard: discardColoriChanges };
}

/** Ritorna true se il salvataggio è andato a buon fine, false altrimenti — usato sia
 *  dal pulsante Salva sia dal registro modifiche non salvate ("Salva e vai"). */
async function saveColori() {
  try {
    await colorStore.save();
    snapshotColoriBaseline();
    document.getElementById('coloriSaveStatus').textContent = 'Saved.';
    return true;
  } catch (error) {
    if (error.name === 'StorageConflictError') {
      document.getElementById('coloriSaveStatus').textContent = 'Conflict: configuration changed elsewhere. Reload the page.';
    } else {
      document.getElementById('coloriSaveStatus').textContent = `Error: ${error.message}`;
    }
    return false;
  }
}

function applyLightThemeToApp() {
  SCENE_FINESTRA_TABELLA.forEach(component => {
    component.slots.forEach(slot => {
      const varName = component.cssVar[slot];
      if (!varName) return;
      document.documentElement.style.setProperty(varName, colorStore.hex(component.id, 'chiaro', slot));
    });
  });
  // Il divisore di intestazione Devices è colorato inline via JS, non da una CSS
  // custom property: va quindi ridisegnato esplicitamente quando il tema cambia.
  renderDevicesHeader();
}

function previewMarkup(tema) {
  const v = (id, slot) => colorStore.hex(id, tema, slot);
  return `
    <div class="colori-preview" style="background:${v('sfondoFinestra', 'sfondo')};">
      <div class="colori-preview-sidebar" style="background:${v('sfondoSidebar', 'sfondo')};"></div>
      <div class="colori-preview-main">
        <div class="colori-preview-title" style="color:${v('titoloPagina', 'primoPiano')};">Devices</div>
        <div class="colori-preview-toolbar">
          <span class="colori-preview-search" style="background:${v('barraRicerca', 'sfondo')}; color:${v('barraRicerca', 'primoPiano')};">🔍 Search…</span>
          <span class="colori-preview-btn" style="background:${v('pulsanteNuovoDevice', 'sfondo')}; color:${v('pulsanteNuovoDevice', 'primoPiano')};">New</span>
        </div>
        <div class="colori-preview-card" style="background:${v('sfondoCard', 'sfondo')};">
          <div class="colori-preview-thead" style="background:${v('sfondoIntestazioneTabella', 'sfondo')}; color:${v('testoIntestazioneTabella', 'primoPiano')};">
            <span>Nickname</span><span>Brand</span><span>IP</span><span>Actions</span>
          </div>
          <div class="colori-preview-row" style="color:${v('testoPrincipale', 'primoPiano')}; border-bottom:1px solid ${v('dividerRigaTabella', 'primoPiano')};">
            <span>Router-Main</span><span>NetGear</span><span>10.0.0.1</span>
            <span class="colori-preview-actions">
              <span class="colori-preview-btn" style="background:${v('rowEditBtn', 'sfondo')}; color:${v('rowEditBtn', 'primoPiano')};">Edit</span>
              <span class="colori-preview-btn" style="background:${v('rowDeleteBtn', 'sfondo')}; color:${v('rowDeleteBtn', 'primoPiano')};">Del</span>
            </span>
          </div>
          <div class="colori-preview-row" style="color:${v('testoPrincipale', 'primoPiano')};">
            <span>Sonoff Studio</span><span>Sonoff</span><span>10.0.0.132</span>
            <span class="colori-preview-actions">
              <span class="colori-preview-btn" style="background:${v('rowEditBtn', 'sfondo')}; color:${v('rowEditBtn', 'primoPiano')};">Edit</span>
              <span class="colori-preview-btn" style="background:${v('rowDeleteBtn', 'sfondo')}; color:${v('rowDeleteBtn', 'primoPiano')};">Del</span>
            </span>
          </div>
          <div class="colori-preview-row" style="color:${v('testoSecondario', 'primoPiano')};">
            <span colspan="3">No other device</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function swatchGridMarkup(tema) {
  return SCENE_FINESTRA_TABELLA.map(component => component.slots.map(slot => {
    const inputId = `swatch-${component.id}-${tema}-${slot}`;
    const label = component.slots.length > 1
      ? `${component.nome} — ${slot === 'sfondo' ? 'background' : 'text'}`
      : component.nome;
    return `
      <div class="colori-swatch" title="${component.descrizione}">
        <input type="color" id="${inputId}" value="${colorStore.hex(component.id, tema, slot)}"
               data-component="${component.id}" data-tema="${tema}" data-slot="${slot}">
        <span>${label}</span>
      </div>
    `;
  }).join('')).join('');
}

function renderColoriScena() {
  document.getElementById('colori-tema-chiaro-preview').innerHTML = previewMarkup('chiaro');
  document.getElementById('colori-tema-scuro-preview').innerHTML = previewMarkup('scuro');
  document.getElementById('colori-tema-chiaro-swatches').innerHTML = swatchGridMarkup('chiaro');
  document.getElementById('colori-tema-scuro-swatches').innerHTML = swatchGridMarkup('scuro');

  document.querySelectorAll('.colori-swatch input[type="color"]').forEach(input => {
    input.addEventListener('input', () => {
      const { component, tema, slot } = input.dataset;
      colorStore.setHex(component, tema, slot, input.value);
      // Riapplica solo l'anteprima di quel tema (più reattivo che ridisegnare tutto).
      const previewEl = document.getElementById(`colori-tema-${tema}-preview`);
      previewEl.innerHTML = previewMarkup(tema);
      if (tema === 'chiaro') applyLightThemeToApp();
    });
  });
}

function switchConfigTab(tabId) {
  document.querySelectorAll('#section-config .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.configTab === tabId);
  });
  document.querySelectorAll('#section-config .config-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabId);
  });
}

async function loadAndShowConfig() {
  await configStore.load();
  snapshotColoriBaseline();
  applyLightThemeToApp();
  renderColoriScena();
  // Backup & Restore lavora su devicesStore: se non è già stato caricato dalla sezione
  // Devices in questa sessione, lo carica qui (altrimenti un backup fatto da Config,
  // senza mai passare da Devices, esporterebbe un elenco dispositivi vuoto).
  if (devicesStore.devices.length === 0) await devicesStore.load();

  setConnStatusIcon(document.getElementById('configConnStatus'), true, `Connected to ${appStorage.providerName} (${appStorage.connectedAccountEmail()}).`);
  document.getElementById('btnConfigConnect').style.display = 'none';
  document.getElementById('btnConfigDisconnect').style.display = 'inline-block';
  document.getElementById('configConnectPlaceholder').style.display = 'none';
  document.getElementById('configTabsArea').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  registerUnsavedChangesChecker(checkColoriUnsavedChanges);
  setConnStatusIcon(document.getElementById('configConnStatus'), false, `Not connected to ${appStorage.providerName}.`);

  // Un solo provider disponibile oggi (Azure SQL, vedi AVAILABLE_STORAGE_PROVIDERS in
  // app-storage.js): niente da scegliere, si mostra solo il nome. Se in futuro
  // AVAILABLE_STORAGE_PROVIDERS torna ad averne più di uno, qui compare da sola una
  // tendina — nessun'altra modifica necessaria in questo file.
  const storageProviderControl = document.getElementById('storageProviderControl');
  if (AVAILABLE_STORAGE_PROVIDERS.length > 1) {
    const select = document.createElement('select');
    AVAILABLE_STORAGE_PROVIDERS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.label;
      select.appendChild(opt);
    });
    select.value = getSelectedStorageProviderId();
    // Niente disconnect() qui: per OneDrive/Azure SQL userebbe un popup di logout
    // Microsoft (logoutPopup) che, se bloccato o ignorato, lascia l'await sospeso
    // per sempre — e con esso anche il salvataggio della scelta e il reload sotto.
    // Non serve comunque un vero logout per cambiare provider: il reload ricrea da
    // zero l'istanza corretta in base a localStorage, quella vecchia viene scartata.
    select.addEventListener('change', () => {
      setSelectedStorageProviderId(select.value);
      location.reload();
    });
    storageProviderControl.appendChild(select);
  } else {
    storageProviderControl.textContent = AVAILABLE_STORAGE_PROVIDERS[0].label;
  }

  document.querySelectorAll('#section-config .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchConfigTab(btn.dataset.configTab));
  });

  document.getElementById('btnConfigConnect').addEventListener('click', async () => {
    try {
      document.getElementById('configConnStatus').textContent = 'Connecting…';
      await appStorage.connect();
      await loadAndShowConfig();
    } catch (error) {
      document.getElementById('configConnStatus').textContent = `Connection error: ${error.message}`;
    }
  });

  document.getElementById('btnConfigDisconnect').addEventListener('click', async () => {
    await appStorage.disconnect();
    setConnStatusIcon(document.getElementById('configConnStatus'), false, `Not connected to ${appStorage.providerName}.`);
    document.getElementById('btnConfigConnect').style.display = 'inline-block';
    document.getElementById('btnConfigDisconnect').style.display = 'none';
    document.getElementById('configTabsArea').style.display = 'none';
    document.getElementById('configConnectPlaceholder').style.display = 'block';
  });

  document.getElementById('btnColoriSave').addEventListener('click', saveColori);

  async function resetTemaEShow(tema, label) {
    colorStore.resetTema(tema);
    if (tema === 'chiaro') applyLightThemeToApp();
    renderColoriScena();
    try {
      await colorStore.save();
      snapshotColoriBaseline();
      document.getElementById('coloriSaveStatus').textContent = `Default colors restored (${label}).`;
    } catch (error) {
      document.getElementById('coloriSaveStatus').textContent = `Error: ${error.message}`;
    }
  }

  document.getElementById('btnColoriResetChiaro').addEventListener('click', () => resetTemaEShow('chiaro', 'Light'));
  document.getElementById('btnColoriResetScuro').addEventListener('click', () => resetTemaEShow('scuro', 'Dark'));

  // Connessione automatica: se una sessione OneDrive era già attiva (anche stabilita
  // da un'altra sezione), si salta il pulsante "Connetti" e si carica direttamente.
  appStorageReady.then(async giaConnesso => {
    if (giaConnesso || appStorage.isConnected()) await loadAndShowConfig();
  });
});
