/* =========================================================
   UI DELLA SEZIONE Devices
   Tabella (pattern AnagrafePersoneView: intestazione fissa +
   scroll sincronizzato) + editor a tab in un <dialog> (pattern
   ripreso e aggiornato dal mockup Home Device Mgmt).
   ========================================================= */

const devicesStore = new DevicesStore(appStorage);
let editingDevice = null; // copia di lavoro mentre il dialog è aperto

function devicesStatusEl() { return document.getElementById('devicesConnStatus'); }
function devicesTableBodyEl() { return document.getElementById('devicesTableBody'); }
function devicesEmptyMessageEl() { return document.getElementById('devicesEmptyMessage'); }

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

  const filtered = devicesStore.devices.filter(d => {
    if (!searchTerm) return true;
    const hostName = computeHostName(d.devCategory, d.devZone, d.devType, d.devId);
    const ip = (d.connections || []).map(c => c.ip).join(' ');
    const haystack = `${d.nickname} ${d.marca} ${d.modello} ${hostName} ${ip}`.toLowerCase();
    return haystack.includes(searchTerm);
  });

  tbody.innerHTML = '';
  devicesEmptyMessageEl().style.display = devicesStore.devices.length === 0 ? 'block' : 'none';

  filtered.forEach(device => {
    const hostName = computeHostName(device.devCategory, device.devZone, device.devType, device.devId);
    const ip = (device.connections || []).map(c => c.ip).filter(Boolean).join(', ');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="sticky-col">${device.nickname || ''}</td>
      <td>${device.marca || ''}</td>
      <td>${device.modello || ''}</td>
      <td>${device.avanzamento || ''}</td>
      <td>${device.devCategory || ''}</td>
      <td>${device.devZone || ''}</td>
      <td>${device.devType || ''}</td>
      <td>${hostName}</td>
      <td>${ip}</td>
      <td>${boolBadge(device.integratoHomeKit)}</td>
      <td>${boolBadge(device.usatoAutomazioni)}</td>
      <td>${boolBadge(device.disponibileOra)}</td>
      <td>${device.note || ''}</td>
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
