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

