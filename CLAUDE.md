# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-file static music player (`index.html`) deployed on Vercel via GitHub. No build step, no dependencies, no package manager.

## Deploy

Push to `main` → Vercel auto-deploys. No manual steps needed.
Remote: `https://github.com/hksonngan/kimngan-test-music`

## Architecture

Everything lives in `index.html`:
- **Song list** — `const songs` array at the top of the `<script>`. Each entry: `{ name, artist, image, src }`. `src` can be a remote URL or relative path like `songs/file.mp3`.
- **Playback** — single `<audio id="audio">` element. `loadSong(autoplay)` swaps `audio.src` and optionally calls `audio.play()`. Always calls `audio.pause()` before swapping src (Safari decoder requirement).
- **State** — `idx` (current song index), `songs` array (mutated in-place when local files are loaded).
- **Media Session API** — all 7 handlers registered: `play`, `pause`, `nexttrack`, `previoustrack`, `seekforward`, `seekbackward`, `seekto`. This is what makes iPod Air headphone button controls work. `setPositionState` is called on `timeupdate` for the iOS lock screen scrubber.
- **Local file loading** — `loadLocalFiles()` revokes old blob URLs, replaces `songs` array with `File` objects wrapped as blob URLs, calls `renderPlaylist()`.
- **Playlist UI** — `renderPlaylist()` rebuilds the `#playlist` div from scratch on every song change.

## Key Safari/iOS constraints

- `audio.pause()` must be called before changing `audio.src` — otherwise Safari's decoder gets stuck between tracks.
- File input must **not** use the `hidden` attribute — use `position:fixed; top:-200px` instead. The input must stay inside the `<label>` for iOS to forward the tap correctly.
- `accept` on the file input uses explicit extensions (`.mp3,.m4a,.aac,.wav,.flac,.ogg`) not `audio/*`.
