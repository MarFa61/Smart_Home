# TODO — sessione 2026-08-30 (analisi Excel, architettura Smart Home, prima versione: Devices, Config, storage OneDrive, pubblicazione GitHub Pages, import dati reali)

## Fatto in questa sessione

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

## Da fare — prossimo passo

- [ ] **Funzionalità Tabelle**: da approfondire con Marco — oggi Categoria/Zona/Tipo dispositivo
      sono ancora liste fisse nel codice (`js/devices/lookups.js`), copiate dal foglio Tabelle
      dell'Excel originale; l'idea è spostarle in una vera sezione Tabelle gestibile dall'utente.
- [ ] Altre "scene" di Colori oltre a "Finestra e tabella" (es. Bottoni, Badge, Campi form) — stesso
      pattern a insiemi finiti chiaro/scuro, non ancora estese.
- [ ] Nessun vero switch chiaro/scuro a runtime: il tema Scuro è modificabile e salvato in Colori ma
      non ancora "attivabile" per l'app intera (serve un controllo Tema come in Incarichi).
- [ ] Connessione OneDrive automatica solo se già stabilita nella stessa sessione: visitando
      Devices poi Config nella stessa pagina la seconda sezione non "eredita" automaticamente la
      connessione della prima nello stesso caricamento (serve un secondo click, senza popup di
      login) — possibile consolidamento futuro in un unico stato di connessione a livello app.
- [ ] Criticità e Priorità intervento: rimandati dal modello dati iniziale di Devices, da
      ripensare insieme (vedi analisi Excel iniziale).

## Note — non decisioni aperte, non richiedono follow-up

- Repository GitHub reso pubblico (necessario per GitHub Pages sul piano gratuito): nessun dato
  reale nel codice, solo il Client ID pubblico dell'app Entra (non un segreto per un'app SPA).
- Un Personal Access Token GitHub è stato esposto per errore in uno screenshot durante il setup
  (30/8): da rigenerare/cancellare su github.com/settings/tokens se non ancora fatto.
