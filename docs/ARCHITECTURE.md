# Architecture

## Overview
NoxyMusic is a static site: no build step and no backend. Scripts are plain browser scripts that share one global scope and load in order from `index.html`.

## Modules
- `core.js`: shared helpers, constants and state
- `audio.js`: Web Audio graph, synth voices, reverb and echo
- `notes.js`: scales, note mapping and the on-screen ladder
- `hands.js`: MediaPipe hand tracking and the main animation loop
- `looper.js`: note-event looper and metronome
- `dj.js`: two decks, key detection, transitions and effect pads
- `sampler.js`: record or upload a sound and play it as an instrument
- `faces.js`: emoji face characters tracked with face landmarks
- `record.js`: MediaRecorder with a filtered canvas video track
- `ui.js`, `storage.js`, `theme.js`, `a11y.js`: toasts, saved settings, themes, accessibility
- `beat.js`, `eq.js`: BPM detection, deck sync and EQ
- `shortcuts.js`, `help.js`, `share.js`, `pwa.js`: shortcuts, help dialog, sharing, offline

## Audio graph
Synth voices feed an effects bus (dry, reverb, echo) into the master gain. Deck audio and effect pads feed the DJ output into the master. Master feeds the speakers, a visualizer and the recorder.
