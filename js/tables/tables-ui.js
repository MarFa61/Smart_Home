/* =========================================================
   UI "Tabelle" — un tab per ciascuna tabella di supporto (vedi
   TABLE_DEFS in TablesStore.js). Stessa intestazione a griglia
   con icona+Connetti/Disconnetti di Devices e Config.

   Ogni riga di una tabella è editabile in linea (un <input> per
   le tabelle a sola etichetta, due per quelle con codice host).
   Il salvataggio è per singolo tab: confronta le righe attuali
   con quelle originali per capire cos'è stato rinominato/
   aggiunto/rimosso, poi propaga rinomina/rimozione ai dispositivi
   che usano il vecchio valore (richiesto esplicitamente: mai
   lasciare un valore "orfano" su un dispositivo).
   ========================================================= */

const tablesStore = new TablesStore(appStorage);

function tabelleRowsContainerId(tableId) { return `tabelle-rows-${tableId}`; }
function tabelleStatusId(tableId) { return `tabelle-status-${tableId}`; }
function tabelleTabContentId(tableId) { return `tabelle-tab-${tableId}`; }

function buildTabelleRow(kind, label, host) {
  const row = document.createElement('div');
  row.className = 'tabelle-row';
  row.dataset.originalLabel = label;
  if (kind === 'labelHost') row.dataset.originalHost = host || '';

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'tabelle-value';
  labelInput.placeholder = 'Label';
  labelInput.value = label;
  row.appendChild(labelInput);

  if (kind === 'labelHost') {
    const hostInput = document.createElement('input');
    hostInput.type = 'text';
    hostInput.className = 'tabelle-host';
    hostInput.placeholder = 'Host code';
    hostInput.value = host || '';
    row.appendChild(hostInput);
  }

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'btn pow';
  delBtn.textContent = '🗑';
  delBtn.title = 'Delete value';
  row.appendChild(delBtn);

  return row;
}

// Ordine alfabetico crescente in visualizzazione, non sullo storage: una riga appena
// aggiunta resta in fondo (modificabile) finché non si ricarica/risalva, invece di
// saltare subito in mezzo all'elenco mentre l'utente sta ancora scrivendo l'etichetta.
function sortedEntriesForDisplay(def) {
  const entries = (tablesStore.tables[def.id] || []).slice();
  entries.sort((a, b) => {
    const labelA = def.kind === 'labelHost' ? a.label : a;
    const labelB = def.kind === 'labelHost' ? b.label : b;
    return String(labelA).localeCompare(String(labelB), 'it', { numeric: true, sensitivity: 'base' });
  });
  return entries;
}

function renderTabelleTabRows(def) {
  const container = document.getElementById(tabelleRowsContainerId(def.id));
  container.innerHTML = '';
  const entries = sortedEntriesForDisplay(def);
  entries.forEach(entry => {
    const row = def.kind === 'labelHost'
      ? buildTabelleRow('labelHost', entry.label, entry.host)
      : buildTabelleRow('label', entry, '');
    container.appendChild(row);
  });

  container.querySelectorAll('.tabelle-row').forEach(row => wireTabelleRowDelete(row, def));
}

// Un valore "usa" il campo di un device: uguaglianza per i campi scalari,
// appartenenza all'array per quelli multipli (es. "Protocolli supportati").
function deviceUsesValue(device, devicesField, value) {
  const raw = device[devicesField.field];
  return devicesField.type === 'array' ? (raw || []).includes(value) : raw === value;
}

function wireTabelleRowDelete(row, def) {
  row.querySelector('.btn.pow').addEventListener('click', () => {
    const original = row.dataset.originalLabel;
    if (original) {
      const count = devicesStore.devices.filter(d => def.devicesFields.some(df => deviceUsesValue(d, df, original))).length;
      if (count > 0) {
        const plural = count > 1 ? 's' : '';
        const ok = confirm(
          `"${original}" is used by ${count} device${plural}. Deleting it will clear this value on ` +
          `${count > 1 ? 'those devices' : 'that device'}. Continue?`
        );
        if (!ok) return;
      }
    }
    row.remove();
  });
}

// Le tabelle "labelHost" (Categoria/Zona/Tipo) non sono un elenco di etichette come
// le altre: insieme a Dev. Id. compongono l'Host Name di ogni dispositivo. Nella barra
// tab sono raggruppate visivamente (sono già contigue in TABLE_DEFS) con un separatore
// e un'etichetta, e nel contenuto del tab compare una nota esplicativa.
function isHostNameGroupStart(def, i) {
  return def.kind === 'labelHost' && (i === 0 || TABLE_DEFS[i - 1].kind !== 'labelHost');
}

function renderTabelleTabsArea() {
  const tabsBar = document.getElementById('tabelleTabsBar');
  const contents = document.getElementById('tabelleTabContents');
  tabsBar.innerHTML = '';
  contents.innerHTML = '';

  TABLE_DEFS.forEach((def, i) => {
    if (isHostNameGroupStart(def, i)) {
      const divider = document.createElement('div');
      divider.className = 'tabelle-tabs-divider';
      tabsBar.appendChild(divider);
      const groupLabel = document.createElement('span');
      groupLabel.className = 'tabelle-tabs-group-label';
      groupLabel.textContent = 'Make up the Host Name';
      tabsBar.appendChild(groupLabel);
    }

    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = 'tab-btn' + (i === 0 ? ' active' : '');
    tabBtn.dataset.tabelleTab = def.id;
    tabBtn.textContent = def.title;
    tabBtn.addEventListener('click', async () => {
      if (!await confirmDiscardUnsavedChanges('Changing tab')) return;
      switchTabelleTab(def.id);
    });
    tabsBar.appendChild(tabBtn);

    const content = document.createElement('div');
    content.className = 'tabelle-tab-content' + (i === 0 ? ' active' : '');
    content.id = tabelleTabContentId(def.id);
    content.innerHTML = `
      ${def.kind === 'labelHost' ? `
        <p class="tabelle-hostname-note">Category, Zone and Type together make up, with Dev. Id., the Host Name of
        each device. The host code next to each label here is the one that ends up in the Host Name: if you
        change it, the Host Name updates immediately everywhere, with no need to edit individual devices.</p>
      ` : ''}
      <div id="${tabelleRowsContainerId(def.id)}" class="tabelle-rows"></div>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button type="button" class="btn edit" data-action="add">+ Add value</button>
        <button type="button" class="btn btn-primary-add" data-action="save">💾 Save</button>
      </div>
      <p id="${tabelleStatusId(def.id)}" style="font-size:13px; color:var(--text-secondary); margin-top:10px;"></p>
    `;
    contents.appendChild(content);

    content.querySelector('[data-action="add"]').addEventListener('click', () => {
      const container = document.getElementById(tabelleRowsContainerId(def.id));
      const row = buildTabelleRow(def.kind, '', '');
      container.appendChild(row);
      wireTabelleRowDelete(row, def);
      row.querySelector('.tabelle-value').focus();
    });
    content.querySelector('[data-action="save"]').addEventListener('click', () => saveTabelleTab(def));

    renderTabelleTabRows(def);
  });
}

// Registrata dentro DOMContentLoaded più sotto (non qui a livello di script): questo
// file viene caricato prima di app.js, che è dove registerUnsavedChangesChecker viene
// definita — a livello di script fallirebbe, dentro DOMContentLoaded no, perché a
// quel punto tutti gli script deferred hanno già eseguito il proprio codice top-level.
function checkTabelleUnsavedChanges() {
  const def = activeTabelleTabDef();
  if (!def || !tabelleTabHasUnsavedChanges(def)) return null;
  return {
    message: `There are unsaved changes in "${def.title}" (Tables).`,
    save: () => saveTabelleTab(def),
    discard: () => {
      renderTabelleTabRows(def);
      document.getElementById(tabelleStatusId(def.id)).textContent = '';
    },
  };
}

function activeTabelleTabDef() {
  const activeContent = document.querySelector('.tabelle-tab-content.active');
  if (!activeContent) return null;
  return TABLE_DEFS.find(d => tabelleTabContentId(d.id) === activeContent.id) || null;
}

function tabelleTabHasUnsavedChanges(def) {
  const rows = Array.from(document.querySelectorAll(`#${tabelleRowsContainerId(def.id)} .tabelle-row`));
  const current = rows.map(row => {
    const label = row.querySelector('.tabelle-value').value.trim();
    return def.kind === 'labelHost' ? { label, host: row.querySelector('.tabelle-host').value.trim() } : label;
  });
  // Confrontato con l'ordine visualizzato (già alfabetico), non quello grezzo dello
  // storage: altrimenti aprire un tab il cui storage non è ancora in ordine alfabetico
  // segnalerebbe "modifiche non salvate" senza che l'utente abbia toccato nulla.
  const saved = sortedEntriesForDisplay(def);
  if (current.length !== saved.length) return true;
  return current.some((entry, i) => def.kind === 'labelHost'
    ? (entry.label !== saved[i].label || entry.host !== (saved[i].host || ''))
    : entry !== saved[i]);
}

function switchTabelleTab(tableId) {
  document.querySelectorAll('#tabelleTabsBar .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tabelleTab === tableId);
  });
  document.querySelectorAll('.tabelle-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabelleTabContentId(tableId));
  });
}

/** Ritorna true se il salvataggio è andato a buon fine, false altrimenti (errore di
 *  validazione o di rete) — usato anche dal registro modifiche non salvate, per sapere
 *  se dopo "Salva e vai" si può davvero procedere a cambiare tab/sezione. */
async function saveTabelleTab(def) {
  const statusEl = document.getElementById(tabelleStatusId(def.id));
  const rows = Array.from(document.querySelectorAll(`#${tabelleRowsContainerId(def.id)} .tabelle-row`));

  const newEntries = [];
  const renames = []; // { from, to }
  const deletions = []; // valori originali non più presenti tra le righe

  const seenLabels = new Set();
  for (const row of rows) {
    const label = row.querySelector('.tabelle-value').value.trim();
    const host = def.kind === 'labelHost' ? row.querySelector('.tabelle-host').value.trim() : undefined;
    if (!label) { statusEl.textContent = 'Error: a value cannot be empty.'; return false; }
    if (seenLabels.has(label)) { statusEl.textContent = `Error: "${label}" is a duplicate.`; return false; }
    seenLabels.add(label);

    newEntries.push(def.kind === 'labelHost' ? { label, host } : label);

    const original = row.dataset.originalLabel;
    if (original && original !== label) renames.push({ from: original, to: label });
  }

  const remainingOriginals = new Set(rows.map(r => r.dataset.originalLabel).filter(Boolean));
  const previousEntries = tablesStore.tables[def.id] || [];
  previousEntries.forEach(entry => {
    const label = def.kind === 'labelHost' ? entry.label : entry;
    if (!remainingOriginals.has(label)) deletions.push(label);
  });

  tablesStore.tables[def.id] = newEntries;

  let devicesChanged = false;
  renames.forEach(({ from, to }) => {
    devicesStore.devices.forEach(d => {
      def.devicesFields.forEach(df => {
        if (df.type === 'array') {
          const arr = d[df.field] || [];
          const i = arr.indexOf(from);
          if (i !== -1) { arr[i] = to; devicesChanged = true; }
        } else if (d[df.field] === from) {
          d[df.field] = to;
          devicesChanged = true;
        }
      });
    });
  });
  deletions.forEach(value => {
    devicesStore.devices.forEach(d => {
      def.devicesFields.forEach(df => {
        if (df.type === 'array') {
          const arr = d[df.field] || [];
          const i = arr.indexOf(value);
          if (i !== -1) { arr.splice(i, 1); devicesChanged = true; }
        } else if (d[df.field] === value) {
          d[df.field] = '';
          devicesChanged = true;
        }
      });
    });
  });

  try {
    await tablesStore.save();
    if (devicesChanged) await devicesStore.save();
    statusEl.textContent = 'Saved.';
    populateDeviceFormSelects();
    renderDevicesHeader();
    renderDevicesTable();
    renderTabelleTabRows(def);
    return true;
  } catch (error) {
    if (error.name === 'StorageConflictError') {
      statusEl.textContent = 'Conflict: data changed elsewhere. Reload the page and try again.';
    } else {
      statusEl.textContent = `Error: ${error.message}`;
    }
    return false;
  }
}

async function loadAndShowTabelle() {
  await tablesStore.load();
  if (devicesStore.devices.length === 0) await devicesStore.load();
  renderTabelleTabsArea();

  setConnStatusIcon(document.getElementById('tabelleConnStatus'), true, `Connected to ${appStorage.providerName} (${appStorage.connectedAccountEmail()}).`);
  document.getElementById('btnTabelleConnect').style.display = 'none';
  document.getElementById('btnTabelleDisconnect').style.display = 'inline-block';
  document.getElementById('tabelleConnectPlaceholder').style.display = 'none';
  document.getElementById('tabelleTabsArea').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
  registerUnsavedChangesChecker(checkTabelleUnsavedChanges);
  setConnStatusIcon(document.getElementById('tabelleConnStatus'), false, `Not connected to ${appStorage.providerName}.`);

  document.getElementById('btnTabelleConnect').addEventListener('click', async () => {
    try {
      document.getElementById('tabelleConnStatus').textContent = 'Connecting…';
      await appStorage.connect();
      await loadAndShowTabelle();
    } catch (error) {
      document.getElementById('tabelleConnStatus').textContent = `Connection error: ${error.message}`;
    }
  });

  document.getElementById('btnTabelleDisconnect').addEventListener('click', async () => {
    await appStorage.disconnect();
    setConnStatusIcon(document.getElementById('tabelleConnStatus'), false, `Not connected to ${appStorage.providerName}.`);
    document.getElementById('btnTabelleConnect').style.display = 'inline-block';
    document.getElementById('btnTabelleDisconnect').style.display = 'none';
    document.getElementById('tabelleTabsArea').style.display = 'none';
    document.getElementById('tabelleConnectPlaceholder').style.display = 'block';
  });

  // Connessione automatica: se una sessione OneDrive era già attiva (anche stabilita
  // da un'altra sezione), si salta il pulsante "Connetti" e si carica direttamente.
  appStorageReady.then(async giaConnesso => {
    if (giaConnesso || appStorage.isConnected()) await loadAndShowTabelle();
  });
});
