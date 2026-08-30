/* =========================================================
   NAVIGAZIONE SEZIONI
   Equivalente HTML/JS del pattern AppSection/sectionDetail di
   ContentView.swift (Incarichi/Oratori): un enum di sezioni,
   una sola selezionata alla volta, contenuto mostrato di conseguenza.
   ========================================================= */

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
    item.addEventListener('click', () => selectSection(item.dataset.section));
  });
});
