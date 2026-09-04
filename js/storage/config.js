/* =========================================================
   CONFIGURAZIONE STORAGE
   clientId: da ottenere registrando un'app gratuita su
   entra.microsoft.com (Microsoft Entra ID) — vedi istruzioni
   fornite separatamente. Non è un segreto: per un'app pubblica
   (SPA) senza client secret è normale che sia visibile nel codice.
   redirectUri: deve corrispondere esattamente a quanto registrato
   nell'app Entra (oggi l'indirizzo locale di sviluppo, in futuro
   anche l'indirizzo di GitHub Pages).
   azureSql: stesso clientId (frontend), ma token richiesto per lo
   scope esposto dall'API Azure Functions (app registration separata
   "smarthome-api-mfasani"), non un segreto nemmeno questo.
   apiBaseUrl: NON è <nome-app>.azurewebsites.net — dopo luglio 2025
   Azure assegna alle nuove Function App un hostname con suffisso
   univoco casuale (vedi "defaultHostName" nella Panoramica della
   risorsa su portal.azure.com se va rigenerato).
   ========================================================= */

const STORAGE_CONFIG = {
  clientId: 'ea23c586-5b8d-490a-a3ce-e2b7e9ff054a',
  redirectUri: window.location.origin + window.location.pathname,
  azureSql: {
    apiScope: 'api://c7e2df7a-9f17-41da-9554-7fe7ebaac5ab/user_impersonation',
    apiBaseUrl: 'https://smarthome-api-mfasani-bxhvebfdh8gmbade.swedencentral-01.azurewebsites.net/api',
  },
};
