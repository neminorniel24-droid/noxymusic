# Architecture

## Overview
NoxyMusic is a static site: no backend. The code is plain ES modules loaded from `js/main.js`. There is no bundler, so what you edit is what the browser runs.

## Modules
- `main.js`: entry point, imports every feature module in order
- `state.js`: the shared mutable state `S` (audio nodes, camera, looper) and the decks registry `D`
- `core.js`: DOM helpers, instrument presets, video filters, tab switching
- `audio.js`: the whole audio graph in one place (voices, effects, deck chains with EQ, limiter, recorder tap)
- `notes.js`, `hands.js`: scale and note ladder, hand tracking and the main animation loop
- `looper.js`, `dj.js`, `sampler.js`, `faces.js`, `record.js`: the looper, DJ decks and effects, sampler, face characters, recording
- `beat.js`, `eq.js`, `platter.js`, `lights.js`, `loud.js`: BPM sync, EQ sliders, round decks, light show, volume
- `ui.js`, `storage.js`, `theme.js`, `a11y.js`, `shortcuts.js`, `help.js`, `share.js`, `pwa.js`: toasts, saved settings, themes, accessibility, shortcuts, help, sharing, offline
- `lib/`: pure logic with no DOM (music math, key detection, BPM detection). These files must not import anything outside `lib/`, and they are unit tested.

## Audio graph
Synth voices feed an effects bus (dry, reverb, echo) into the master gain. Each deck runs through three EQ bands and a filter into the DJ output, which also receives the effect pads. Master feeds an analyser, then a compressor and soft clipper (so volume up to 200% cannot distort), then the speakers and the recorder.

## Page markup
All panels live in `index.html`. Modules only bind to existing elements. A test fails if code looks up an id that is missing from the page.

## Tooling
- `npm run lint`: ESLint finds undefined or unused names
- `npm run check`: syntax, file references, unreachable modules, and a current `sw.js`
- `npm test`: unit tests plus a full page run in jsdom with fake audio and camera
- `npm run build`: regenerates the file list and cache name in `sw.js`
