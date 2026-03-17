# sPACE iS tHE faCE

Real-time Joy Division–style face visualiser. Your webcam face becomes deformable contour lines, ghost features, point clouds, and glitch FX on a black void.

Built for live music visuals and MIDI performance. Pure browser JS — no build tools, no backend.

**[Try it live →](https://mr-nic.github.io/sPACE-iS-tHE-fACE/)**

## How it works

- **MediaPipe FaceLandmarker** tracks 478 3D face landmarks from your webcam in real time
- The face mesh (852 triangles) is rendered as a depth map with anatomical eye/mouth weighting
- 23 horizontal lines sample that depth map — flat where there's no face, deformed where there is
- Ghost eye/mouth contours, vertical accent lines, and a full point cloud layer on top
- Webcam feed overlay with pixelation, luma key, and retro effects (Mono/PXL-2000/1-Bit)
- Pixel stretch glitch engine with multiple blend modes
- Audio reactive mode — waveform or frequency bands riding the contour lines
- Everything morphs smoothly between states with configurable transition time

## Run it

Drop the files in a folder and serve locally:

```
python -m http.server 8000
```

Open `http://localhost:8000` in Chrome. Allow webcam access.

Click ⚙ (top-right) to open the control panels.

## Controls

### Right panel — Visualisation

**Lines** — blur, displacement (0–300), power curve (0–2.0), thickness (0.1–24px)

**Face depth** — eye socket and mouth depth weighting

**Ghost features** — eye/mouth contour overlays with opacity, depth subtract (cuts lines), depth pull (deforms lines upward)

**Vertical lines** — perpendicular accent lines through eyes/mouth with density control

**Point cloud** — 478 landmarks with per-region opacity (all/eyes/mouth/outline), dot size

**Style** — colour picker, glow amount and spread

**Layer transforms** — per-layer trackball offset, scale, and rotation (ghost/verts/points)

### Left panel — Camera & FX

**Webcam overlay** — opacity, pixelation (1–48px blocks), effect mode (Normal/Mono/PXL-2000/1-Bit), luma key, contrast, blur, scale. Cam displacement lock warps the webcam image with the face depth grid.

**Pixel stretch** — glitch smear with opacity, amount, position, density, contrast, colour cycle, scale, explode. Blend modes: Normal / Face cuts stretch / Stretch cuts feed / XOR / Feed masks stretch / Colour burn.

**Audio reactive** — mic input via Web Audio API. Waveform mode (scrolling time-domain shape) or Freq bands mode (23 bands mapped to lines). Controls for mix, gain, scroll speed/direction, face lock.

**Global** — zoom (0.5×–3×) with post-everything toggle, safe area (0–40% inset) with flip-at-boundary.

**FX triggers** — trail with safe-area clipping option, colour cycle speed.

**Presets** — 4 save/load slots, JSON export/import.

### Keyboard shortcuts

| Key | Effect |
|-----|--------|
| Space | Pulse |
| I | Invert |
| F | Strobe |
| E | Explode |
| R | Implode |

### Per-section controls

Every section has 🔒 Lock, 🏠 Home, ⟲ Reset, and 🎲 Randomise buttons. Lock blocks all automation (Reset All, Random All, Gentle Reset) while keeping manual control. Global morph time controls transition speed (0–30s).

### Recording

Canvas capture at 60fps/20Mbps. Auto codec selection: H.264/MP4 first, falls back to VP9/VP8/WebM.

## Files

- `index.html` — page structure, dual control panels, all UI
- `main.js` — rendering engine (MediaPipe, depth map, contour lines, webcam FX, audio, morph system, presets)
- `triangulation.js` — 852-triangle face mesh topology from MediaPipe

## Tech

- [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) (FaceLandmarker API)
- Web Audio API (mic input, analyser node)
- 2D Canvas for all rendering (multiple offscreen canvases for compositing)
- MediaRecorder API for canvas capture
- No frameworks, no build step, no dependencies beyond CDN imports

## Requirements

- Modern browser with WebGL (Chrome recommended)
- Webcam
- Local HTTP server (ES modules need it — `python -m http.server` works fine)
- Microphone (optional, for audio reactive mode)

## Roadmap

- [ ] Promo timeline — preset morphing with cue points for song sections
- [ ] Web MIDI API integration (map CC/notes to parameters, drums to triggers)
- [ ] Integration with [Daniel Aagentah's nw_wrld](https://github.com/danielaagentah)
- [ ] Remote phone control via WebRTC/WebSocket
- [ ] Offline mode — bundle MediaPipe WASM + model locally

## Credits

Inspired by Peter Saville's iconic cover art for Joy Division's *Unknown Pleasures* (1979), itself based on a pulsar chart by Harold Craft.

Face tracking powered by Google MediaPipe.

## Licence

MIT
