/* =========================================================
   CONFIGURAZIONE STORAGE
   postgres: backend sul container "dbserver" del minipc Proxmox, che
   serve anche il frontend — percorso relativo, stessa origine.
   ========================================================= */

const STORAGE_CONFIG = {
  postgres: {
    apiBaseUrl: './api',
  },
};
