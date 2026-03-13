# sPACE iS tHE faCE

Real-time Joy Division–style face visualiser. Your webcam face becomes deformable contour lines, ghost features, and point clouds on a black void.

Built for live music visuals and MIDI performance. Pure browser JS — no build tools, no backend.

## How it works

- **MediaPipe FaceLandmarker** tracks 478 3D face landmarks from your webcam in real time
- The face mesh (852 triangles) is rendered as a depth map using anatomical depth values
- Horizontal lines sample that depth map — flat where there's no face, deformed where there is
- Ghost eye/mouth contours, vertical accent lines, and a full point cloud layer on top
- Everything responds to a colour picker and glow controls

## Run it

Drop the files in a folder and serve locally:

```
python -m http.server 8000
```

Open `http://localhost:8000` in Chrome. Allow webcam access.

Click ⚙ (top-right) to open the control panel.

## Controls

**Lines** — blur, displacement, power curve, thickness

**Face depth** — eye socket and mouth depth tuning

**Ghost features** — faint eye and mouth contour overlays

**Vertical lines** — perpendicular accent lines through eyes/mouth

**Style** — colour picker, glow intensity and spread

**Point cloud** — toggle all points, eyes, mouth, face outline, dot size

## Files

- `index.html` — page structure and control panel
- `main.js` — all rendering logic (MediaPipe, depth map, Joy Division lines, effects)
- `triangulation.js` — 852-triangle face mesh topology extracted from MediaPipe

## Tech

- [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) (FaceLandmarker API)
- 2D Canvas for all rendering
- No frameworks, no build step, no dependencies beyond CDN imports

## Requirements

- Modern browser with WebGL (Chrome recommended)
- Webcam
- Local HTTP server (ES modules need it — `python -m http.server` works fine)

## Roadmap

- [ ] Web MIDI API integration (trigger effects from DAW / controller)
- [ ] Audio waveform riding along the contour lines
- [ ] Particle emissions from point cloud (eyes, mouth)
- [ ] Integration with [Daniel Aagentah's nw_wrld](https://github.com/danielaagentah)
- [ ] Preset save/load

## Credits

Inspired by Peter Saville's iconic cover art for Joy Division's *Unknown Pleasures* (1979), itself based on a pulsar chart by Harold Craft.

Face tracking powered by Google MediaPipe.

## Licence

MIT
