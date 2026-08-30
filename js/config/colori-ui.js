/* =========================================================
   UI "Colori" — pattern "insiemi finiti" di Incarichi/Oratori:
   ogni scena è un contesto visivo reale (non isolato), mostrato
   due volte (Chiaro poi Scuro, impilate), con sotto la griglia
   degli swatch dei componenti coinvolti.

   Prima scena: "Finestra e tabella". Il tema Chiaro, oltre a
   essere modificabile qui, si applica dal vivo a tutta l'app
   (non c'è ancora un vero switch chiaro/scuro runtime: quello
   è un passo successivo — lo Scuro qui è editabile e salvato,
   ma non ancora applicato altrove nell'app).
   ========================================================= */

const configStore = new ConfigStore(appStorage);
const colorStore = new ColorStore(configStore);

const SCENE_FINESTRA_TABELLA = COLOR_COMPONENTS.filter(c => c.categoria === 'Finestra e tabella');

function applyLightThemeToApp() {
  SCENE_FINESTRA_TABELLA.forEach(component => {
    component.slots.forEach(slot => {
      const varName = component.cssVar[slot];
      if (!varName) return;
      document.documentElement.style.setProperty(varName, colorStore.hex(component.id, 'chiaro', slot));
    });
  });
}

function previewMarkup(tema) {
  const v = (id, slot) => colorStore.hex(id, tema, slot);
  return `
    <div class="colori-preview" style="background:${v('sfondoFinestra', 'sfondo')};">
      <div class="colori-preview-sidebar" style="background:${v('sfondoSidebar', 'sfondo')};"></div>
      <div class="colori-preview-main">
        <div class="colori-preview-title" style="color:${v('titoloPagina', 'primoPiano')};">Devices</div>
        <div class="colori-preview-card" style="background:${v('sfondoCard', 'sfondo')};">
          <div class="colori-preview-thead" style="background:${v('sfondoIntestazioneTabella', 'sfondo')}; color:${v('testoIntestazioneTabella', 'primoPiano')};">
            <span>Nickname</span><span>Marca</span><span>IP</span>
          </div>
          <div class="colori-preview-row" style="color:${v('testoPrincipale', 'primoPiano')}; border-bottom:1px solid ${v('dividerRigaTabella', 'primoPiano')};">
            <span>Router-Main</span><span>NetGear</span><span>10.0.0.1</span>
          </div>
          <div class="colori-preview-row" style="color:${v('testoPrincipale', 'primoPiano')};">
            <span>Sonoff Studio</span><span>Sonoff</span><span>10.0.0.132</span>
          </div>
          <div class="colori-preview-row" style="color:${v('testoSecondario', 'primoPiano')};">
            <span colspan="3">Nessun altro dispositivo</span>
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
      ? `${component.nome} — ${slot === 'sfondo' ? 'sfondo' : 'testo'}`
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

async function loadAndShowColori() {
  await configStore.load();
  applyLightThemeToApp();
  renderColoriScena();
  document.getElementById('coloriConnStatus').textContent = `Connesso a OneDrive (${appStorage.connectedAccountEmail()}).`;
  document.getElementById('btnColoriConnect').style.display = 'none';
  document.getElementById('coloriForm').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnColoriConnect').addEventListener('click', async () => {
    try {
      await appStorage.connect();
      await loadAndShowColori();
    } catch (error) {
      document.getElementById('coloriConnStatus').textContent = `Errore di connessione: ${error.message}`;
    }
  });

  document.getElementById('btnColoriSave').addEventListener('click', async () => {
    try {
      await colorStore.save();
      document.getElementById('coloriSaveStatus').textContent = 'Salvato.';
    } catch (error) {
      if (error.name === 'StorageConflictError') {
        document.getElementById('coloriSaveStatus').textContent = 'Conflitto: la configurazione è cambiata altrove. Ricarica la pagina.';
      } else {
        document.getElementById('coloriSaveStatus').textContent = `Errore: ${error.message}`;
      }
    }
  });

  document.getElementById('btnColoriReset').addEventListener('click', async () => {
    colorStore.resetAll();
    applyLightThemeToApp();
    renderColoriScena();
    try {
      await colorStore.save();
      document.getElementById('coloriSaveStatus').textContent = 'Ripristinati i colori predefiniti.';
    } catch (error) {
      document.getElementById('coloriSaveStatus').textContent = `Errore: ${error.message}`;
    }
  });

  // Connessione automatica: se una sessione OneDrive era già attiva (anche stabilita
  // da un'altra sezione), si salta il pulsante "Connetti" e si carica direttamente.
  appStorageReady.then(async giaConnesso => {
    if (giaConnesso || appStorage.isConnected()) await loadAndShowColori();
  });
});
