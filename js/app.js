/* =========================================================
   NAVIGAZIONE SEZIONI
   Equivalente HTML/JS del pattern AppSection/sectionDetail di
   ContentView.swift (Incarichi/Oratori): un enum di sezioni,
   una sola selezionata alla volta, contenuto mostrato di conseguenza.

   REGISTRO MODIFICHE NON SALVATE: qualunque sezione con un form
   che si salva solo su azione esplicita (non ad ogni tasto) può
   registrare qui un controllo — usato sia dalla navigazione tra
   sezioni sotto, sia da eventuali cambi di tab interni a una
   sezione (es. i tab di Tabelle), per non perdere dati in modo
   silenzioso. Ogni controllo restituisce null (nessuna modifica
   in sospeso) oppure { message, save(): Promise<boolean>, discard() }.
   Alla conferma si apre lo stesso alert a 3 opzioni di Incarichi/
   Oratori (Salva e vai / Non salvare e vai / Resta qui).
   ========================================================= */

const unsavedChangesCheckers = [];

function registerUnsavedChangesChecker(fn) {
  unsavedChangesCheckers.push(fn);
}

function findUnsavedChanges() {
  for (const checker of unsavedChangesCheckers) {
    const result = checker();
    if (result) return result;
  }
  return null;
}

function showUnsavedChangesDialog(message) {
  return new Promise(resolve => {
    const dlg = document.getElementById('unsavedChangesDlg');
    document.getElementById('unsavedChangesMessage').textContent = message;
    const btnSave = document.getElementById('btnUnsavedSaveAndGo');
    const btnDiscard = document.getElementById('btnUnsavedDiscardAndGo');
    const btnStay = document.getElementById('btnUnsavedStay');

    function cleanup(choice) {
      btnSave.removeEventListener('click', onSave);
      btnDiscard.removeEventListener('click', onDiscard);
      btnStay.removeEventListener('click', onStay);
      dlg.close();
      resolve(choice);
    }
    function onSave() { cleanup('save'); }
    function onDiscard() { cleanup('discard'); }
    function onStay() { cleanup('stay'); }

    btnSave.addEventListener('click', onSave);
    btnDiscard.addEventListener('click', onDiscard);
    btnStay.addEventListener('click', onStay);
    dlg.showModal();
  });
}

/** Se ci sono modifiche non salvate, propone Salva e vai/Non salvare e vai/Resta qui.
 *  Ritorna true se si può procedere (nessuna modifica, salvate, o scartate), false
 *  se l'utente resta o se il salvataggio fallisce. */
async function confirmDiscardUnsavedChanges(actionLabel) {
  const unsaved = findUnsavedChanges();
  if (!unsaved) return true;

  const choice = await showUnsavedChangesDialog(`${unsaved.message} ${actionLabel} andranno perse.`);
  if (choice === 'stay') return false;
  if (choice === 'discard') { unsaved.discard(); return true; }
  if (choice === 'save') return await unsaved.save();
  return false;
}

function selectSection(sectionId) {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });
  document.querySelectorAll('.section-view').forEach(view => {
    view.classList.toggle('active', view.id === `section-${sectionId}`);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', async () => {
      if (item.classList.contains('active')) return;
      if (!await confirmDiscardUnsavedChanges('Cambiando sezione')) return;
      selectSection(item.dataset.section);
    });
  });
});
