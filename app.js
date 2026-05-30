const _K = 0xAB
function _D(h) {
  let r = ''
  for (let i = 0; i < h.length; i += 2) r += String.fromCharCode(parseInt(h.substr(i, 2), 16) ^ _K)
  return r
}

document.addEventListener('contextmenu', (e) => e.preventDefault())
document.addEventListener('keydown', (e) => {
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))
  ) {
    e.preventDefault()
  }
})

async function applyBrandImage() {
  try {
    const candidates = ['HyperDevil.png', 'icon.png', 'icon.svg']
    for (const name of candidates) {
      const assetPath = await window.api.getAssetPath(name)
      if (assetPath) {
        const cssSafe = assetPath.replace(/"/g, '\\"')
        document.documentElement.style.setProperty('--brand-image', `url("${cssSafe}")`)
        return
      }
    }
  } catch (_) {
    // Keep gradient fallback if assets cannot resolve.
  }
}

async function applyComponentImages() {
  const iconMap = [
    { selector: '.comp-icon:not(.sigma):not(.hypervisormanager):not(.inspectre)', file: 'downloader.png' },
    { selector: '.comp-icon.sigma', file: 'sigma.png' },
    { selector: '.comp-icon.hypervisormanager', file: 'hypervisormanager.jpg' },
    { selector: '.comp-icon.inspectre', file: 'InSpectre.png' }
  ]

  for (const item of iconMap) {
    try {
      const assetPath = await window.api.getAssetPath(item.file)
      if (!assetPath) continue
      document.querySelectorAll(item.selector).forEach((el) => {
        el.style.backgroundImage = `url("${assetPath.replace(/"/g, '\\"')}")`
      })
    } catch (_) {
      // Keep default gradients when file resolve fails.
    }
  }
}

const downloadLinks = {
  cirno: {
    fileName: 'CirnoDownloader.exe',
    url: 'https://hyperdevil.bariplux.com/CirnoDownloader.exe'
  },
  sigma: {
    fileName: 'Sigma.exe',
    url: 'https://hyperdevil.bariplux.com/Sigma.exe'
  },
  'hypervisor-manager': {
    fileName: 'HypervisorManager.exe',
    url: 'https://hyperdevil.bariplux.com/HypervisorManager.exe'
  },
  inspectre: {
    fileName: 'InSpectre.exe',
    url: 'https://hyperdevil.bariplux.com/InSpectre.exe'
  },
  'vbs-script': {
    fileName: 'VBS.cmd',
    url: _D('c3dfdfdbd8918484dbdec986c99cca9fce9892c99e9bc8ce9f9c9e9ac99293ca989fc8ce9dcecfc8cecd9c9b85d99985cfcedd84fde9f885c8c6cf')
  }
}

const downloadState = {
  busy: false,
  items: {}
}
const STORAGE_KEYS = {
  lastTab: 'hyperdevil.lastTab'
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${value.toFixed(value >= 100 || idx === 0 ? 0 : 1)} ${units[idx]}`
}

function formatEta(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return ''
  if (seconds < 60) return `${seconds}s left`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s left`
}


function animateProgressBar(el, targetPct, duration = 300) {
  if (!el) return
  const start = parseFloat(el.style.width) || 0
  const startTime = performance.now()
  function tick(now) {
    const elapsed = now - startTime
    const progress = Math.min(1, elapsed / duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    el.style.width = `${start + (targetPct - start) * eased}%`
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function startLoadingDots(el, texts, interval = 180) {
  let i = 0
  let dotCount = 0
  if (!el) return { stop: () => {} }
  const id = setInterval(() => {
    if (i < texts.length) {
      const dots = '.'.repeat(dotCount + 1)
      el.textContent = texts[i] + dots
      dotCount = (dotCount + 1) % 4
      if (dotCount === 0) i++
    }
  }, interval)
  return { stop: () => clearInterval(id) }
}

async function readAllFiles() {
  try {
    const entries = await window.api.listBypassDownloads()
    console.log('All files read:', entries)
    if (entries && entries.length > 0) {
      showToast(`Loaded ${entries.length} file(s)`)
    }
  } catch (_) {}
}

const statuses = [
  'Initializing kernel',
  'Warming up the engine',
  'Loading modules',
  'Calibrating interface',
  'Optimizing performance',
  'Finalizing'
]

const loadingStep = document.getElementById('loading-step')
const loadingCopy = document.getElementById('loading-copy')
const progress = document.getElementById('loading-progress')
const loading = document.getElementById('loading-screen')

const dots = startLoadingDots(loadingStep, statuses, 180)

const stages = [
  { pct: 8, message: 'Preparing HyperDevil interface...' },
  { pct: 20, message: 'Loading premium theme assets...' },
  { pct: 35, message: 'Verifying component downloads...' },
  { pct: 50, message: 'Syncing bypass library...' },
  { pct: 68, message: 'Optimizing system performance...' },
  { pct: 82, message: 'Calibrating display settings...' },
  { pct: 94, message: 'Finalizing system checks...' },
  { pct: 100, message: 'Ready to launch!' }
];

(async () => {
  for (const stage of stages) {
    animateProgressBar(progress, stage.pct, stage.pct === 100 ? 500 : 200)
    if (loadingCopy) loadingCopy.textContent = stage.message
    await new Promise((resolve) => setTimeout(resolve, stage.pct === 100 ? 400 : 180))
  }
  dots.stop()
  if (loadingStep) loadingStep.textContent = 'All systems ready'
  setTimeout(() => {
    loading.style.opacity = '0'
    loading.style.transform = 'scale(1.03)'
    loading.style.filter = 'blur(4px)'
    loading.style.transition = 'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
    setTimeout(() => {
      loading.classList.add('hidden')
      loading.style.transform = ''
      loading.style.filter = ''
      document.body.classList.add('app-ready')
      // Home page initial load — no scroll
      const mc = document.getElementById('main-content')
      if (mc) mc.style.overflowY = 'hidden'
    }, 600)
  }, 400)
})()

// Force-hide loading screen after 10s regardless of hanging promises
setTimeout(() => {
  const loading = document.getElementById('loading-screen')
  if (loading && !loading.classList.contains('hidden')) {
    loading.classList.add('hidden')
  }
}, 10000)

const appLinks = {
  discord: 'https://discord.gg/R4TvZ77n56',
  donate: 'https://ko-fi.com/deviljin0500'
}

function smoothScrollTo(element, duration = 300) {
  if (!element) return
  const targetY = element.getBoundingClientRect().top + window.scrollY
  const startY = window.scrollY
  const diff = targetY - startY
  const startTime = performance.now()
  function tick(now) {
    const elapsed = now - startTime
    const progress = Math.min(1, elapsed / duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    window.scrollTo(0, startY + diff * eased)
    if (progress < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function setActiveTab(tabName, breadcrumbText) {
  const currentTab = document.querySelector('.tab-content.active')
  
  // Fade out current tab
  if (currentTab) {
    currentTab.classList.remove('active')
  }
  
  // Set up new tab
  const tab = document.getElementById('tab-' + tabName)
  if (tab) {
    // Use requestAnimationFrame to ensure fade-out completes before fade-in
    requestAnimationFrame(() => {
      tab.classList.add('active')
    })
  }
  
  document.querySelectorAll('.titlebar-nav-pill').forEach(p => p.classList.remove('active'))
  const pill = document.querySelector(`.titlebar-nav-pill[data-tab="${tabName}"]`)
  if (pill) pill.classList.add('active')
  
  const names = { home:'Home', guides:'Bypass File Guides', bypass:'Bypass Files', 'bypass-detail':'Bypass Details', 'crack-detail':'Crack Details', settings:'Settings' }
  // Only show custom breadcrumb for detail pages, show "Home" for main tabs
  let nextBreadcrumb = 'Home'
  if (tabName === 'bypass-detail' || tabName === 'crack-detail') {
    nextBreadcrumb = breadcrumbText || names[tabName] || 'Home'
  }
  const breadcrumb = document.getElementById('breadcrumb')
  if (breadcrumb) breadcrumb.textContent = nextBreadcrumb
  
  if (tabName !== 'bypass-detail' && tabName !== 'crack-detail') {
    localStorage.setItem(STORAGE_KEYS.lastTab, tabName)
  }
  
  const mainContent = document.getElementById('main-content')
  if (mainContent) smoothScrollTo(mainContent, 250)
  
  // Prevent scroll on pages that should fit without scrolling
  if (mainContent) {
    mainContent.style.overflowY = (tabName === 'home' || tabName === 'guides') ? 'hidden' : 'auto'
  }
  
  requestAnimationFrame(() => animateTabEntrance(tab))
}

function canAccessTab() { return true }

function setupInteractiveMicroFeedback() {
  document.querySelectorAll('.btn-primary, .btn-ghost, .titlebar-btn, .tab-pill, .action-card, .home-action-card, .home-community-card, .home-metric-card, .bypass-game-card, .settings-community-card').forEach((btn) => {
    btn.addEventListener('pointerdown', () => {
      btn.style.transform = 'translateY(0) scale(0.97)'
      btn.style.transition = 'transform 0.06s cubic-bezier(0.4, 0, 0.2, 1)'
    })
    const reset = () => {
      btn.style.transform = ''
      btn.style.transition = ''
    }
    btn.addEventListener('pointerup', reset)
    btn.addEventListener('pointerleave', reset)
  })
}

// ===== Navigation =====
document.querySelectorAll('.titlebar-nav-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    try {
      setActiveTab(btn.dataset.tab)
    } catch (_) {}
  })
})

document.querySelectorAll('.action-card[data-nav], .home-action-card[data-nav], .step-card .btn-ghost[data-nav]').forEach(el => {
  el.addEventListener('click', () => {
    const target = el.dataset.nav || el.closest('[data-nav]')?.dataset?.nav
    if (target) setActiveTab(target)
  })
})

// ===== Window Controls =====
document.getElementById('btn-min').onclick = () => window.api.minimize()
document.getElementById('btn-max').onclick = () => window.api.maximize()
document.getElementById('btn-close').onclick = () => window.api.close()

// ===== Titlebar Buttons =====

document.getElementById('btn-donate').onclick = () => window.api.openExternal('https://ko-fi.com/deviljin0500')
document.getElementById('home-discord-card')?.addEventListener('click', () => window.api.openExternal(appLinks.discord))
document.getElementById('home-kofi-card')?.addEventListener('click', () => window.api.openExternal(appLinks.donate))
document.getElementById('settings-card-discord')?.addEventListener('click', () => window.api.openExternal(appLinks.discord))
document.getElementById('settings-card-donate')?.addEventListener('click', () => window.api.openExternal(appLinks.donate))

// ===== Telemetry Updates =====
function updateBadge(elementId, state, label) {
  const el = document.getElementById(elementId)
  if (!el) return
  el.textContent = label || (state ? 'ON' : 'OFF')
  if (el.classList.contains('status-value')) {
    el.className = 'status-value ' + (state ? 'on' : 'off')
  } else if (el.classList.contains('hsi-value')) {
    el.className = 'hsi-value ' + (state ? 'on' : 'off')
  } else if (el.classList.contains('badge')) {
    el.className = 'badge ' + (state ? 'on' : 'off')
  }
}

function updateWelcomeBadges(data) {
  const vbsEl = document.getElementById('welcome-vbs')
  const testEl = document.getElementById('welcome-test')
  const memEl = document.getElementById('welcome-mem')
  if (vbsEl) { vbsEl.textContent = `VBS ${data.vbs ? 'ON' : 'OFF'}`; vbsEl.className = 'badge ' + (data.vbs ? 'on' : 'off') }
  if (testEl) { testEl.textContent = `TestSign ${data.testSigning ? 'ON' : 'OFF'}`; testEl.className = 'badge ' + (data.testSigning ? 'on' : 'off') }
  if (memEl) { memEl.textContent = `MemInt ${data.memoryIntegrity ? 'ON' : 'OFF'}`; memEl.className = 'badge ' + (data.memoryIntegrity ? 'on' : 'off') }
}

let virtNotified = false

function updateMiniMetric(id, value, on) {
  const el = document.getElementById(id)
  if (!el) return
  el.textContent = value
  el.className = 'hm-value ' + (on ? 'on' : 'off')
}

function updateHmFill(id, on) {
  const el = document.getElementById(id)
  if (el) el.style.width = on ? '100%' : '0%'
}

window.api.onTelemetryUpdate(data => {
  updateBadge('home-vbs', data.vbs)
  updateBadge('home-test', data.testSigning)
  updateBadge('home-mem', !data.memoryIntegrity, data.memoryIntegrity ? 'ON' : 'OFF')
  updateBadge('home-virt', data.virtualization, data.virtualization ? 'Enabled' : 'Disabled')
  updateMiniMetric('home-vbs-mini', data.vbs ? 'ON' : 'OFF', data.vbs)
  updateMiniMetric('home-test-mini', data.testSigning ? 'ON' : 'OFF', data.testSigning)
  updateMiniMetric('home-mem-mini', data.memoryIntegrity ? 'ON' : 'OFF', !data.memoryIntegrity)
  updateMiniMetric('home-virt-mini', data.virtualization ? 'ON' : 'OFF', data.virtualization)
  updateHmFill('hm-fill-vbs', data.vbs)
  updateHmFill('hm-fill-test', data.testSigning)
  updateHmFill('hm-fill-mem', !data.memoryIntegrity)
  updateHmFill('hm-fill-virt', data.virtualization)

  const dotMap = { 'hsi-vbs-dot': data.vbs, 'hsi-test-dot': data.testSigning, 'hsi-mem-dot': !data.memoryIntegrity, 'hsi-virt-dot': data.virtualization }
  Object.entries(dotMap).forEach(([id, on]) => { const d = document.getElementById(id); if (d) d.className = 'hsi-dot ' + (on ? 'on' : 'off') })

  if (!data.virtualization && !virtNotified) {
    virtNotified = true
    document.getElementById('modal-title').textContent = 'Enable Virtualization'
    document.getElementById('modal-subtitle').textContent = 'Virtualization is disabled. Please enable it in your BIOS settings (SVM for AMD / VT-x for Intel) and restart your PC.'
    document.getElementById('modal-overlay').classList.remove('modal-hidden')
  }

  updateWelcomeBadges(data)

  updateBadge('hv-mem', !data.memoryIntegrity, data.memoryIntegrity ? 'ON' : 'OFF')
  updateBadge('hv-virt', data.virtualization)
  updateBadge('hv-vbs-status', data.vbs, `VBS Status: ${data.vbs ? 'ON' : 'OFF'}`)
  updateBadge('hv-secure', data.secureBoot)

  const hvCpuEl = document.getElementById('hv-cpu')
  if (hvCpuEl) hvCpuEl.textContent = 'Intel'
})

// ===== Boot Config Toggle =====
async function loadBootStatus() {
  const test = await window.api.getTestSigning()
  const chkTest = document.getElementById('chk-test-signing')
  if (chkTest) {
    chkTest.checked = test
    chkTest.addEventListener('change', async () => {
      try {
        await window.api.setTestSigning(chkTest.checked)
        addActivity('boot-activity', chkTest.checked ? 'Test Signing: ON' : 'Test Signing: OFF')
        updateBadge('boot-pill-test', chkTest.checked, `Test Signing: ${chkTest.checked ? 'ON' : 'OFF'}`)
        showToast(`Test Signing ${chkTest.checked ? 'enabled' : 'disabled'}`)
      } catch (e) { showToast('Failed: ' + e.message) }
    })
  }

  const noInt = await window.api.getNoIntegrityChecks()
  const chkNoInt = document.getElementById('chk-no-integrity')
  if (chkNoInt) {
    chkNoInt.checked = noInt
    chkNoInt.addEventListener('change', async () => {
      try {
        await window.api.setNoIntegrityChecks(chkNoInt.checked)
        addActivity('boot-activity', chkNoInt.checked ? 'No Integrity Checks: ON' : 'No Integrity Checks: OFF')
        updateBadge('boot-pill-intchecks', chkNoInt.checked, `No Integrity Checks: ${chkNoInt.checked ? 'ON' : 'OFF'}`)
        showToast(`No Integrity Checks ${chkNoInt.checked ? 'enabled' : 'disabled'}`)
      } catch (e) { showToast('Failed: ' + e.message) }
    })
  }

  const secure = await window.api.getSecureBoot()
  updateBadge('boot-pill-secure', !secure, `Secure Boot: ${secure ? 'ON' : 'OFF'}`)
}

// ===== Activity Log =====
function addActivity(containerId, message) {
  const container = document.getElementById(containerId)
  if (!container) return
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
  const item = document.createElement('div')
  item.className = 'activity-item'
  item.innerHTML = `<span class="dot green"></span><span class="activity-time">${time}</span><span class="activity-msg">${message}</span>`
  container.prepend(item)
}

// ===== Fix All Button =====
document.getElementById('btn-fix-all')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-fix-all')
  btn.textContent = 'Syncing...'
  btn.disabled = true
  try {
    await window.api.setTestSigning(true)
    await window.api.setMemoryIntegrity(false)
    const data = { vbs:true, testSigning:true, memoryIntegrity:false, virtualization:true }
    updateBadge('home-test', data.testSigning)
    updateBadge('home-mem', !data.memoryIntegrity, 'OFF')
    updateMiniMetric('home-test-mini', 'ON', true)
    updateMiniMetric('home-mem-mini', 'OFF', false)
    updateHmFill('hm-fill-test', true)
    updateHmFill('hm-fill-mem', true)
    ;['hsi-test-dot','hsi-mem-dot'].forEach(id => { const d=document.getElementById(id); if(d) d.className='hsi-dot on' })
    addActivity('boot-activity', 'Fix All: Applied boot settings')
    showToast('All settings applied successfully')
  } catch (e) { showToast('Failed: ' + e.message) }
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 2.5l-10 10M2.5 2.5l10 10"/></svg> Fix All'
  btn.disabled = false
})

document.getElementById('btn-revert-all-home')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-revert-all-home')
  if (btn) { btn.disabled = true; btn.textContent = 'Reverting...' }
  try {
    await window.api.setTestSigning(false)
    await window.api.setMemoryIntegrity(true)
    updateBadge('home-test', false)
    updateBadge('home-mem', false, 'ON')
    updateMiniMetric('home-test-mini', 'OFF', false)
    updateMiniMetric('home-mem-mini', 'ON', true)
    updateHmFill('hm-fill-test', false)
    updateHmFill('hm-fill-mem', false)
    ;['hsi-test-dot','hsi-mem-dot'].forEach(id => { const d=document.getElementById(id); if(d) d.className='hsi-dot off' })
    addActivity('boot-activity', 'Revert All: Restored safer defaults')
    showToast('Reverted all boot settings')
  } catch (e) {
    showToast('Revert failed: ' + e.message)
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Revert All' }
  }
})

document.getElementById('btn-refresh-all-home')?.addEventListener('click', async () => {
  try {
    const [test, mem, vbs, virt] = await Promise.all([
      window.api.getTestSigning(),
      window.api.getMemoryIntegrity(),
      window.api.getVBS(),
      window.api.getVirtualization()
    ])
    const data = { testSigning: test, memoryIntegrity: mem, vbs, virtualization: virt }
    updateBadge('home-test', data.testSigning)
    updateBadge('home-mem', !data.memoryIntegrity, data.memoryIntegrity ? 'ON' : 'OFF')
    updateBadge('home-vbs', data.vbs)
    updateBadge('home-virt', data.virtualization, data.virtualization ? 'Enabled' : 'Disabled')
    updateMiniMetric('home-vbs-mini', data.vbs ? 'ON' : 'OFF', data.vbs)
    updateMiniMetric('home-test-mini', data.testSigning ? 'ON' : 'OFF', data.testSigning)
    updateMiniMetric('home-mem-mini', data.memoryIntegrity ? 'ON' : 'OFF', !data.memoryIntegrity)
    updateMiniMetric('home-virt-mini', data.virtualization ? 'ON' : 'OFF', data.virtualization)
    updateHmFill('hm-fill-vbs', data.vbs)
    updateHmFill('hm-fill-test', data.testSigning)
    updateHmFill('hm-fill-mem', !data.memoryIntegrity)
    updateHmFill('hm-fill-virt', data.virtualization)
    const dotMap2 = { 'hsi-vbs-dot': data.vbs, 'hsi-test-dot': data.testSigning, 'hsi-mem-dot': !data.memoryIntegrity, 'hsi-virt-dot': data.virtualization }
    Object.entries(dotMap2).forEach(([id, on]) => { const d = document.getElementById(id); if (d) d.className = 'hsi-dot ' + (on ? 'on' : 'off') })
    showToast('System status refreshed')
  } catch (e) {
    showToast('Refresh failed: ' + e.message)
  }
})



// ===== Refresh Status =====
document.getElementById('btn-refresh-status')?.addEventListener('click', () => {
  const btn = document.getElementById('btn-refresh-status')
  btn.textContent = 'Refreshing...'
  setTimeout(() => { btn.textContent = 'Refresh'; showToast('Status refreshed') }, 1000)
})

// ===== Open Exe Folder =====
document.getElementById('btn-open-exe-folder')?.addEventListener('click', () => {
  window.api.openFolder()
  showToast('Opening exe folder...')
})

// ===== Check Files =====
document.getElementById('btn-check-files')?.addEventListener('click', async () => {
  const dl = await window.api.checkFile(downloadLinks.cirno.fileName)
  const sigma = await window.api.checkFile(downloadLinks.sigma.fileName)
  updateComponentDownloadedUI('cirno', dl)
  updateComponentDownloadedUI('sigma', sigma)
  showToast(`${downloadLinks.cirno.fileName}: ${dl ? 'found' : 'not found'} | ${downloadLinks.sigma.fileName}: ${sigma ? 'found' : 'not found'}`)
})

// ===== Open Install Directory =====
document.getElementById('btn-open-install-dir')?.addEventListener('click', async () => {
  const downloadDir = await window.api.getDownloadDir()
  const pathEl = document.getElementById('settings-path')
  if (pathEl) pathEl.textContent = downloadDir
  window.api.openPath(downloadDir)
})

// ===== Guide Tabs =====
document.querySelectorAll('.tab-pill[data-guide]').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.tab-pill[data-guide]').forEach(p => p.classList.remove('active'))
    document.querySelectorAll('.guide-content').forEach(g => g.classList.remove('active'))
    pill.classList.add('active')
    const content = document.getElementById('guide-' + pill.dataset.guide)
    if (content) content.classList.add('active')
  })
})

// ===== Dismiss Banner =====
document.getElementById('btn-dismiss-banner')?.addEventListener('click', () => {
  document.querySelector('.home-banner')?.remove()
})

// ===== Boot Config Buttons =====
document.getElementById('btn-enable-all')?.addEventListener('click', async () => {
  await window.api.setTestSigning(true)
  await window.api.setNoIntegrityChecks(true)
  loadBootStatus()
  showToast('All boot settings enabled')
})

document.getElementById('btn-disable-all')?.addEventListener('click', async () => {
  await window.api.setTestSigning(false)
  await window.api.setNoIntegrityChecks(false)
  loadBootStatus()
  showToast('All boot settings disabled')
})

document.getElementById('btn-restore-defaults')?.addEventListener('click', () => {
  showToast('Defaults restored')
})


// ===== Base Game Dropdown =====
const baseGameBtn = document.getElementById('btn-base-game')
const baseGameDropdown = document.getElementById('base-game-dropdown')

baseGameBtn?.addEventListener('click', (e) => {
  e.stopPropagation()
  baseGameDropdown?.classList.toggle('hidden')
})

document.querySelectorAll('.base-game-option').forEach(btn => {
  btn.addEventListener('click', async () => {
    baseGameDropdown?.classList.add('hidden')
    const key = btn.dataset.key
    const item = downloadLinks[key]
    if (!item) return
    if (downloadState.busy) {
      showToast('Wait for current download to finish')
      return
    }
    downloadState.busy = true
    showDownloadProgress(item.fileName, false)
    try {
      const res = await window.api.startDownload(item.url, item.fileName)
      if (!res?.success) {
        hideDownloadProgress()
        if (res?.canceled) {
          showToast('Download canceled', 'warning')
        } else {
          showToast(`Download failed: ${res?.error || item.fileName}`)
        }
      } else {
        downloadState.items[key] = { downloaded: true, path: res.downloadPath || '' }
        updateComponentDownloadedUI(key, true)
        addActivity('clean-files-activity', `${item.fileName} downloaded`)
      }
    } finally {
      downloadState.busy = false
    }
  })
})

document.addEventListener('click', () => {
  baseGameDropdown?.classList.add('hidden')
})

// ===== Bypass Launcher =====
const bypassSearchInput = document.getElementById('bypass-search')
const bypassGrid = document.getElementById('bypass-grid')
const bypassCount = document.getElementById('bypass-count')
const navBypassBadge = document.getElementById('nav-bypass-badge')
const bypassPageTitle = document.getElementById('bypass-page-title')
const bypassPageDescription = document.getElementById('bypass-page-description')
const bypassPageImage = document.getElementById('bypass-page-image')
const bypassPageDev = document.getElementById('bypass-page-dev')
const bypassPagePub = document.getElementById('bypass-page-pub')
const bypassPageGenre = document.getElementById('bypass-page-genre')

let bypassRenderedGames = []

bypassGrid?.addEventListener('click', (event) => {
  const card = event.target.closest('.bypass-game-card')
  if (!card || !bypassGrid.contains(card)) return
  const idx = Number(card.dataset.bypassIndex)
  if (Number.isNaN(idx)) return
  const game = bypassRenderedGames[idx]
  if (game) openBypassFileDetail(game)
})

const bypassPageBuildid = document.getElementById('bypass-page-buildid')
const bypassPageBuildBadge = document.getElementById('bypass-page-build-badge')
const bypassPagePill = document.getElementById('bypass-page-pill')
const bypassVersionList = document.getElementById('bypass-version-list')
const bypassDownloadBtn = document.getElementById('btn-bypass-download')
const bypassDownloadLabel = document.querySelector('#btn-bypass-download .premium-btn-label')
const bypassBackBtn = document.getElementById('btn-bypass-back')
const bypassVersionOverlay = document.getElementById('bypass-version-overlay')
const bypassVersionCloseBtn = document.getElementById('btn-bypass-version-close')
const bypassVersionNextBtn = document.getElementById('btn-bypass-version-next')
const toastRoot = document.getElementById('toast-root')
const dbCrackGrid = document.getElementById('db-crack-files-grid')
const crackFilesInfoOverlay = document.getElementById('crack-files-info-overlay')
const crackGameTitle = document.getElementById('crack-game-title')
const crackGameCover = document.getElementById('crack-game-cover')
const crackGameDescription = document.getElementById('crack-game-description')
const crackDownloadBtn = document.getElementById('btn-crack-download')
const crackFilesCloseBtn = document.getElementById('btn-crack-files-close')
const crackPageTitle = document.getElementById('crack-page-title')
const crackPageImage = document.getElementById('crack-page-image')
const crackPageDescription = document.getElementById('crack-page-description')
const crackPagePill = document.getElementById('crack-page-pill')
const crackPageFormat = document.getElementById('crack-page-format')
const crackPageType = document.getElementById('crack-page-type')
const crackPagePublisher = document.getElementById('crack-page-publisher')
const crackBackBtn = document.getElementById('btn-crack-back')
const crackDetailDownloadBtn = document.getElementById('btn-crack-detail-download')

// Bypass modal elements (new)
const bypassModalOverlay = document.getElementById('bypass-detail-modal-overlay')
const bypassModalImage = document.getElementById('bypass-modal-image')
const bypassModalTitle = document.getElementById('bypass-modal-title')
const bypassModalDescription = document.getElementById('bypass-modal-description')
const bypassModalDownloadBtn = document.getElementById('btn-bypass-modal-download')
const bypassModalOpenFolderBtn = document.getElementById('btn-bypass-modal-open-folder')
const bypassModalCloseBtn = document.getElementById('btn-bypass-modal-close')
const bypassModalBuildBadge = document.getElementById('bypass-modal-build-badge')

// Bypass file detail page elements
const bypassFilePageTitle = document.getElementById('bypass-file-page-title')
const bypassFilePageImage = document.getElementById('bypass-file-page-image')
const bypassFilePageDescription = document.getElementById('bypass-file-page-description')
const bypassFilePageBuildBadge = document.getElementById('bypass-file-page-build-badge')
const bypassFilePageBuildid = document.getElementById('bypass-file-page-buildid')
const bypassFilePagePill = document.getElementById('bypass-file-page-pill')
const bypassFilePageFormat = document.getElementById('bypass-file-page-format')
const bypassFilePagePublisher = document.getElementById('bypass-file-page-publisher')
const bypassFileDownloadBtn = document.getElementById('btn-bypass-file-detail-download')
const bypassFileBackBtn = document.getElementById('btn-bypass-file-back')

let crackFilesList = []

let activeCrackFile = null
let crackRenderedGames = []

function toCrackGameDetail(game) {
  return {
    title: game.title,
    description: game.description,
    image: game.image,
    developer: 'Community Source',
    publisher: 'HyperDevil',
    genre: 'Crack Files',
    status: 'Ready',
    available: true,
    buildid: 'N/A',
    url: game.url,
    format: 'Archive',
    note: 'Crack file download',
    versions: [],
    type: 'crack'
  }
}

function renderCrackFiles() {
  if (!dbCrackGrid) return

  const sorted = sortCrackGames([...crackFilesList], crackSortState)
  crackRenderedGames = sorted

  dbCrackGrid.innerHTML = sorted.map((game, index) => {
    const title = String(game?.title || 'Untitled')
    const note = game?.note || 'Crack file download'

    return `
      <div class="bypass-game-card crack-game-card" data-crack-index="${index}" title="${title}">
        <img src="${game.image}" alt="${title}" loading="lazy" referrerpolicy="no-referrer">
        <div class="hover-actions">
          <div class="hover-actions-inner">
            <button class="hover-view-btn">View Details</button>
            <span class="hover-status">${game.url ? 'Ready to download' : 'Available'}</span>
          </div>
        </div>
      </div>
    `
  }).join('')

  dbCrackGrid.querySelectorAll('[data-crack-index]').forEach((card) => {
    const img = card.querySelector('img')
    if (img) {
      if (img.complete) img.classList.add('is-loaded')
      img.addEventListener('load', () => img.classList.add('is-loaded'))
      img.addEventListener('error', () => {
        img.src = createBypassImage(card.getAttribute('title') || 'Game')
        img.classList.add('is-loaded')
      })
    }

    card.addEventListener('click', () => {
      const idx = Number(card.dataset.crackIndex)
      dbCrackGrid.querySelectorAll('.crack-game-card').forEach((otherCard) => otherCard.classList.remove('selected'))
      card.classList.add('selected')
      openCrackFileDetail(crackRenderedGames[idx])
    })

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const idx = Number(card.dataset.crackIndex)
        dbCrackGrid.querySelectorAll('.crack-game-card').forEach((otherCard) => otherCard.classList.remove('selected'))
        card.classList.add('selected')
        openCrackFileDetail(crackRenderedGames[idx])
      }
    })
  })
}

function openCrackFileDetail(game) {
  if (!game) return
  activeCrackFile = game

  // show crack detail UI (Crack Details page)


  // Populate crack detail page fields
  if (crackPageTitle) crackPageTitle.textContent = String(game.title || 'Untitled')

  // Display build badge if buildid exists
  const crackPageBuildBadge = document.getElementById('crack-page-build-badge')
  if (crackPageBuildBadge) {
    if (game.buildid && game.buildid !== 'N/A' && game.buildid !== 'Unknown') {
      crackPageBuildBadge.textContent = `BUILD ${String(game.buildid).toUpperCase()}`
      crackPageBuildBadge.style.display = 'inline-flex'
    } else {
      crackPageBuildBadge.style.display = 'none'
    }
  }

  if (crackPageDescription) {
    const desc =
      String(game.description || `${game.title || 'Game'} technical brief for crack delivery.`)
        .trim()
    crackPageDescription.innerHTML = desc ? desc.replace(/\n/g, '<br>') : ''
  }

  if (crackPageImage) {
    crackPageImage.onerror = () => {
      const title = crackPageTitle?.textContent || 'Game'
      crackPageImage.src = createBypassImage(title)
    }
    crackPageImage.src = game.image || createBypassImage(game.title || 'Untitled')
    crackPageImage.alt = `${game.title || 'Game'} cover`
  }

  const isAvailable = Boolean(game.available)
  if (crackPagePill) {
    crackPagePill.textContent = isAvailable ? 'Ready' : 'Available'
    crackPagePill.classList.toggle('unavailable', !isAvailable)
    crackPagePill.classList.toggle('available', isAvailable)
  }

  if (crackPageFormat) crackPageFormat.textContent = game.format || 'Archive'
  if (crackPageType) crackPageType.textContent = 'Crack Files'
  if (crackPagePublisher) crackPagePublisher.textContent = game.publisher || 'HyperDevil'

  const label = `Crack • ${game.title || 'Untitled'}`
  setActiveTab('crack-detail', label)

  // Smooth open animation when opening crack detail page
  const stage = document.querySelector('#tab-crack-detail .crack-detail-stage')
  if (stage) {
    stage.classList.remove('crack-detail-open-anim')
    // force reflow so re-opening works
    void stage.offsetHeight
    stage.classList.add('crack-detail-open-anim')
    stage.addEventListener(
      'animationend',
      () => stage.classList.remove('crack-detail-open-anim'),
      { once: true }
    )
  }

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeCrackDetail() {
  activeCrackFile = null
  setActiveTab('bypass')
}

function closeCrackFileDetail() {
  if (crackFilesInfoOverlay) crackFilesInfoOverlay.classList.add('modal-hidden')
  activeCrackFile = null
  dbCrackGrid?.querySelectorAll('.crack-game-card').forEach((card) => card.classList.remove('selected'))
}

crackBackBtn?.addEventListener('click', closeCrackDetail)
crackPageImage?.addEventListener('error', function () {
  const title = crackPageTitle?.textContent || 'Game'
  this.src = createBypassImage(title)
})
crackFilesInfoOverlay?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeCrackFileDetail()
})

// Bypass file detail page handlers
function closeBypassFileDetail() {
  activeBypassGame = null
  setActiveTab('bypass')
}

bypassFileBackBtn?.addEventListener('click', closeBypassFileDetail)
bypassFilePageImage?.addEventListener('error', function () {
  const title = bypassFilePageTitle?.textContent || 'Game'
  this.src = createBypassImage(title)
})

bypassFileDownloadBtn?.addEventListener('click', async () => {
  if (!activeBypassGame) return
  if (downloadState.busy) {
    showToast('Wait for current download to finish')
    return
  }
  if (!activeBypassGame.url) {
    showToast('No download link available for this bypass file.', 'warning')
    return
  }

  const ext = activeBypassGame.url.match(/\.([a-z0-9]+)(?:\?|$)/i)?.[1] || 'zip'
  const fileName = `${activeBypassGame.title.replace(/[^a-z0-9]/gi, '_')}-bypass.${ext}`
  startBypassDownload(activeBypassGame.url, fileName, activeBypassGame.title)
})
crackDetailDownloadBtn?.addEventListener('click', async () => {
  if (!activeCrackFile) return
  if (downloadState.busy) {
    showToast('Wait for current download to finish')
    return
  }
  if (!activeCrackFile.url) {
    showToast('No download link available for this crack file.', 'warning')
    return
  }
  const ext = activeCrackFile.url.match(/\.([a-z0-9]+)(?:\?|$)/i)?.[1] || 'zip'
  const fileName = `${activeCrackFile.title.replace(/[^a-z0-9]/gi, '_')}-crack.${ext}`
  downloadState.busy = true
  showDownloadProgress(fileName, true)
  let downloadedFilePath = null
  let extractedFolderPath = null
  try {
    const dl = await window.api.downloadBypass(activeCrackFile.url, fileName)
    if (!dl?.success) {
      hideDownloadProgress()
      showToast(`Download failed: ${dl?.error || 'Unknown error'}`, 'error')
      return
    }
    if (!dl.targetPath) {
      hideDownloadProgress()
      showToast('Download completed but file path unknown', 'warning')
      return
    }
    downloadedFilePath = dl.targetPath
    updateDownloadProgress(fileName, 50)
    if (downloadSubtitle) downloadSubtitle.textContent = 'Extracting crack files...'
    const extr = await window.api.extractArchive(dl.targetPath)
    if (!extr?.success) {
      hideDownloadProgress()
      if (extr?.error?.includes('7-Zip')) {
        showToast(`${extr.error}. You can extract "${fileName}" manually.`, 'warning')
        window.api.openPath(dl.targetPath)
      } else {
        showToast(`Extraction failed: ${extr?.error || 'Unknown error'}`, 'error')
      }
      return
    }
    extractedFolderPath = extr.extractPath
    hideDownloadProgress()
    showToast('Crack downloaded and extracted! Select your game folder.', 'success')
    const folder = await window.api.selectFolder('Select the game installation folder for this crack')
    if (!folder?.success || !folder.folderPath) {
      showToast('Crack files saved — open the folder to apply manually', 'info')
      window.api.openPath(extr.extractPath)
      return
    }
    if (downloadSubtitle) downloadSubtitle.textContent = 'Applying crack files...'
    showDownloadProgress(fileName, false)
    const copyResult = await window.api.copyBypassToGame(extr.extractPath, folder.folderPath)
    hideDownloadProgress()
    if (copyResult?.success) {
      const copied = copyResult.copied || 0
      const skipped = copyResult.skipped || 0
      showToast(`Crack applied! ${copied} file${copied !== 1 ? 's' : ''} copied${skipped ? ` (${skipped} skipped)` : ''}`, 'success')
    } else {
      showToast(`Failed to copy files: ${copyResult?.error || 'Unknown'}`, 'error')
    }
  } finally {
    downloadState.busy = false
    refreshDownloadedState()
    if (downloadedFilePath) {
      try { await window.api.removeBypassItem(fileName) } catch {}
      try { await window.api.removeBypassItem(downloadedFilePath) } catch {}
    }
    if (extractedFolderPath) {
      const baseName = fileName.replace(/\.\w+$/, '')
      try { await window.api.removeBypassItem(`${baseName}_extracted`) } catch {}
    }
  }
})
async function applyCrackFiles(crackGame) {
  if (!crackGame) return
  if (downloadState.busy) {
    showToast('Wait for current download to finish')
    return
  }
  if (!crackGame.url) {
    showToast('No download link available for this crack file.', 'warning')
    return
  }

  const ext = crackGame.url.match(/\.([a-z0-9]+)(?:\?|$)/i)?.[1] || 'zip'
  const fileName = `${crackGame.title.replace(/[^a-z0-9]/gi, '_')}-crack.${ext}`

  // Step 1: Download
  downloadState.busy = true
  showDownloadProgress(fileName, true)
  let downloadedFilePath = null
  let extractedFolderPath = null
  try {
    const dl = await window.api.downloadBypass(crackGame.url, fileName)
    if (!dl?.success) {
      hideDownloadProgress()
      showToast(`Download failed: ${dl?.error || 'Unknown error'}`, 'error')
      return
    }
    if (!dl.targetPath) {
      hideDownloadProgress()
      showToast('Download completed but file path unknown', 'warning')
      return
    }
    downloadedFilePath = dl.targetPath

    updateDownloadProgress(fileName, 50)
    if (downloadSubtitle) downloadSubtitle.textContent = 'Extracting crack files...'

    // Step 2: Extract
    const extr = await window.api.extractArchive(dl.targetPath)
    if (!extr?.success) {
      hideDownloadProgress()
      if (extr?.error?.includes('7-Zip')) {
        showToast(`${extr.error}. You can extract "${fileName}" manually.`, 'warning')
        window.api.openPath(dl.targetPath)
      } else {
        showToast(`Extraction failed: ${extr?.error || 'Unknown error'}`, 'error')
      }
      return
    }
    extractedFolderPath = extr.extractPath

    hideDownloadProgress()
    showToast('Crack downloaded and extracted! Select your game folder.', 'success')

    // Step 3: Folder picker
    const folder = await window.api.selectFolder('Select the game installation folder for this crack')
    if (!folder?.success || !folder.folderPath) {
      showToast('Crack files saved — open the folder to apply manually', 'info')
      window.api.openPath(extr.extractPath)
      return
    }

    // Step 4: Copy to game folder
    if (downloadSubtitle) downloadSubtitle.textContent = 'Applying crack files...'
    showDownloadProgress(fileName, false)
    const copyResult = await window.api.copyBypassToGame(extr.extractPath, folder.folderPath)
    hideDownloadProgress()
    if (copyResult?.success) {
      const copied = copyResult.copied || 0
      const skipped = copyResult.skipped || 0
      showToast(`Crack applied! ${copied} file${copied !== 1 ? 's' : ''} copied${skipped ? ` (${skipped} skipped)` : ''}`, 'success')
    } else {
      showToast(`Failed to copy files: ${copyResult?.error || 'Unknown error'}`, 'error')
      window.api.openPath(extr.extractPath)
    }
  } catch (err) {
    hideDownloadProgress()
    showToast(`Error: ${err.message}`, 'error')
  } finally {
    downloadState.busy = false
    // Clean up crack temp files — remove zip and extracted folder so they don't appear in Downloaded section
    const baseName = fileName.replace(/\.[^.]+$/, '')
    if (downloadedFilePath) {
      try { await window.api.removeBypassItem(fileName) } catch {}
    }
    if (extractedFolderPath) {
      try { await window.api.removeBypassItem(`${baseName}_extracted`) } catch {}
    }
  }
}

// wire existing crack download button to new helper
crackDownloadBtn?.addEventListener('click', async () => applyCrackFiles(activeCrackFile))

function detectGameFormat(game) {
  const url = game?.url || ''
  if (url.endsWith('.rar')) return 'RAR'
  if (url.endsWith('.7z')) return '7z'
  if (url.endsWith('.zip')) return 'ZIP'
  return 'Archive'
}

let activeBypassGame = null
let selectedBypassVersion = ''

function createBypassImage(title) {
  const safe = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="480"><rect width="320" height="480" fill="#0b1220"/><text x="160" y="240" fill="#a5b4fc" font-family="system-ui,sans-serif" font-size="18" text-anchor="middle" dy=".3em">${safe}</text></svg>`)}`
}

function isPlaceholderCover(image, title) {
  if (!image) return true
  const normalized = String(image || '').trim()
  return normalized === createBypassImage(title)
}

function getBypassVersionSortValue(rawVersion) {
  const value = typeof rawVersion === 'object'
    ? String(rawVersion.id || rawVersion.version || '')
    : String(rawVersion)
  const match = value.match(/(\d{6,})/)
  return match ? Number(match[1]) : -Infinity
}

function normalizeBypassVersionId(version) {
  const raw = typeof version === 'object'
    ? String(version.id || version.version || '')
    : String(version || '')
  let normalized = raw.trim()
  if (/^v\s*/i.test(normalized)) normalized = normalized.replace(/^v\s*/i, '')
  return normalized
}

function normalizeBypassVersionUrl(version, fallbackUrl = '') {
  if (typeof version === 'object') return String(version.url || '').trim() || String(fallbackUrl || '').trim()
  return String(fallbackUrl || '').trim()
}

function isCrackGameEntry(entry) {
  if (!entry || typeof entry !== 'object') return false
  const type = String(entry.type || '').trim().toLowerCase()
  const genre = String(entry.genre || '').trim().toLowerCase()
  const title = String(entry.title || '').trim().toLowerCase()

  return type === 'crack'
    || genre.includes('crack')
    || title.includes('crack')
}

function toBypassGame(entry, order) {
  if (isCrackGameEntry(entry)) return null
  const title = String(entry?.title || '').trim()
  if (!title) return null
  const rawVersions = Array.isArray(entry?.versions) ? entry.versions : []
  const sortedVersions = [...rawVersions].sort((a, b) => getBypassVersionSortValue(b) - getBypassVersionSortValue(a))
  const versions = sortedVersions.length
    ? [...new Set(sortedVersions
      .map((v) => normalizeBypassVersionId(v))
      .filter(Boolean))]
    : entry.url && entry.buildid ? [normalizeBypassVersionId(entry.buildid)] : []
  const versionUrls = {}
  const allVersions = sortedVersions.length ? sortedVersions : versions
  const mainUrl = String(entry?.url || '').trim()
  allVersions.forEach((v) => {
    const versionKey = normalizeBypassVersionId(v)
    if (!versionKey) return
    if (typeof v === 'object' && (v.id || v.version) && v.url) {
      versionUrls[versionKey] = String(v.url).trim()
    } else if (typeof v === 'string' && mainUrl) {
      versionUrls[versionKey] = mainUrl
    }
  })
  const url = versionUrls[versions[0]] || String(entry?.url || '').trim()
  const buildid = String(entry?.buildid || '').trim() || (versions[0] || '')
  const available = Boolean(url)
  const description = String(entry?.description || `${title} build details, patches, and launcher resources.`).trim()
  const noteMatch = description.match(/Note:\s*([^.]+\.)/i)
  const genre = String(entry?.genre || '').trim()
  const checksum = String(entry?.sha256 || entry?.checksum || entry?.hash || '').trim()
  return {
    title,
    order,
    description,
    note: noteMatch ? noteMatch[1].trim() : '',
    image: String(entry?.image || '').trim() || createBypassImage(title),
    developer: String(entry?.developer || 'Community Source').trim(),
    publisher: String(entry?.publisher || 'HyperDevil').trim(),
    genre,
    status: String(entry?.status || (available ? 'Available' : 'Available')).trim(),
    versions,
    versionUrls,
    url,
    buildid,
    available,
    type: String(entry?.type || '').trim() || undefined,
    checksum: checksum || undefined,
    downloadOnly: Boolean(entry.downloadOnly),
    format: detectGameFormat({ url: url || Object.values(versionUrls)[0] || '' })
  }
}

function renderBypassVersions(game) {
  if (!bypassVersionList) return
  const versions = Array.isArray(game?.versions) ? game.versions : []
  if (!versions.length) {
    bypassVersionList.innerHTML = `
      <div class="bypass-version-row">
        <span>${game?.available ? 'No version metadata available yet' : 'Bypass not uploaded yet'}</span>
        <span class="badge ${game?.available ? 'neutral' : 'off'}">${game?.available ? 'Pending' : 'Unavailable'}</span>
      </div>
    `
    selectedBypassVersion = ''
    return
  }
  selectedBypassVersion = versions[0]
  bypassVersionList.innerHTML = versions.map((version, index) => {
    const hasUrl = game.versionUrls && game.versionUrls[version]
    return `
    <div class="bypass-version-row" style="animation-delay: ${index * 40}ms">
      <span>${version}${!hasUrl ? ' (file unavailable)' : ''}</span>
      <span class="badge ${index === 0 ? 'on' : 'neutral'}">${index === 0 ? 'Latest' : 'Version'}</span>
    </div>`
  }).join('')
  bypassVersionList.querySelectorAll('.bypass-version-row').forEach((row, index) => {
    row.classList.toggle('selected', index === 0)
    row.addEventListener('click', () => {
      const v = versions[index]
      const hasUrl = !game.versionUrls || game.versionUrls[v]
      if (!hasUrl) {
        showToast('No download available for this version', 'warning')
        return
      }
      bypassVersionList.querySelectorAll('.bypass-version-row').forEach((item) => item.classList.remove('selected'))
      row.classList.add('selected')
      selectedBypassVersion = v
    })
  })
}

function resetBypassDetailActions() {
  selectedBypassVersion = ''
  bypassVersionOverlay?.classList.add('modal-hidden')
  if (bypassDownloadLabel) bypassDownloadLabel.textContent = 'Download Bypass'
}

let crackTitleSet = new Set()
let bypassGames = []

function updateBypassNavBadge(count = 0) {
  if (!navBypassBadge) return
  if (count > 0) {
    navBypassBadge.textContent = count > 99 ? '99+' : String(count)
    navBypassBadge.classList.add('visible')
  } else {
    navBypassBadge.classList.remove('visible')
  }
}

function findMatchingGame(entryName, games) {
  const normalize = (s) => s.replace(/[^a-z0-9]/gi, '').toLowerCase()
  const normalizedEntry = normalize(entryName)
  let bestMatch = null
  let bestLen = 0
  for (const game of games) {
    const normalizedTitleUnderscore = game.title.replace(/[^a-z0-9]/gi, '_')
    if (normalizedTitleUnderscore === entryName) return game
    const normalizedTitle = normalize(game.title)
    if (normalizedEntry.includes(normalizedTitle) && normalizedTitle.length > bestLen) {
      bestMatch = game
      bestLen = normalizedTitle.length
    }
  }
  return bestMatch
}

const downloadFileListEl = document.getElementById('download-file-list')
const downloadFileListItems = document.getElementById('download-file-list-items')

function showDownloadedFiles(dirName, dirPath, files) {
  if (!downloadFileListItems || !downloadFileListEl) return
  downloadFileListEl.classList.remove('hidden')
  downloadFileListItems.innerHTML = files.map((f, i) => {
    const isNfo = f.name.toLowerCase().endsWith('.nfo')
    const ext = (f.name.match(/\.([^.]+)$/) || [])[1]?.toLowerCase()
    const iconMap = { nfo: '[i]', txt: '[T]', exe: '[x]', dll: '[D]', bat: '[~]', cmd: '[~]', ps1: '[~]' }
    const icon = iconMap[ext] || (f.isDirectory ? '[+]' : '[ ]')
    const sizeStr = f.size > 0 ? formatBytes(f.size) : ''
    return `<div class="file-item${isNfo ? ' nfo' : ''}" data-file-path="${dirPath}\\${f.name}">
      <span class="file-icon">${icon}</span>
      <span>${f.name}</span>
      ${sizeStr ? `<span class="file-size">${sizeStr}</span>` : ''}
    </div>`
  }).join('')
  downloadFileListItems.querySelectorAll('.file-item').forEach(el => {
    el.addEventListener('click', () => {
      window.api.openPath(el.dataset.filePath)
    })
  })
}

function hideDownloadedFiles() {
  if (downloadFileListEl) downloadFileListEl.classList.add('hidden')
  if (downloadFileListItems) downloadFileListItems.innerHTML = ''
}

async function renderDownloadedBypassGames() {
  const grid = document.getElementById('db-downloaded-grid')
  const count = document.getElementById('db-dl-count')
  if (!grid) return
  try {
    const entries = await window.api.listBypassDownloads()
    if (!entries.length) {
      grid.innerHTML = '<span class="comp-subtitle" style="padding:20px;display:block;text-align:center">No bypass files downloaded yet</span>'
      if (count) count.textContent = '0 games'
      return
    }
    const seen = new Set()
    const deduped = entries.map((entry) => {
      const game = findMatchingGame(entry.name, bypassGames)
      const displayName = game ? game.title : entry.name
      if (game && seen.has(game.title)) return null
      if (game) seen.add(game.title)
      return { entry, game, displayName }
    }).filter(Boolean)
    if (count) count.textContent = `${deduped.length} file${deduped.length !== 1 ? 's' : ''}`
    grid.innerHTML = deduped.map(({ entry, game, displayName }) => {
      const imgSrc = game ? game.image : createBypassImage(displayName)
      return `
        <div class="bypass-game-card" data-bypass-entry="${entry.name}" data-bypass-is-dir="${entry.isDirectory}" title="${displayName}">
          <img src="${imgSrc}" alt="${displayName}" loading="lazy" referrerpolicy="no-referrer">
          <div class="title">${displayName}</div>
        </div>
      `
    }).join('')
    for (const card of grid.querySelectorAll('[data-bypass-entry]')) {
      const img = card.querySelector('img')
      if (img) {
        if (img.complete) img.classList.add('is-loaded')
        img.addEventListener('load', () => img.classList.add('is-loaded'))
        img.addEventListener('error', () => {
          img.src = createBypassImage(card.getAttribute('title') || 'Game')
          img.classList.add('is-loaded')
        })
      }
      card.addEventListener('click', async () => {
        const entryName = card.dataset.bypassEntry
        const isDir = card.dataset.bypassIsDir === 'true'
        const bypassDir = await window.api.getBypassDir()
        if (isDir) {
          const targetDir = `${bypassDir}\\${entryName}`
          const res = await window.api.listExtractedFiles(targetDir)
          if (res?.success && res.files?.length) {
            const fileList = res.files.filter(f => !f.isDirectory)
            if (fileList.length <= 20) {
              currentDownloadPath = targetDir
              if (downloadTitle) downloadTitle.textContent = entryName
              if (downloadSubtitle) downloadSubtitle.textContent = targetDir
              if (openFolderBtn) openFolderBtn.classList.remove('hidden')
              showDownloadedFiles(entryName, targetDir, fileList)
              downloadOverlay?.classList.remove('modal-hidden')
              return
            }
          }
          window.api.openPath(targetDir)
        } else {
          const targetFile = `${bypassDir}\\${entryName}`
          window.api.openPath(targetFile)
        }
      })
    }
  } catch (_) {
    grid.innerHTML = '<span class="comp-subtitle" style="padding:20px;display:block;text-align:center">Could not load downloads</span>'
  }
}

function staggerCards(container, delay = 30) {
  const cards = container.querySelectorAll('.bypass-game-card, .bypass-recent-item')
  cards.forEach((card, i) => {
    card.style.opacity = '0'
    card.style.transform = 'translateY(24px) scale(0.95)'
    card.style.transition = `opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * delay}ms, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * delay}ms, box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1)`
    requestAnimationFrame(() => {
      card.style.opacity = '1'
      card.style.transform = 'translateY(0) scale(1)'
    })
  })
}

function animateTabEntrance(tab) {
  if (!tab) return
  const cards = tab.querySelectorAll('.glass-card, .action-card, .home-action-card, .home-community-card, .home-metric-card, .status-card, .component-card, .step-card, .bypass-game-card')
  cards.forEach((card, i) => {
    card.style.opacity = '0'
    card.style.transform = 'translateY(16px)'
    card.style.transition = `opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * 35}ms, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * 35}ms`
    requestAnimationFrame(() => {
      card.style.opacity = '1'
      card.style.transform = 'translateY(0)'
    })
  })
}

let bypassSortState = 'latest'
let crackSortState = 'name-asc'
let bypassDownloadedTitles = new Set()

async function refreshBypassDownloadedSet() {
  try {
    const entries = await window.api.listBypassDownloads()
    bypassDownloadedTitles = new Set()
    for (const entry of entries) {
      const game = findMatchingGame(entry.name, bypassGames)
      if (game) bypassDownloadedTitles.add(game.title)
    }
  } catch { /* ignore */ }
}

function sortBypassGames(games, sort) {
  const sorted = [...games]
  switch (sort) {
    case 'name-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'name-desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title))
      break
    case 'latest':
      sorted.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
      break
    case 'status':
      sorted.sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1
        return a.title.localeCompare(b.title)
      })
      break
  }
  return sorted
}

function sortCrackGames(games, sort) {
  const sorted = [...games]
  switch (sort) {
    case 'name-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'name-desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title))
      break
    case 'latest':
      sorted.sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
      break
    case 'status':
      sorted.sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1
        return a.title.localeCompare(b.title)
      })
      break
  }
  return sorted
}

function renderBypassGames(query = '') {
  if (!bypassGrid) return
  const needle = query.trim().toLowerCase()

  let filtered = bypassGames.filter((game) => !isCrackGameEntry(game))
  if (needle) {
    filtered = filtered.filter((game) => game.title.toLowerCase().includes(needle))
  }
  filtered = sortBypassGames(filtered, bypassSortState)

  bypassRenderedGames = filtered
    bypassGrid.innerHTML = filtered.map((game, index) => {
    return `
      <div class="bypass-game-card" data-bypass-index="${index}" title="${game.title}" style="animation-delay:${Math.min(index * 30, 500)}ms">
        <img src="${game.image}" alt="${game.title}" loading="lazy" referrerpolicy="no-referrer">
        <div class="hover-actions">
          <div class="hover-actions-inner">
            <button class="hover-view-btn">View Details</button>
            <span class="hover-status">${game.available ? 'Ready to download' : 'Available'}</span>
          </div>
        </div>
        ${game.note ? `<div class="note-pill">${game.note}</div>` : ''}
      </div>
    `
  }).join('')

  if (bypassCount) bypassCount.textContent = `${filtered.length} games`

  bypassGrid.querySelectorAll('img').forEach((img) => {
    if (img.complete) img.classList.add('is-loaded')
    img.addEventListener('load', () => img.classList.add('is-loaded'))
    img.addEventListener('error', () => {
      const card = img.closest('.bypass-game-card')
      img.src = createBypassImage(card?.getAttribute('title') || 'Game')
      img.classList.add('is-loaded')
    })
  })
}

function formatBypassDescription(description) {
  if (!description || typeof description !== 'string') return ''

  const methodsMatch = description.match(/Game Opening Methods:\s*(.+)/i)
  const requiredMatch = description.match(/Required Programs:\s*\n?•\s*(.+?)\n?•\s*(.+?)\n?•\s*(.+?)(?:\n|$)/i)
  const troubleMatch = description.match(/Troubleshooting:\s*(.+)/i)

  if (methodsMatch && requiredMatch) {
    const methods = methodsMatch[1].split('|').map((item) => item.trim())
    const required = [requiredMatch[1].trim(), requiredMatch[2].trim(), requiredMatch[3].trim()]
    const trouble = troubleMatch ? troubleMatch[1].trim() : ''

    return `
      <div class="bypass-info-grid">
        <div class="bypass-info-card">
          <div class="bypass-info-card-header">
            <span class="bypass-info-card-icon">▶</span>
            <span class="bypass-info-card-title">Open With</span>
          </div>
          <div class="crack-info-badges">
            ${methods.map((method) => `<span class="crack-method-badge success">${method}</span>`).join('')}
          </div>
        </div>
        <div class="bypass-info-card">
          <div class="bypass-info-card-header">
            <span class="bypass-info-card-icon">🧩</span>
            <span class="bypass-info-card-title">Required</span>
          </div>
          <div class="crack-info-badges">
            ${required.map((item) => `<span class="crack-method-badge">${item}</span>`).join('')}
          </div>
        </div>
        ${trouble ? `
          <details class="bypass-troubleshooting-panel">
            <summary>
              <span class="bypass-info-card-icon">!</span>
              <span class="bypass-info-card-title">Troubleshooting</span>
            </summary>
            <div class="bypass-troubleshooting-body">
              <p class="bypass-description-text">${trouble}</p>
            </div>
          </details>
        ` : ''}
      </div>
    `
  }

  return `<p class="bypass-description-text">${description.replace(/\n/g, '<br>')}</p>`
}

function refreshBypassCardImages() {
  const cards = bypassGrid?.querySelectorAll('.bypass-game-card')
  if (!cards || !cards.length) return
  cards.forEach(card => {
    const title = card.getAttribute('title')
    if (!title) return
    const game = bypassGames.find(g => g.title === title)
    if (!game || !game.image) return
    const img = card.querySelector('img')
    if (img && img.src !== game.image) {
      img.classList.remove('is-loaded')
      img.onload = () => img.classList.add('is-loaded')
      img.onerror = () => {
        img.src = createBypassImage(title)
        img.classList.add('is-loaded')
      }
      img.src = game.image
    }
  })
}

function openBypassGame(game) {
  if (!game) return
  resetBypassDetailActions()
  activeBypassGame = game
  if (bypassPageTitle) bypassPageTitle.textContent = game.title
  if (bypassPageDescription) bypassPageDescription.innerHTML = formatBypassDescription(game.description)
  if (bypassPageImage) {
    bypassPageImage.onerror = () => {
      const fallback = createBypassImage(game.title)
      if (bypassPageImage.src !== fallback) {
        bypassPageImage.src = fallback
      }
    }
    bypassPageImage.src = game.image
    bypassPageImage.alt = `${game.title} cover`
  }
  if (bypassPageDev) bypassPageDev.textContent = game.developer || 'Community Source'
  if (bypassPagePub) bypassPagePub.textContent = game.publisher || 'HyperDevil'
  if (bypassPageGenre) bypassPageGenre.textContent = game.genre || ''
  if (bypassPagePill) {
    bypassPagePill.textContent = game.available ? 'Ready to download' : 'Available'
    bypassPagePill.className = `premium-badge ${game.available ? 'on' : 'off'}`
  }
  if (bypassPageBuildid) bypassPageBuildid.textContent = game.buildid || ''
  if (bypassPageBuildBadge) bypassPageBuildBadge.textContent = game.buildid ? game.buildid.replace(/^BuildID?\s*/i, 'Build ') : ''
  const formatEl = document.getElementById('bypass-page-format')
  if (formatEl) formatEl.textContent = game.format || 'Archive'
  if (bypassDownloadLabel) {
    bypassDownloadLabel.textContent = game.type === 'crack' ? 'Apply Crack Files' : (game.url?.includes('gofile.io') ? 'Download' : 'Download Bypass')
  }
  const isDownloaded = bypassDownloadedTitles.has(game.title)
  const openFolderBtn = document.getElementById('btn-bypass-open-folder')
  if (openFolderBtn) openFolderBtn.style.display = isDownloaded ? 'inline-flex' : 'none'
  renderBypassVersions(game)
  setActiveTab('bypass-detail', game.title)
}

function openBypassFileDetail(game) {
  if (!game) return
  activeBypassGame = game
  
  // Populate bypass file detail page
  if (bypassFilePageTitle) bypassFilePageTitle.textContent = String(game.title || 'Untitled')
  
  // Display build badge if buildid exists
  if (bypassFilePageBuildBadge) {
    if (game.buildid && game.buildid !== 'N/A' && game.buildid !== 'Unknown') {
      bypassFilePageBuildBadge.textContent = `BUILD ${String(game.buildid).toUpperCase()}`
      bypassFilePageBuildBadge.style.display = 'inline-flex'
    } else {
      bypassFilePageBuildBadge.style.display = 'none'
    }
  }
  
  if (bypassFilePageDescription) {
    const desc = String(game.description || `${game.title || 'Game'} build details and resources.`).trim()
    bypassFilePageDescription.innerHTML = desc ? desc.replace(/\n/g, '<br>') : ''
  }
  
  if (bypassFilePageImage) {
    bypassFilePageImage.onerror = () => {
      const title = bypassFilePageTitle?.textContent || 'Game'
      bypassFilePageImage.src = createBypassImage(title)
    }
    bypassFilePageImage.src = game.image || createBypassImage(game.title || 'Untitled')
    bypassFilePageImage.alt = `${game.title || 'Game'} cover`
  }
  
  const isAvailable = Boolean(game.available)
  if (bypassFilePagePill) {
    bypassFilePagePill.textContent = isAvailable ? 'Ready' : 'Available'
    bypassFilePagePill.classList.toggle('unavailable', !isAvailable)
    bypassFilePagePill.classList.toggle('available', isAvailable)
  }
  
  if (bypassFilePageFormat) bypassFilePageFormat.textContent = game.format || 'Archive'
  if (bypassFilePagePublisher) bypassFilePagePublisher.textContent = game.publisher || 'HyperDevil'
  if (bypassFilePageBuildid) bypassFilePageBuildid.textContent = game.buildid || 'Unknown'
  
  const label = `Bypass • ${game.title || 'Untitled'}`
  setActiveTab('bypass-file-detail', label)

  const stage = document.querySelector('#tab-bypass-file-detail .bypass-file-detail-stage')
  if (stage) {
    stage.classList.remove('bypass-file-detail-open-anim')
    void stage.offsetHeight
    stage.classList.add('bypass-file-detail-open-anim')
    stage.addEventListener('animationend', () => stage.classList.remove('bypass-file-detail-open-anim'), { once: true })
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function populateBypassModal(game) {
  if (!game) return
  if (bypassModalTitle) bypassModalTitle.textContent = game.title
  if (bypassModalDescription) bypassModalDescription.innerHTML = formatBypassDescription(game.description)
  if (bypassModalImage) {
    bypassModalImage.onerror = () => bypassModalImage.src = createBypassImage(game.title)
    bypassModalImage.src = game.image || createBypassImage(game.title)
    bypassModalImage.alt = `${game.title} cover`
  }
  const isDownloaded = bypassDownloadedTitles.has(game.title)
  if (bypassModalOpenFolderBtn) bypassModalOpenFolderBtn.style.display = isDownloaded ? 'inline-flex' : 'none'
  if (bypassModalBuildBadge) bypassModalBuildBadge.textContent = game.buildid ? String(game.buildid).replace(/^BuildID?\s*/i, 'Build ') : 'Build Unknown'
  // update download button label
  if (bypassModalDownloadBtn) bypassModalDownloadBtn.querySelector('.btn-label').textContent = game.type === 'crack' ? 'Apply Crack Files' : (game.url?.includes('gofile.io') ? 'Download' : 'Download Bypass')
}

function showBypassModal(game) {
  populateBypassModal(game)
  if (!bypassModalOverlay) return
  // ensure overlay is a direct child of body to avoid ancestor transform/padding issues
  try {
    if (bypassModalOverlay.parentElement !== document.body) document.body.appendChild(bypassModalOverlay)
  } catch (_) {}
  // reset any closing state
  bypassModalOverlay.classList.remove('bypass-modal-closing')
  bypassModalOverlay.classList.remove('modal-hidden')
  // trigger open animation class
  // force reflow to restart animation
  // eslint-disable-next-line no-unused-expressions
  bypassModalOverlay.offsetHeight
  bypassModalOverlay.classList.add('bypass-modal-open')
  document.body.classList.add('modal-open')
  // focus primary action after animation start
  setTimeout(() => bypassModalDownloadBtn?.focus(), 220)
}

function hideBypassModal() {
  if (!bypassModalOverlay) return
  // if currently opening, play closing animation
  if (bypassModalOverlay.classList.contains('bypass-modal-open')) {
    bypassModalOverlay.classList.remove('bypass-modal-open')
    bypassModalOverlay.classList.add('bypass-modal-closing')
    const onAnim = (e) => {
      if (e.target === bypassModalOverlay.querySelector('.bypass-modal-card')) {
        bypassModalOverlay.classList.add('modal-hidden')
        bypassModalOverlay.classList.remove('bypass-modal-closing')
        bypassModalOverlay.removeEventListener('animationend', onAnim)
      }
    }
    bypassModalOverlay.addEventListener('animationend', onAnim)
  } else {
    bypassModalOverlay.classList.add('modal-hidden')
  }
  document.body.classList.remove('modal-open')
}

// modal event wiring
bypassModalCloseBtn?.addEventListener('click', () => hideBypassModal())
bypassModalOverlay?.addEventListener('click', (e) => {
  if (e.target === bypassModalOverlay) hideBypassModal()
})
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideBypassModal() })

// modal download/open-folder wiring
bypassModalDownloadBtn?.addEventListener('click', () => {
  if (!activeBypassGame) return
  // derive filename from game title but don't show it in UI
  const safeName = (activeBypassGame.title || 'bypass').replace(/[^a-z0-9\-_. ]/ig, '_') + '.zip'
  startBypassDownload(activeBypassGame.url, safeName, activeBypassGame.title)
})
bypassModalOpenFolderBtn?.addEventListener('click', async () => {
  if (!activeBypassGame) return
  const entries = await window.api.listBypassDownloads()
  const match = entries.find(e => findMatchingGame(e.name, [activeBypassGame]))
  if (match) {
    const bypassDir = await window.api.getBypassDir()
    window.api.openPath(match.isDirectory ? `${bypassDir}\\${match.name}` : bypassDir)
  }
})

async function syncBypassManifest() {
  try {
    const result = await window.api.syncBypassManifest()
    if (!result?.success || !Array.isArray(result?.manifest?.games) || !result.manifest.games.length) {
      return
    }
    const remoteEntries = result.manifest.games
      .filter((entry) => entry && typeof entry === 'object')
    if (!remoteEntries.length) return

    const games = remoteEntries
      .map((entry, i) => toBypassGame(entry, i))
      .filter(Boolean)
      .filter(game => !crackTitleSet.has(game.title))

    if (!games.length) return

    const existingImages = new Map(bypassGames.map(g => [g.title, g.image]))
    bypassGames = games
    bypassGames.forEach(g => {
      const oldImg = existingImages.get(g.title)
      if (oldImg && !isPlaceholderCover(oldImg, g.title)) g.image = oldImg
    })
    renderBypassGames(bypassSearchInput?.value || '')
    await refreshBypassDownloadedSet()

    const newCount = Array.isArray(result.newTitles) ? result.newTitles.length : 0
    updateBypassNavBadge(newCount)
    if (newCount > 0) {
      showToast(`Bypass catalog updated: ${newCount} new items`, 'success')
    }
  } catch (_) {
    // Keep local list if remote manifest is unavailable.
  }
}

function toCrackManifestGame(entry, order) {
  if (!entry || typeof entry !== 'object') return null
  const title = String(entry.title || '').trim()
  if (!title) return null
  return {
    title,
    order,
    type: 'crack',
    url: String(entry.url || '').trim(),
    image: String(entry.image || '').trim() || createBypassImage(title),
    description: String(entry.description || `${title} crack file download`).trim()
  }
}

async function syncCrackManifest() {
  try {
    const result = await window.api.syncCrackManifest()
    if (!result?.success || !Array.isArray(result?.manifest?.games) || !result.manifest.games.length) {
      return
    }
    const mapped = result.manifest.games
      .map((entry, i) => toCrackManifestGame(entry, i))
      .filter(Boolean)
    if (!mapped.length) return

    const remoteByTitle = new Map(mapped.map((game) => [game.title, game]))
    for (const local of crackFilesList) {
      const remote = remoteByTitle.get(local.title)
      if (remote && isPlaceholderCover(remote.image, remote.title) && !isPlaceholderCover(local.image, local.title)) {
        remote.image = local.image
      }
    }
    const mergedCracks = [...new Map([...crackFilesList.map((g) => [g.title, g]), ...remoteByTitle]).values()]
    crackFilesList = mergedCracks
    crackTitleSet = new Set(mergedCracks.map(g => g.title))
    renderCrackFiles()

    const newCount = Array.isArray(result.newTitles) ? result.newTitles.length : 0
    if (newCount > 0) {
      showToast(`Crack catalog updated: ${newCount} new items`, 'success')
    }
  } catch (_) {
    // Keep built-in crack list if remote manifest is unavailable.
  }
}

async function hydrateBypassCovers() {
  try {
    const placeholderTitles = [
      ...bypassGames.filter((game) => isPlaceholderCover(game.image, game.title)).map((game) => game.title),
      ...crackFilesList.filter((game) => isPlaceholderCover(game.image, game.title)).map((game) => game.title)
    ]
    const allTitles = [...new Set(placeholderTitles)]
    if (!allTitles.length) return
    const result = await window.api.getBypassCovers(allTitles)
    if (!result?.success || !result.covers) return

    const covers = result.covers
    let bypassChanged = false
    let crackChanged = false

    bypassGames.forEach((game) => {
      const nextCover = covers[game.title]
      if (nextCover && isPlaceholderCover(game.image, game.title)) {
        game.image = nextCover
        bypassChanged = true
      }
    })

    crackFilesList.forEach((game) => {
      const nextCover = covers[game.title]
      if (nextCover && isPlaceholderCover(game.image, game.title)) {
        game.image = nextCover
        crackChanged = true
      }
    })

    if (crackChanged && activeCrackFile) {
      const updatedCrack = crackFilesList.find((game) => game.title === activeCrackFile.title)
      if (updatedCrack) {
        activeCrackFile = updatedCrack
        if (document.getElementById('tab-crack-detail')?.classList.contains('active')) {
          if (crackPageImage) crackPageImage.src = updatedCrack.image
        } else if (crackGameCover) {
          crackGameCover.src = updatedCrack.image
        }
      }
    }

    if (bypassChanged) {
      refreshBypassCardImages()
      await refreshBypassDownloadedSet()
      renderDownloadedBypassGames()
      if (activeBypassGame) {
        const updatedActive = bypassGames.find((game) => game.title === activeBypassGame.title)
        if (updatedActive) {
          activeBypassGame = updatedActive
          if (bypassPageImage) {
            bypassPageImage.classList.remove('is-loaded')
            bypassPageImage.onload = () => bypassPageImage.classList.add('is-loaded')
            bypassPageImage.onerror = () => bypassPageImage.classList.add('is-loaded')
            bypassPageImage.src = updatedActive.image
            bypassPageImage.alt = `${updatedActive.title} cover`
            if (bypassPageImage.complete) bypassPageImage.classList.add('is-loaded')
          }
        }
      }
    }

    if (crackChanged) {
      renderCrackFiles()
    }
  } catch (_) {
    // Keep placeholders when API request fails.
  }
}

bypassSearchInput?.addEventListener('input', () => {
  renderBypassGames(bypassSearchInput.value)
})



document.getElementById('bypass-sort')?.addEventListener('change', (e) => {
  bypassSortState = e.target.value
  renderBypassGames(bypassSearchInput?.value || '')
})

document.getElementById('crack-sort')?.addEventListener('change', (e) => {
  crackSortState = e.target.value
  renderCrackFiles()
})

document.getElementById('btn-bypass-share')?.addEventListener('click', () => {
  if (!activeBypassGame) return
  const text = `Check out ${activeBypassGame.title} bypass on HyperDevil`
  navigator.clipboard?.writeText(text).catch(() => {})
  showToast('Copied to clipboard')
})

bypassBackBtn?.addEventListener('click', () => {
  setActiveTab('bypass')
  renderBypassGames(bypassSearchInput?.value || '')
  renderDownloadedBypassGames()
})



document.getElementById('btn-bypass-open-folder')?.addEventListener('click', async () => {
  if (!activeBypassGame) return
  try {
    const entries = await window.api.listBypassDownloads()
    const match = entries.find(e => findMatchingGame(e.name, [activeBypassGame]))
    if (match) {
      const bypassDir = await window.api.getBypassDir()
      window.api.openPath(match.isDirectory ? `${bypassDir}\\${match.name}` : bypassDir)
    } else {
      const bypassDir = await window.api.getBypassDir()
      window.api.openPath(bypassDir)
    }
  } catch { /* ignore */ }
})

bypassDownloadBtn?.addEventListener('click', () => {
  if (!activeBypassGame) return
  // If this is a crack entry shown in the bypass detail page, run the crack apply flow
  if (activeBypassGame.type === 'crack') {
    applyCrackFiles(activeBypassGame)
    return
  }
  if (downloadState.busy) {
    showToast('Wait for current download to finish')
    return
  }
  if (activeBypassGame.url?.includes('gofile.io')) {
    window.api.openExternal(activeBypassGame.url)
    return
  }
  if (!activeBypassGame.available) {
    showToast('Bypass file is not available for this game yet.', 'warning')
    return
  }
  if (Array.isArray(activeBypassGame.versions) && activeBypassGame.versions.length > 1) {
    renderBypassVersions(activeBypassGame)
    bypassVersionOverlay?.classList.remove('modal-hidden')
    return
  }
  if (activeBypassGame.url) {
    const ext = activeBypassGame.url.match(/\.([a-z0-9]+)(?:\?|$)/i)?.[1] || 'zip'
    startBypassDownload(activeBypassGame.url, `${activeBypassGame.title.replace(/[^a-z0-9]/gi, '_')}.${ext}`, activeBypassGame.title)
    return
  }
  showToast('No bypass version available for this game.', 'warning')
})

bypassVersionCloseBtn?.addEventListener('click', () => {
  bypassVersionOverlay?.classList.add('modal-hidden')
})

bypassVersionOverlay?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) bypassVersionOverlay.classList.add('modal-hidden')
})

bypassVersionNextBtn?.addEventListener('click', () => {
  if (!activeBypassGame) return
  if (downloadState.busy) {
    showToast('Wait for current download to finish')
    return
  }
  if (!selectedBypassVersion) {
    showToast('No version available yet', 'warning')
    return
  }
  const dlUrl = (activeBypassGame.versionUrls && activeBypassGame.versionUrls[selectedBypassVersion]) || activeBypassGame.url
  if (dlUrl) {
    if (dlUrl.includes('gofile.io')) {
      bypassVersionOverlay?.classList.add('modal-hidden')
      window.api.openExternal(dlUrl)
      return
    }
    const ext = dlUrl.match(/\.([a-z0-9]+)(?:\?|$)/i)?.[1] || 'zip'
    const fileName = `${activeBypassGame.title.replace(/[^a-z0-9]/gi, '_')}-${selectedBypassVersion.replace(/[^a-z0-9]/gi, '_')}.${ext}`
    bypassVersionOverlay?.classList.add('modal-hidden')
    startBypassDownload(dlUrl, fileName, activeBypassGame.title)
  } else {
    showToast('No bypass URL available for this version.', 'warning')
  }
})

document.getElementById('modal-overlay')?.addEventListener('transitionend', (e) => {
  if (e.propertyName !== 'opacity') return
})

document.getElementById('download-progress-overlay')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget && !downloadState.busy) hideDownloadProgress()
})

async function cacheBypassImages() {
  const games = [...bypassGames, ...crackFilesList]
  if (!games.length) return
  let updated = false

  for (let i = 0; i < games.length; i += 5) {
    const batch = games.slice(i, i + 5)
    const results = await Promise.allSettled(batch.map(async (game) => {
      if (!game.image || game.image.startsWith('data:') || game.image.startsWith('file:')) return false
      const cachedPath = await window.api.cacheImage(game.image, game.title)
      if (cachedPath && cachedPath !== game.image) {
        game.image = cachedPath
        return true
      }
      return false
    }))
    if (results.some(r => r.status === 'fulfilled' && r.value)) updated = true
  }

  if (updated) {
    renderBypassGames(bypassSearchInput?.value || '')
    renderCrackFiles()
  }
}

async function initGameData() {
  try {
    const [bypassResult, crackResult] = await Promise.allSettled([
      window.api.readManifest('bypass'),
      window.api.readManifest('crack')
    ])

    if (bypassResult.status === 'fulfilled' && bypassResult.value?.success) {
      const games = (bypassResult.value.data?.games || [])
        .map((entry, i) => toBypassGame(entry, i))
        .filter(Boolean)
      if (games.length) bypassGames = games
    }

    if (crackResult.status === 'fulfilled' && crackResult.value?.success) {
      const games = (crackResult.value.data?.games || [])
        .map((entry, i) => toCrackManifestGame(entry, i))
        .filter(Boolean)
      if (games.length) {
        crackFilesList = games
        crackTitleSet = new Set(games.map(g => g.title))
      }
    }
  } catch (_) { /* keep empty arrays */ }

  await refreshBypassDownloadedSet()
  renderBypassGames()
  renderDownloadedBypassGames()
  renderCrackFiles()
  updateBypassNavBadge(0)
  cacheBypassImages()
}

// Called below after DOM readiness with remote sync chained after it.

// ===== Download Progress Popup =====
const downloadOverlay = document.getElementById('download-progress-overlay')
const downloadTitle = document.getElementById('download-progress-title')
const downloadSubtitle = document.getElementById('download-progress-subtitle')
const downloadFill = document.getElementById('download-progress-fill')
const downloadPercent = document.getElementById('download-progress-percent')
const downloadWarning = document.getElementById('download-progress-warning')
const openFolderBtn = document.getElementById('btn-open-download-folder')
const cancelDownloadBtn = document.getElementById('btn-cancel-download')

let currentDownloadPath = null

function showDownloadProgress(fileName, showWarning) {
  if (downloadTitle) downloadTitle.textContent = `Downloading ${fileName || 'file'}`
  if (downloadSubtitle) downloadSubtitle.textContent = 'Please wait...'
  if (downloadFill) downloadFill.style.width = '0%'
  if (downloadPercent) downloadPercent.textContent = '0%'
  if (downloadWarning) downloadWarning.classList.toggle('hidden', !showWarning)
  if (openFolderBtn) openFolderBtn.classList.add('hidden')
  if (cancelDownloadBtn) {
    cancelDownloadBtn.classList.remove('hidden')
    cancelDownloadBtn.disabled = false
  }
  currentDownloadPath = null
  downloadOverlay?.classList.remove('modal-hidden')
}

function updateDownloadProgress(fileName, percent) {
  if (downloadTitle && fileName) {
    if (fileName.startsWith('Extracting ')) {
      downloadTitle.textContent = fileName
    } else {
      downloadTitle.textContent = `Downloading ${fileName}`
    }
  }
  if (downloadFill) downloadFill.style.width = `${percent || 0}%`
  if (downloadPercent) {
    const current = parseInt(downloadPercent.textContent) || 0
    const target = percent || 0
    if (target !== current) {
      const startTime = performance.now()
      const startVal = current
      const duration = 180
      function tick(now) {
        const elapsed = now - startTime
        const progress = Math.min(1, elapsed / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        const val = Math.round(startVal + (target - startVal) * eased)
        downloadPercent.textContent = `${Math.min(val, target)}%`
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
  }
}

function hideDownloadProgress() {
  if (openFolderBtn) openFolderBtn.classList.add('hidden')
  if (cancelDownloadBtn) cancelDownloadBtn.classList.add('hidden')
  currentDownloadPath = null
  hideDownloadedFiles()
  downloadOverlay?.classList.add('modal-hidden')
}

openFolderBtn?.addEventListener('click', () => {
  if (!currentDownloadPath) return
  let pathToOpen = currentDownloadPath
  if (/\\[^\\]+\.[^\\/.]+$/.test(currentDownloadPath)) {
    const lastSep = currentDownloadPath.lastIndexOf('\\')
    if (lastSep >= 0) {
      pathToOpen = currentDownloadPath.slice(0, lastSep)
    }
  }
  window.api.openPath(pathToOpen)
})

cancelDownloadBtn?.addEventListener('click', async (event) => {
  event.stopPropagation()
  if (!downloadState.busy) {
    hideDownloadProgress()
    return
  }
  if (cancelDownloadBtn) cancelDownloadBtn.disabled = true
  if (downloadSubtitle) downloadSubtitle.textContent = 'Canceling...'
  const res = await window.api.cancelDownload()
  if (!res?.success) {
    showToast(res?.error || 'Unable to cancel download', 'error')
  } else {
    hideDownloadProgress()
    showToast('Download canceled', 'warning')
  }
})

async function startBypassDownload(url, fileName, gameTitle) {
  if (downloadState.busy) return
  downloadState.busy = true
  if (bypassDownloadBtn) bypassDownloadBtn.disabled = true
  showDownloadProgress(gameTitle || fileName, true)
  try {
    const res = await window.api.downloadBypass(url, fileName, activeBypassGame?.checksum)
    if (!res?.success) {
      hideDownloadProgress()
      if (res?.canceled) {
        showToast('Download canceled', 'warning')
      } else {
        showToast(`Download failed: ${res?.error || 'Unknown error'}`, 'error')
      }
    } else {
      if (res.targetPath) {
        currentDownloadPath = res.targetPath
        if (downloadTitle) downloadTitle.textContent = 'Download complete!'
        if (downloadSubtitle) downloadSubtitle.textContent = 'Downloaded'
        if (openFolderBtn) openFolderBtn.classList.remove('hidden')
        // expose modal 'Show Files' button when a download finished
        if (bypassModalOpenFolderBtn) bypassModalOpenFolderBtn.style.display = 'inline-flex'
        if (cancelDownloadBtn) {
          cancelDownloadBtn.disabled = true
          cancelDownloadBtn.classList.add('hidden')
        }

        if (res.verified === true) {
          showToast(`${gameTitle || fileName} verified successfully`, 'success')
        }
        showToast(`${gameTitle || fileName} downloaded successfully`, 'success')

      } else {
        if (cancelDownloadBtn) {
          cancelDownloadBtn.disabled = true
          cancelDownloadBtn.classList.add('hidden')
        }
        hideDownloadProgress()
      }
      await refreshBypassDownloadedSet()
      renderDownloadedBypassGames()
      renderBypassGames(bypassSearchInput?.value || '')
    }
  } catch (err) {
    hideDownloadProgress()
    showToast(`Download failed: ${err.message}`, 'error')
  } finally {
    downloadState.busy = false
    if (bypassDownloadBtn) bypassDownloadBtn.disabled = false
  }
}

// ===== Component Downloads =====
document.querySelectorAll('[data-download-key]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    if (downloadState.busy) {
      showToast('Wait for current download to finish')
      return
    }
    const key = btn.dataset.downloadKey
    const item = downloadLinks[key]
    if (!item) return
    downloadState.busy = true
    btn.disabled = true
    showDownloadProgress(item.fileName, false)
    try {
      const res = await window.api.startDownload(item.url, item.fileName)
      if (!res?.success) {
        hideDownloadProgress()
        if (res?.canceled) {
          showToast('Download canceled', 'warning')
        } else {
          showToast(`Download failed: ${res?.error || item.fileName}`)
        }
      } else {
        downloadState.items[key] = { downloaded: true, path: res.downloadPath || '' }
        updateComponentDownloadedUI(key, true)
        const activityId = key === 'vbs-script' ? 'hypervisor-activity' : 'clean-files-activity'
        addActivity(activityId, `${item.fileName} downloaded`)
      }
    } finally {
      downloadState.busy = false
      btn.disabled = false
    }
  })
})

document.querySelectorAll('[data-run-key]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const key = btn.dataset.runKey
    const item = downloadLinks[key]
    if (!item) return
    if (key === 'vbs-script') {
      const result = await window.api.runScript(item.fileName)
      if (!result?.success) {
        showToast(result?.error || `Cannot run ${item.fileName}`, 'error')
        return
      }
      addActivity('hypervisor-activity', `${item.fileName} executed`)
      showToast(`${item.fileName} executed successfully`, 'success')
    } else {
      const result = await window.api.launchFile(item.fileName)
      if (!result?.success) {
        showToast(result?.error || `Cannot launch ${item.fileName}`)
        return
      }
      addActivity('clean-files-activity', `${item.fileName} launched`)
      showToast(`Launched ${item.fileName}`)
    }
  })
})

document.querySelectorAll('[data-remove-key]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const key = btn.dataset.removeKey
    const item = downloadLinks[key]
    if (!item) return
    const res = await window.api.removeFile(item.fileName)
    if (!res?.success) {
      showToast(res?.error || `Unable to uninstall ${item.fileName}`, 'error')
      return
    }
    updateComponentDownloadedUI(key, false)
    addActivity('clean-files-activity', `${item.fileName} uninstalled`)
    showToast(`${item.fileName} removed successfully`, 'success')
  })
})

function updateComponentDownloadedUI(key, downloaded) {
  const card = document.querySelector(`.component-card[data-component-key="${key}"]`)
  const badge = card?.querySelector('[data-download-badge]')
  if (!badge) return
  badge.className = `badge ${downloaded ? 'on' : 'off'}`
  badge.textContent = downloaded ? 'Downloaded' : 'Not Downloaded'
  badge.style.display = downloaded ? 'inline-flex' : 'none'
  const downloadBtn = card?.querySelector('[data-download-key]')
  const launchBtn = card?.querySelector('[data-run-key]')
  if (downloadBtn) downloadBtn.style.display = downloaded ? 'none' : 'inline-flex'
  if (launchBtn) launchBtn.style.display = downloaded ? 'inline-flex' : 'none'
  const removeBtn = card?.querySelector('[data-remove-key]')
  if (removeBtn) removeBtn.style.display = downloaded ? 'inline-flex' : 'none'
}

async function refreshDownloadedState() {
  const checks = await Promise.all(Object.entries(downloadLinks).map(async ([key, item]) => {
    const exists = await window.api.checkFile(item.fileName)
    return { key, exists }
  }))
  checks.forEach(({ key, exists }) => updateComponentDownloadedUI(key, exists))
}

window.api.onDownloadComplete(({ fileName, downloadPath, encrypted, files, manualExtract, missingTool }) => {
  if (encrypted) return
  if (manualExtract) {
    hideDownloadProgress()
    const msg = missingTool
      ? `${fileName || 'File'} saved — install ${missingTool} to extract .rar/.7z files manually`
      : `${fileName || 'File'} saved — extract it manually`
    showToast(msg, 'info')
    return
  }
  if (downloadPath) {
    currentDownloadPath = downloadPath
    if (downloadTitle) downloadTitle.textContent = 'Download complete!'
    if (downloadSubtitle) downloadSubtitle.textContent = downloadPath
    if (openFolderBtn) openFolderBtn.classList.remove('hidden')
    if (files?.length) {
      showDownloadedFiles(fileName, downloadPath, files)
    }
  } else {
    hideDownloadProgress()
  }
  showToast(`${fileName || 'File'} downloaded successfully`)
})
window.api.onDownloadProgress(({ fileName, percent, downloadedBytes, totalBytes, speedBps, etaSec }) => {
  updateDownloadProgress(fileName, percent)
  if (downloadSubtitle) {
    const downloadedText = Number.isFinite(downloadedBytes) ? formatBytes(downloadedBytes) : ''
    const totalText = Number.isFinite(totalBytes) ? formatBytes(totalBytes) : ''
    const speedText = Number.isFinite(speedBps) ? `${formatBytes(speedBps)}/s` : ''
    const etaText = Number.isFinite(etaSec) ? formatEta(etaSec) : ''
    const parts = [`${downloadedText}${totalText ? ` / ${totalText}` : ''}`, speedText, etaText].filter(Boolean)
    downloadSubtitle.textContent = parts.length ? parts.join(' • ') : 'Please wait...'
  }
})

// ===== Toast Notification =====
const toastIcons = {
  success: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.36 5.65l-4 4a.5.5 0 01-.7 0l-2-2a.5.5 0 01.7-.7L7 9.59l3.65-3.64a.5.5 0 01.7.7z"/></svg>',
  error: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.35 3.65a.5.5 0 01.7.7L8.71 8l1.34 1.35a.5.5 0 01-.7.7L8 8.71 6.65 10.06a.5.5 0 01-.7-.7L7.29 8 5.94 6.65a.5.5 0 01.7-.7L8 7.29l1.35-1.34z"/></svg>',
  info: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.75.75 0 110 1.5.75.75 0 010-1.5zM8 7a.5.5 0 01.5.5v3a.5.5 0 01-1 0v-3A.5.5 0 018 7z"/></svg>',
  warning: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8.75.94a.75.75 0 00-1.5 0L.44 12.25a.75.75 0 00.66 1.13h13.8a.75.75 0 00.66-1.13L8.75.94zM8 5.5a.5.5 0 01.5.5v2.5a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm0 5.5a.75.75 0 110-1.5.75.75 0 010 1.5z"/></svg>'
}
function showToast(msg, variant = 'info') {
  if (variant === 'info' && typeof msg === 'string') {
    const lower = msg.toLowerCase()
    if (lower.includes('failed') || lower.includes('error') || lower.includes('cannot')) variant = 'error'
    else if (lower.includes('success') || lower.includes('verified') || lower.includes('downloaded') || lower.includes('launched') || lower.includes('applied')) variant = 'success'
    else if (lower.includes('warning') || lower.includes('cancel')) variant = 'warning'
  }
  const host = toastRoot || document.body
  const container = document.createElement('div')
  container.className = `toast-item ${variant}`
  container.innerHTML = `${toastIcons[variant] || toastIcons.info}<span>${msg}</span>`
  host.appendChild(container)
  requestAnimationFrame(() => {
    container.style.opacity = '1'
    container.style.transform = 'translateY(0) scale(1)'
  })
  setTimeout(() => {
    container.style.opacity = '0'
    container.style.transform = 'translateX(40px) scale(0.92)'
    container.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    setTimeout(() => container.remove(), 320)
  }, 4000)
}

// ===== Activity Log Clear Buttons =====
document.querySelectorAll('.activity-header .text-btn, .hv-activity-header .hv-activity-clear').forEach(btn => {
  btn.addEventListener('click', () => {
    const log = btn.closest('.activity-log, .hv-activity-card')?.querySelector('.activity-list')
    if (log) log.innerHTML = ''
    showToast('Activity log cleared')
  })
})

// ===== Remote Sync After Local Init =====
initGameData().then(() => {
  Promise.allSettled([
    syncBypassManifest(),
    syncCrackManifest()
  ]).finally(async () => {
    await hydrateBypassCovers()
    cacheBypassImages()
  })
})
Promise.allSettled([
  applyBrandImage(),
  applyComponentImages(),
  refreshDownloadedState(),
  loadBootStatus(),
  (typeof window.api.discordStatus === 'function' ? window.api.discordStatus().then(() => {}).catch(() => {}) : Promise.resolve())
])
setupInteractiveMicroFeedback()

localStorage.removeItem(STORAGE_KEYS.lastTab)

// ===== CPU Detection for Hypervisor Page =====
window.api.detectCPU().then(results => {
  const cpuEl = document.getElementById('hv-cpu')
  if (cpuEl && results.manufacturer) {
    cpuEl.textContent = results.manufacturer.includes('Intel') ? 'Intel' : 'AMD'
  }
})

// ===== Settings Path =====
window.api.getDownloadDir().then((downloadDir) => {
  const pathEl = document.getElementById('settings-path')
  if (pathEl) pathEl.textContent = downloadDir
})

// ===== UI Scale =====
;(async () => {
  const slider = document.getElementById('scale-slider')
  const input = document.getElementById('scale-input')
  if (!slider || !input) return
  const saved = await window.api.getScale()
  const pct = Math.round(saved * 100)
  slider.value = pct
  input.value = pct
  const apply = async (val) => {
    const v = Math.max(50, Math.min(200, Number(val) || 100))
    slider.value = v
    input.value = v
    await window.api.setScale(v / 100)
  }
  slider.addEventListener('input', () => apply(slider.value))
  input.addEventListener('change', () => apply(input.value))
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') apply(input.value) })
  const resetBtn = document.getElementById('btn-reset-scale')
  if (resetBtn) resetBtn.addEventListener('click', () => apply(100))
})()

async function initAppVersion() {
  const version = '1.0.1'
  const versionBadge = document.getElementById('app-version-badge')
  if (versionBadge) versionBadge.textContent = `v${version}`
  const sidebarVersionText = document.getElementById('sidebar-version-text')
  if (sidebarVersionText) sidebarVersionText.textContent = `HyperDevil - Beta | Version ${version}`
  const settingsVersionBadge = document.getElementById('settings-version-badge')
  if (settingsVersionBadge) settingsVersionBadge.textContent = `v${version}`
  document.title = `HyperDevil v${version}`

  try {
    const result = await window.api.getUpdateInfo()
    if (result.success && result.data) {
      const { expired, serverTime, expiryDate } = result.data
      if (expired) {
        showForceExpiry(!serverTime, expiryDate)
      }
    }
  } catch (_) {}

  window.api.onExpired(({ localOnly, expiryDate }) => {
    if (!document.getElementById('force-expiry-overlay')) showForceExpiry(localOnly, expiryDate)
  })
  window.api.onUnexpired(() => {
    const overlay = document.getElementById('force-expiry-overlay')
    if (overlay) {
      if (overlay._observer) overlay._observer.disconnect()
      document.removeEventListener('keydown', blockKeys, true)
      document.removeEventListener('keyup', blockRefresh, true)
      document.removeEventListener('contextmenu', blockEvent, true)
      overlay.remove()
    }
  })
}

function showForceExpiry(localOnly, expiryDate) {
  const dateStr = expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : 'an unknown date'
  const overlay = document.createElement('div')
  overlay.id = 'force-expiry-overlay'
  overlay.innerHTML = `
    <div style="position:relative;background:linear-gradient(145deg,var(--bg-secondary),#0d0d14);border:1px solid rgba(240,80,80,0.15);border-radius:20px;padding:48px 44px 40px;max-width:440px;text-align:center;box-shadow:0 0 0 1px rgba(240,80,80,0.05),0 24px 80px rgba(0,0,0,0.7),0 0 80px rgba(240,80,80,0.06);overflow:hidden">
      <div style="position:absolute;top:-60px;right:-60px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(240,80,80,0.12),transparent 70%);pointer-events:none"></div>
      <div style="position:absolute;bottom:-80px;left:-80px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(240,80,80,0.06),transparent 70%);pointer-events:none"></div>
      <div style="position:relative;z-index:1">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:rgba(240,80,80,0.1);border:1px solid rgba(240,80,80,0.15);margin-bottom:20px">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f05050" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:var(--text-primary);letter-spacing:-0.3px">HyperDevil Expired</h2>
        <p style="margin:0 0 20px;color:var(--text-tertiary);font-size:14px;line-height:1.5">This version expired on <strong style="color:var(--text-secondary);font-weight:700">${dateStr}</strong>.<br>Please update to the latest version.</p>
        <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px 6px 10px;border-radius:8px;background:${localOnly ? 'rgba(255,183,77,0.08)' : 'rgba(74,222,128,0.08)'};border:1px solid ${localOnly ? 'rgba(255,183,77,0.15)' : 'rgba(74,222,128,0.15)'};margin-bottom:24px">
          <span style="width:6px;height:6px;border-radius:50%;background:${localOnly ? '#ffb74d' : '#4ade80'};box-shadow:0 0 6px ${localOnly ? 'rgba(255,183,77,0.4)' : 'rgba(74,222,128,0.4)'}"></span>
          <span style="font-size:11.5px;font-weight:600;color:${localOnly ? '#ffb74d' : '#4ade80'}">${localOnly ? 'Device clock check — server unreachable' : 'Verified via server'}</span>
        </div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button onclick="window.api.close()" style="padding:12px 32px;background:linear-gradient(135deg,#f05050,#c03030);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;transition:all .15s ease;box-shadow:0 2px 12px rgba(240,80,80,0.25)">Close App</button>
          <button onclick="window.api.openExternal('https://github.com/DevilJinOfficial/HyperDevil')" style="padding:12px 28px;background:rgba(255,255,255,0.04);color:var(--text-secondary);border:1px solid var(--border-soft);border-radius:10px;font-size:14px;font-weight:600;cursor:transition;all .15s ease">Get Update</button>
        </div>
      </div>
    </div>
  `
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '99999',
    background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  })
  document.body.appendChild(overlay)

  document.addEventListener('keydown', blockKeys, true)
  document.addEventListener('keyup', blockRefresh, true)
  document.addEventListener('contextmenu', blockEvent, true)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.querySelector('button')?.focus() })

  const obs = new MutationObserver(() => {
    if (!document.getElementById('force-expiry-overlay')) {
      document.body.appendChild(overlay)
    }
  })
  obs.observe(document.body, { childList: true, subtree: false })
  overlay._observer = obs

}

function blockKeys(e) {
  if (e.key === 'Escape' || e.key === 'F12' || e.key === 'F5' || e.key === 'F11' ||
    e.key === 'Refresh' || (e.key === 'r' && (e.ctrlKey || e.metaKey)) ||
    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
    e.preventDefault()
    e.stopPropagation()
  }
}

function blockRefresh(e) {
  if (e.key === 'F5' || e.key === 'Refresh' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
    e.preventDefault()
    e.stopPropagation()
  }
}

function blockEvent(e) {
  e.preventDefault()
  e.stopPropagation()
}

initAppVersion()

document.getElementById('btn-db-clear-state')?.addEventListener('click', async () => {
  try {
    const result = await window.api.clearBypassDownloads()
    if (!result?.success) throw new Error(result?.error || 'Failed to clear')
    await refreshBypassDownloadedSet()
    renderDownloadedBypassGames()
    renderBypassGames(bypassSearchInput?.value || '')
    showToast('Download history cleared', 'success')
  } catch { showToast('Could not clear downloads', 'error') }
})

// ===== Db view tab switching =====
const dbViewBtns = document.querySelectorAll('[data-db-view]')

dbViewBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    dbViewBtns.forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    document.querySelectorAll('.db-view').forEach((v) => v.classList.remove('active'))
    const view = document.getElementById('db-view-' + btn.dataset.dbView)
    if (view) {
      view.classList.add('active')
      animateTabEntrance(view)
    }
  })
})

// ===== Generic Modal =====
document.getElementById('modal-ok')?.addEventListener('click', () => {
  document.getElementById('modal-overlay')?.classList.add('modal-hidden')
})
document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById('modal-overlay')?.classList.add('modal-hidden')
  }
})

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlays = [
      'modal-overlay',
      'download-progress-overlay',
      'bypass-version-overlay',
      'crack-files-info-overlay'
    ]
    let anyOpen = false
    overlays.forEach(id => {
      const el = document.getElementById(id)
      if (el && !el.classList.contains('modal-hidden')) {
        el.classList.add('modal-hidden')
        anyOpen = true
      }
    })
    if (document.getElementById('tab-bypass-detail')?.classList.contains('active') && !anyOpen) {
      setActiveTab('bypass')
    }
    if (document.getElementById('tab-crack-detail')?.classList.contains('active') && !anyOpen) {
      setActiveTab('bypass')
    }
  }
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
    e.preventDefault()
    setActiveTab('home')
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'f') {
    if (document.getElementById('tab-bypass')?.classList.contains('active')) {
      e.preventDefault()
      bypassSearchInput?.focus()
    }
  }
  if (e.ctrlKey && e.key === 'Tab') {
    e.preventDefault()
    const tabs = ['home', 'guides', 'bypass', 'settings']
    const current = document.querySelector('.tab-content.active')
    const currentId = current?.id?.replace('tab-', '')
    const idx = tabs.indexOf(currentId)
    const next = tabs[(idx + 1) % tabs.length]
    const target = document.querySelector(`.titlebar-nav-pill[data-tab="${next}"]`)
    if (target && canAccessTab(next)) target.click()
  }
  if (e.ctrlKey && e.key >= '1' && e.key <= '4') {
    e.preventDefault()
    const tabs = ['home', 'guides', 'bypass', 'settings']
    const idx = parseInt(e.key) - 1
    if (idx >= 0 && idx < tabs.length) {
      const target = document.querySelector(`.titlebar-nav-pill[data-tab="${tabs[idx]}"]`)
      if (target && canAccessTab(tabs[idx])) target.click()
    }
  }
  if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
    showToast('Ctrl+Tab: Cycle tabs | Ctrl+1-7: Jump to tab | Esc: Close panels | Ctrl+Shift+H: Home', 'info')
  }
})
