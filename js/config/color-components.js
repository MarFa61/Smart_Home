/* =========================================================
   COMPONENTI COLORE — stessa logica di AppColorStore.swift/
   ColoriView.swift in Incarichi: un elenco finito di elementi
   visivi, ciascuno con uno o due slot (sfondo/primoPiano) e un
   valore di default per tema chiaro e per tema scuro.

   Prima "scena" per Smart Home: Finestra e tabella (equivalente
   della Scena 1 "Finestra ed elenco" di Incarichi). Altre scene
   (Bottoni, Badge, ecc.) si aggiungono allo stesso modo in un
   passo successivo.
   ========================================================= */

const COLOR_SLOTS = ['sfondo', 'primoPiano'];

// Ogni componente indica anche la variabile CSS che controlla nell'app vera: è così che
// il tema "chiaro" scelto qui si applica davvero all'interfaccia, non solo all'anteprima.
const COLOR_COMPONENTS = [
  {
    id: 'sfondoFinestra',
    categoria: 'Finestra e tabella',
    nome: 'Window background',
    descrizione: 'General background behind the cards, in every section of the app.',
    slots: ['sfondo'],
    cssVar: { sfondo: '--bg-main' },
    defaultChiaro: { sfondo: '#f4f6f9' },
    defaultScuro: { sfondo: '#1c1c1e' },
  },
  {
    id: 'sfondoSidebar',
    categoria: 'Finestra e tabella',
    nome: 'Sidebar background',
    descrizione: 'Background of the side menu (Devices, Config).',
    slots: ['sfondo'],
    cssVar: { sfondo: '--sidebar-bg' },
    defaultChiaro: { sfondo: '#eef1f6' },
    defaultScuro: { sfondo: '#2c2c2e' },
  },
  {
    id: 'sfondoCard',
    categoria: 'Finestra e tabella',
    nome: 'Card background',
    descrizione: 'Background of the main panels (e.g. the Devices card, the Colors one).',
    slots: ['sfondo'],
    cssVar: { sfondo: '--card-bg' },
    defaultChiaro: { sfondo: '#ffffff' },
    defaultScuro: { sfondo: '#2c2c2e' },
  },
  {
    id: 'titoloPagina',
    categoria: 'Finestra e tabella',
    nome: 'Page title',
    descrizione: 'Text of the large title at the top of each section (e.g. "Devices", "Colors").',
    slots: ['primoPiano'],
    cssVar: { primoPiano: '--title-color' },
    defaultChiaro: { primoPiano: '#1a1a1a' },
    defaultScuro: { primoPiano: '#f2f2f7' },
  },
  {
    id: 'sfondoIntestazioneTabella',
    categoria: 'Finestra e tabella',
    nome: 'Table header background',
    descrizione: 'Background of the column header row in the Devices table.',
    slots: ['sfondo'],
    cssVar: { sfondo: '--table-header-bg' },
    defaultChiaro: { sfondo: '#f8f9fa' },
    defaultScuro: { sfondo: '#333335' },
  },
  {
    id: 'testoIntestazioneTabella',
    categoria: 'Finestra e tabella',
    nome: 'Table header text',
    descrizione: 'Text of the column labels (e.g. "Nickname", "Brand") in the Devices table.',
    slots: ['primoPiano'],
    cssVar: { primoPiano: '--table-header-text' },
    defaultChiaro: { primoPiano: '#555555' },
    defaultScuro: { primoPiano: '#e2e8f0' },
  },
  {
    id: 'testoPrincipale',
    categoria: 'Finestra e tabella',
    nome: 'Main text',
    descrizione: 'Default text color: table rows, field labels in forms.',
    slots: ['primoPiano'],
    cssVar: { primoPiano: '--text-color' },
    defaultChiaro: { primoPiano: '#333333' },
    defaultScuro: { primoPiano: '#f2f2f7' },
  },
  {
    id: 'testoSecondario',
    categoria: 'Finestra e tabella',
    nome: 'Secondary text',
    descrizione: 'Less important text: placeholder messages, explanatory notes.',
    slots: ['primoPiano'],
    cssVar: { primoPiano: '--text-secondary' },
    defaultChiaro: { primoPiano: '#888888' },
    defaultScuro: { primoPiano: '#9b9ba1' },
  },
  {
    id: 'dividerRigaTabella',
    categoria: 'Finestra e tabella',
    nome: 'Table row divider',
    descrizione: 'Thin line separating one row from the next in the Devices table.',
    slots: ['primoPiano'],
    cssVar: { primoPiano: '--border-color' },
    defaultChiaro: { primoPiano: '#e0e0e0' },
    defaultScuro: { primoPiano: '#3a3a3c' },
  },
  {
    id: 'iconaOrdinamentoFiltroAttiva',
    categoria: 'Finestra e tabella',
    // Il colore "a riposo" non è un componente a parte: icona filtro e freccia di
    // ordinamento usano direttamente --table-header-text (stesso colore del testo delle
    // label di colonna, non solo uguale per default), già configurabile sopra come
    // "Testo intestazione tabella".
    nome: 'Column sort/filter icon (active)',
    descrizione: 'Color of the filter icon when the filter is applied, and of the arrow when the column is the sorted one.',
    slots: ['primoPiano'],
    cssVar: { primoPiano: '--table-icon-active-color' },
    // Blu (stesso di --primary): un giallo/arancio, per quanto "intenso", rischia di
    // confondersi con uno sfondo intestazione personalizzato su toni caldi (successo
    // reale: sfondo intestazione arancione + questa icona in giallo-oro = invisibile).
    defaultChiaro: { primoPiano: '#0066cc' },
    defaultScuro: { primoPiano: '#4d94ff' },
  },
  {
    id: 'dividerIntestazioneTabella',
    categoria: 'Finestra e tabella',
    nome: 'Table header divider',
    descrizione: 'Thin vertical line separating one column from the next, only in the header row of the Devices table.',
    slots: ['primoPiano'],
    cssVar: { primoPiano: '--table-header-divider-color' },
    defaultChiaro: { primoPiano: '#b0b0b0' },
    defaultScuro: { primoPiano: '#6b6b6f' },
  },
  {
    id: 'barraRicerca',
    categoria: 'Finestra e tabella',
    nome: 'Search bar',
    descrizione: 'Background and text of the search field in the Devices header.',
    slots: ['sfondo', 'primoPiano'],
    cssVar: { sfondo: '--search-bg', primoPiano: '--search-text' },
    defaultChiaro: { sfondo: '#ffffff', primoPiano: '#333333' },
    defaultScuro: { sfondo: '#2c2c2e', primoPiano: '#f2f2f7' },
  },
  {
    id: 'pulsanteNuovoDevice',
    categoria: 'Finestra e tabella',
    nome: 'Button "New Device"',
    descrizione: 'Background and text of the button to add a device, in the Devices header.',
    slots: ['sfondo', 'primoPiano'],
    cssVar: { sfondo: '--add-device-btn-bg', primoPiano: '--add-device-btn-text' },
    defaultChiaro: { sfondo: '#0066cc', primoPiano: '#ffffff' },
    defaultScuro: { sfondo: '#0066cc', primoPiano: '#ffffff' },
  },
];

function colorComponentById(id) {
  return COLOR_COMPONENTS.find(c => c.id === id);
}
