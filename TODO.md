# TODO — Smart Home (analisi Excel, architettura, prima versione, pubblicazione GitHub Pages, import dati reali, rifinitura colonne Devices, avviata migrazione backend verso Azure SQL)

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

## Fatto — sessione 2026-09-01

- **Script di avvio del server locale**: aggiunto `avvia-server-locale.sh` in `Smart Home/` (fuori da
  `Codice/`), lancia `python3 -m http.server 5500` sulla cartella Codice — comodo dopo un riavvio,
  stesso comando già usato manualmente nelle sessioni precedenti.
- **Editor Device, campi IP bloccati senza Dev. Group**: senza un Dev. Group impostato, i campi IP e
  Nota di ogni connessione sono ora disabilitati (placeholder esplicito) e il pulsante "+ Aggiungi
  connessione" resta nascosto, invece di lasciare l'IP come testo libero senza vincoli.
- **Bug reale nel popover di suggerimento IP**: la selezione di un IP suggerito non funzionava —
  causa verificata con test diretto nel browser (non un'ipotesi): il popover, pur disegnato sopra il
  `<dialog>` modale grazie al top layer della Popover API, viveva fuori dal sottoalbero DOM del
  dialog, che lo rendeva "inerte" (non cliccabile) anche se visibile. Risolto appendendo il popover
  dentro il dialog stesso invece che a `<body>`. **Confermato funzionante da Marco.**
- **Cambio Dev. Group con IP già impostati**: se gli IP presenti non appartengono al blocco del nuovo
  gruppo, un avviso chiede conferma prima di cancellarli; annullando, il Dev. Group torna al valore
  precedente e nulla viene toccato.
- **Cestino sulle righe Connessioni (IP/Nota)**: sull'unica riga rimasta, invece di essere disabilitato
  (nessun effetto al click), ora svuota il contenuto della riga. Aggiunta anche una conferma prima di
  eliminare/svuotare una riga con contenuto, trattandosi di un'azione irreversibile (nessuna conferma
  se la riga è già vuota).
- **Devices: titolo e testata della tabella fissi, scroll verticale solo sulle righe**: il contenitore
  della tabella (`.table-responsive`) è diventato l'unico contenitore con scroll verticale, con la
  testata ancorata (`position: sticky`) in cima ad esso — titolo e barra di ricerca/pulsante "Nuovo
  Device" restano fuori da quell'area e non scorrono mai. **Confermato funzionante da Marco.**
- **Campo Marca diventato tabella**: nuova tabella "Marca" in Tabelle (10ª, valori iniziali = le
  marche già presenti nei device), il campo nell'editor Device passa da testo libero a tendina.
- **Campo Protocollo diviso in due**: "Protocollo" (scelta singola) sostituito da **"Protocolli
  supportati"** (elenco a più righe, stessa logica delle Connessioni IP ma con tendina invece di
  campo libero, niente duplicati tra le righe dello stesso device) e **"Protocollo di Connessione"**
  (nuovo campo, scelta singola) — entrambi alimentati dalla stessa tabella "Protocollo" già esistente.
  Managing App e Protocollo si sono scambiati posizione nel form, su richiesta esplicita. Migrazione
  automatica al primo caricamento: il vecchio valore singolo di ogni device viene copiato sia in
  "Protocolli supportati" sia in "Protocollo di Connessione", nessun dato perso. La colonna
  "Protocollo" nella tabella Devices mostra ora "Protocollo di Connessione". Propagazione di
  rinomina/eliminazione da Tabelle estesa per gestire anche il campo ad array. **Confermato
  funzionante da Marco.**
- Cache-busting arrivato a v39 (JS) / v35 (CSS) nel corso della sessione.

## Fatto — sessione 2026-09-02

- **Dialog Device, altezza dei campi non uniforme**: causa verificata sui pixel di uno
  screenshot (non un'ipotesi) — i `<select>` nativi rendono più bassi degli `<input>` a
  parità di padding/bordo (differenza di rendering del browser), mentre nella riga
  "Protocolli supportati" succedeva l'opposto (la select veniva stirata all'altezza del
  pulsante cestino accanto, per il layout flex della riga). Risolto con un'altezza fissa
  a 36px su input/select del dialog (escluse color e textarea) e sui pulsanti cestino
  delle righe Connessioni/Protocolli, senza toccare le larghezze.
- **Interfaccia tradotta in inglese**: tutte le etichette statiche (campi form,
  intestazioni colonna, tab, sidebar — "Tabelle" → "Tables"), i tooltip della pagina
  Colori e i messaggi dinamici (alert, conferme, errori) sono ora in inglese
  (`lang="it"` → `lang="en"` in index.html). Lasciati di proposito in italiano: i valori
  delle tabelle di lookup (Marca, Categoria, Zona, Tipo, Dev. Group, ecc.) già salvati
  sui dispositivi reali su OneDrive e usati per generare l'Host Name; le chiavi interne
  di Colori (`chiaro`/`scuro`, `sfondo`/`primoPiano`, id dei componenti) già salvate come
  override in config.json; i commenti nel codice.
- **Pulsante "Nuovo Device" con icona**: sostituita la label "New Device" con icona +
  "New". Icona ricavata da `Icons/New Device.png` (fornita da Marco), ritagliata dallo
  spazio bianco e resa trasparente (altrimenti sul pulsante blu compariva un riquadro
  bianco), salvata come `img/new-device-icon.png`. Altezza finale 45px su richiesta
  esplicita di Marco (più alta del pulsante stesso, che quindi si allarga in verticale
  per contenerla).
- Cache-busting aggiornato su tutti i file toccati.
- **Non ancora testato da Marco**: nessuna delle modifiche di questa sessione è stata
  verificata dal vivo (per policy, il test dell'app è sempre un'azione di Marco).

## Fatto — sessione 2026-09-03

- **Icone dei pulsanti riga (Devices)**: sostituite matita/cestino emoji con le icone
  reali fornite da Marco (`Icons/Modify.png`, `Icons/Cestino.png`), stessa tecnica di
  ritaglio + sfondo trasparente usata per "New Device" — salvate come
  `img/edit-icon.png` e `img/delete-icon.png`, mostrate a 22px.
- **Pulsanti Edit/Delete a larghezza uguale e spaziatura simmetrica**: le due icone
  hanno proporzioni molto diverse a parità di altezza (la penna è quasi il doppio più
  larga del cestino) — risolto con una larghezza fissa comune (42px, icona centrata)
  invece di inseguire il padding. Colonna Azioni ricalcolata a 126px = 14 (padding
  cella) + 42 (pulsante) + 14 (spazio) + 42 (pulsante) + 14 (padding cella): i tre spazi
  bianchi (sinistra, tra le icone, destra) risultano matematicamente identici.
- **Colori dei pulsanti riga resi configurabili**: `.btn.edit`/`.btn.pow` avevano
  colori fissi in CSS, condivisi anche da altri pulsanti dell'app (Connect, Cancel,
  "+ Add connection", ecc.) — non potevano diventare configurabili globalmente senza
  toccare anche quelli. Aggiunti due nuovi componenti in Colori → "Finestra e tabella"
  ("Row edit button", "Row delete button"), applicati solo dentro la colonna Azioni
  tramite un selettore CSS più specifico (`.actions .btn.edit`/`.actions .btn.pow`),
  senza alterare gli altri usi delle stesse classi.
- **Anteprima Colori estesa**: un colore configurabile senza riferimento visivo
  nell'anteprima "non si capisce niente" (feedback esplicito di Marco, salvato in
  memoria per i prossimi progetti con lo stesso pattern). Aggiunti nel frame di
  anteprima: mini pulsanti Edit/Del nelle righe finte (per i due nuovi componenti) e,
  colmando un gap preesistente non introdotto in questa sessione, una riga toolbar con
  barra di ricerca finta e pulsante "New" (per i componenti già esistenti "Search bar"
  e "Button New Device", che non erano mai comparsi in anteprima).
- **Non ancora testato da Marco**: nessuna delle modifiche di questa sessione è stata
  verificata dal vivo.

## Fatto — sessione 2026-09-03 (pomeriggio/sera) — Azure SQL / backend

- **Decisione architetturale**: valutate le opzioni per rendere Incarichi/Oratori/Smart Home
  utilizzabili anche da remoto e su Android (discussione a parte, non solo per questo progetto).
  Per Smart Home nello specifico, deciso di sostituire OneDrive con **Azure SQL Database** come
  storage, sfruttando l'offerta gratuita a vita di Microsoft (fino a 10 database per
  sottoscrizione, 100.000 secondi vCore + 32 GB/mese ciascuno, verificata con fonti ufficiali
  Microsoft). Superata la precedente ipotesi "SQL Server via Aruba" annotata in sessioni
  precedenti.
- **Sottoscrizione Azure SQL creata**: database `smarthome-db` sul server
  `smarthome-sql-mfasani.database.windows.net` (Sweden Central), gruppo di risorse `Smart_Home`,
  offerta gratuita applicata e confermata (costo stimato zero). Login SQL `smarthomeadm` creato
  (password nota solo a Marco, salvata in `Backend/local.settings.json`, escluso da git).
  Firewall: accesso consentito dal Mac di Marco e dai servizi Azure.
- **Backend Azure Functions scritto e distribuito** (nuova cartella `Smart Home/Backend/`, nuovo
  repository privato `github.com/MarFa61/smarthome-backend`): due funzioni HTTP
  (`GET`/`PUT` su `/api/resources/{key}`) che replicano esattamente il contratto
  `StorageProvider` già usato con OneDrive (blob JSON per chiave, concorrenza ottimistica) — non
  serve quindi ridisegnare uno schema relazionale, basta una tabella generica `Resources`
  (`ResourceKey`, `Data`, `Version` ROWVERSION, `UpdatedAt`). Logica di lettura/scrittura
  condivisa in `src/lib/resources.js`, testata end-to-end con uno script Node reale
  (`test/db-smoke-test.js`) contro il database vero: creazione, lettura, aggiornamento
  versionato, rilevamento conflitto — tutti verificati.
- **Function App creata su Azure** (`smarthome-api-mfasani`, piano Consumo (Windows) — il più
  recente "Consumo Flessibile" non è supportato dalla sottoscrizione trial di Marco, scoperto
  durante la creazione). Distribuzione automatica da GitHub configurata (Deployment Center →
  GitHub Actions, autenticazione di base SCM abilitata dopo un primo tentativo OIDC fallito per
  un residuo di un tentativo precedente). Primo deploy riuscito e verificato.
- **API protette con autenticazione reale** (Easy Auth / App Service Authentication), non un
  segreto nel codice (il repository frontend è pubblico): nuova app registration Entra
  `smarthome-api-mfasani` (client ID `c7e2df7a-9f17-41da-9554-7fe7ebaac5ab`), tipo account
  "Qualsiasi directory Microsoft Entra e account Microsoft personali" (per restare compatibile
  col login OneDrive esistente, solo account personali), accesso ristretto all'app frontend già
  esistente (client ID `ea23c586-5b8d-490a-a3ce-e2b7e9ff054a`) tramite "Requisito
  dell'applicazione client", richieste non autenticate → HTTP 401 (non un redirect, corretto per
  un'API). **Verificato dal vivo**: chiamata anonima all'endpoint pubblico risponde 401 come
  atteso.
- **Ambiente locale**: installati Node.js e Azure Functions Core Tools (via npm, non Homebrew —
  un tap Homebrew non fidato ha bloccato l'installazione, barriera di sicurezza rispettata e non
  aggirata) su richiesta per poter scrivere/testare il backend.

## Da fare — prossimo passo

- [ ] **Smart Home → Azure SQL, completamento** (ripartire da qui): configurare "Esponi
      un'API"/scope sull'app registration `smarthome-api-mfasani` su Entra ID (necessario perché
      il frontend possa richiedere un token valido per chiamare le nuove API); scrivere
      `AzureSqlProvider.js` nel frontend (stesso contratto `StorageProvider`, verso
      `/api/resources/{key}`); aggiungere un selettore OneDrive/Azure SQL in Config; test
      end-to-end dal vivo (login, salvataggio, conflitto). Backend già scritto, distribuito e
      verificato — vedi sessione sopra per tutti i dettagli tecnici (nomi risorse, ID app,
      repository).

- [ ] Login OneDrive in locale: errore Microsoft "invalid_request: redirect_uri non
      valido" riscontrato da Marco durante il test di questa sessione — verificare che
      l'URL esatto in barra indirizzi (porta/percorso, slash finale incluso) corrisponda
      al redirect URI registrato su Entra ID (dovrebbe essere `http://localhost:5500/`).
      Non ancora risolto, interrotto per passare ad altro.

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
- [ ] Ipotesi "SQL Server via Aruba" (annotata nelle sessioni precedenti): superata, sostituita
      dalla migrazione verso Azure SQL avviata in questa sessione (vedi sopra).

## Note — non decisioni aperte, non richiedono follow-up

- Repository GitHub reso pubblico (necessario per GitHub Pages sul piano gratuito): nessun dato
  reale nel codice, solo il Client ID pubblico dell'app Entra (non un segreto per un'app SPA).
- Un Personal Access Token GitHub è stato esposto per errore in uno screenshot durante il setup
  (30/8): da rigenerare/cancellare su github.com/settings/tokens se non ancora fatto.
