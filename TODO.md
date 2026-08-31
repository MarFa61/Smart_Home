# TODO — Smart Home (analisi Excel, architettura, prima versione, pubblicazione GitHub Pages, import dati reali, rifinitura colonne Devices)

## Fatto — sessione 2026-08-30

- **Analisi Excel di partenza**: letto `MF Home - Device Configuration.xlsx` (OneDrive, cartella
  Archivi), 3 fogli (Dispositivi Smart, Tabelle, IP Statici). Chiarite con Marco tutte le ambiguità
  strutturali: righe apparentemente duplicate sono in realtà dispositivi fisici distinti da
  disambiguare; caso HomeyPro (Wi-Fi+Ethernet) → un solo dispositivo con più connessioni; gruppo
  Sonos Home Theatre → satelliti reali, IP che conta è quello del dispositivo principale (Playbar).
- **Pivot architetturale**: niente app nativa Swift (nessun account Apple Developer a pagamento →
  provisioning iOS di soli 7 giorni, impraticabile). Valutate e scartate le alternative cloud
  (CloudKit: richiede comunque account a pagamento anche solo per l'accesso web; iCloud Drive: non
  raggiungibile da browser; Proton Drive: nessuna API pubblica per terze parti verificata). Scelto
  **OneDrive** (Microsoft Graph API, account personale gratuito) dietro un layer di storage astratto
  (`StorageProvider`), per non legarsi al provider per sempre.
- **Riuso del mockup preesistente**: ritrovato un prototipo HTML/CSS/JS in `Home Device Mgmt/`
  (precedente a questa sessione), riadattato come base per il frontend vanilla (nessun framework/
  build tool).
- **Fase 1-4 completate**: scaffolding (sidebar/menu, stile Incarichi/Oratori), storage layer
  (`OneDriveProvider` con concorrenza ottimistica via `cTag`, non `eTag` — Graph non lo ripopola
  subito dopo una scrittura), Devices (modello dati, tabella, editor a tab, Host Name auto-generato,
  connessioni multiple per dispositivo), Config (Backup & Restore, Colori — prima "scena" nello
  stesso stile a insiemi finiti chiaro/scuro di Incarichi/Oratori: "Finestra e tabella").
- **Pubblicazione su GitHub Pages** (`https://marfa61.github.io/Smart_Home/`, repo pubblico
  `MarFa61/Smart_Home`): registrata l'app "Smart Home" su Microsoft Entra ID (tenant creato da zero,
  vari intoppi con l'account personale documentati nella conversazione), aggiunto il redirect URI
  GitHub Pages accanto a quello di sviluppo locale (`http://localhost:5500/`).
- **Bug reali corretti durante il collaudo multi-device**: libreria MSAL caricata da un CDN
  Microsoft non più valido da v3 in poi (ora servita da un file locale, `js/vendor/`); niente
  cache-busting sui file locali → Safari iOS serviva versioni vecchie dopo ogni pubblicazione (fix:
  `?v=N` su ogni script/css, da incrementare ad ogni deploy); login senza `prompt: select_account` →
  Microsoft riusava silenziosamente un account già loggato nel browser, impedendo di sceglierne un
  altro (mancava anche un pulsante Disconnetti, aggiunto); controllo di unicità su Dev.Id troppo
  severo (doveva essere l'Host Name completo, non il solo Dev.Id — "meteo" è legittimo su più
  stazioni in zone diverse).
- **Import dei dati reali dall'Excel**: 65 dispositivi (66 righe originali, HomeyPro unito).
  Corretti in fase di trasformazione: Samsung TV Camera (Zona/Dev.Id duplicati per refuso Excel),
  3 satelliti "Sonos Soggiorno" senza IP (Dev.Id duplicati con Sonos Bagno/Camera), Lunvon 1-3 e
  Smart Switch 1-3 (Dev.Id mancante, causava Host Name identici). Avanzamento (7 valori originali)
  mappato sui 4 nuovi; Criticità (non ancora un campo del modello) riportata in coda alle Note.
  Record di prova precedente sostituito dal ripristino.
- **Colonne Devices ordinabili, filtrabili, ridimensionabili** (stesso pattern di
  AnagrafePersoneView/ColumnWidthStore in Incarichi/Oratori): intestazione cliccabile per
  ordinare (con freccia ↑/↓), icona per filtrare per valori distinti su Marca/Avanzamento/
  Categoria/Zona/Tipo/HomeKit/Automazioni/Disponibile, trascinamento del bordo colonna per
  ridimensionare (larghezza persistita in localStorage, per browser/device, non su OneDrive).
  Debug non banale sull'icona filtro: prima non visibile (elemento posizionato in assoluto
  dentro una cella con overflow:hidden, corretto passando a un layout flex in flusso normale),
  poi visibile ma senza effetto al click (il popover, annidato dentro il `<th>`, veniva tagliato
  dall'overflow di `.table-responsive` necessario per lo scroll orizzontale — spostato ad essere
  appeso a `<body>` con posizione calcolata via JS). Sostituito anche il carattere Unicode "▾"
  con un'icona SVG inline, per non dipendere dal supporto font del sistema.

## Fatto — sessione 2026-08-31

- **Filtro colonne Devices confermato funzionante** da Marco (era rimasto da verificare dalla
  sessione precedente).
- **Rifinitura icona filtro**: sostituita l'icona (bordino + freccina sottile) con un'icona a
  imbuto SVG piena, senza bordo, con evidenziazione solo su hover — più visibile e riconoscibile.
- **Popover filtro colonna riorganizzato**: i pulsanti "Nessun filtro"/"Applica" erano in fondo,
  costringendo a scorrere tutta la lista valori per raggiungerli — spostati in cima al popover
  (sticky, restano visibili anche scorrendo un elenco lungo). Aggiunto un terzo pulsante
  "Deseleziona tutto" (deseleziona le caselle senza chiudere il popover, per poi riselezionare solo
  i valori voluti) — mancava l'azione opposta a "Nessun filtro".
- **Colore icona filtro e freccia di ordinamento resi configurabili**: l'icona a riposo usa ora
  direttamente la stessa variabile CSS del testo delle label di colonna (`--table-header-text`,
  già configurabile in Colori come "Testo intestazione tabella") invece di una variabile separata
  solo "uguale per default" — garantisce che restino davvero identici, non solo coincidenti. Il
  colore in stato attivo (filtro applicato / colonna correntemente ordinata, la freccia è sempre in
  questo stato) è un nuovo componente configurabile in Colori → "Finestra e tabella": "Icona
  ordinamento/filtro colonna (attiva)".
- **Bug reali corretti durante la rifinitura**: un giro intermedio aveva aggiunto un colore di
  sfondo al pulsante filtro attivo, mai richiesto — rimosso. Il colore attivo di default era stato
  scelto giallo-oro (`#c98a00`): su questo dispositivo, con lo sfondo intestazione tabella già
  personalizzato in arancione (override salvato in una sessione precedente), icona e sfondo
  risultavano quasi identici → icona filtro attiva e freccia di ordinamento praticamente invisibili.
  Diagnosticato da uno screenshot (nessuna causa individuabile dalla sola lettura del codice).
  Corretto cambiando il default a blu (`--primary`, lo stesso già usato per titoli e accenti
  nell'app), che contrasta bene sia sul grigio chiaro di default sia sull'arancione personalizzato.
  Confermato funzionante da Marco.
- Cache-busting incrementato progressivamente fino a v14 nel corso della sessione.
- **Icona di stato connessione differenziata per dispositivo** (Mac mini/iPad/iPhone), sostituisce
  il testo "Connesso/Non connesso a OneDrive" in Devices e Config (testo rimasto come tooltip).
  Nota tecnica: Safari su iPadOS si identifica come Mac, quindi il riconoscimento usa anche la
  presenza dello schermo touch, non solo lo user agent.
- **Titolo e stato connessione unificati** in Devices e Config: icona + pulsante Connetti/Disconnetti
  spostati sulla riga del titolo, centrati (griglia a 3 colonne). Pulsante rinominato "Disconnetti";
  "Connetti" (prima "Connetti a OneDrive") ora con lo stesso stile del pulsante Disconnetti.
- **Config ristrutturato in tab** (Backup & Restore / Colori) sotto un titolo unico "Config", con
  una sola connessione condivisa invece delle due separate di prima — Backup & Restore prima non
  aveva una connessione propria e contava implicitamente su dati già caricati altrove.
- **Pulsanti dell'app resi "3D"**: ombra a riposo + effetto "premuto" al click su tutti i pulsanti
  d'azione (non su tab e icone inline, per non stonare con lo stile a sottolineatura già in uso lì).
- **Scalino di altezza sulla colonna sticky (Nickname) e divisori verticali in testata**: causa
  reale trovata (non un'ipotesi) — Safari, su una cella `position:sticky`, dipinge lo sfondo della
  cella sopra il proprio bordo (comportamento noto, diverso da Chrome), rendendo un `border-right`
  visibile solo a tratti a seconda dello zoom. Risolto sostituendo il bordo con un `box-shadow`
  inset, che non ha questo problema di ordine di disegno. Aggiunti anche i divisori verticali sottili
  tra le colonne in testata, colore configurabile in Colori.
- **1:1 tra colonne Excel e colonne Devices**: aggiunte le colonne mancanti (Tipo dispositivo,
  Protocollo, Phisical Hub, Managing App, Collegato a Homey, SSID, Connection Speed, Dev. Id.) più
  due campi assenti dal modello (**Dev. Group**, **Connected to** — con relativo campo nell'editor).
  Criticità e Priorità intervento restano fuori: dati Excel non assestati (Priorità vuota su tutti i
  66 dispositivi, Criticità con un solo valore reale scritto "Integrabile???"). Backfill di Dev.
  Group/Connected to sui 65 dispositivi già importati, dai valori reali dell'Excel (nickname
  normalizzato per gestire i 7 satelliti Sonos, uniti sotto un'unica riga Excel per gruppo).
- **Nuova sezione "Tabelle"**: 9 tabelle di supporto gestibili dall'utente (Avanzamento, Tipo
  dispositivo, Protocollo, Phisical Hub, Managing App, SSID, Categoria, Zona, Tipo — le ultime tre
  con etichetta+codice host, le altre sola etichetta), sostituiscono gli elenchi fissi che erano in
  `js/devices/lookups.js`. Rinominare un valore propaga il cambiamento a tutti i dispositivi che lo
  usano (Host Name compreso, ricalcolato al volo); eliminare un valore in uso avvisa quanti
  dispositivi sono coinvolti prima di procedere, e li svuota invece di lasciarli con un valore
  "orfano".
- **Colori esteso**: nuovi componenti configurabili per il divisore di intestazione tabella, la
  barra di ricerca di Devices e il pulsante "Nuovo Device" (scollegato da `--primary`, altrimenti
  personalizzarlo avrebbe cambiato anche gli altri pulsanti "primari" dell'app). "Ripristina
  predefiniti" diviso in due pulsanti separati (Chiaro/Scuro) invece di uno che resettava entrambi
  insieme.
- **Controllo modifiche non salvate esteso a tutta l'app** (prima solo nei tab di Tabelle): registro
  condiviso in `app.js`, usato dalla navigazione tra sezioni in sidebar e dal cambio tab. Sostituito
  il `confirm()` del browser con lo stesso alert nativo a 3 opzioni di Incarichi/Oratori ("Salva e
  vai" / "Non salvare e vai" / "Resta qui"); "Salva e vai" richiama il salvataggio vero e proprio e
  resta sulla pagina se fallisce, invece di navigare via con dati persi.
- **Suggerimento IP automatico** nell'editor Device, in base al Dev. Group del dispositivo (blocchi
  IP riservati per gruppo, dagli stessi intervalli con nome trovati nel foglio Tabelle dell'Excel
  originale — lì usati in una Convalida Dati con `INDIRETTO(Dev.Group)`), esclusi gli IP già usati
  da altri dispositivi. Prima versione con `<datalist>` scartata: supporto incompleto in Safari su
  input di testo. Poi un popover fatto a mano appeso a `<body>` è risultato comunque invisibile per
  un motivo diverso e reale: il dialog Device è un `<dialog>` nativo aperto con `showModal()`, che
  vive nel "top layer" del browser sopra tutta la pagina — un div normale in `<body>` finisce
  sempre nascosto dietro di esso, indipendentemente da z-index. Risolto con l'API Popover nativa
  (`popover="auto"`), pensata apposta per comparire sopra un dialog aperto. Aggiunti anche un
  avviso esplicito quando il Dev. Group non è ancora impostato (prerequisito per i suggerimenti) e
  una freccina sul campo, come le tendine native, quando i suggerimenti sono disponibili.
  **Non ancora confermato funzionante da Marco — verificare alla ripresa.**
- Cache-busting arrivato a v33 nel corso della sessione.

## Da fare — prossimo passo

- [ ] **Verificare il suggerimento IP** nell'editor Device (avviso Dev. Group, freccina, popover
      con gli IP liberi del blocco riservato): non ancora confermato funzionante da Marco.
- [ ] Altre "scene" di Colori oltre a "Finestra e tabella" (es. Bottoni, Badge, Campi form) — stesso
      pattern a insiemi finiti chiaro/scuro, non ancora estese.
- [ ] Nessun vero switch chiaro/scuro a runtime: il tema Scuro è modificabile e salvato in Colori ma
      non ancora "attivabile" per l'app intera (serve un controllo Tema come in Incarichi).
- [ ] Connessione OneDrive automatica solo se già stabilita nella stessa sessione: visitando
      Devices poi Tabelle/Config nella stessa pagina la sezione successiva non "eredita"
      automaticamente la connessione della prima nello stesso caricamento (serve un secondo click,
      senza popup di login) — possibile consolidamento futuro in un unico stato di connessione a
      livello app.
- [ ] Criticità e Priorità intervento: rimandati di proposito (dati Excel non assestati, vedi sopra),
      da ripensare insieme quando i dati saranno chiari.
- [ ] 5 dispositivi presenti nell'Excel ma non nell'app (Aqara Hub, AqaraCamera, AqaraSoggiorno,
      Tenda Armadio, Tenda Letto): rimossi volutamente dall'app da Marco, l'Excel non è ancora stato
      allineato di conseguenza (non un'azione per Claude — Marco userà a breve l'app come unica
      fonte, l'Excel diventerà obsoleto).

## Note — non decisioni aperte, non richiedono follow-up

- Repository GitHub reso pubblico (necessario per GitHub Pages sul piano gratuito): nessun dato
  reale nel codice, solo il Client ID pubblico dell'app Entra (non un segreto per un'app SPA).
- Un Personal Access Token GitHub è stato esposto per errore in uno screenshot durante il setup
  (30/8): da rigenerare/cancellare su github.com/settings/tokens se non ancora fatto.
