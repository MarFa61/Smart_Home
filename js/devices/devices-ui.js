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
// Stesso ordine e stessa copertura del foglio "Dispositivi Smart" dell'Excel di
// partenza (colonna per colonna), tranne Criticità e Priorità intervento — rimandate
// di proposito nell'analisi iniziale (dati non ancora assestati/valorizzati).
const DEVICES_COLUMNS = [
  { id: 'nickname', title: 'Nickname', sticky: true, filterable: false, defaultWidth: 170,
    value: d => d.nickname || '', render: d => escapeHtml(d.nickname || '') },
  { id: 'marca', title: 'Brand', filterable: true, defaultWidth: 110,
    value: d => d.marca || '', render: d => escapeHtml(d.marca || '') },
  { id: 'modello', title: 'Model', filterable: false, defaultWidth: 150,
    value: d => d.modello || '', render: d => escapeHtml(d.modello || '') },
  { id: 'avanzamento', title: 'Progress', filterable: true, defaultWidth: 130,
    value: d => d.avanzamento || '', render: d => escapeHtml(d.avanzamento || '') },
  { id: 'tipoDispositivo', title: 'Device type', filterable: false, defaultWidth: 140,
    value: d => d.tipoDispositivo || '', render: d => escapeHtml(d.tipoDispositivo || '') },
  { id: 'protocollo', title: 'Protocol', filterable: true, defaultWidth: 130,
    value: d => d.protocolloConnessione || '', render: d => escapeHtml(d.protocolloConnessione || '') },
  { id: 'phisicalHub', title: 'Connection Hub', filterable: true, defaultWidth: 140,
    value: d => d.phisicalHub || '', render: d => escapeHtml(d.phisicalHub || '') },
  { id: 'managingApp', title: 'Managing App', filterable: false, defaultWidth: 130,
    value: d => d.managingApp || '', render: d => escapeHtml(d.managingApp || '') },
  { id: 'homey', title: 'Connected to Homey', filterable: true, defaultWidth: 100,
    value: d => !!d.collegatoHomey, render: d => boolBadge(d.collegatoHomey) },
  { id: 'ssid', title: 'SSID', filterable: false, defaultWidth: 120,
    value: d => d.ssid || '', render: d => escapeHtml(d.ssid || '') },
  { id: 'connectedTo', title: 'Connected to', filterable: true, defaultWidth: 100,
    value: d => d.connectedTo || '', render: d => escapeHtml(d.connectedTo || '') },
  { id: 'connectionSpeed', title: 'Connection Speed', filterable: true, defaultWidth: 110,
    value: d => d.connectionSpeed || '', render: d => escapeHtml(d.connectionSpeed || '') },
  { id: 'devGroup', title: 'Dev. Group', filterable: true, defaultWidth: 110,
    value: d => d.devGroup || '', render: d => escapeHtml(d.devGroup || '') },
  { id: 'devCategory', title: 'Category', filterable: true, defaultWidth: 100,
    value: d => d.devCategory || '', render: d => escapeHtml(d.devCategory || '') },
  { id: 'devZone', title: 'Zone', filterable: true, defaultWidth: 100,
    value: d => d.devZone || '', render: d => escapeHtml(d.devZone || '') },
  { id: 'devType', title: 'Type', filterable: true, defaultWidth: 90,
    value: d => d.devType || '', render: d => escapeHtml(d.devType || '') },
  { id: 'devId', title: 'Dev. Id.', filterable: false, defaultWidth: 90,
    value: d => d.devId || '', render: d => escapeHtml(d.devId || '') },
  { id: 'hostName', title: 'Host Name', filterable: false, defaultWidth: 210,
    value: d => computeHostName(d.devCategory, d.devZone, d.devType, d.devId),
    render: d => escapeHtml(computeHostName(d.devCategory, d.devZone, d.devType, d.devId)) },
  { id: 'ip', title: 'IP', filterable: false, defaultWidth: 110,
    value: d => (d.connections || []).map(c => c.ip).filter(Boolean).join(', '),
    render: d => escapeHtml((d.connections || []).map(c => c.ip).filter(Boolean).join(', ')) },
  { id: 'homekit', title: 'HomeKit', filterable: true, defaultWidth: 85,
    value: d => !!d.integratoHomeKit, render: d => boolBadge(d.integratoHomeKit) },
  { id: 'automazioni', title: 'Automations', filterable: true, defaultWidth: 100,
    value: d => !!d.usatoAutomazioni, render: d => boolBadge(d.usatoAutomazioni) },
  { id: 'disponibile', title: 'Available', filterable: true, defaultWidth: 95,
    value: d => !!d.disponibileOra, render: d => boolBadge(d.disponibileOra) },
  { id: 'note', title: 'Notes', filterable: false, defaultWidth: 220,
    value: d => d.note || '', render: d => escapeHtml(d.note || '') },
];

// Ordinamento persistito in localStorage (preferenza del browser/device, come le
// larghezze colonna in ColumnWidthStore, non dato business: non va su OneDrive) —
// altrimenti si perdeva ad ogni ricaricamento della pagina.
const DEVICES_SORT_KEY = 'devicesSort';
function loadDevicesSort() {
  try {
    const saved = JSON.parse(localStorage.getItem(DEVICES_SORT_KEY));
    if (saved && DEVICES_COLUMNS.some(c => c.id === saved.columnId)) {
      return { columnId: saved.columnId, direction: saved.direction === 'desc' ? 'desc' : 'asc' };
    }
  } catch (e) { /* localStorage non disponibile: si parte dal default */ }
  return { columnId: 'nickname', direction: 'asc' };
}
function saveDevicesSort() {
  try {
    localStorage.setItem(DEVICES_SORT_KEY, JSON.stringify({ columnId: sortColumnId, direction: sortDirection }));
  } catch (e) { /* localStorage non disponibile: l'ordinamento resta solo per questa sessione */ }
}

const _initialDevicesSort = loadDevicesSort();
let sortColumnId = _initialDevicesSort.columnId;
let sortDirection = _initialDevicesSort.direction;
const columnFilters = {}; // columnId -> Set di valori visualizzati ammessi (assente = nessun filtro)
let openFilterColumnId = null;

function compareValues(a, b) {
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return a === b ? 0 : (a ? 1 : -1);
  }
  return String(a).localeCompare(String(b), 'it', { numeric: true, sensitivity: 'base' });
}

function displayValueForFilter(rawValue) {
  if (typeof rawValue === 'boolean') return rawValue ? 'Yes' : 'No';
  return rawValue || '(empty)';
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
    // Divisore come box-shadow inset, non border-right: su una cella position:sticky
    // Safari dipinge lo sfondo SOPRA il proprio bordo (bug noto e documentato di
    // WebKit, diverso dal comportamento di Chrome), rendendo un border-right visibile
    // solo a tratti a seconda dell'arrotondamento sub-pixel dello zoom. Un box-shadow
    // non ha questo problema — è la stessa tecnica già in uso per l'ombra di scroll
    // della colonna Nickname (.sticky-col), qui riprodotta per poterla combinare.
    const dividerColor = colorStore.hex('dividerIntestazioneTabella', 'chiaro', 'primoPiano');
    th.style.boxShadow = col.sticky
      ? `2px 0 5px rgba(0,0,0,0.05), inset -1px 0 0 ${dividerColor}`
      : `inset -1px 0 0 ${dividerColor}`;

    // Contenuto in flusso normale (non position:absolute): più robusto su colonne strette,
    // dove un elemento assoluto rischiava di finire fuori dall'area visibile della cella.
    const content = document.createElement('div');
    content.className = 'th-content';

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
      saveDevicesSort();
      renderDevicesHeader();
      renderDevicesTable();
    });
    content.appendChild(label);

    if (sortColumnId === col.id) {
      const arrow = document.createElement('span');
      arrow.className = 'sort-arrow';
      arrow.textContent = sortDirection === 'asc' ? '↑' : '↓';
      content.appendChild(arrow);
    }

    if (col.filterable) {
      const filterBtn = document.createElement('button');
      filterBtn.type = 'button';
      filterBtn.className = 'col-filter-btn' + (columnFilters[col.id] ? ' active' : '');
      // Icona a imbuto (SVG, non carattere Unicode: indipendente dal supporto font del
      // sistema), più riconoscibile e visibile della precedente freccina sottile.
      filterBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 14 14"><polygon points="12.5 2 1.5 2 6 7.5 6 11.5 8 12.5 8 7.5 12.5 2" fill="currentColor"/></svg>';
      filterBtn.title = 'Filter this column';
      filterBtn.addEventListener('click', e => {
        e.stopPropagation();
        toggleFilterPopover(col, th);
      });
      content.appendChild(filterBtn);
    }

    th.appendChild(content);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'col-resize-handle';
    resizeHandle.addEventListener('mousedown', e => startColumnResize(e, col));
    th.appendChild(resizeHandle);

    headerRow.appendChild(th);
  });

  const actionsColEl = document.createElement('col');
  // 14 (padding sinistro cella) + 42 (pulsante) + 14 (gap) + 42 (pulsante) + 14 (padding
  // destro cella) = 126: nessun margine residuo, i tre spazi bianchi risultano identici.
  actionsColEl.style.width = '126px';
  colgroup.appendChild(actionsColEl);
  const actionsTh = document.createElement('th');
  actionsTh.className = 'sticky-actions';
  actionsTh.textContent = 'Actions';
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
    <div class="col-filter-actions">
      <button type="button" class="btn edit" data-action="deselect-all">Deselect all</button>
      <button type="button" class="btn edit" data-action="clear">No filter</button>
      <button type="button" class="btn btn-primary-add" data-action="apply">Apply</button>
    </div>
    <div class="col-filter-list">
      ${distinctValues.map(v => `
        <label class="col-filter-item">
          <input type="checkbox" value="${escapeHtml(v)}" ${(!currentFilter || currentFilter.has(v)) ? 'checked' : ''}>
          ${escapeHtml(v)}
        </label>
      `).join('')}
    </div>
  `;
  popover.addEventListener('click', e => e.stopPropagation());
  popover.addEventListener('mousedown', e => e.stopPropagation());
  popover.querySelector('[data-action="deselect-all"]').addEventListener('click', () => {
    popover.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
  });
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

  // Appeso a <body> con posizione calcolata (non dentro il <th>): un contenitore antenato
  // con overflow impostato (es. .table-responsive per lo scroll orizzontale) taglierebbe
  // altrimenti il popover, essendo un blocco a comparsa che deve sporgere sotto la testata.
  const rect = thEl.getBoundingClientRect();
  popover.style.position = 'fixed';
  popover.style.top = `${rect.bottom + 2}px`;
  popover.style.left = `${rect.left}px`;
  document.body.appendChild(popover);
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
    blank.textContent = '-- Select --';
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
  return `<span class="badge ${value ? 'badge-yes' : 'badge-no'}">${value ? 'Yes' : 'No'}</span>`;
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
          <button class="btn edit" title="Edit" data-action="edit" data-id="${device.id}"><img src="./img/edit-icon.png?v=1" class="row-action-icon" alt="Edit"></button>
          <button class="btn pow" title="Delete" data-action="delete" data-id="${device.id}"><img src="./img/delete-icon.png?v=1" class="row-action-icon" alt="Delete"></button>
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

// IP disponibili per il Dev. Group del dispositivo in modifica: dal blocco riservato
// a quel gruppo (DEV_GROUP_IP_RANGES), esclusi gli IP già usati da ALTRI dispositivi.
// Nessun blocco per il gruppo (Dinamico/TBD/n/a/vuoto) → nessun suggerimento, resta
// testo libero.
function availableIpsForEditingDevice() {
  const range = DEV_GROUP_IP_RANGES[editingDevice.devGroup];
  if (!range) return [];
  const usedByOthers = new Set();
  devicesStore.devices.forEach(d => {
    if (d.id === editingDevice.id) return;
    (d.connections || []).forEach(c => { if (c.ip) usedByOthers.add(c.ip); });
  });
  return expandIpRange(range).filter(ip => !usedByOthers.has(ip));
}

// Popover suggerimenti IP fatto a mano invece di <datalist>: il supporto di
// <datalist> su input di testo è incompleto/inaffidabile in Safari (spesso non
// mostra alcun menu). Usa l'API Popover nativa (attributo popover="auto"), non un
// div appeso a <body> come il popover filtro colonne: il dialog Device è un
// <dialog> aperto con showModal(), che vive nel "top layer" del browser sopra tutta
// la pagina — un div normale in <body> finirebbe sempre nascosto dietro di esso,
// indipendentemente da z-index. Un popover con l'attributo nativo si apre invece
// anch'esso nel top layer, sopra il dialog, e si chiude da solo al click fuori.
function closeIpSuggestPopover() {
  const existing = document.querySelector('.ip-suggest-popover');
  if (existing) existing.remove();
}

function showIpSuggestPopover(inputEl, allIps) {
  closeIpSuggestPopover();
  const typed = inputEl.value.trim().toLowerCase();
  const matches = typed ? allIps.filter(ip => ip.toLowerCase().includes(typed)) : allIps;

  const popover = document.createElement('div');
  popover.className = 'ip-suggest-popover';
  popover.setAttribute('popover', 'auto');
  popover.innerHTML = matches.length
    ? matches.map(ip => `<div class="ip-suggest-item" data-ip="${ip}">${ip}</div>`).join('')
    : '<div class="ip-suggest-empty">No free IP in the reserved block</div>';
  // pointerdown (non mousedown/click): è il primo evento della sequenza, prima che
  // il light-dismiss nativo del popover possa nasconderlo e far "cadere" il click
  // sull'elemento sottostante (es. il pulsante Aggiungi connessione).
  popover.addEventListener('pointerdown', e => {
    e.preventDefault();
    const item = e.target.closest('.ip-suggest-item');
    if (!item) return;
    inputEl.value = item.dataset.ip;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    closeIpSuggestPopover();
  });

  // Appeso dentro il <dialog>, non a document.body: il dialog modale rende inerte
  // (non cliccabile) tutto ciò che sta fuori dal proprio sottoalbero DOM, anche se
  // il popover, promosso al top layer, ci si disegna visivamente sopra — da fuori i
  // click "cadevano" sul dialog sottostante invece di raggiungere gli item.
  document.getElementById('deviceDlg').appendChild(popover);
  const rect = inputEl.getBoundingClientRect();
  popover.style.top = `${rect.bottom + 2}px`;
  popover.style.left = `${rect.left}px`;
  popover.style.width = `${rect.width}px`;
  popover.showPopover();
}

// Avviso quando manca il prerequisito per i suggerimenti IP: Dev. Group non ancora
// scelto per niente (diverso da Dinamico/TBD/n/a, che semplicemente non hanno un
// blocco riservato — caso normale, nessun avviso). Reso esplicito qui invece di
// lasciare che il campo IP torni silenziosamente testo libero senza spiegazioni.
function updateIpGroupHint() {
  const hint = document.getElementById('devIpGroupHint');
  if (!editingDevice.devGroup) {
    hint.textContent = 'Set the Dev. Group (tab "Configuration & Groups") to get free IP suggestions within the reserved block.';
    hint.style.display = 'block';
  } else {
    hint.style.display = 'none';
  }
}

function renderConnectionsList() {
  updateIpGroupHint();
  const container = document.getElementById('devConnectionsList');
  container.innerHTML = '';
  // Senza Dev. Group non c'è un blocco IP di riferimento: i campi restano bloccati
  // (non testo libero) e non si possono aggiungere altre connessioni, invece di
  // lasciare che l'utente componga un IP fuori da qualsiasi blocco riservato.
  const locked = !editingDevice.devGroup;
  const availableIps = availableIpsForEditingDevice();
  const ipPlaceholder = locked ? 'Set the Dev. Group first' : 'IP address';
  // Freccina come nelle tendine native, solo quando ci sono davvero suggerimenti da
  // mostrare: segnala che il campo si può scegliere da un elenco, non solo digitare.
  const arrowSvg = '<svg class="conn-ip-arrow" width="8" height="8" viewBox="0 0 10 10"><path d="M1 3 L5 7 L9 3" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  document.getElementById('btnAddConnection').style.display = locked ? 'none' : '';

  editingDevice.connections.forEach((conn, index) => {
    const row = document.createElement('div');
    row.className = 'connection-row';
    row.innerHTML = `
      <div class="conn-ip-wrap${availableIps.length ? ' has-suggestions' : ''}">
        <input type="text" placeholder="${ipPlaceholder}" class="conn-ip" value="${escapeHtml(conn.ip || '')}" autocomplete="off" ${locked ? 'disabled' : ''}>
        ${availableIps.length ? arrowSvg : ''}
      </div>
      <input type="text" placeholder="Note (e.g. Wi-Fi / Ethernet)" class="conn-note" value="${escapeHtml(conn.note || '')}" ${locked ? 'disabled' : ''}>
      <button type="button" class="btn pow conn-remove">🗑️</button>
    `;
    const ipInput = row.querySelector('.conn-ip');
    ipInput.addEventListener('input', e => {
      conn.ip = e.target.value;
      if (availableIps.length) showIpSuggestPopover(ipInput, availableIps);
    });
    if (availableIps.length) {
      // Sia focus (es. arrivo con Tab) sia click (anche a campo già attivo, dato che
      // un click sul campo mentre il popover è aperto lo chiude da solo: è un
      // popover "auto", si autochiude sui click fuori da sé — l'input è fuori).
      ipInput.addEventListener('focus', () => showIpSuggestPopover(ipInput, availableIps));
      ipInput.addEventListener('click', () => showIpSuggestPopover(ipInput, availableIps));
    }
    row.querySelector('.conn-note').addEventListener('input', e => { conn.note = e.target.value; });
    row.querySelector('.conn-remove').addEventListener('click', () => {
      // Conferma solo se c'è davvero qualcosa da perdere: azione irreversibile,
      // ma su una riga già vuota non ha senso interrompere l'utente.
      if ((conn.ip || conn.note) && !confirm('Delete this connection (IP and Note)?')) return;
      // Sull'unica riga rimasta non si può eliminare la riga stessa (ne deve
      // restare sempre almeno una): il cestino ne svuota invece il contenuto.
      if (editingDevice.connections.length <= 1) {
        conn.ip = '';
        conn.note = '';
      } else {
        editingDevice.connections.splice(index, 1);
      }
      renderConnectionsList();
    });
    container.appendChild(row);
  });
}

// "Protocolli supportati": elenco a più righe come le Connessioni (IP), ma con una
// tendina invece di un campo libero — niente popover di suggerimento, solo scelta
// dalla tabella "Protocollo". Ogni riga esclude i protocolli già scelti nelle altre
// righe dello stesso device (niente duplicati), mostrando comunque il proprio valore.
function renderProtocolliList() {
  const container = document.getElementById('devProtocolliList');
  container.innerHTML = '';
  const allProtocolli = tablesStore.labels('protocollo');

  document.getElementById('btnAddProtocollo').style.display =
    editingDevice.protocolli.length >= allProtocolli.length ? 'none' : '';

  editingDevice.protocolli.forEach((value, index) => {
    const row = document.createElement('div');
    row.className = 'connection-row';
    const select = document.createElement('select');
    select.className = 'protocollo-select';
    const usedByOthers = new Set(editingDevice.protocolli.filter((_, i) => i !== index));
    const options = allProtocolli.filter(p => p === value || !usedByOthers.has(p));
    populateSelect(select, options, !value);
    select.value = value;
    select.addEventListener('change', e => { editingDevice.protocolli[index] = e.target.value; renderProtocolliList(); });
    row.appendChild(select);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn pow';
    removeBtn.textContent = '🗑️';
    removeBtn.addEventListener('click', () => {
      if (value && !confirm(`Remove "${value}" from supported protocols?`)) return;
      editingDevice.protocolli.splice(index, 1);
      renderProtocolliList();
    });
    row.appendChild(removeBtn);

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
  document.getElementById('deviceDlgTitle').textContent = isNew ? 'New Device' : `Edit: ${device.nickname || '(no name)'}`;

  document.getElementById('devNickname').value = editingDevice.nickname;
  document.getElementById('devMarca').value = editingDevice.marca;
  document.getElementById('devModello').value = editingDevice.modello;
  document.getElementById('devTipoDispositivo').value = editingDevice.tipoDispositivo;
  document.getElementById('devManagingApp').value = editingDevice.managingApp;
  populateSelect(document.getElementById('devPhisicalHub'), hubNicknameOptions(editingDevice.id), true);
  document.getElementById('devPhisicalHub').value = editingDevice.phisicalHub;
  document.getElementById('devProtocolloConnessione').value = editingDevice.protocolloConnessione;
  if (!Array.isArray(editingDevice.protocolli)) editingDevice.protocolli = [];
  renderProtocolliList();

  document.getElementById('devSSID').value = editingDevice.ssid;
  document.getElementById('devConnSpeed').value = editingDevice.connectionSpeed;
  document.getElementById('devConnectedTo').value = editingDevice.connectedTo;
  renderConnectionsList();

  document.getElementById('devGroup').value = editingDevice.devGroup;
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
  editingDevice.managingApp = document.getElementById('devManagingApp').value.trim();
  editingDevice.phisicalHub = document.getElementById('devPhisicalHub').value.trim();
  editingDevice.protocolloConnessione = document.getElementById('devProtocolloConnessione').value.trim();
  // editingDevice.protocolli è già aggiornato in tempo reale da renderProtocolliList()

  editingDevice.ssid = document.getElementById('devSSID').value.trim();
  editingDevice.connectionSpeed = document.getElementById('devConnSpeed').value.trim();
  editingDevice.connectedTo = document.getElementById('devConnectedTo').value;
  // editingDevice.connections è già aggiornato in tempo reale da renderConnectionsList()

  editingDevice.devGroup = document.getElementById('devGroup').value;
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
      alert('Data changed in the meantime (probably from another device). Reload the page and try again.');
    } else {
      alert(`Error saving: ${error.message}`);
    }
  }
}

async function deleteDevice(id) {
  const device = devicesStore.devices.find(d => d.id === id);
  if (!device) return;
  if (!confirm(`Delete "${device.nickname || device.id}"?`)) return;

  devicesStore.remove(id);
  try {
    await devicesStore.save();
    renderDevicesTable();
  } catch (error) {
    if (error.name === 'StorageConflictError') {
      alert('Data changed in the meantime. Reload the page and try again.');
    } else {
      alert(`Error saving: ${error.message}`);
    }
  }
}

// "Connection Hub": un hub è un device, quindi i valori scelgibili sono i nickname
// degli altri device già presenti (un device non può essere hub di sé stesso).
function hubNicknameOptions(excludeId) {
  return devicesStore.devices
    .filter(d => d.id !== excludeId && d.nickname)
    .map(d => d.nickname)
    .sort((a, b) => a.localeCompare(b, 'it', { numeric: true, sensitivity: 'base' }));
}

// Tendine alimentate da Tabelle (tablesStore): richiamata anche dopo un salvataggio
// in Tabelle, per riflettere subito le modifiche senza dover ricaricare la pagina.
function populateDeviceFormSelects() {
  populateSelect(document.getElementById('devCategory'), tablesStore.labels('devCategory'), true);
  populateSelect(document.getElementById('devZone'), tablesStore.labels('devZone'), true);
  populateSelect(document.getElementById('devType'), tablesStore.labels('devType'), true);
  populateSelect(document.getElementById('devAvanzamento'), tablesStore.labels('avanzamento'), false);
  populateSelect(document.getElementById('devTipoDispositivo'), tablesStore.labels('tipoDispositivo'), true);
  populateSelect(document.getElementById('devMarca'), tablesStore.labels('marca'), true);
  populateSelect(document.getElementById('devProtocolloConnessione'), tablesStore.labels('protocollo'), true);
  // devPhisicalHub ("Connection Hub") non viene popolato qui: dipende dal device in
  // modifica (esclude sé stesso), viene rifatto in openDeviceDialog().
  populateSelect(document.getElementById('devManagingApp'), tablesStore.labels('managingApp'), true);
  populateSelect(document.getElementById('devSSID'), tablesStore.labels('ssid'), true);
  populateSelect(document.getElementById('devGroup'), DEV_GROUPS, true);
  populateSelect(document.getElementById('devConnectedTo'), DEV_CONNECTED_TO, true);
}

document.addEventListener('DOMContentLoaded', () => {
  renderDevicesHeader();
  setConnStatusIcon(devicesStatusEl(), false, `Not connected to ${appStorage.providerName}.`);

  populateDeviceFormSelects();

  ['devCategory', 'devZone', 'devType', 'devId'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateHostNamePreview);
    document.getElementById(id).addEventListener('change', updateHostNamePreview);
  });

  // Il blocco IP suggerito dipende dal Dev. Group: cambiandolo si aggiorna la lista.
  // Se ci sono IP già impostati non compatibili col nuovo blocco, chiede conferma
  // prima di cancellarli (mai una perdita silenziosa di dati); se l'utente annulla,
  // il Dev. Group torna al valore precedente.
  document.getElementById('devGroup').addEventListener('change', e => {
    const oldGroup = editingDevice.devGroup;
    const newGroup = e.target.value;
    const newRange = DEV_GROUP_IP_RANGES[newGroup];
    const newValidIps = newRange ? new Set(expandIpRange(newRange)) : null;
    const incompatible = editingDevice.connections.some(c => c.ip && (!newValidIps || !newValidIps.has(c.ip)));

    if (incompatible && !confirm('The IP addresses set do not belong to the new Dev. Group block and will be deleted. Continue?')) {
      e.target.value = oldGroup;
      return;
    }
    if (incompatible) {
      editingDevice.connections.forEach(c => {
        if (c.ip && (!newValidIps || !newValidIps.has(c.ip))) c.ip = '';
      });
    }
    editingDevice.devGroup = newGroup;
    renderConnectionsList();
  });

  document.querySelectorAll('#deviceDlg .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchDeviceTab(btn.dataset.tab));
  });

  document.getElementById('btnAddConnection').addEventListener('click', () => {
    editingDevice.connections.push({ ip: '', note: '' });
    renderConnectionsList();
  });

  document.getElementById('btnAddProtocollo').addEventListener('click', () => {
    editingDevice.protocolli.push('');
    renderProtocolliList();
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
      devicesStatusEl().textContent = 'Connecting…';
      await appStorage.connect();
      await loadAndShowDevices();
    } catch (error) {
      devicesStatusEl().textContent = `Connection error: ${error.message}`;
    }
  });

  document.getElementById('btnDevicesDisconnect').addEventListener('click', async () => {
    await appStorage.disconnect();
    devicesStore.devices = [];
    renderDevicesTable();
    setConnStatusIcon(devicesStatusEl(), false, `Not connected to ${appStorage.providerName}.`);
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
  setConnStatusIcon(devicesStatusEl(), true, `Connected to ${appStorage.providerName} (${appStorage.connectedAccountEmail()}).`);
  document.getElementById('btnDevicesConnect').style.display = 'none';
  document.getElementById('btnDevicesDisconnect').style.display = 'inline-block';
  document.getElementById('btnDeviceNew').style.display = 'inline-block';
  // Senza questo, le tendine del dialog Device (popolate una sola volta al
  // DOMContentLoaded, prima di qualunque connessione) restano sui valori di default
  // hardcoded invece di quelli reali salvati in Tabelle — bug reale: un utente che apre
  // Devices senza essere mai passato da Tables in questa sessione vedeva un editor con
  // opzioni non aggiornate (es. valori di Protocollo aggiunti dopo la scrittura dei
  // default apparivano come righe vuote, pur essendo salvati correttamente sul device).
  if (!tablesStore._loaded) {
    await tablesStore.load();
    populateDeviceFormSelects();
  }
  await devicesStore.load();
  renderDevicesTable();
}
