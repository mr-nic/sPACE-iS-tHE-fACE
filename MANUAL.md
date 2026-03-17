# sPACE iS tHE faCE — User Manual

## Overview

A real-time browser face visualiser. Your webcam face is tracked as 478 3D points via MediaPipe, rendered as a depth map, and sampled as horizontal contour lines in the style of Joy Division's Unknown Pleasures. Built for live music visuals and promo video production.

## Getting Started

1. Open in Chrome (local server or GitHub Pages)
2. Allow webcam access
3. Click **⚙** (top-right) to open control panels
4. Click **?** for the in-app quick guide

Two panels appear: **Right** = visualisation controls, **Left** = camera, FX, audio, and timeline.

## Controls Overview

### Right Panel — Visualisation

**Morph time** — controls how smoothly all transitions happen (0 = instant snap, up to 30s). Affects Reset, Random, Home buttons, and timeline cue transitions.

**Lines** — the core Joy Division contour lines. Blur softens the depth map, Displacement sets how much the face pushes the lines, Power curves the depth response, Thickness controls line weight.

**Face depth** — adjusts how deep the eye sockets and mouth appear in the depth map.

**Ghost features** — faint eye and mouth contour overlays drawn on top of the lines. Depth subtract cuts into the main lines, Depth pull deforms lines upward.

**Vertical lines** — perpendicular accent lines through the eye and mouth regions. Density controls how many.

**Point cloud** — the raw 478 face landmarks as dots. Separate opacity for all points, eyes, mouth, and face outline.

**Style** — colour picker for everything, glow amount and spread.

**Layer transforms** — trackball pads to offset ghost features, vertical lines, and point cloud independently. Each has its own scale and rotation.

### Left Panel — Camera & FX

**Webcam feed** — overlays the raw webcam on top of everything (drawn last). Pixelation creates a blocky retro look. Effect modes: Normal, Mono (tinted monochrome), PXL-2000 (lo-fi camcorder with frame ghosting), 1-Bit (black and white threshold). Luma key removes dark or bright pixels (use Invert for bright backgrounds). Cam displacement lock warps the webcam image using the face depth grid.

**Pixel stretch** — a glitch smear effect with multiple blend modes. The two trackball pads control camera offset and stretch axis independently.

**Audio reactive** — enable the mic, then the contour lines respond to sound. Waveform mode scrolls the audio waveform shape across the lines. Freq bands mode maps 23 frequency bands to the 23 lines. Face lock keeps the audio centred on the face position.

**Global** — zoom (0.5×–3×), with a "post-everything" toggle that includes camera/FX in the zoom. Safe area creates an inset boundary with an optional flip-at-boundary effect.

**FX triggers** — trail (frame persistence), colour cycle (rainbow rotation).

**Chaos** — progressive parameter destruction. At low values it adds subtle jitter to sliders. At medium values it shifts colours and boosts displacement. At high values it fires random pulses, strobes, and explosions. At maximum it's a full parameter blitz. **Chaos is locked by default** — Random All won't touch it. When you drop chaos back to zero, everything restores.

**Audio track** — load a .wav or .mp3 file for the performance. Streams from disk (handles large files). Check "Route to audio reactive" to feed it through the contour lines and BPM detector.

**BPM sync** — tap tempo or type a BPM value. Auto-detect listens to the mic or audio track for kick drum onsets. Auto-pulse and auto-strobe fire effects on each beat. Division selector for double/half time.

**Timeline** — a sequencer of visual states synced to your audio track. See the Timeline section below for full workflow.

**Presets** — 4 save/load slots (browser localStorage). Export/Import as JSON.

## Per-Section Buttons

Every section has these buttons in its header:

- **🔓/🔒 Lock** — when locked (orange, shows 🔒), the section is completely protected from Reset All, Random All, and Gentle Reset. Manual slider tweaks still work. **Lock sections you want to keep before hitting Random All.**
- **🏠 Home** — gentle morph back to default values (minimum 2s, uses morph time if higher).
- **⟲ Reset** — returns to defaults. Uses morph time if set, otherwise instant snap.
- **🎲 Random** — randomises the section. Morphs smoothly if morph time is set.
- **Click a label name** — instant snap of that single slider back to its default (always instant, ignores morph time).

## Keyboard Shortcuts

| Key | Effect |
|-----|--------|
| Space | Pulse (temporary thickness boost) |
| I | Toggle invert (negative image) |
| F | Toggle strobe (white flash) |
| E | Explode (lines burst outward) |
| R | Implode (lines collapse inward) |
| N | Next timeline cue |
| Ctrl+Z / Cmd+Z | Undo last change |

## Timeline Workflow

The timeline lets you pre-programme visual changes synced to a music track.

### Building a Timeline

1. **Load your audio track** (Audio track section → Load .wav/.mp3)
2. **Play the track**, pause at the first section change
3. **Set up your look** — adjust sliders, colours, effects for the intro
4. **Hit + Add cue** — this captures your current visual state AND the current audio position as a timestamp
5. **Resume playback**, pause at the next section change
6. **Adjust your look** for the new section, hit + Add cue again
7. **Repeat** for each song section (verse, chorus, breakdown, drop, outro)

### Cue Fields

Each cue shows three editable fields:
- **Timestamp** (blue, m:ss format) — when in the audio track this cue triggers
- **Name** — label for your reference
- **Morph duration** (seconds) — how long the transition takes to reach this state

### Playing Back

- **▶ Play** — starts the audio from the beginning and auto-triggers cues at their timestamps
- **▸ Next** (or press N) — manually jump to the next cue
- **■ Stop** — halt playback

Cues without timestamps fall back to timer-based auto-advance.

### Export/Import

Export saves the full timeline (states + timestamps) as JSON. Import loads it back. You can also import single preset JSON files as individual cues.

## Recording

1. Hit **● REC** to start canvas capture (60fps, 20Mbps)
2. Perform your piece — all FX triggers, cue changes, and chaos levels are logged
3. Hit **■ STOP** — downloads three files:
   - **Video** (.mp4 or .webm)
   - **SRT timecode file** — drag into your video editor (Premiere, DaVinci Resolve) to see event markers as subtitles on the timeline
   - **CSV timecode file** — spreadsheet-friendly version of the same data

## Promo Video Workflow

1. Load your track, enable "Route to audio reactive"
2. Enable BPM auto-detect, turn on auto-pulse
3. Build your timeline: add cues at each song section with appropriate looks
4. Set chaos to 0 for calm sections, cue it up to 80-100% for the drop
5. Hit REC, then Play on the timeline
6. The visuals morph automatically through your cues synced to the music
7. Use keyboard shortcuts (Space, E, F) for extra live hits during the performance
8. Stop recording — get your video + timecode sidecar files

## Technical Notes

- **Browser**: Chrome recommended (WebGL required)
- **Cache**: Press Ctrl+Shift+R after updates to force reload
- **Large audio files**: Streamed, not buffered — 100MB+ wav files work fine
- **Local server**: Required for ES modules — `python -m http.server 8000`
- **Mobile**: Works on Android Chrome (no keyboard shortcuts)

## Files

- `index.html` — page structure, dual control panels, help panel, all UI
- `main.js` — rendering engine, audio, morph system, timeline, chaos, BPM, recording
- `triangulation.js` — 852-triangle face mesh topology from MediaPipe
