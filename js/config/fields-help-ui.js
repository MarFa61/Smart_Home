/* =========================================================
   TAB "FIELDS & HELP" (Config) — gestione dei testi di aiuto e dell'obbligatorietà
   dinamica dei campi di Devices (vedi HelpFieldsStore.js). Stesso schema di
   colori-ui.js/backup-ui.js: niente framework, DOM diretto, render-on-change.
   Il rendering iniziale avviene da loadAndShowConfig() (colori-ui.js), non qui al
   DOMContentLoaded: prima della connessione configStore.config è ancora il
   segnaposto di default, e comunque l'intero configTabsArea resta nascosto finché
   non ci si connette.
   ========================================================= */

const helpFieldsStore = new HelpFieldsStore(configStore);

let fieldsHelpEditingKey = null;

function fieldsHelpScreens() {
  const seen = [];
  helpFieldsStore.rows().forEach(r => { if (!seen.includes(r.screen)) seen.push(r.screen); });
  return seen;
}

function fieldsHelpGroupsFor(screen) {
  const seen = [];
  helpFieldsStore.rows()
    .filter(r => r.screen === screen)
    .forEach(r => { if (r.group && !seen.includes(r.group)) seen.push(r.group); });
  return seen;
}

// Dropdown "Tab" mostrato solo se la screen selezionata ha più di un gruppo —
// stesso comportamento del filtro "Finestra/Tag" in Incarichi (TestiAiutoView).
function renderFieldsHelpFilters() {
  const screenSelect = document.getElementById('fieldsHelpScreen');
  const screens = fieldsHelpScreens();
  const currentScreen = screens.includes(screenSelect.value) ? screenSelect.value : screens[0];
  populateSelect(screenSelect, screens, false);
  screenSelect.value = currentScreen;

  const groups = fieldsHelpGroupsFor(currentScreen);
  const groupSelect = document.getElementById('fieldsHelpGroup');
  groupSelect.style.display = groups.length > 1 ? '' : 'none';
  if (groups.length > 1) {
    const currentGroup = groups.includes(groupSelect.value) ? groupSelect.value : groups[0];
    populateSelect(groupSelect, groups, false);
    groupSelect.value = currentGroup;
  }
}

function buildFieldsHelpMandatoryCell(row) {
  const td = document.createElement('td');
  const wrap = document.createElement('label');
  wrap.className = 'switch-wrap';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'switch-input';
  checkbox.checked = row.mandatory;
  checkbox.addEventListener('change', async () => {
    helpFieldsStore.setMandatory(row.key, checkbox.checked);
    await saveFieldsHelp();
  });
  const slider = document.createElement('span');
  slider.className = 'switch-slider';
  wrap.appendChild(checkbox);
  wrap.appendChild(slider);
  td.appendChild(wrap);
  return td;
}

function renderFieldsHelpTable() {
  const screen = document.getElementById('fieldsHelpScreen').value;
  const groups = fieldsHelpGroupsFor(screen);
  const group = groups.length > 1 ? document.getElementById('fieldsHelpGroup').value : null;

  const rows = helpFieldsStore.rows().filter(r => r.screen === screen && (group === null || r.group === group));

  const tbody = document.getElementById('fieldsHelpTableBody');
  tbody.innerHTML = '';
  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.appendChild(buildFieldsHelpMandatoryCell(row));

    const tdLabel = document.createElement('td');
    tdLabel.textContent = row.label;
    tr.appendChild(tdLabel);

    const tdText = document.createElement('td');
    tdText.className = 'fields-help-text-cell';
    tdText.textContent = row.text;
    tr.appendChild(tdText);

    // Stesso pattern della colonna Azioni di Devices (.actions/.actions .btn, 42px
    // senza padding orizzontale): senza, il padding di .btn tagliava il pulsante
    // contro il bordo della colonna stretta.
    const tdActions = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'actions';
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn edit';
    editBtn.title = 'Edit';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => openFieldHelpEditDialog(row));
    actions.appendChild(editBtn);
    tdActions.appendChild(actions);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}

function openFieldHelpEditDialog(row) {
  fieldsHelpEditingKey = row.key;
  document.getElementById('fieldHelpEditKey').value = row.key;
  document.getElementById('fieldHelpEditLabel').value = row.label;
  document.getElementById('fieldHelpEditText').value = row.text;
  document.getElementById('fieldHelpEditDlg').showModal();
}

async function saveFieldsHelp() {
  const status = document.getElementById('fieldsHelpStatus');
  try {
    await helpFieldsStore.save();
    status.textContent = '';
  } catch (error) {
    status.textContent = `Error: ${error.message}`;
  }
  renderFieldsHelpTable();
  // I campi obbligatori di Devices possono essere cambiati da qui: la prossima
  // apertura del dialog Device deve riflettere il nuovo stato (bordo rosso/Save).
  if (typeof applyRequiredFieldStyling === 'function') applyRequiredFieldStyling();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fieldsHelpScreen').addEventListener('change', () => {
    renderFieldsHelpFilters();
    renderFieldsHelpTable();
  });
  document.getElementById('fieldsHelpGroup').addEventListener('change', renderFieldsHelpTable);

  document.getElementById('fieldsHelpEnabled').addEventListener('change', async e => {
    helpFieldsStore.enabled = e.target.checked;
    await saveFieldsHelp();
  });

  document.getElementById('btnFieldHelpEditCancel').addEventListener('click', () => {
    document.getElementById('fieldHelpEditDlg').close();
  });
  document.getElementById('btnFieldHelpEditSave').addEventListener('click', async () => {
    helpFieldsStore.setText(fieldsHelpEditingKey, document.getElementById('fieldHelpEditText').value.trim());
    document.getElementById('fieldHelpEditDlg').close();
    await saveFieldsHelp();
  });
});
