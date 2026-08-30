/* =========================================================
   UI "Backup & Restore"
   Equivalente di BackupEngine.swift + BackupRestoreSheet.swift
   in Incarichi/Oratori: export/import di uno snapshot JSON,
   passando sempre dalla logica applicativa (devicesStore/
   configStore), mai da una scrittura diretta dello storage.
   ========================================================= */

function currentTimestampForFilename() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function downloadBackupFile() {
  const backup = {
    exportedAt: new Date().toISOString(),
    devices: devicesStore.devices,
    colorOverrides: configStore.config.colorOverrides,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `smarthome-backup-${currentTimestampForFilename()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function restoreFromBackupFile(file) {
  const status = document.getElementById('backupStatus');
  let backup;
  try {
    const text = await file.text();
    backup = JSON.parse(text);
  } catch (error) {
    status.textContent = 'File non valido: non è un backup JSON leggibile.';
    return;
  }

  if (!Array.isArray(backup.devices)) {
    status.textContent = 'File non valido: manca l\'elenco dei dispositivi.';
    return;
  }

  const confermato = confirm(
    `Ripristinare questo backup (${backup.devices.length} dispositivi, esportato il ${backup.exportedAt || 'data sconosciuta'})?\n` +
    `L'elenco Devices attuale su OneDrive verrà sostituito interamente.`
  );
  if (!confermato) return;

  try {
    devicesStore.devices = backup.devices;
    await devicesStore.save();
    if (backup.colorOverrides) {
      configStore.config.colorOverrides = backup.colorOverrides;
      await configStore.save();
      applyLightThemeToApp();
      renderColoriScena();
    }
    renderDevicesTable();
    status.textContent = `Ripristino completato: ${backup.devices.length} dispositivi.`;
  } catch (error) {
    if (error.name === 'StorageConflictError') {
      status.textContent = 'Conflitto: i dati su OneDrive sono cambiati nel frattempo. Ricarica la pagina e riprova.';
    } else {
      status.textContent = `Errore durante il ripristino: ${error.message}`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnBackupDownload').addEventListener('click', downloadBackupFile);

  document.getElementById('inputRestoreFile').addEventListener('change', event => {
    const file = event.target.files[0];
    if (file) restoreFromBackupFile(file);
    event.target.value = ''; // permette di riselezionare lo stesso file in un secondo tentativo
  });
});
