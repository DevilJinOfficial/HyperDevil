const { app, BrowserWindow, ipcMain, shell, Notification, dialog, Menu } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const { pipeline } = require('stream/promises')
const Store = require('electron-store')
const axios = require('axios')
const fs = require('fs')
const os = require('os')
const { pathToFileURL } = require('url')
const crypto = require('crypto')

Menu.setApplicationMenu(null)

const store = new Store()

function runPowerShell(command, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', command])
    let output = ''
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      ps.kill()
      reject(new Error(`PowerShell timed out after ${timeoutMs}ms`))
    }, timeoutMs)
    ps.stdout.on('data', (d) => { output += d.toString() })
    ps.stderr.on('data', () => {}) // drain
    ps.on('error', (err) => { clearTimeout(timer); reject(err) })
    ps.on('close', (code) => {
      clearTimeout(timer)
      if (!timedOut) resolve(output.trim())
    })
  })
}
const { GAMES_DATABASE } = require('./games-database.js')

// Load .env.local if present
try {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n').filter(Boolean)
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('#') || !trimmed.includes('=')) continue
      const eqIdx = trimmed.indexOf('=')
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (key && val && !process.env[key]) process.env[key] = val
    }
  }
} catch (_) { /* .env.local is optional */ }

let mainWindow
const STEAMGRIDDB_API_KEY = process.env.STEAMGRIDDB_API_KEY || ''
const STEAMGRIDDB_API_BASE = 'https://www.steamgriddb.com/api/v2'
const BYPASS_MANIFEST_URL = process.env.BYPASS_MANIFEST_URL || ''
const CRACK_MANIFEST_URL = process.env.CRACK_MANIFEST_URL || ''
const STEAMGRID_SEARCH_ALIASES = {
  'The Settlers: New Allies': 'The Settlers',
  'Warhammer Age of Sigmar: Realms of Ruin': 'Warhammer Age of Sigmar',
  'City Transport Simulator 2026': 'City Transport Simulator Tram',
  'NEW MONOPOLY': 'Monopoly',
  'Beyond Good & Evil - 20th Anniversary Edition': 'Beyond Good and Evil 20th Anniversary',
}
const STEAMGRID_EXACT_GAME_IDS = {
  'Persona 3 Portable': 37280,
  'NEW MONOPOLY': 5426265,
  'Persona 4 Golden': 37347,
  'Persona 4 Arena Ultimax': 34618,
  'Persona 5 Royal': 5352446,
  'Persona 5 Tactica': 5409711,
  'Persona 3 Reload': 5423841,
  'Like a Dragon: Ishin!': 5352382,
  'Like a Dragon Gaiden: The Man Who Erased His Name': 5406907,
  'Like a Dragon Infinite Wealth': 5430778,
  'Like a Dragon: Pirate Yakuza in Hawaii': 5465595,
  'Soul Hackers 2': 5334526,
  'Shin Megami Tensei V: Vengeance': 5444817,
  'Lost Judgment': 5352430,
  'Marvel\'s Midnight Suns': 5294440,
  'Demon Slayer -Kimetsu no Yaiba- Sweep the Board!': 5452056,
  'Warhammer Age of Sigmar: Realms of Ruin': 5403773,
  'Warhammer 40,000: Chaos Gate - Daemonhunters': 5286730,
  'Hatsune Miku: Project DIVA Mega Mix+': 5330706,
  'Street Fighter 6': 5352662,
  'Mortal Kombat 1': 5402478,
  'Sonic Superstars': 5423728,
  'Sonic X Shadow Generations': 5442858,
  'Sonic Origins': 5324938,
  'Redfall': 5323833,
  'Atomic Heart': 19655,
  'Star Wars Outlaws': 5442017,
  'Avatar: Frontiers of Pandora': 5438536,
  'Prince of Persia: The Lost Crown': 5439836,
  'Assassins Creed Shadows': 5353927,
  'Monster Hunter Wilds': 5438489,
  'Crimson Desert': 5473454,
  'Dragon\'s Dogma 2': 5406918,
  'Metaphor: ReFantazio': 5439691,
  'Total War: Warhammer 3': 5276977,
  'Two Point Museum': 5461508,
  'Planet Coaster 2': 5457968,
  'Sniper Elite: Resistance': 5462458,
  'Sniper Elite 5': 5309382,
  'Jurassic World Evolution 2': 5287379,
  'Pragmata': 5454532,
  'Hello Kitty Island Adventure': 5455450,
  'F1 Manager 2024': 5446609,
  'F1 Manager 2022': 5321569,
  'Football Manager 2024': 5428637,
  'Football Manager 2022': 5300432,
  'Madden NFL 21': 5262403,
  'Madden NFL 23': 5332023,
  'Madden NFL 24': 5406597,
  'Madden NFL 25': 5259762,
  'F1 23': 5386635,
  'F1 24': 5445331,
  'NBA 2K24': 5413431,
  'NBA 2K25': 5457855,
  'EA Sports FC 24': 5414999,
  'EA SPORTS FC 25': 5458628,
  'Rabbids: Party of Legends': 5338934,
  'Need For Speed Unbound': 5356756,
  'EA Sports PGA Tour': 5378465,
  'Super Mega Baseball 4': 5398675,
  'Undisputed': 5270863,
  'EA SPORTS WRC': 5426979,
  'GRID Legends': 5290863,
  'Valiant Hearts: Coming Home': 5446296,
  "Sid Meier's Civilization VII": 5454366,
  'Beyond Good & Evil - 20th Anniversary Edition': 5456033,
  'Monopoly Madness': 5309862,
  'Construction Simulator': 5337369,
  'City Transport Simulator 2026': 5528094,
  'City Transport Simulator: Tram': 5439098,
  'The First Berserker: Khazan': 5438459,
  'FINAL FANTASY XV WINDOWS EDITION': 18411,
  'TopSpin 2K25': 5441833,
  'Yakuza Kiwami 3': 5503254,
  'F1 Manager 2023': 5403298,
  'Sonic Frontiers': 5309245,
  'Black Myth Wukong': 5269886,
  'Stellar Blade': 5443884,
  'Resident Evil Requiem': 5491566,
  'DOOM The Dark Ages': 5454562,
  'DRAGON QUEST VII Reimagined': 5501986,
  'Gunjack': 9461
}

function getManagedDownloadDir() {
  const baseDir = app.isPackaged
    ? app.getPath('userData')
    : app.getAppPath()
  const downloadDir = path.join(baseDir, 'downloads')
  fs.mkdirSync(downloadDir, { recursive: true })
  return downloadDir
}

function resolveExistingFilePath(fileName) {
  const candidates = [
    path.join(getManagedDownloadDir(), fileName),
    path.join(app.getAppPath(), fileName),
    path.join(path.dirname(app.getPath('exe')), fileName),
    path.join(app.getPath('downloads'), fileName)
  ]
  return candidates.find((candidate) => fs.existsSync(candidate)) || ''
}

function computeFileHash(filePath, algorithm = 'sha256') {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm)
    const stream = fs.createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

async function computeDirectoryFingerprint(dirPath, algorithm = 'sha256') {
  const paths = listFilePathsRecursive(dirPath).sort()
  const hash = crypto.createHash(algorithm)
  for (const filePath of paths) {
    const relativePath = path.relative(dirPath, filePath).replace(/\\/g, '/')
    const fileHash = await computeFileHash(filePath, algorithm)
    hash.update(`${relativePath}:${fileHash}\n`)
  }
  return hash.digest('hex')
}

function normalizeTitle(value) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function scoreTitleMatch(query, candidate) {
  const q = normalizeTitle(query)
  const c = normalizeTitle(candidate)
  if (!q || !c) return 0
  if (q === c) return 100
  let score = 0
  if (c.includes(q) || q.includes(c)) score += 40

  const qTokens = String(query).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const cTokens = String(candidate).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  if (qTokens.length && cTokens.length) {
    const cSet = new Set(cTokens)
    const overlap = qTokens.filter((t) => cSet.has(t)).length
    score += Math.round((overlap / Math.max(qTokens.length, 1)) * 60)
    const revOverlap = cTokens.filter((t) => new Set(qTokens).has(t)).length
    score += Math.round((revOverlap / Math.max(cTokens.length, 1)) * 20)
  }
  score -= Math.min(10, Math.abs(q.length - c.length))
  return Math.max(0, Math.round(score / 2))
}

function tokenOverlapCount(a, b) {
  const aTokens = String(a || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const bTokens = String(b || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  if (!aTokens.length || !bTokens.length) return 0
  const bSet = new Set(bTokens)
  const direct = aTokens.filter((token) => bSet.has(token)).length
  if (direct > 0) return direct
  const aSet = new Set(aTokens)
  return bTokens.filter((token) => aSet.has(token)).length
}

function buildSearchTerms(title) {
  const terms = []
  const push = (v) => {
    const value = (v || '').trim()
    if (value && !terms.includes(value)) terms.push(value)
  }
  push(title)
  const alias = STEAMGRID_SEARCH_ALIASES[title]
  if (alias && alias !== title) push(alias)

  const stripped = String(title || '')
    .replace(/[™®©\[\]()!+\u2019\u2018']/g, '')
    .replace(/&/g, 'and')
    .replace(/\//g, ' ')
    .replace(/\b\d{4}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (stripped !== title) push(stripped)

  const noYear = String(title || '').replace(/\b\d{4}\b/g, '').replace(/\s+/g, ' ').trim()
  push(noYear)

  const beforeColon = String(title || '').split(':')[0].trim()
  push(beforeColon)

  const beforeDash = String(stripped || '').split(' - ')[0].trim()
  if (beforeDash && beforeDash !== beforeColon) push(beforeDash)

  const tokens = String(title || '').split(/[^a-z0-9]+/i).filter(Boolean)
  if (tokens.length >= 2) {
    push(tokens.slice(0, -1).join(' '))
    if (tokens.length >= 3) push(tokens.slice(0, 2).join(' '))
  }
  return terms
}

async function fetchSteamGridImage(title, type = 'grids') {
  if (!STEAMGRIDDB_API_KEY) return ''
  const headers = { Authorization: `Bearer ${STEAMGRIDDB_API_KEY}` }

  async function fetchImageByGameId(gameId) {
    const apiUrl = `${STEAMGRIDDB_API_BASE}/${type}/game/${gameId}`
    const apiRes = await axios.get(apiUrl, { headers, timeout: 9000 })
    const items = Array.isArray(apiRes?.data?.data) ? apiRes.data.data : []
    if (!items.length) return ''
    const preferLandscape = type === 'heroes'
    const sorted = [...items].sort((a, b) => {
      const aLandscape = Number(a?.width || 0) - Number(a?.height || 0)
      const bLandscape = Number(b?.width || 0) - Number(b?.height || 0)
      return preferLandscape ? bLandscape - aLandscape : aLandscape - bLandscape
    })
    return sorted[0]?.url || items[0]?.url || ''
  }

  const exactId = STEAMGRID_EXACT_GAME_IDS[title] || STEAMGRID_EXACT_GAME_IDS[Object.keys(STEAMGRID_EXACT_GAME_IDS).find(k => k.toLowerCase() === title.toLowerCase())]
  if (exactId) {
    const exactImage = await fetchImageByGameId(exactId)
    if (exactImage) return exactImage
  }

  const searchTerms = buildSearchTerms(title)
  let entries = []

  for (const term of searchTerms) {
    const autocompleteUrl = `${STEAMGRIDDB_API_BASE}/search/autocomplete/${encodeURIComponent(term)}`
    const autoRes = await axios.get(autocompleteUrl, { headers, timeout: 9000 })
    const batch = Array.isArray(autoRes?.data?.data) ? autoRes.data.data : []
    if (batch.length) {
      entries = batch
      break
    }
  }

  if (!entries.length) {
    for (const term of searchTerms.slice(0, 3)) {
      try {
        const searchUrl = `${STEAMGRIDDB_API_BASE}/search/${encodeURIComponent(term)}`
        const searchRes = await axios.get(searchUrl, { headers, timeout: 9000 })
        const batch = Array.isArray(searchRes?.data?.data) ? searchRes.data.data : []
        if (batch.length) {
          entries = batch
          break
        }
      } catch (_) {}
    }
  }

  if (!entries.length) return ''

  const ranked = [...entries]
    .map((entry) => ({ entry, score: scoreTitleMatch(title, entry?.name || '') }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  for (const candidate of ranked) {
    const candidateName = candidate.entry?.name || ''
    const overlap = tokenOverlapCount(title, candidateName)
    const isShort = String(title || '').split(/[^a-z0-9]+/i).filter(Boolean).length <= 2
    const minimumScore = isShort ? 12 : 20
    if (candidate.score < minimumScore || overlap < 1) continue

    const gameId = candidate.entry?.id
    if (!gameId) continue
    const imageUrl = await fetchImageByGameId(gameId)
    if (imageUrl) return imageUrl
  }

  if (ranked.length > 0 && ranked[0].score > 0) {
    const gameId = ranked[0].entry?.id
    if (gameId) {
      const imageUrl = await fetchImageByGameId(gameId)
      if (imageUrl) return imageUrl
    }
  }

  return ''
}

async function fetchSteamGridCover(title) {
  return fetchSteamGridImage(title, 'grids')
}

async function fetchSteamGridHero(title) {
  return fetchSteamGridImage(title, 'heroes')
}

async function resolveSteamGridCovers(titles = []) {
  const rawCache = store.get('bypass.coverCache')
  const coverCache = (rawCache && typeof rawCache === 'object') ? rawCache : {}
  const results = {}
  const forceRefreshTitles = new Set([
    ...Object.keys(STEAMGRID_SEARCH_ALIASES),
    ...Object.keys(STEAMGRID_EXACT_GAME_IDS)
  ])

  function resolveLocalCover(title) {
    const safeName = (title || '').replace(/[<>:"/\\|?*]+/g, '_').trim()
    const altName = safeName.toLowerCase().replace(/\s+/g, '_')
    const nameVariants = [...new Set([safeName, altName, safeName.replace(/\s+/g, ''), altName.replace(/_+/g, '')])]
    const extensions = ['.jpg', '.png', '.webp']
    const basePaths = [app.getAppPath(), process.resourcesPath, __dirname]
    for (const base of basePaths) {
      for (const name of nameVariants) {
        for (const ext of extensions) {
          const localPath = path.join(base, 'assets', 'covers', name + ext)
          if (fs.existsSync(localPath)) return pathToFileURL(localPath).href
        }
      }
    }
    return ''
  }

  const concurrency = 8
  const rateLimitDelay = 350
  const tasks = titles.map((title) => async () => {
    if (!title) return
    if (coverCache[title] && !forceRefreshTitles.has(title)) {
      results[title] = coverCache[title]
      return
    }
    await new Promise((r) => setTimeout(r, rateLimitDelay))
    const localCover = resolveLocalCover(title)
    if (localCover) {
      coverCache[title] = localCover
      results[title] = localCover
      return
    }
    try {
      const imageUrl = await fetchSteamGridCover(title)
      if (imageUrl) {
        coverCache[title] = imageUrl
        results[title] = imageUrl
        return
      }
    } catch (_) {
      // Keep placeholder cover when SteamGrid lookup fails.
    }
    try {
      const heroUrl = await fetchSteamGridHero(title)
      if (heroUrl) {
        coverCache[title] = heroUrl
        results[title] = heroUrl
      }
    } catch (_) {}
  })

  for (let i = 0; i < tasks.length; i += concurrency) {
    await Promise.all(tasks.slice(i, i + concurrency).map((run) => run()))
  }

  store.set('bypass.coverCache', coverCache)
  return results
}

async function resolveSteamGridHeroes(titles = []) {
  if (!STEAMGRIDDB_API_KEY) return {}
  const rawCache = store.get('bypass.heroCache')
  const heroCache = (rawCache && typeof rawCache === 'object') ? rawCache : {}
  const results = {}
  const forceRefreshTitles = new Set([
    ...Object.keys(STEAMGRID_SEARCH_ALIASES),
    ...Object.keys(STEAMGRID_EXACT_GAME_IDS)
  ])

  const concurrency = 8
  const rateLimitDelay = 350
  const tasks = titles.map((title) => async () => {
    if (!title) return
    if (heroCache[title] && !forceRefreshTitles.has(title)) {
      results[title] = heroCache[title]
      return
    }
    await new Promise((r) => setTimeout(r, rateLimitDelay))
    try {
      const imageUrl = await fetchSteamGridHero(title)
      if (imageUrl) {
        heroCache[title] = imageUrl
        results[title] = imageUrl
      }
    } catch (_) {}
  })

  for (let i = 0; i < tasks.length; i += concurrency) {
    await Promise.all(tasks.slice(i, i + concurrency).map((run) => run()))
  }

  store.set('bypass.heroCache', heroCache)
  return results
}

function normalizeManifestGame(entry) {
  if (!entry || typeof entry !== 'object') return null
  const title = String(entry.title || '').trim()
  if (!title) return null
  const checksum = String(entry.sha256 || entry.checksum || entry.hash || '').trim()
  return {
    title,
    url: String(entry.url || '').trim(),
    buildid: String(entry.buildid || '').trim(),
    versions: Array.isArray(entry.versions)
      ? entry.versions.map((v) => {
          if (v && typeof v === 'object') {
            const id = String(v.id || v.version || '').trim()
            const url = String(v.url || '').trim()
            return url ? { id, url } : id
          }
          return String(v || '').trim()
        }).filter((v) => v !== '')
      : [],
    description: String(entry.description || `${title} build details, patches, and launcher resources.`).trim(),
    image: String(entry.image || '').trim(),
    developer: String(entry.developer || '').trim(),
    publisher: String(entry.publisher || '').trim(),
    genre: String(entry.genre || '').trim(),
    status: String(entry.status || 'Available').trim(),
    checksum: checksum || undefined
  }
}

function createWindow() {
  const baseWidth = 1280
  const baseHeight = 720
  mainWindow = new BrowserWindow({
    width: baseWidth,
    height: baseHeight,
    minWidth: baseWidth,
    minHeight: baseHeight,
    frame: false,
    transparent: false,
    backgroundColor: '#0d0d0d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWindow.setAspectRatio(16 / 9)
  mainWindow.loadFile('renderer/index.html')
  mainWindow.setMenuBarVisibility(false)

  const savedScale = store.get('ui.scale', 1)
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(savedScale)
  })

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (
      input.key === 'F12' || input.key === 'F5' || input.key === 'F11' ||
      input.key === 'Refresh' ||
      (input.control && input.shift && (input.key === 'I' || input.key === 'J' || input.key === 'C')) ||
      ((input.control || input.meta) && (input.key === 'r' || input.key === 'R'))
    ) {
      event.preventDefault()
    }
  })

  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault()
  })
}

// Elevated command runner
function runElevatedPowerShell(command) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(app.getPath('temp'), `hd-${Date.now()}.ps1`)
    fs.writeFileSync(tmpFile, command, 'utf8')
    const ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command',
      `Start-Process powershell -Verb runAs -ArgumentList '-NoProfile','-NonInteractive','-Command','& "${tmpFile}"' -Wait -PassThru | % { $_.WaitForExit(); exit $_.ExitCode }`])
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; ps.kill(); reject(new Error('Elevated command timed out')) }, 60000)
    ps.on('error', (err) => { clearTimeout(timer); reject(err) })
    ps.on('close', (code) => {
      clearTimeout(timer)
      try { fs.unlinkSync(tmpFile) } catch {}
      if (!timedOut) code === 0 ? resolve() : reject(new Error(`Command failed: ${code}`))
    })
  })
}

function runElevatedAssetScript(scriptFile) {
  return new Promise((resolve, reject) => {
    const requestedPath = String(scriptFile || '').trim()
    if (!requestedPath) {
      reject(new Error('Script name is required'))
      return
    }

    let scriptPath = requestedPath
    if (!path.isAbsolute(scriptPath)) {
      const base = app.isPackaged ? process.resourcesPath : app.getAppPath()
      scriptPath = path.join(base, 'assets', 'script', path.basename(scriptPath))
      if (!fs.existsSync(scriptPath)) {
        scriptPath = path.join(app.getAppPath(), 'assets', 'script', path.basename(scriptPath))
      }
    }

    if (!fs.existsSync(scriptPath)) {
      reject(new Error(`Script not found: ${requestedPath}`))
      return
    }

    const escapedPath = scriptPath.replace(/'/g, "''")
    const command = `Start-Process -FilePath '${escapedPath}' -Verb runAs -Wait`
    let timedOut = false
    const ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', command])
    const timer = setTimeout(() => { timedOut = true; ps.kill(); reject(new Error('Script timed out')) }, 120000)
    ps.on('error', (err) => { clearTimeout(timer); reject(err) })
    ps.on('close', (code) => {
      clearTimeout(timer)
      if (!timedOut) code === 0 ? resolve() : reject(new Error(`Script failed: ${code}`))
    })
  })
}

// Boot parameter handlers
ipcMain.handle('boot:test-signing:get', async () => {
  try {
    const output = await runPowerShell('bcdedit /enum | Select-String "testsigning"')
    const match = output.match(/testsigning\s+(\w+)/i)
    return match?.[1]?.toLowerCase() === 'yes'
  } catch { return false }
})

ipcMain.handle('boot:test-signing:set', async (_, enabled) => {
  await runElevatedPowerShell(`bcdedit /set testsigning ${enabled ? 'on' : 'off'}`)
  return true
})

ipcMain.handle('boot:no-integrity-checks:get', async () => {
  try {
    const output = await runPowerShell('bcdedit /enum | Select-String "nointegritychecks"')
    const match = output.match(/nointegritychecks\s+(\w+)/i)
    return match?.[1]?.toLowerCase() === 'yes'
  } catch { return false }
})

ipcMain.handle('boot:no-integrity-checks:set', async (_, enabled) => {
  await runElevatedPowerShell(`bcdedit /set nointegritychecks ${enabled ? 'on' : 'off'}`)
  return true
})

ipcMain.handle('boot:memory-integrity:get', async () => {
  try {
    const output = await runPowerShell('(Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity" -Name Enabled -ErrorAction SilentlyContinue).Enabled -eq 1')
    return output.toLowerCase() === 'true'
  } catch { return false }
})

ipcMain.handle('boot:memory-integrity:set', async (_, enabled) => {
  await runElevatedPowerShell(`powershell -Command "Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity' -Name Enabled -Value ${enabled ? 1 : 0} -Type DWORD -Force"`)
  return true
})

ipcMain.handle('boot:vbs:get', async () => {
  try {
    const output = await runPowerShell('(Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard" -Name EnableVirtualizationBasedSecurity -ErrorAction SilentlyContinue).EnableVirtualizationBasedSecurity -eq 1')
    return output.toLowerCase() === 'true'
  } catch { return false }
})

ipcMain.handle('script:run', async (_, scriptFile) => {
  try {
    await runElevatedAssetScript(scriptFile)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message || 'Failed to run script' }
  }
})

ipcMain.handle('vbs:download-and-run', async () => {
  try {
    const url = process.env.VBS_DOWNLOAD_URL || ''
    const tmpDir = app.getPath('temp')
    const tmpFile = path.join(tmpDir, 'HyperDevil_VBS.cmd')
    const writer = fs.createWriteStream(tmpFile)
    const response = await axios({ method: 'get', url, responseType: 'stream', timeout: 30000 })
    await new Promise((resolve, reject) => {
      response.data.pipe(writer)
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
    await runElevatedAssetScript(tmpFile)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message || 'Failed to download and run VBS' }
  }
})

ipcMain.handle('config:download-links', () => ({
  cirno: {
    fileName: 'CirnoDownloader.exe',
    url: process.env.CIRNO_DOWNLOAD_URL || ''
  },
  sigma: {
    fileName: 'Sigma.exe',
    url: process.env.SIGMA_DOWNLOAD_URL || ''
  },
  'hypervisor-manager': {
    fileName: 'HypervisorManager.exe',
    url: process.env.HYPERVISOR_MANAGER_URL || ''
  },
  inspectre: {
    fileName: 'InSpectre.exe',
    url: process.env.INSPECTRE_URL || ''
  },
  'vbs-script': {
    fileName: 'VBS.cmd',
    url: process.env.VBS_DOWNLOAD_URL || ''
  }
}))

ipcMain.handle('scale:get', () => {
  return store.get('ui.scale', 1)
})

ipcMain.handle('scale:set', (_, value) => {
  const v = Math.max(0.5, Math.min(2, Number(value) || 1))
  store.set('ui.scale', v)
  mainWindow?.webContents.setZoomFactor(v)
  return v
})

ipcMain.handle('boot:secure-boot:get', async () => {
  try {
    const output = await runPowerShell('Confirm-SecureBootUEFI -ErrorAction SilentlyContinue')
    return output.toLowerCase() === 'true'
  } catch { return false }
})

// CPU virtualization detection
ipcMain.handle('cpu:detect', async () => {
  try {
    const output = await runPowerShell(`
      $cpu = Get-WmiObject Win32_Processor | Select-Object VirtualizationFirmwareEnabled, VMMonitorModeExtensions, SecondLevelAddressTranslationExtensions, Manufacturer
      $iommu = (Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard" -Name IOMMUEnabled -ErrorAction SilentlyContinue).IOMMUEnabled -eq 1
      @{ manufacturer=$cpu.Manufacturer; vt=$cpu.VirtualizationFirmwareEnabled; vmx=$cpu.VMMonitorModeExtensions; slat=$cpu.SecondLevelAddressTranslationExtensions; iommu=$iommu } | ConvertTo-Json
    `)
    return JSON.parse(output)
  } catch { return {} }
})

// Virtualization status
ipcMain.handle('cpu:virtualization:get', async () => {
  try {
    const output = await runPowerShell('$cpu=Get-CimInstance Win32_Processor; [bool](($cpu.VirtualizationFirmwareEnabled -contains $true) -or ($cpu.VMMonitorModeExtensions -contains $true) -or (Get-CimInstance Win32_ComputerSystem).HypervisorPresent)')
    return output.toLowerCase() === 'true'
  } catch { return false }
})

// Parallel download configuration
const PARALLEL_CHUNKS = 4
const MIN_CHUNK_SIZE = 5 * 1024 * 1024

async function downloadFile(url, filePath, signal, onProgress) {
  let totalBytes = 0
  let supportsRange = false
  try {
    const headRes = await axios({ url, method: 'HEAD', signal, timeout: 5000 })
    totalBytes = Number(headRes.headers['content-length'] || 0)
    supportsRange = (headRes.headers['accept-ranges'] || '').toLowerCase() === 'bytes'
  } catch {}

  if (supportsRange && totalBytes >= MIN_CHUNK_SIZE) {
    return await downloadParallel(url, filePath, totalBytes, signal, onProgress)
  }
  return await downloadSingle(url, filePath, signal, onProgress, totalBytes)
}

async function downloadSingle(url, filePath, signal, onProgress, knownTotal) {
  const res = await axios({ url, method: 'GET', responseType: 'stream', signal })
  const totalBytes = knownTotal || Number(res.headers['content-length'] || 0)
  const writer = fs.createWriteStream(filePath)
  let downloaded = 0
  const t0 = Date.now()
  res.data.on('data', (c) => {
    downloaded += c.length
    if (!totalBytes) return
    const sec = Math.max(1, (Date.now() - t0) / 1000)
    onProgress({
      percent: Math.min(100, Math.round((downloaded / totalBytes) * 100)),
      downloadedBytes: downloaded, totalBytes,
      speedBps: Math.round(downloaded / sec),
      etaSec: Math.max(0, Math.round((totalBytes - downloaded) / (downloaded / sec)))
    })
  })
  await pipeline(res.data, writer)
  if (totalBytes) onProgress({ percent: 100, downloadedBytes: totalBytes, totalBytes, speedBps: null, etaSec: 0 })
  return { success: true, downloadPath: filePath }
}

async function downloadParallel(url, filePath, totalBytes, signal, onProgress) {
  const numChunks = Math.min(PARALLEL_CHUNKS, Math.max(1, Math.floor(totalBytes / MIN_CHUNK_SIZE)))
  const tempDir = filePath + '.parts'
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true })
  fs.mkdirSync(tempDir, { recursive: true })

  let downloaded = 0
  const t0 = Date.now()
  let lastUpdate = 0

  const tasks = []
  for (let i = 0; i < numChunks; i++) {
    const chunkSize = Math.ceil(totalBytes / numChunks)
    const start = i * chunkSize
    const end = i === numChunks - 1 ? totalBytes - 1 : Math.min((i + 1) * chunkSize - 1, totalBytes - 1)
    const partFile = path.join(tempDir, `p${i}`)
    tasks.push((async () => {
      const res = await axios({ url, headers: { Range: `bytes=${start}-${end}` }, method: 'GET', responseType: 'stream', signal })
      const writer = fs.createWriteStream(partFile)
      res.data.on('data', (c) => {
        downloaded += c.length
        const now = Date.now()
        if (now - lastUpdate < 100) return
        lastUpdate = now
        const sec = Math.max(1, (now - t0) / 1000)
        onProgress({
          percent: Math.min(100, Math.round((downloaded / totalBytes) * 100)),
          downloadedBytes: downloaded, totalBytes,
          speedBps: Math.round(downloaded / sec),
          etaSec: Math.max(0, Math.round((totalBytes - downloaded) / (downloaded / sec)))
        })
      })
      await pipeline(res.data, writer)
    })())
  }

  await Promise.all(tasks)
  onProgress({ percent: 100, downloadedBytes: totalBytes, totalBytes, speedBps: null, etaSec: 0 })

  const writer = fs.createWriteStream(filePath)
  for (let i = 0; i < numChunks; i++) {
    const partFile = path.join(tempDir, `p${i}`)
    writer.write(fs.readFileSync(partFile))
  }
  await new Promise((r, j) => writer.end((e) => e ? j(e) : r()))
  fs.rmSync(tempDir, { recursive: true, force: true })
  return { success: true, downloadPath: filePath }
}

// File operations
let currentDownloadAbortController = null
let currentDownloadTargetPath = null

ipcMain.handle('file:check', async (_, fileName) => {
  if (!fileName) return false
  const targetPath = path.join(getManagedDownloadDir(), String(fileName))
  return fs.existsSync(targetPath)
})

ipcMain.handle('file:verify', async (_, targetPath, expectedHash = null) => {
  try {
    if (!targetPath || !fs.existsSync(targetPath)) {
      return { success: false, error: 'Path not found' }
    }
    const stat = fs.statSync(targetPath)
    const actualHash = stat.isDirectory()
      ? await computeDirectoryFingerprint(targetPath)
      : await computeFileHash(targetPath)
    const result = {
      success: true,
      path: targetPath,
      type: stat.isDirectory() ? 'directory' : 'file',
      hash: actualHash
    }
    if (expectedHash) {
      result.expectedHash = String(expectedHash).trim()
      result.verified = actualHash.toLowerCase() === String(expectedHash).trim().toLowerCase()
    }
    return result
  } catch (err) {
    return { success: false, error: err.message || 'Verification failed' }
  }
})

ipcMain.handle('file:open-folder', async () => {
  shell.openPath(getManagedDownloadDir())
  return true
})

ipcMain.handle('file:remove', async (_, fileName) => {
  try {
    if (!fileName) return { success: false, error: 'File name required' }
    const targetPath = path.join(getManagedDownloadDir(), String(fileName))
    if (!fs.existsSync(targetPath)) {
      return { success: false, error: 'File not found' }
    }
    fs.rmSync(targetPath, { force: true })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message || 'Failed to remove file' }
  }
})

ipcMain.handle('file:get-download-dir', async () => {
  return getManagedDownloadDir()
})

ipcMain.handle('file:download', async (_, url, fileName) => {
  const resolvedFileName = fileName || url.split('/').pop() || `download-${Date.now()}`
  const downloadPath = path.join(getManagedDownloadDir(), resolvedFileName)
  const controller = new AbortController()
  currentDownloadAbortController = controller
  currentDownloadTargetPath = downloadPath

  try {
    const result = await downloadFile(url, downloadPath, controller.signal, (p) => {
      mainWindow?.webContents.send('download:progress', { fileName: resolvedFileName, ...p })
    })
    mainWindow?.webContents.send('download:complete', { fileName: resolvedFileName, downloadPath })
    return { success: true, downloadPath }
  } catch (err) {
    if (err?.code === 'ERR_CANCELED' || err?.message?.toLowerCase()?.includes('canceled')) {
      if (fs.existsSync(downloadPath)) {
        if (fs.statSync(downloadPath).isDirectory()) {
          try { fs.rmSync(downloadPath, { recursive: true, force: true }) } catch (_) {}
        } else {
          try { fs.unlinkSync(downloadPath) } catch (_) {}
        }
      }
      const partsDir = downloadPath + '.parts'
      if (fs.existsSync(partsDir)) {
        try { fs.rmSync(partsDir, { recursive: true, force: true }) } catch (_) {}
      }
      return { success: false, canceled: true, error: 'Download canceled' }
    }
    return { success: false, error: err.message }
  } finally {
    currentDownloadAbortController = null
    currentDownloadTargetPath = null
  }
})

ipcMain.handle('file:extract-archive', async (_, archivePath) => {
  try {
    if (!archivePath || !fs.existsSync(archivePath)) {
      return { success: false, error: 'Archive file not found' }
    }

    const ext = path.extname(archivePath).toLowerCase()
    const baseName = path.basename(archivePath, ext)
    const destDir = path.join(path.dirname(archivePath), `${baseName}_extracted`)

    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true })
    }
    fs.mkdirSync(destDir, { recursive: true })

    if (ext === '.zip') {
      const result = await extractWithPowerShell(archivePath, destDir)
      if (result === 'encrypted') {
        return { success: false, error: 'Archive is encrypted or corrupted' }
      }
    } else {
      const sevenZipPath = find7z()
      if (!sevenZipPath) {
        return { success: false, error: '7-Zip not found — install 7-Zip to extract .rar/.7z files' }
      }
      const result = await extractWith7z(sevenZipPath, archivePath, destDir)
      if (result === 'encrypted') {
        return { success: false, error: 'Archive is encrypted or corrupted' }
      }
    }

    flattenSingleRootFolder(destDir)
    const files = listFilesRecursive(destDir)

    return { success: true, extractPath: destDir, files }
  } catch (err) {
    return { success: false, error: err.message || 'Extraction failed' }
  }
})

function find7z() {
  const candidates = [
    'C:\\Program Files\\7-Zip\\7z.exe',
    'C:\\Program Files (x86)\\7-Zip\\7z.exe',
    path.join(process.env['ProgramFiles'] || '', '7-Zip\\7z.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', '7-Zip\\7z.exe')
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

function extractWithPowerShell(zipPath, destPath) {
  return new Promise((resolve, reject) => {
    const ps = spawn('powershell', [
      '-NoProfile', '-NonInteractive', '-Command',
      `$ErrorActionPreference='Stop'; Expand-Archive -Path "${zipPath.replace(/"/g, '""')}" -DestinationPath "${destPath.replace(/"/g, '""')}" -Force`
    ])
    let stderr = ''
    ps.stderr.on('data', (d) => { stderr += d.toString() })
    ps.on('close', (code) => {
      if (code === 0) return resolve()
      const msg = stderr.toLowerCase()
      if (msg.includes('password') || msg.includes('encrypted') || msg.includes('corrupt')) {
        return resolve('encrypted')
      }
      reject(new Error(`Expand-Archive failed: ${code}`))
    })
    ps.on('error', reject)
  })
}

function extractWith7z(sevenZipPath, archivePath, destPath) {
  return new Promise((resolve, reject) => {
    const ps = spawn(sevenZipPath, ['x', archivePath, `-o${destPath}`, '-y'])
    let stderr = ''
    ps.stderr.on('data', (d) => { stderr += d.toString() })
    ps.stdout.on('data', () => {})
    ps.on('close', (code) => {
      if (code === 0) return resolve()
      const msg = stderr.toLowerCase()
      if (msg.includes('password') || msg.includes('wrong password') || msg.includes('can not open encrypted')) {
        return resolve('encrypted')
      }
      if (code === 2) {
        if (msg.includes('cannot find') || msg.includes('no files')) {
          return reject(new Error(`7-Zip: archive not found or empty: ${archivePath}`))
        }
        return resolve('encrypted')
      }
      reject(new Error(`7-Zip extraction failed (code ${code}): ${msg.slice(0, 200)}`))
    })
    ps.on('error', reject)
  })
}

function listFilesRecursive(dirPath, relativeTo = dirPath) {
  const results = []
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relPath = path.relative(relativeTo, fullPath)
      if (entry.isDirectory()) {
        results.push({ name: relPath, isDirectory: true, size: 0 })
        results.push(...listFilesRecursive(fullPath, relativeTo))
      } else {
        const stat = fs.statSync(fullPath)
        results.push({ name: relPath, isDirectory: false, size: stat.size })
      }
    }
  } catch (_) {}
  return results
}

function listFilePathsRecursive(dirPath) {
  const results = []
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        results.push(...listFilePathsRecursive(fullPath))
      } else {
        results.push(fullPath)
      }
    }
  } catch (_) {}
  return results
}

function flattenSingleRootFolder(dirPath) {
  try {
    while (true) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      if (entries.length !== 1 || !entries[0].isDirectory()) {
        return entries.length > 0
      }

      const rootFolder = path.join(dirPath, entries[0].name)
      const rootEntries = fs.readdirSync(rootFolder, { withFileTypes: true })
      for (const entry of rootEntries) {
        const src = path.join(rootFolder, entry.name)
        const dest = path.join(dirPath, entry.name)
        fs.renameSync(src, dest)
      }
      fs.rmSync(rootFolder, { recursive: true, force: true })
    }
  } catch (_) {
    return false
  }
}

ipcMain.handle('file:list-extracted-files', async (_, dirPath) => {
  try {
    if (!dirPath || !fs.existsSync(dirPath)) {
      return { success: false, error: 'Directory not found' }
    }
    const files = listFilesRecursive(dirPath)
    return { success: true, files }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

function getBypassDir() {
  const dir = path.join(getManagedDownloadDir(), 'bypass')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function getImageCacheDir() {
  const localData = app.getPath('localAppData')
  const dir = path.join(localData, 'hyperdevil', 'image-cache')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

const imageCacheLock = new Map()

ipcMain.handle('image:cache', async (_, url, title) => {
  if (!url || typeof url !== 'string') return url
  if (url.startsWith('data:') || url.startsWith('file:')) return url

  const ext = path.extname(url.split('?')[0].split('#')[0]) || '.jpg'
  const safeName = title.replace(/[^a-z0-9]/gi, '_') + ext
  const cachePath = path.join(getImageCacheDir(), safeName)

  if (fs.existsSync(cachePath)) return pathToFileURL(cachePath).href

  if (imageCacheLock.has(url)) return imageCacheLock.get(url)

  const promise = (async () => {
    try {
      const controller = new AbortController()
      await downloadFile(url, cachePath, controller.signal, () => {})
      return pathToFileURL(cachePath).href
    } catch {
      try { if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath) } catch {}
      return url
    }
  })()

  imageCacheLock.set(url, promise)
  const result = await promise
  imageCacheLock.delete(url)
  return result
})

ipcMain.handle('file:get-bypass-dir', async () => getBypassDir())

ipcMain.handle('file:list-bypass-downloads', async () => {
  try {
    const bypassDir = getBypassDir()
    // Read all files recursively
    const allFiles = listFilePathsRecursive(bypassDir)
    // Also include top-level directories
    const entries = fs.readdirSync(bypassDir, { withFileTypes: true })
    const topLevel = entries.map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      fullPath: path.join(bypassDir, e.name)
    }))
    // Return both top-level entries and all recursive files
    return {
      topLevel: topLevel,
      allFiles: allFiles,
      total: allFiles.length
    }
  } catch { return { topLevel: [], allFiles: [], total: 0 } }
})

ipcMain.handle('file:clear-bypass-downloads', async () => {
  try {
    const bypassDir = getBypassDir()
    const entries = fs.readdirSync(bypassDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(bypassDir, entry.name)
      if (entry.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true })
      } else {
        fs.rmSync(fullPath, { force: true })
      }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('file:remove-bypass-item', async (_, name) => {
  try {
    if (!name) return { success: false, error: 'Name required' }
    const bypassDir = getBypassDir()
    const targetPath = path.join(bypassDir, name)
    if (!fs.existsSync(targetPath)) return { success: true }
    fs.rmSync(targetPath, { recursive: true, force: true })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message || 'Failed to remove bypass item' }
  }
})

ipcMain.handle('file:download-bypass', async (_, url, fileName = 'bypass.zip', expectedHash = null) => {
  const bypassDir = getBypassDir()
  const filePath = path.join(bypassDir, fileName)
  const controller = new AbortController()
  currentDownloadAbortController = controller
  currentDownloadTargetPath = filePath

  try {
    await downloadFile(url, filePath, controller.signal, (p) => {
      mainWindow?.webContents.send('download:progress', { fileName, ...p })
    })

    if (expectedHash) {
      try {
        const actualHash = await computeFileHash(filePath)
        if (actualHash.toLowerCase() !== String(expectedHash).trim().toLowerCase()) {
          mainWindow?.webContents.send('download:complete', {
            fileName, downloadPath: filePath,
            verified: false, expectedHash: String(expectedHash).trim(), actualHash
          })
          return { success: false, error: 'File verification failed', verified: false, expectedHash: String(expectedHash).trim(), actualHash }
        }
      } catch (hashError) {
        return { success: false, error: hashError.message || 'Failed to verify download' }
      }
    }

    const result = { success: true, targetPath: filePath }
    if (expectedHash) {
      result.verified = true
      result.expectedHash = String(expectedHash).trim()
    }
    mainWindow?.webContents.send('download:complete', { fileName, downloadPath: filePath, verified: result.verified, expectedHash: result.expectedHash })
    return result
  } catch (err) {
    if (err?.code === 'ERR_CANCELED' || err?.message?.toLowerCase()?.includes('canceled')) {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath) } catch (_) {}
      }
      const partsDir = filePath + '.parts'
      if (fs.existsSync(partsDir)) {
        try { fs.rmSync(partsDir, { recursive: true, force: true }) } catch (_) {}
      }
      return { success: false, canceled: true, error: 'Download canceled' }
    }
    return { success: false, error: err.message }
  } finally {
    currentDownloadAbortController = null
    currentDownloadTargetPath = null
  }
})

ipcMain.handle('file:launch', async (_, fileName) => {
  try {
    const filePath = resolveExistingFilePath(fileName)
    if (!filePath) {
      return { success: false, error: `${fileName} is not downloaded yet. Download it first.` }
    }

    const launchError = await shell.openPath(filePath)
    if (launchError) {
      return { success: false, error: launchError }
    }

    return { success: true, filePath }
  } catch (err) {
    return { success: false, error: err.message || 'Failed to launch file' }
  }
})

ipcMain.handle('dialog:select-folder', async (_, title = 'Select Game Folder') => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title,
      properties: ['openDirectory']
    })
    if (result.canceled || !result.filePaths.length) {
      return { success: false, canceled: true }
    }
    return { success: true, folderPath: result.filePaths[0] }
  } catch (err) {
    return { success: false, error: err.message || 'Failed to select folder' }
  }
})

ipcMain.handle('file:cancel-download', async () => {
  if (currentDownloadAbortController) {
    currentDownloadAbortController.abort()
    return { success: true }
  }
  return { success: false, error: 'No active download' }
})

ipcMain.handle('file:copy-bypass-to-game', async (_, bypassPath, gameFolderPath) => {
  try {
    if (!fs.existsSync(bypassPath)) {
      return { success: false, error: 'Bypass folder does not exist' }
    }
    if (!fs.existsSync(gameFolderPath)) {
      return { success: false, error: 'Game folder does not exist' }
    }

    const bypassFiles = listFilePathsRecursive(bypassPath)
    let copiedCount = 0
    let skippedCount = 0

    for (const file of bypassFiles) {
      const relativePath = path.relative(bypassPath, file)
      const targetPath = path.join(gameFolderPath, relativePath)
      const targetDir = path.dirname(targetPath)

      try {
        fs.mkdirSync(targetDir, { recursive: true })
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(file, targetPath)
          copiedCount++
        } else {
          skippedCount++
        }
      } catch (err) {
        console.error(`Failed to copy ${file}:`, err)
      }
    }

    return { success: true, copied: copiedCount, skipped: skippedCount }
  } catch (err) {
    return { success: false, error: err.message || 'Failed to copy files' }
  }
})

ipcMain.handle('bypass:covers:resolve', async (_, titles = []) => {
  try {
    const safeTitles = Array.isArray(titles)
      ? titles.filter((title) => typeof title === 'string' && title.trim())
      : []
    const covers = await resolveSteamGridCovers(safeTitles)
    return { success: true, covers }
  } catch (err) {
    return { success: false, covers: {}, error: err.message || 'Failed to resolve covers' }
  }
})

ipcMain.handle('bypass:heroes:resolve', async (_, titles = []) => {
  try {
    const safeTitles = Array.isArray(titles)
      ? titles.filter((title) => typeof title === 'string' && title.trim())
      : []
    const heroes = await resolveSteamGridHeroes(safeTitles)
    return { success: true, heroes }
  } catch (err) {
    return { success: false, heroes: {}, error: err.message || 'Failed to resolve hero banners' }
  }
})

ipcMain.handle('bypass:manifest:sync', async () => {
  try {
    const res = await axios.get(BYPASS_MANIFEST_URL, { timeout: 12000 })
    const payload = res?.data || {}
    const games = Array.isArray(payload.games)
      ? payload.games.map(normalizeManifestGame).filter(Boolean)
      : []

    if (!games.length) {
      return { success: false, error: 'Bypass manifest has no games' }
    }

    const remoteVersion = String(payload.version || payload.updatedAt || `${games.length}`)
    const currentTitles = games.map((game) => game.title)
    const previous = store.get('bypass.manifestMeta')
    const previousTitles = new Set(Array.isArray(previous?.titles) ? previous.titles : [])
    const newTitles = currentTitles.filter((title) => !previousTitles.has(title))
    const changed =
      remoteVersion !== String(previous?.version || '') ||
      currentTitles.length !== Number(previous?.count || 0) ||
      newTitles.length > 0

    store.set('bypass.manifestMeta', {
      version: remoteVersion,
      count: currentTitles.length,
      titles: currentTitles,
      updatedAt: payload.updatedAt || new Date().toISOString()
    })

    return {
      success: true,
      changed,
      newTitles,
      manifest: {
        version: remoteVersion,
        updatedAt: payload.updatedAt || '',
        games
      }
    }
  } catch (err) {
    return { success: false, error: err.message || 'Failed to sync bypass manifest' }
  }
})

ipcMain.handle('crack:manifest:sync', async () => {
  try {
    const res = await axios.get(CRACK_MANIFEST_URL, { timeout: 12000 })
    const payload = res?.data || {}
    const games = Array.isArray(payload.games)
      ? payload.games.map(normalizeManifestGame).filter(Boolean)
      : []

    if (!games.length) {
      return { success: false, error: 'Crack manifest has no games' }
    }

    const remoteVersion = String(payload.version || payload.updatedAt || `${games.length}`)
    const currentTitles = games.map((game) => game.title)
    const previous = store.get('crack.manifestMeta')
    const previousTitles = new Set(Array.isArray(previous?.titles) ? previous.titles : [])
    const newTitles = currentTitles.filter((title) => !previousTitles.has(title))
    const changed =
      remoteVersion !== String(previous?.version || '') ||
      currentTitles.length !== Number(previous?.count || 0) ||
      newTitles.length > 0

    store.set('crack.manifestMeta', {
      version: remoteVersion,
      count: currentTitles.length,
      titles: currentTitles,
      updatedAt: payload.updatedAt || new Date().toISOString()
    })

    return {
      success: true,
      changed,
      newTitles,
      manifest: {
        version: remoteVersion,
        updatedAt: payload.updatedAt || '',
        games
      }
    }
  } catch (err) {
    return { success: false, error: err.message || 'Failed to sync crack manifest' }
  }
})

// System info
ipcMain.handle('system:info', async () => {
  return { os: 'Windows 10/11', cpu: 'Intel/AMD Processor', ram: '16GB' }
})



// Window controls
ipcMain.handle('window:minimize', () => mainWindow.minimize())
ipcMain.handle('window:maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize())
ipcMain.handle('window:close', () => mainWindow.close())

// Shell operations
ipcMain.handle('shell:open-external', (_, url) => shell.openExternal(url))
ipcMain.handle('shell:open-path', (_, p) => shell.openPath(p))
ipcMain.handle('asset:path', (_, fileName) => {
  const directPath = path.join(app.getAppPath(), 'assets', fileName)
  if (fs.existsSync(directPath)) return pathToFileURL(directPath).href

  // Fallback for packaged output layouts where assets may live beside app.asar.
  const resourcesPath = path.join(process.resourcesPath, 'assets', fileName)
  if (fs.existsSync(resourcesPath)) return pathToFileURL(resourcesPath).href

  return ''
})

// Notifications
ipcMain.handle('notify', (_, msg) => {
  new Notification({ title: 'HyperDevil', body: msg }).show()
})

// Telemetry polling
let telemetryInterval
async function getTelemetryData() {
  const tryRun = (cmd) => runPowerShell(cmd, 10000).then(o => o.toLowerCase() === 'true').catch(() => false)
  return {
    testSigning: await runPowerShell('bcdedit /enum | Select-String "testsigning"', 10000)
      .then(o => o.match(/testsigning\s+(\w+)/i)?.[1]?.toLowerCase() === 'yes')
      .catch(() => false),
    memoryIntegrity: await tryRun('(Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity" -Name Enabled -ErrorAction SilentlyContinue).Enabled -eq 1'),
    vbs: await tryRun('(Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard" -Name EnableVirtualizationBasedSecurity -ErrorAction SilentlyContinue).EnableVirtualizationBasedSecurity -eq 1'),
    secureBoot: await tryRun('Confirm-SecureBootUEFI -ErrorAction SilentlyContinue'),
    virtualization: await tryRun('$cpu=Get-CimInstance Win32_Processor; [bool](($cpu.VirtualizationFirmwareEnabled -contains $true) -or ($cpu.VMMonitorModeExtensions -contains $true) -or (Get-CimInstance Win32_ComputerSystem).HypervisorPresent)')
  }
}

function startTelemetry() {
  const poll = async () => {
    const data = await getTelemetryData()
    mainWindow?.webContents.send('telemetry:update', data)
  }
  poll()
  telemetryInterval = setInterval(poll, 30000)
}

// Games database handlers
ipcMain.handle('games-db:get', async () => {
  return GAMES_DATABASE
})

ipcMain.handle('games-db:save-state', async (_, state) => {
  try {
    const statePath = path.join(getManagedDownloadDir(), 'download-state.json')
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8')
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('games-db:load-state', async () => {
  try {
    const statePath = path.join(getManagedDownloadDir(), 'download-state.json')
    if (!fs.existsSync(statePath)) return { success: true, state: {} }
    const raw = fs.readFileSync(statePath, 'utf-8')
    return { success: true, state: JSON.parse(raw) }
  } catch (err) {
    return { success: true, state: {} }
  }
})

ipcMain.handle('games-db:get-download-name', async (_, url) => {
  const fileName = url.split('/').pop() || `download-${Date.now()}`
  return fileName
})

const MANIFEST_DIR = path.join(__dirname, 'tools')

// R2 / Cloudflare configuration
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || ''
const CF_API_TOKEN = process.env.CF_API_TOKEN || ''
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID || CF_API_TOKEN
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY || CF_API_TOKEN
const R2_BUCKET = process.env.R2_BUCKET || ''
const R2_ENDPOINT = process.env.R2_ENDPOINT || (CF_ACCOUNT_ID ? `https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com` : '')
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || (CF_ACCOUNT_ID ? `https://pub-${CF_ACCOUNT_ID}.r2.dev` : '')
const AUTO_SYNC_ENABLED = store.get('r2.autoSync', false)

function sha256(data) {
  return crypto.createHash('sha256').update(data, 'utf-8').digest('hex')
}

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data, 'utf-8').digest()
}

function getSigningKey(key, dateStamp, region, service) {
  const kDate = hmac('AWS4' + key, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  return hmac(kService, 'aws4_request')
}

async function uploadToR2(fileName, data) {
  if (!CF_API_TOKEN && !process.env.R2_ACCESS_KEY_ID) {
    return { success: false, error: 'No R2 credentials configured. Set CF_API_TOKEN or R2_ACCESS_KEY_ID env vars.' }
  }
  const key = fileName
  const body = JSON.stringify(data, null, 4)
  const bodyHash = sha256(body)
  const host = new URL(R2_ENDPOINT).host
  const region = 'auto'
  const service = 's3'
  const amzDate = new Date().toISOString().replace(/[:\-]/g, '').split('.')[0] + 'Z'
  const dateStamp = amzDate.slice(0, 8)
  const canonicalUri = '/' + R2_BUCKET + '/' + encodeURIComponent(key).replace(/%2F/g, '/')
  const canonicalQuerystring = ''
  const canonicalHeaders = 'host:' + host + '\n' + 'x-amz-content-sha256:' + bodyHash + '\n' + 'x-amz-date:' + amzDate + '\n'
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonicalRequest = 'PUT\n' + canonicalUri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\n' + signedHeaders + '\n' + bodyHash
  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = dateStamp + '/' + region + '/' + service + '/aws4_request'
  const stringToSign = algorithm + '\n' + amzDate + '\n' + credentialScope + '\n' + sha256(canonicalRequest)
  const signingKey = getSigningKey(R2_SECRET_KEY, dateStamp, region, service)
  const signature = hmac(signingKey, stringToSign).toString('hex')
  const authorizationHeader = algorithm + ' Credential=' + R2_ACCESS_KEY + '/' + credentialScope + ', SignedHeaders=' + signedHeaders + ', Signature=' + signature

  try {
    const url = R2_ENDPOINT + canonicalUri
    const res = await axios.put(url, body, {
      headers: {
        'x-amz-content-sha256': bodyHash,
        'x-amz-date': amzDate,
        'Authorization': authorizationHeader,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })
    const publicUrl = `${R2_PUBLIC_URL}/${key}`
    return { success: true, publicUrl, status: res.status }
  } catch (err) {
    const detail = err.response?.data ? err.response.data.toString() : err.message
    return { success: false, error: detail }
  }
}

// App update info
const UPDATE_PATH = path.join(__dirname, 'update.json')
const REMOTE_UPDATE_URL = `${R2_PUBLIC_URL}/update.json`

async function fetchRemoteUpdate() {
  try {
    const res = await axios.get(REMOTE_UPDATE_URL, { timeout: 10000 })
    if (res.status === 200 && res.data && res.data.expiry) {
      return { success: true, data: res.data }
    }
    return { success: false }
  } catch {
    return { success: false }
  }
}

async function getTrustedTime() {
  const sources = [
    `https://pub-${CF_ACCOUNT_ID}.r2.dev/bypass-manifest.json`,
    `https://pub-${CF_ACCOUNT_ID}.r2.dev/crack-manifest.json`,
    'https://cloudflare.com',
  ]
  for (const url of sources) {
    try {
      const res = await axios.head(url, { timeout: 8000 })
      const dateHeader = res.headers['date']
      if (dateHeader) {
        const ts = Date.parse(dateHeader)
        if (!isNaN(ts)) return ts
      }
    } catch {}
  }
  return null
}

function readLocalUpdate() {
  if (!fs.existsSync(UPDATE_PATH)) return null
  try {
    const raw = fs.readFileSync(UPDATE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function calcExpiry(expiryStr, now) {
  const expiryDate = expiryStr ? new Date(expiryStr).getTime() : null
  const expired = expiryDate ? now > expiryDate : false
  return { expiryDate, expired }
}

ipcMain.handle('app:update-info', async () => {
  try {
    const serverTime = await getTrustedTime()
    const now = serverTime || Date.now()

    const remote = await fetchRemoteUpdate()
    if (remote.success) {
      const { expiryDate, expired } = calcExpiry(remote.data.expiry, now)
      return { success: true, data: { ...remote.data, expired, expiryDate }, serverTime: serverTime ? new Date(serverTime).toISOString() : null }
    }

    const local = readLocalUpdate()
    if (local) {
      const { expiryDate, expired } = calcExpiry(local.expiry, now)
      return { success: true, data: { ...local, expired, expiryDate }, serverTime: serverTime ? new Date(serverTime).toISOString() : null }
    }

    return { success: true, data: { version: '', expiry: null, expired: true, expiryDate: null }, serverTime: serverTime ? new Date(serverTime).toISOString() : null }
  } catch (err) {
    const serverTime = await getTrustedTime()
    return { success: true, data: { version: '', expiry: null, expired: true, expiryDate: null }, serverTime: serverTime ? new Date(serverTime).toISOString() : null }
  }
})

// Store auto-sync preference
ipcMain.handle('r2:get-auto-sync', async () => {
  return { enabled: store.get('r2.autoSync', false) }
})

ipcMain.handle('r2:set-auto-sync', async (_, enabled) => {
  store.set('r2.autoSync', Boolean(enabled))
  return { success: true }
})

ipcMain.handle('manifest:read', async (_, type) => {
  try {
    const fileName = type === 'crack' ? 'crack-manifest.json' : 'bypass-manifest.json'
    const filePath = path.join(MANIFEST_DIR, fileName)
    if (!fs.existsSync(filePath)) return { success: true, data: { version: '1', updatedAt: '', games: [] } }
    let raw = fs.readFileSync(filePath, 'utf-8')
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)
    return { success: true, data: JSON.parse(raw) }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('manifest:write', async (_, type, data) => {
  try {
    const fileName = type === 'crack' ? 'crack-manifest.json' : 'bypass-manifest.json'
    const filePath = path.join(MANIFEST_DIR, fileName)
    const backupDir = path.join(MANIFEST_DIR, '.backups')
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
    if (fs.existsSync(filePath)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupName = `${fileName.replace('.json', '')}-${stamp}.json`
      fs.copyFileSync(filePath, path.join(backupDir, backupName))
    }
    data.updatedAt = new Date().toISOString().split('T')[0]
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8')

    if (AUTO_SYNC_ENABLED || store.get('r2.autoSync', false)) {
      const result = await uploadToR2(fileName, data)
      if (result.success) {
        return { success: true, uploaded: true, publicUrl: result.publicUrl }
      } else {
        return { success: true, uploaded: false, uploadError: result.error }
      }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('manifest:upload-now', async (_, type) => {
  try {
    const fileName = type === 'crack' ? 'crack-manifest.json' : 'bypass-manifest.json'
    const filePath = path.join(MANIFEST_DIR, fileName)
    if (!fs.existsSync(filePath)) return { success: false, error: 'Manifest file not found' }
    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)
    return await uploadToR2(fileName, data)
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('manifest:list-backups', async () => {
  try {
    const backupDir = path.join(MANIFEST_DIR, '.backups')
    if (!fs.existsSync(backupDir)) return { success: true, backups: [] }
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json')).sort().reverse()
    return { success: true, backups: files }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('manifest:restore-backup', async (_, name) => {
  try {
    const backupDir = path.join(MANIFEST_DIR, '.backups')
    const src = path.join(backupDir, name)
    if (!fs.existsSync(src)) return { success: false, error: 'Backup not found' }
    const type = name.startsWith('crack') ? 'crack' : 'bypass'
    const fileName = type === 'crack' ? 'crack-manifest.json' : 'bypass-manifest.json'
    fs.copyFileSync(src, path.join(MANIFEST_DIR, fileName))
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

let _expiryWatchInterval
let _expiryForceInterval
let _expiryActive = false

function startExpiryWatch() {
  const check = async () => {
    try {
      const serverTime = await getTrustedTime()
      const now = serverTime || Date.now()
      let expired = false
      let expiryDate = null

      const remote = await fetchRemoteUpdate()
      if (remote.success) {
        const r = calcExpiry(remote.data.expiry, now)
        expiryDate = r.expiryDate
        expired = r.expired
      } else {
        const local = readLocalUpdate()
        if (local) {
          const r = calcExpiry(local.expiry, now)
          expiryDate = r.expiryDate
          expired = r.expired
        } else {
          expired = true
        }
      }
      if (expired && !_expiryActive) {
        _expiryActive = true
        mainWindow?.webContents.send('app:expired', { localOnly: !serverTime, expiryDate })
        _expiryForceInterval = setInterval(() => {
          mainWindow?.webContents.send('app:expired', { localOnly: !serverTime, expiryDate })
        }, 10000)
      } else if (expired && _expiryActive) {
        mainWindow?.webContents.send('app:expired', { localOnly: !serverTime, expiryDate })
      } else if (!expired) {
        if (_expiryActive) {
          _expiryActive = false
          clearInterval(_expiryForceInterval)
        }
        mainWindow?.webContents.send('app:unexpired')
      }
    } catch {}
  }
  check()
  _expiryWatchInterval = setInterval(check, 30000)
}

app.whenReady().then(() => {
  createWindow()
  startTelemetry()
  startExpiryWatch()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
})

app.on('window-all-closed', () => {
  clearInterval(telemetryInterval)
  process.platform !== 'darwin' && app.quit()
})
