const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Boot settings
  getTestSigning: () => ipcRenderer.invoke('boot:test-signing:get'),
  setTestSigning: (e) => ipcRenderer.invoke('boot:test-signing:set', e),
  getNoIntegrityChecks: () => ipcRenderer.invoke('boot:no-integrity-checks:get'),
  setNoIntegrityChecks: (e) => ipcRenderer.invoke('boot:no-integrity-checks:set', e),
  getMemoryIntegrity: () => ipcRenderer.invoke('boot:memory-integrity:get'),
  setMemoryIntegrity: (e) => ipcRenderer.invoke('boot:memory-integrity:set', e),
  getVBS: () => ipcRenderer.invoke('boot:vbs:get'),
  runScript: (scriptFile) => ipcRenderer.invoke('script:run', scriptFile),
  runVBSDownload: () => ipcRenderer.invoke('vbs:download-and-run'),
  getSecureBoot: () => ipcRenderer.invoke('boot:secure-boot:get'),

  // CPU/Virtualization
  detectCPU: () => ipcRenderer.invoke('cpu:detect'),
  getVirtualization: () => ipcRenderer.invoke('cpu:virtualization:get'),

  // File operations
  checkFile: (f) => ipcRenderer.invoke('file:check', f),
  openFolder: () => ipcRenderer.invoke('file:open-folder'),
  getDownloadDir: () => ipcRenderer.invoke('file:get-download-dir'),
  startDownload: (u, f) => ipcRenderer.invoke('file:download', u, f),
  launchFile: (f) => ipcRenderer.invoke('file:launch', f),
  removeFile: (f) => ipcRenderer.invoke('file:remove', f),
  downloadBypass: (u, f, expectedHash = null) => ipcRenderer.invoke('file:download-bypass', u, f, expectedHash),
  cancelDownload: () => ipcRenderer.invoke('file:cancel-download'),
  selectFolder: (title) => ipcRenderer.invoke('dialog:select-folder', title),
  copyBypassToGame: (bypassPath, gameFolder) => ipcRenderer.invoke('file:copy-bypass-to-game', bypassPath, gameFolder),
  onDownloadComplete: (cb) => ipcRenderer.on('download:complete', (_, d) => cb(d)),
  onDownloadProgress: (cb) => ipcRenderer.on('download:progress', (_, d) => cb(d)),

  // System
  getSystemInfo: () => ipcRenderer.invoke('system:info'),

  // Telemetry
  onTelemetryUpdate: (cb) => ipcRenderer.on('telemetry:update', (_, d) => cb(d)),

  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  // Shell
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  openPath: (p) => ipcRenderer.invoke('shell:open-path', p),
  getAssetPath: (fileName) => ipcRenderer.invoke('asset:path', fileName),
  getBypassCovers: (titles) => ipcRenderer.invoke('bypass:covers:resolve', titles),
  cacheImage: (url, title) => ipcRenderer.invoke('image:cache', url, title),
  getBypassHeroes: (titles) => ipcRenderer.invoke('bypass:heroes:resolve', titles),
  syncBypassManifest: () => ipcRenderer.invoke('bypass:manifest:sync'),
  syncCrackManifest: () => ipcRenderer.invoke('crack:manifest:sync'),
  getBypassDir: () => ipcRenderer.invoke('file:get-bypass-dir'),
  verifyFile: (targetPath, expectedHash = null) => ipcRenderer.invoke('file:verify', targetPath, expectedHash),
  listBypassDownloads: () => ipcRenderer.invoke('file:list-bypass-downloads'),
  clearBypassDownloads: () => ipcRenderer.invoke('file:clear-bypass-downloads'),
  listExtractedFiles: (dirPath) => ipcRenderer.invoke('file:list-extracted-files', dirPath),
  removeBypassItem: (name) => ipcRenderer.invoke('file:remove-bypass-item', name),
  extractArchive: (archivePath) => ipcRenderer.invoke('file:extract-archive', archivePath),

  // Games database
  getGamesDatabase: () => ipcRenderer.invoke('games-db:get'),
  saveDownloadState: (state) => ipcRenderer.invoke('games-db:save-state', state),
  loadDownloadState: () => ipcRenderer.invoke('games-db:load-state'),
  getDownloadName: (url) => ipcRenderer.invoke('games-db:get-download-name', url),

  // Notifications
  notify: (m) => ipcRenderer.invoke('notify', m),

  // Manifest manager
  readManifest: (type) => ipcRenderer.invoke('manifest:read', type),
  writeManifest: (type, data) => ipcRenderer.invoke('manifest:write', type, data),
  listBackups: () => ipcRenderer.invoke('manifest:list-backups'),
  restoreBackup: (name) => ipcRenderer.invoke('manifest:restore-backup', name),
  uploadManifestNow: (type) => ipcRenderer.invoke('manifest:upload-now', type),
  getR2AutoSync: () => ipcRenderer.invoke('r2:get-auto-sync'),
  setR2AutoSync: (enabled) => ipcRenderer.invoke('r2:set-auto-sync', enabled),

  // UI Scale
  getScale: () => ipcRenderer.invoke('scale:get'),
  setScale: (v) => ipcRenderer.invoke('scale:set', v),

  // App update info
  getUpdateInfo: () => ipcRenderer.invoke('app:update-info'),
  onExpired: (cb) => ipcRenderer.on('app:expired', (_, d) => cb(d)),
  onUnexpired: (cb) => ipcRenderer.on('app:unexpired', () => cb()),
})
