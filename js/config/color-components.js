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
    nome: 'Sfondo finestra',
    descrizione: 'Sfondo generale dietro le card, in ogni sezione dell\'app.',
    slots: ['sfondo'],
    cssVar: { sfondo: '--bg-main' },
    defaultChiaro: { sfondo: '#f4f6f9' },
    defaultScuro: { sfondo: '#1c1c1e' },
  },
  {
    id: 'sfondoSidebar',
    categoria: 'Finestra e tabella',
    nome: 'Sfondo sidebar',
    descrizione: 'Sfondo del menu laterale (Devices, Config).',
    slots: ['sfondo'],
    cssVar: { sfondo: '--sidebar-bg' },
    defaultChiaro: { sfondo: '#eef1f6' },
    defaultScuro: { sfondo: '#2c2c2e' },
  },
  {
    id: 'sfondoCard',
    categoria: 'Finestra e tabella',
    nome: 'Sfondo card',
    descrizione: 'Sfondo dei pannelli principali (es. la card di Devices, quella di Colori).',
    slots: ['sfondo'],
    cssVar: { sfondo: '--card-bg' },
    defaultChiaro: { sfondo: '#ffffff' },
    defaultScuro: { sfondo: '#2c2c2e' },
  },
  {
    id: 'titoloPagina',
    categoria: 'Finestra e tabella',
    nome: 'Titolo pagina',
    descrizione: 'Testo del titolo grande in cima a ogni sezione (es. "Devices", "Colori").',
    slots: ['primoPiano'],
    cssVar: { primoPiano: '--title-color' },
    defaultChiaro: { primoPiano: '#1a1a1a' },
    defaultScuro: { primoPiano: '#f2f2f7' },
  },
  {
    id: 'sfondoIntestazioneTabella',
    categoria: 'Finestra e tabella',
    nome: 'Sfondo intestazione tabella',
    descrizione: 'Sfondo della riga di intestazione colonne nella tabella Devices.',
    slots: ['sfondo'],
    cssVar: { sfondo: '--table-header-bg' },
    defaultChiaro: { sfondo: '#f8f9fa' },
    defaultScuro: { sfondo: '#333335' },
  },
  {
    id: 'testoIntestazioneTabella',
    categoria: 'Finestra e tabella',
    nome: 'Testo intestazione tabella',
    descrizione: 'Testo delle etichette di colonna (es. "Nickname", "Marca") nella tabella Devices.',
    slots: ['primoPiano'],
    cssVar: { primoPiano: '--table-header-text' },
    defaultChiaro: { primoPiano: '#555555' },
    defaultScuro: { primoPiano: '#e2e8f0' },
  },
  {
    id: 'testoPrincipale',
    categoria: 'Finestra e tabella',
    nome: 'Testo principale',
    descrizione: 'Colore di testo di default: righe della tabella, etichette dei campi nei form.',
    slots: ['primoPiano'],
    cssVar: { primoPiano: '--text-color' },
    defaultChiaro: { primoPiano: '#333333' },
    defaultScuro: { primoPiano: '#f2f2f7' },
  },
  {
    id: 'testoSecondario',
    categoria: 'Finestra e tabella',
    nome: 'Testo secondario',
    descrizione: 'Testo meno importante: messaggi segnaposto, note esplicative.',
    slots: ['primoPiano'],
    cssVar: { primoPiano: '--text-secondary' },
    defaultChiaro: { primoPiano: '#888888' },
    defaultScuro: { primoPiano: '#9b9ba1' },
  },
  {
    id: 'dividerRigaTabella',
    categoria: 'Finestra e tabella',
    nome: 'Divider riga tabella',
    descrizione: 'Linea sottile che separa una riga dalla successiva nella tabella Devices.',
    slots: ['primoPiano'],
    cssVar: { primoPiano: '--border-color' },
    defaultChiaro: { primoPiano: '#e0e0e0' },
    defaultScuro: { primoPiano: '#3a3a3c' },
  },
];

function colorComponentById(id) {
  return COLOR_COMPONENTS.find(c => c.id === id);
}
