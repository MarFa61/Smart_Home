/* =========================================================
   ICONA ⓘ DI AIUTO PER CAMPO — mostra il testo di helpFieldsStore (vedi
   HelpFieldsStore.js) accanto a un'etichetta/controllo, con un popover al click.
   Cliccabile invece che a comparsa sull'hover — a differenza del tooltip nativo
   usato in Incarichi (.help()) — perché questa app gira anche su iPad/iPhone,
   dove l'hover non esiste: un tooltip solo-hover lì non sarebbe mai visibile.
   Stesso meccanismo nativo (popover="auto" + showPopover(), posizione calcolata
   via JS) già usato per i suggerimenti IP in devices-ui.js, non una libreria nuova.
   ========================================================= */

function closeFieldHelpPopover() {
  const existing = document.querySelector('.field-help-popover');
  if (existing) existing.remove();
}

function showFieldHelpPopover(iconEl, text) {
  closeFieldHelpPopover();
  const popover = document.createElement('div');
  popover.className = 'field-help-popover';
  popover.setAttribute('popover', 'auto');
  popover.textContent = text;

  // Appeso al <dialog> ospitante se c'è (un dialog modale rende inerte tutto ciò
  // che sta fuori dal proprio sottoalbero, anche se il popover ci si disegna
  // comunque sopra — stesso motivo di showIpSuggestPopover in devices-ui.js),
  // altrimenti a <body> (icone fuori da un dialog, es. Tables/Config).
  const hostDialog = iconEl.closest('dialog');
  (hostDialog || document.body).appendChild(popover);

  const rect = iconEl.getBoundingClientRect();
  popover.style.top = `${rect.bottom + 4}px`;
  popover.style.left = `${rect.left}px`;
  popover.showPopover();
}

/** Inserisce l'icona ⓘ dentro anchorEl, in coda al suo testo (stessa riga, non un
 *  fratello a parte — dentro un contenitore flex-column come .dlg-form-group un
 *  fratello finirebbe su una riga propria tra label e campo), se lo switch globale
 *  "Tooltips enabled" è attivo e c'è un testo per "key" — altrimenti non inserisce
 *  nulla (o rimuove l'icona già presente). Un <span> cliccabile, non un <button>:
 *  anchorEl può essere a sua volta un <button> (Config/Tables), e annidare due
 *  <button> è HTML non valido. Idempotente: richiamabile più volte sullo stesso
 *  anchorEl (es. ad ogni apertura del dialog Device) senza duplicare l'icona. */
function attachFieldHelpIcon(anchorEl, key) {
  if (!anchorEl) return;
  const existing = anchorEl.querySelector(`.field-help-icon[data-key="${key}"]`);
  if (existing) existing.remove();

  const text = helpFieldsStore.text(key);
  if (!helpFieldsStore.enabled || !text) return;

  const icon = document.createElement('span');
  icon.className = 'field-help-icon';
  icon.dataset.key = key;
  icon.textContent = 'ⓘ';
  icon.setAttribute('role', 'button');
  icon.setAttribute('tabindex', '0');
  icon.setAttribute('aria-label', 'Help');
  icon.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    showFieldHelpPopover(icon, text);
  });
  icon.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    e.stopPropagation();
    showFieldHelpPopover(icon, text);
  });
  anchorEl.appendChild(icon);
}
