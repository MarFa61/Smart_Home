/* =========================================================
   CONFIGURAZIONE STORAGE
   clientId: da ottenere registrando un'app gratuita su
   entra.microsoft.com (Microsoft Entra ID) — vedi istruzioni
   fornite separatamente. Non è un segreto: per un'app pubblica
   (SPA) senza client secret è normale che sia visibile nel codice.
   redirectUri: deve corrispondere esattamente a quanto registrato
   nell'app Entra (oggi l'indirizzo locale di sviluppo, in futuro
   anche l'indirizzo di GitHub Pages).
   ========================================================= */

const STORAGE_CONFIG = {
  clientId: 'ea23c586-5b8d-490a-a3ce-e2b7e9ff054a',
  redirectUri: window.location.origin + window.location.pathname,
};
