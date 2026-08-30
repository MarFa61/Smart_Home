/* =========================================================
   UI DELLA SEZIONE Devices
   Tabella (pattern AnagrafePersoneView: intestazione fissa +
   scroll sincronizzato) + editor a tab in un <dialog> (pattern
   ripreso e aggiornato dal mockup Home Device Mgmt).
   ========================================================= */

const devicesStore = new DevicesStore(appStorage);
const columnWidthStore = new ColumnWidthStore('devices');
let editingDevice = null; // copia di lavoro mentre il dialog è aperto

function devicesStatusEl() { return document.getElementById('devicesConnStatus'); }
function devicesTableBodyEl() { return document.getElementById('devicesTableBody'); }
function devicesEmptyMessageEl() { return document.getElementById('devicesEmptyMessage'); }

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* =========================================================
   COLONNE: ordinabili, filtrabili (per valori distinti),
   ridimensionabili — stesso pattern di AnagrafePersoneView
   (colonne libere sortabili+filtrabili via elenco valori,
   colonne descrittive lunghe come Modello/Host Name/Note
   solo sortabili, non filtrabili).
   ========================================================= */
const DEVICES_COLUMNS = [
  { id: 'nickname', title: 'Nickname', sticky: true, filterable: false, defaultWidth: 170,
    value: d => d.nickname || '', render: d => escapeHtml(d.nickname || '') },
  { id: 'marca', title: 'Marca', filterable: true, defaultWidth: 110,
    value: d => d.marca || '', render: d => escapeHtml(d.marca || '') },
  { id: 'modello', title: 'Modello', filterable: false, defaultWidth: 150,
    value: d => d.modello || '', render: d => escapeHtml(d.modello || '') },
  { id: 'avanzamento', title: 'Avanzamento', filterable: true, defaultWidth: 130,
    value: d => d.avanzamento || '', render: d => escapeHtml(d.avanzamento || '') },
  { id: 'devCategory', title: 'Categoria', filterable: true, defaultWidth: 100,
    value: d => d.devCategory || '', render: d => escapeHtml(d.devCategory || '') },
  { id: 'devZone', title: 'Zona', filterable: true, defaultWidth: 100,
    value: d => d.devZone || '', render: d => escapeHtml(d.devZone || '') },
  { id: 'devType', title: 'Tipo', filterable: true, defaultWidth: 90,
    value: d => d.devType || '', render: d => escapeHtml(d.devType || '') },
  { id: 'hostName', title: 'Host Name', filterable: false, defaultWidth: 210,
    value: d => computeHostName(d.devCategory, d.devZone, d.devType, d.devId),
    render: d => escapeHtml(computeHostName(d.devCategory, d.devZone, d.devType, d.devId)) },
  { id: 'ip', title: 'IP', filterable: false, defaultWidth: 110,
    value: d => (d.connections || []).map(c => c.ip).filter(Boolean).join(', '),
    render: d => escapeHtml((d.connections || []).map(c => c.ip).filter(Boolean).join(', ')) },
  { id: 'homekit', title: 'HomeKit', filterable: true, defaultWidth: 85,
    value: d => !!d.integratoHomeKit, render: d => boolBadge(d.integratoHomeKit) },
  { id: 'automazioni', title: 'Automazioni', filterable: true, defaultWidth: 100,
    value: d => !!d.usatoAutomazioni, render: d => boolBadge(d.usatoAutomazioni) },
  { id: 'disponibile', title: 'Disponibile', filterable: true, defaultWidth: 95,
    value: d => !!d.disponibileOra, render: d => boolBadge(d.disponibileOra) },
  { id: 'note', title: 'Note', filterable: false, defaultWidth: 220,
    value: d => d.note || '', render: d => escapeHtml(d.note || '') },
];

let sortColumnId = 'nickname';
let sortDirection = 'asc';
const columnFilters = {}; // columnId -> Set di valori visualizzati ammessi (assente = nessun filtro)
let openFilterColumnId = null;

function compareValues(a, b) {
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return a === b ? 0 : (a ? 1 : -1);
  }
  return String(a).localeCompare(String(b), 'it', { numeric: true, sensitivity: 'base' });
}

function displayValueForFilter(rawValue) {
  if (typeof rawValue === 'boolean') return rawValue ? 'Sì' : 'No';
  return rawValue || '(vuoto)';
}

function renderDevicesHeader() {
  const colgroup = document.getElementById('devicesColgroup');
  const headerRow = document.getElementById('devicesHeaderRow');
  colgroup.innerHTML = '';
  headerRow.innerHTML = '';

  DEVICES_COLUMNS.forEach(col => {
    const colEl = document.createElement('col');
    colEl.style.width = `${columnWidthStore.width(col.id, col.defaultWidth)}px`;
    colEl.dataset.col = col.id;
    colgroup.appendChild(colEl);

    const th = document.createElement('th');
    th.classList.add('sortable-th');
    if (col.sticky) th.classList.add('sticky-col');

    const label = document.createElement('span');
    label.className = 'th-label';
    label.textContent = col.title;
    label.addEventListener('click', () => {
      if (sortColumnId === col.id) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumnId = col.id;
        sortDirection = 'asc';
      }
      renderDevicesHeader();
      renderDevicesTable();
    });
    th.appendChild(label);

    if (sortColumnId === col.id) {
      const arrow = document.createElement('span');
      arrow.className = 'sort-arrow';
      arrow.textContent = sortDirection === 'asc' ? ' ↑' : ' ↓';
      th.appendChild(arrow);
    }

    if (col.filterable) {
      const filterBtn = document.createElement('button');
      filterBtn.type = 'button';
      filterBtn.className = 'col-filter-btn' + (columnFilters[col.id] ? ' active' : '');
      filterBtn.textContent = '▾';
      filterBtn.title = 'Filtra questa colonna';
      filterBtn.addEventListener('click', e => {
        e.stopPropagation();
        toggleFilterPopover(col, th);
      });
      th.appendChild(filterBtn);
    }

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'col-resize-handle';
    resizeHandle.addEventListener('mousedown', e => startColumnResize(e, col));
    th.appendChild(resizeHandle);

    headerRow.appendChild(th);
  });

  const actionsColEl = document.createElement('col');
  actionsColEl.style.width = '90px';
  colgroup.appendChild(actionsColEl);
  const actionsTh = document.createElement('th');
  actionsTh.className = 'sticky-actions';
  actionsTh.textContent = 'Azioni';
  headerRow.appendChild(actionsTh);
}

function startColumnResize(e, col) {
  e.preventDefault();
  e.stopPropagation();
  const th = e.target.closest('th');
  const startX = e.clientX;
  const startWidth = th.getBoundingClientRect().width;
  const colEl = document.querySelector(`#devicesColgroup col[data-col="${col.id}"]`);

  function onMove(ev) {
    const newWidth = Math.max(50, Math.round(startWidth + (ev.clientX - startX)));
    if (colEl) colEl.style.width = `${newWidth}px`;
  }
  function onUp(ev) {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    const newWidth = Math.max(50, Math.round(startWidth + (ev.clientX - startX)));
    columnWidthStore.setWidth(col.id, newWidth);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function toggleFilterPopover(col, thEl) {
  const existing = document.querySelector('.col-filter-popover');
  if (existing) existing.remove();
  if (openFilterColumnId === col.id) {
    openFilterColumnId = null;
    return;
  }
  openFilterColumnId = col.id;

  const distinctValues = Array.from(new Set(devicesStore.devices.map(d => displayValueForFilter(col.value(d)))))
    .sort((a, b) => a.localeCompare(b, 'it'));
  const currentFilter = columnFilters[col.id];

  const popover = document.createElement('div');
  popover.className = 'col-filter-popover';
  popover.innerHTML = `
    <div class="col-filter-list">
      ${distinctValues.map(v => `
        <label class="col-filter-item">
          <input type="checkbox" value="${escapeHtml(v)}" ${(!currentFilter || currentFilter.has(v)) ? 'checked' : ''}>
          ${escapeHtml(v)}
        </label>
      `).join('')}
    </div>
    <div class="col-filter-actions">
      <button type="button" class="btn edit" data-action="clear">Nessun filtro</button>
      <button type="button" class="btn btn-primary-add" data-action="apply">Applica</button>
    </div>
  `;
  popover.addEventListener('click', e => e.stopPropagation());
  popover.addEventListener('mousedown', e => e.stopPropagation());
  popover.querySelector('[data-action="clear"]').addEventListener('click', () => {
    delete columnFilters[col.id];
    openFilterColumnId = null;
    popover.remove();
    renderDevicesHeader();
    renderDevicesTable();
  });
  popover.querySelector('[data-action="apply"]').addEventListener('click', () => {
    const checked = Array.from(popover.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    if (checked.length === distinctValues.length) {
      delete columnFilters[col.id];
    } else {
      columnFilters[col.id] = new Set(checked);
    }
    openFilterColumnId = null;
    popover.remove();
    renderDevicesHeader();
    renderDevicesTable();
  });

  thEl.appendChild(popover);
}

document.addEventListener('click', () => {
  const existing = document.querySelector('.col-filter-popover');
  if (existing) {
    existing.remove();
    openFilterColumnId = null;
  }
});

function populateSelect(selectEl, options, includeBlank) {
  selectEl.innerHTML = '';
  if (includeBlank) {
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '-- Seleziona --';
    selectEl.appendChild(blank);
  }
  options.forEach(value => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    selectEl.appendChild(opt);
  });
}

function boolBadge(value) {
  return `<span class="badge ${value ? 'badge-yes' : 'badge-no'}">${value ? 'Sì' : 'No'}</span>`;
}

function renderDevicesTable() {
  const tbody = devicesTableBodyEl();
  const searchTerm = (document.getElementById('devicesSearch').value || '').toLowerCase();

  let filtered = devicesStore.devices.filter(d => {
    for (const col of DEVICES_COLUMNS) {
      const filterSet = columnFilters[col.id];
      if (!filterSet) continue;
      if (!filterSet.has(displayValueForFilter(col.value(d)))) return false;
    }
    return true;
  });

  if (searchTerm) {
    filtered = filtered.filter(d => {
      const haystack = DEVICES_COLUMNS
        .map(col => { const v = col.value(d); return typeof v === 'boolean' ? '' : v; })
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchTerm);
    });
  }

  const sortCol = DEVICES_COLUMNS.find(c => c.id === sortColumnId);
  if (sortCol) {
    filtered = filtered.slice().sort((a, b) => {
      const cmp = compareValues(sortCol.value(a), sortCol.value(b));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }

  tbody.innerHTML = '';
  devicesEmptyMessageEl().style.display = devicesStore.devices.length === 0 ? 'block' : 'none';

  filtered.forEach(device => {
    const tr = document.createElement('tr');
    const cellsHtml = DEVICES_COLUMNS.map(col => {
      const cls = col.sticky ? ' class="sticky-col"' : '';
      return `<td${cls}>${col.render(device)}</td>`;
    }).join('');
    tr.innerHTML = `
      ${cellsHtml}
      <td class="sticky-actions">
        <div class="actions">
          <button class="btn edit" title="Modifica" data-action="edit" data-id="${device.id}">✏️</button>
          <button class="btn pow" title="Elimina" data-action="delete" data-id="${device.id}">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateHostNamePreview() {
  const preview = document.getElementById('devHostNamePreview');
  preview.value = computeHostName(
    document.getElementById('devCategory').value,
    document.getElementById('devZone').value,
    document.getElementById('devType').value,
    document.getElementById('devId').value
  );
}

function renderConnectionsList() {
  const container = document.getElementById('devConnectionsList');
  container.innerHTML = '';

  editingDevice.connections.forEach((conn, index) => {
    const row = document.createElement('div');
    row.className = 'connection-row';
    row.innerHTML = `
      <input type="text" placeholder="Indirizzo IP" class="conn-ip" value="${conn.ip || ''}">
      <input type="text" placeholder="Nota (es. Wi-Fi / Ethernet)" class="conn-note" value="${conn.note || ''}">
      <button type="button" class="btn pow conn-remove" ${editingDevice.connections.length <= 1 ? 'disabled' : ''}>🗑️</button>
    `;
    row.querySelector('.conn-ip').addEventListener('input', e => { conn.ip = e.target.value; });
    row.querySelector('.conn-note').addEventListener('input', e => { conn.note = e.target.value; });
    row.querySelector('.conn-remove').addEventListener('click', () => {
      editingDevice.connections.splice(index, 1);
      renderConnectionsList();
    });
    container.appendChild(row);
  });
}

function switchDeviceTab(tabId) {
  document.querySelectorAll('#deviceDlg .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('#deviceDlg .tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabId);
  });
}

function openDeviceDialog(device) {
  editingDevice = JSON.parse(JSON.stringify(device)); // copia di lavoro: Annulla non deve toccare lo store
  document.getElementById('deviceDlgConflicts').style.display = 'none';

  const isNew = !devicesStore.devices.some(d => d.id === device.id);
  document.getElementById('deviceDlgTitle').textContent = isNew ? 'Nuovo Dispositivo' : `Modifica: ${device.nickname || '(senza nome)'}`;

  document.getElementById('devNickname').value = editingDevice.nickname;
  document.getElementById('devMarca').value = editingDevice.marca;
  document.getElementById('devModello').value = editingDevice.modello;
  document.getElementById('devTipoDispositivo').value = editingDevice.tipoDispositivo;
  document.getElementById('devProtocollo').value = editingDevice.protocollo;
  document.getElementById('devPhisicalHub').value = editingDevice.phisicalHub;
  document.getElementById('devManagingApp').value = editingDevice.managingApp;

  document.getElementById('devSSID').value = editingDevice.ssid;
  document.getElementById('devConnSpeed').value = editingDevice.connectionSpeed;
  renderConnectionsList();

  document.getElementById('devCategory').value = editingDevice.devCategory;
  document.getElementById('devZone').value = editingDevice.devZone;
  document.getElementById('devType').value = editingDevice.devType;
  document.getElementById('devId').value = editingDevice.devId;
  updateHostNamePreview();

  document.getElementById('devAvanzamento').value = editingDevice.avanzamento;
  document.getElementById('devDisponibile').checked = editingDevice.disponibileOra;
  document.getElementById('devHomey').checked = editingDevice.collegatoHomey;
  document.getElementById('devHomeyNote').value = editingDevice.collegatoHomeyNote;
  document.getElementById('devHomeKit').checked = editingDevice.integratoHomeKit;
  document.getElementById('devHomeKitNote').value = editingDevice.integratoHomeKitNote;
  document.getElementById('devAutomazioni').checked = editingDevice.usatoAutomazioni;
  document.getElementById('devAutomazioniNote').value = editingDevice.usatoAutomazioniNote;
  document.getElementById('devNote').value = editingDevice.note;

  switchDeviceTab('dtab-gen');
  document.getElementById('deviceDlg').showModal();
}

function collectFormIntoEditingDevice() {
  editingDevice.nickname = document.getElementById('devNickname').value.trim();
  editingDevice.marca = document.getElementById('devMarca').value.trim();
  editingDevice.modello = document.getElementById('devModello').value.trim();
  editingDevice.tipoDispositivo = document.getElementById('devTipoDispositivo').value.trim();
  editingDevice.protocollo = document.getElementById('devProtocollo').value.trim();
  editingDevice.phisicalHub = document.getElementById('devPhisicalHub').value.trim();
  editingDevice.managingApp = document.getElementById('devManagingApp').value.trim();

  editingDevice.ssid = document.getElementById('devSSID').value.trim();
  editingDevice.connectionSpeed = document.getElementById('devConnSpeed').value.trim();
  // editingDevice.connections è già aggiornato in tempo reale da renderConnectionsList()

  editingDevice.devCategory = document.getElementById('devCategory').value;
  editingDevice.devZone = document.getElementById('devZone').value;
  editingDevice.devType = document.getElementById('devType').value;
  editingDevice.devId = document.getElementById('devId').value.trim();

  editingDevice.avanzamento = document.getElementById('devAvanzamento').value;
  editingDevice.disponibileOra = document.getElementById('devDisponibile').checked;
  editingDevice.collegatoHomey = document.getElementById('devHomey').checked;
  editingDevice.collegatoHomeyNote = document.getElementById('devHomeyNote').value.trim();
  editingDevice.integratoHomeKit = document.getElementById('devHomeKit').checked;
  editingDevice.integratoHomeKitNote = document.getElementById('devHomeKitNote').value.trim();
  editingDevice.usatoAutomazioni = document.getElementById('devAutomazioni').checked;
  editingDevice.usatoAutomazioniNote = document.getElementById('devAutomazioniNote').value.trim();
  editingDevice.note = document.getElementById('devNote').value.trim();
}

async function saveEditingDevice() {
  collectFormIntoEditingDevice();

  const conflicts = devicesStore.findConflicts(editingDevice);
  const conflictsBox = document.getElementById('deviceDlgConflicts');
  if (conflicts.length > 0) {
    conflictsBox.style.display = 'block';
    conflictsBox.innerHTML = conflicts.map(c => `<div>⚠️ ${c}</div>`).join('');
    return;
  }
  conflictsBox.style.display = 'none';

  devicesStore.upsert(editingDevice);
  try {
    await devicesStore.save();
    document.getElementById('deviceDlg').close();
    renderDevicesTable();
  } catch (error) {
    if (error.name === 'StorageConflictError') {
      alert('I dati su OneDrive sono cambiati nel frattempo (probabilmente da un altro dispositivo). Ricarica la pagina e riprova.');
    } else {
      alert(`Errore nel salvataggio: ${error.message}`);
    }
  }
}

async function deleteDevice(id) {
  const device = devicesStore.devices.find(d => d.id === id);
  if (!device) return;
  if (!confirm(`Eliminare "${device.nickname || device.id}"?`)) return;

  devicesStore.remove(id);
  try {
    await devicesStore.save();
    renderDevicesTable();
  } catch (error) {
    if (error.name === 'StorageConflictError') {
      alert('I dati su OneDrive sono cambiati nel frattempo. Ricarica la pagina e riprova.');
    } else {
      alert(`Errore nel salvataggio: ${error.message}`);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderDevicesHeader();

  populateSelect(document.getElementById('devCategory'), DEV_CATEGORIES.map(c => c.label), true);
  populateSelect(document.getElementById('devZone'), DEV_ZONES.map(z => z.label), true);
  populateSelect(document.getElementById('devType'), DEV_TYPES.map(t => t.label), true);
  populateSelect(document.getElementById('devAvanzamento'), DEV_AVANZAMENTO, false);

  ['devCategory', 'devZone', 'devType', 'devId'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateHostNamePreview);
    document.getElementById(id).addEventListener('change', updateHostNamePreview);
  });

  document.querySelectorAll('#deviceDlg .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchDeviceTab(btn.dataset.tab));
  });

  document.getElementById('btnAddConnection').addEventListener('click', () => {
    editingDevice.connections.push({ ip: '', note: '' });
    renderConnectionsList();
  });

  document.getElementById('btnDeviceCancel').addEventListener('click', () => {
    document.getElementById('deviceDlg').close();
  });
  document.getElementById('btnDeviceSave').addEventListener('click', saveEditingDevice);

  document.getElementById('btnDeviceNew').addEventListener('click', () => {
    openDeviceDialog(makeEmptyDevice());
  });

  devicesTableBodyEl().addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'edit') {
      const device = devicesStore.devices.find(d => d.id === id);
      if (device) openDeviceDialog(device);
    } else if (btn.dataset.action === 'delete') {
      deleteDevice(id);
    }
  });

  document.getElementById('devicesSearch').addEventListener('input', renderDevicesTable);

  document.getElementById('btnDevicesConnect').addEventListener('click', async () => {
    try {
      devicesStatusEl().textContent = 'Connessione in corso…';
      await appStorage.connect();
      await loadAndShowDevices();
    } catch (error) {
      devicesStatusEl().textContent = `Errore di connessione: ${error.message}`;
    }
  });

  document.getElementById('btnDevicesDisconnect').addEventListener('click', async () => {
    await appStorage.disconnect();
    devicesStore.devices = [];
    renderDevicesTable();
    devicesStatusEl().textContent = 'Non connesso a OneDrive.';
    document.getElementById('btnDevicesConnect').style.display = 'inline-block';
    document.getElementById('btnDevicesDisconnect').style.display = 'none';
    document.getElementById('btnDeviceNew').style.display = 'none';
  });

  // Connessione automatica: se una sessione OneDrive era già attiva, si salta del
  // tutto il pulsante "Connetti" e si carica direttamente l'elenco.
  appStorageReady.then(async giaConnesso => {
    if (giaConnesso) await loadAndShowDevices();
  });
});

async function loadAndShowDevices() {
  devicesStatusEl().textContent = `Connesso a OneDrive (${appStorage.connectedAccountEmail()}).`;
  document.getElementById('btnDevicesConnect').style.display = 'none';
  document.getElementById('btnDevicesDisconnect').style.display = 'inline-block';
  document.getElementById('btnDeviceNew').style.display = 'inline-block';
  await devicesStore.load();
  renderDevicesTable();
}
