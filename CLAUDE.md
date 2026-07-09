# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-file static music player (`index.html`) deployed on Vercel via GitHub. No build step, no dependencies, no package manager.

## Deploy

Push to `main` → Vercel auto-deploys. No manual steps needed.
Remote: `https://github.com/hksonngan/kimngan-test-music`

## Local testing

```
cd E:\Dev\kimngan-test-music
python -m http.server 8080
```
Open `http://localhost:8080`. Must use HTTP (not `file://`) for Web Audio API (EQ/visualizer) and Service Worker.

## Architecture

Everything lives in `index.html` (~900 lines). Key sections in order:

- **CSS custom properties** — `--accent`, `--accent-dark`, `--player-bg`, `--track-bg` in `:root`
- **HTML** — cover-wrap (canvas + vizCanvas overlay), controls, volume, EQ section, sleep row, file picker, playlist
- **`const songs`** — array of `{ name, artist, src, eq }`. `src` = relative path `songs/XX.mp3`. `eq` = preset `{ bass, mid, treble }`.
- **`drawCover(title, artist)`** — deterministic gradient canvas art from song name hash
- **`loadSong(autoplay)`** — always `audio.pause()` before src swap (Safari), then `audio.play()` or `audio.load()`
- **`updateMediaSession()`** — sets lock screen metadata + artwork from canvas `toDataURL()`
- **`renderPlaylist()`** — uses `createElement + textContent` (NOT innerHTML — XSS risk from local filenames)
- **`EQ_BANDS` lookup** — `{ bass, mid, treble }` → filter node + slider/dB element IDs. Used by `setEQ` and `loadEQ`
- **`eqStore`** — `{ [idx]: { bass, mid, treble } }` for user overrides. Falls back to `songs[idx].eq` preset, then `{0,0,0}`. `resetEQ()` deletes override to restore preset.
- **Visualizer** — `vizLoop()` single RAF loop. `vizAlpha` fades bars on pause using `lastData` snapshot. Restarts on `play` if `!vizRaf`.
- **Media Session API** — all 7 handlers: `play`, `pause`, `nexttrack`, `previoustrack`, `seekforward`, `seekbackward`, `seekto`

## Features

- **iPod Air controls** — double-click = next, triple-click = prev (via Media Session `nexttrack`/`previoustrack`)
- **Offline / PWA** — Service Worker caches all assets. `manifest.json` enables Add to Home Screen on iPhone
- **EQ** — 3-band (Bass 200Hz lowshelf, Mid 1kHz peaking, Treble 3kHz highshelf), per-song presets + user override
- **Visualizer** — frequency bars overlay on spinning vinyl cover art
- **Shuffle** — `nextIdx()` picks random non-current index when `shuffle=true`
- **Repeat** — `none/all/one`, handled in `audio.addEventListener('ended', ...)`
- **Sleep timer** — single `setInterval` every 30s, pauses audio when remaining ≤ 0
- **Keyboard** — Space (play/pause), ←→ seek 5s, ↑↓ volume, N/P (next/prev)
- **Swipe** — touchstart/touchend on `.cover-wrap`, dx threshold 40px
- **Local files** — file picker loads blob URLs, clears `eqStore`, replaces `songs` array

## Key Safari/iOS constraints

- `audio.pause()` before `audio.src` swap — Safari decoder gets stuck otherwise
- `audio.crossOrigin = 'anonymous'` must be set **before** first `src` assignment (set at page init, guarded by `location.protocol !== 'file:'`)
- File input must **not** use `hidden` attribute — use `position:fixed; top:-200px` inside `<label>`
- `accept` uses explicit extensions `.mp3,.m4a,.aac,.wav,.flac,.ogg` not `audio/*`
- Web Audio API (`initAudioGraph`) returns early on `file://` — EQ/visualizer only work on http(s)
- `setSleep()` uses explicit `btn` parameter — never implicit `event` global (crashes when called from setTimeout)

## Service Worker

`sw.js` caches all assets on install (`skipWaiting` only on success). Range request handler manually slices `ArrayBuffer` from cache to synthesize 206 responses — required because `cache.match()` returns full files, not partial ranges. Bump `CACHE` version string when changing cached assets.

## What's not done yet (possible next steps)

- Persist EQ/shuffle/repeat state via `localStorage`
- Crossfade between tracks (Web Audio `GainNode`)
- Playlist drag-and-drop reorder
- Search/filter in playlist
