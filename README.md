<div align="center">
  <h1>HyperDevil</h1>
  <p><strong>Windows Boot Configuration Manager for Game Modding</strong></p>
  <p>
    <img src="https://img.shields.io/badge/version-1.0.1-blue" alt="v1.0.1">
    <img src="https://img.shields.io/badge/electron-31-green" alt="Electron 31">
    <img src="https://img.shields.io/badge/platform-windows-lightgrey" alt="Windows">
  </p>
</div>

## Overview

HyperDevil is a Windows desktop application that helps you manage game modding configurations. It provides a unified interface for browsing game bypasses, managing downloads, monitoring system status (Test Signing, Memory Integrity, VBS, Secure Boot), and accessing modding tools.

## Features

- **System Dashboard** — Real-time status of Test Signing Mode, Memory Integrity (Core Isolation), Virtualization-Based Security (VBS), Secure Boot, and Virtualization
- **Bypass Files** — Browse, search, and download game bypass files with automatic SHA-256 verification
- **Crack Files** — Browse and download crack files organized by game cover
- **Guides** — Step-by-step guides for system configuration
- **Tool Downloads** — One-click download of modding tools
- **Cover Art** — Automatic game cover art resolution
- **Download Manager** — Progress overlay with speed, ETA, and parallel downloads with range support

## Installation

Download the latest installer from the Releases page. The app installs to `%PROGRAMFILES%\HyperDevil` and stores data in `%LOCALAPPDATA%\HyperDevil`.

### Requirements

- Windows 10/11 (64-bit)

## Development

## Project Structure

```
├── main.js              # Electron main process
├── preload.js           # Preload script (IPC bridge)
├── renderer/
│   ├── index.html       # UI layout and templates
│   ├── app.js           # Renderer logic
│   └── style.css        # Styles
├── assets/              # Icons, scripts, cover cache
├── tools/               # Bundled manifest tools
├── games-database.js    # Game database
└── crack-manifest.json  # Crack files manifest
```


