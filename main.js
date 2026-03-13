// main.js — Unknown Pleasures face (final)
// Horizontal Joy Division lines + ghost eye/mouth features + vertical accent lines

import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
import { TRIANGULATION } from "./triangulation.js";

const { FaceLandmarker, FilesetResolver } = vision;

// ─── Config ────────────────────────────────────────────────────────
const NUM_LINES    = 23;
const LINE_SAMPLES = 300;
const LINE_COLOR   = "#fff";
const LINE_WIDTH   = 1.6;
const SMOOTH_FACTOR = 0.25;

// ─── DOM ───────────────────────────────────────────────────────────
const video    = document.getElementById("webcam");
const canvas   = document.getElementById("canvas");
const ctx      = canvas.getContext("2d");
const statusEl = document.getElementById("status");

// Sliders
const sl = (id) => document.getElementById(id);
const blurSlider     = sl("blurSlider"),     blurVal     = sl("blurVal");
const dispSlider     = sl("dispSlider"),     dispVal     = sl("dispVal");
const powSlider      = sl("powSlider"),      powVal      = sl("powVal");
const thickSlider    = sl("thickSlider"),    thickVal    = sl("thickVal");
const eyeSlider      = sl("eyeSlider"),      eyeValEl    = sl("eyeVal");
const mouthSlider    = sl("mouthSlider"),    mouthValEl  = sl("mouthVal");
const eyeOpSlider    = sl("eyeOpSlider"),    eyeOpVal    = sl("eyeOpVal");
const mouthOpSlider  = sl("mouthOpSlider"),  mouthOpVal  = sl("mouthOpVal");
const eyeVertSlider  = sl("eyeVertSlider"),  eyeVertVal  = sl("eyeVertVal");
const mouthVertSlider= sl("mouthVertSlider"),mouthVertVal= sl("mouthVertVal");
const vertDensSlider = sl("vertDensSlider"), vertDensVal = sl("vertDensVal");

blurSlider.oninput      = () => blurVal.textContent = blurSlider.value;
dispSlider.oninput      = () => dispVal.textContent = dispSlider.value;
powSlider.oninput       = () => powVal.textContent = (powSlider.value / 100).toFixed(2);
thickSlider.oninput     = () => thickVal.textContent = (thickSlider.value / 10).toFixed(1);
eyeSlider.oninput       = () => { eyeValEl.textContent = (eyeSlider.value / 100).toFixed(2); updateAnatomical(); };
mouthSlider.oninput     = () => { mouthValEl.textContent = (mouthSlider.value / 100).toFixed(2); updateAnatomical(); };
eyeOpSlider.oninput     = () => eyeOpVal.textContent = (eyeOpSlider.value / 100).toFixed(2);
mouthOpSlider.oninput   = () => mouthOpVal.textContent = (mouthOpSlider.value / 100).toFixed(2);
eyeVertSlider.oninput   = () => eyeVertVal.textContent = eyeVertSlider.value == 0 ? "off" : (eyeVertSlider.value / 100).toFixed(2);
mouthVertSlider.oninput = () => mouthVertVal.textContent = mouthVertSlider.value == 0 ? "off" : (mouthVertSlider.value / 100).toFixed(2);
vertDensSlider.oninput  = () => vertDensVal.textContent = vertDensSlider.value;

const colourPicker    = sl("colourPicker"),  colourVal    = sl("colourVal");
const glowSlider      = sl("glowSlider"),    glowValEl    = sl("glowVal");
const glowSpreadSlider= sl("glowSpreadSlider"), glowSpreadVal = sl("glowSpreadVal");

const pcAllSlider     = sl("pcAllSlider"),     pcAllVal     = sl("pcAllVal");
const pcEyeSlider     = sl("pcEyeSlider"),     pcEyeVal     = sl("pcEyeVal");
const pcMouthSlider   = sl("pcMouthSlider"),   pcMouthVal   = sl("pcMouthVal");
const pcOutlineSlider = sl("pcOutlineSlider"), pcOutlineVal = sl("pcOutlineVal");
const pcSizeSlider    = sl("pcSizeSlider"),    pcSizeVal    = sl("pcSizeVal");

colourPicker.oninput     = () => colourVal.textContent = colourPicker.value;
glowSlider.oninput       = () => glowValEl.textContent = glowSlider.value == 0 ? "off" : glowSlider.value;
glowSpreadSlider.oninput = () => glowSpreadVal.textContent = glowSpreadSlider.value;

pcAllSlider.oninput     = () => pcAllVal.textContent = pcAllSlider.value == 0 ? "off" : (pcAllSlider.value / 100).toFixed(2);
pcEyeSlider.oninput     = () => pcEyeVal.textContent = pcEyeSlider.value == 0 ? "off" : (pcEyeSlider.value / 100).toFixed(2);
pcMouthSlider.oninput   = () => pcMouthVal.textContent = pcMouthSlider.value == 0 ? "off" : (pcMouthSlider.value / 100).toFixed(2);
pcOutlineSlider.oninput = () => pcOutlineVal.textContent = pcOutlineSlider.value == 0 ? "off" : (pcOutlineSlider.value / 100).toFixed(2);
pcSizeSlider.oninput    = () => pcSizeVal.textContent = (pcSizeSlider.value / 10).toFixed(1);

// Helper: get current colour with optional alpha
function getColour(alpha) {
  const hex = colourPicker.value;
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  if (alpha !== undefined) return `rgba(${r},${g},${b},${alpha})`;
  return hex;
}

// Helper: apply glow to context
function applyGlow(c) {
  const glowAmt = parseInt(glowSlider.value);
  const spread = parseInt(glowSpreadSlider.value);
  if (glowAmt > 0) {
    c.shadowColor = getColour(glowAmt / 100);
    c.shadowBlur = spread;
  } else {
    c.shadowColor = "transparent";
    c.shadowBlur = 0;
  }
}

function clearGlow(c) {
  c.shadowColor = "transparent";
  c.shadowBlur = 0;
}

// ─── Offscreen canvases ────────────────────────────────────────────
const rawCanvas  = document.createElement("canvas");
const rawCtx     = rawCanvas.getContext("2d");
const blurCanv   = document.createElement("canvas");
const blurCtx    = blurCanv.getContext("2d", { willReadFrequently: true });

// ─── State ─────────────────────────────────────────────────────────
let faceLandmarker = null;
let lastTimestamp  = -1;
let prevGrid       = null;
let currentLandmarks = null;

function resize() {
  canvas.width     = window.innerWidth;
  canvas.height    = window.innerHeight;
  rawCanvas.width  = Math.floor(canvas.width * 0.5);
  rawCanvas.height = Math.floor(canvas.height * 0.5);
  blurCanv.width   = rawCanvas.width;
  blurCanv.height  = rawCanvas.height;
}
window.addEventListener("resize", resize);
resize();

// ─── Anatomical depth ──────────────────────────────────────────────
const aDepth = new Float32Array(478).fill(0.32);

const EYE_INDICES = [22,23,24,25,26,27,28,29,30,31,33,110,111,112,113,130,133,145,
  153,154,155,157,158,159,160,161,163,173,190,243,244,245,246,247,
  252,253,254,255,256,257,258,259,260,261,263,339,340,341,342,359,
  362,374,380,381,382,384,385,386,387,388,390,398,414,463,464,465,466,467];

const MOUTH_INDICES = [0,11,12,13,14,15,16,17,37,38,39,40,41,42,61,62,72,73,74,76,77,78,
  80,81,82,84,85,86,87,88,89,90,91,95,96,146,178,179,180,181,183,184,
  185,191,267,268,269,270,271,272,291,292,302,303,304,306,307,308,310,
  311,312,314,315,316,317,318,319,320,321,324,325,375,402,403,404,405,
  407,408,409,415];

// Left eye contour, right eye contour, outer lips contour (for ghost rendering)
const LEFT_EYE_CONTOUR = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246,
  30,29,28,27,56,190,243,112,26,22,23,24,110,25];
const RIGHT_EYE_CONTOUR = [263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466,
  260,259,258,257,286,414,463,341,256,252,253,254,339,255];
const OUTER_LIPS = [61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,
  37,39,40,185];

function setBaseAnatomical() {
  aDepth.fill(0.32);
  [1,2,3,4,5,6,19,94,141,370].forEach(i => aDepth[i] = 1.0);
  [168,197,195,9,8].forEach(i => { if(i<478) aDepth[i] = 0.82; });
  [48,49,50,51,97,98,115,131,134,198,209,217,218,219,220,
   278,279,280,281,327,328,344,360,363,429,437,438,439,440]
    .forEach(i => { if(i<478) aDepth[i] = 0.65; });
  [36,50,101,116,117,118,119,123,126,142,203,205,206,207,212,
   266,280,330,345,346,347,348,352,355,371,423,425,426,427,432]
    .forEach(i => { if(i<478) aDepth[i] = 0.52; });
  [10,21,54,67,68,69,103,104,108,109,151,234,251,284,297,298,299,
   332,333,337,338,66,105,63,70,107,336,296,334,293,300]
    .forEach(i => { if(i<478) aDepth[i] = 0.48; });
  [63,66,70,105,107,46,53,52,65,55,285,295,282,283,296,336,334,293,300,276]
    .forEach(i => { if(i<478) aDepth[i] = 0.55; });
  [148,149,150,152,169,170,171,172,175,176,199,200,208,210,211,214,
   32,377,378,379,394,395,396,397,400,401,428,430,431,434,262]
    .forEach(i => { if(i<478) aDepth[i] = 0.35; });
  [93,127,132,136,137,138,139,140,162,164,165,166,167,177,192,
   213,215,356,361,365,366,367,368,369,391,411,416,435,454,58,288,323,389]
    .forEach(i => { if(i<478) aDepth[i] = 0.03; });
}

function updateAnatomical() {
  setBaseAnatomical();
  const eyeD = eyeSlider.value / 100;
  const mouthD = mouthSlider.value / 100;
  EYE_INDICES.forEach(i => { if(i<478) aDepth[i] = eyeD; });
  MOUTH_INDICES.forEach(i => { if(i<478) aDepth[i] = mouthD; });
}

setBaseAnatomical();
EYE_INDICES.forEach(i => { if(i<478) aDepth[i] = 0.08; });
MOUTH_INDICES.forEach(i => { if(i<478) aDepth[i] = 0.52; });

function getDepth(lm, index) {
  const realZ = Math.max(0, Math.min(1, (-lm.z * 4) + 0.5));
  return aDepth[index] * 0.8 + realZ * 0.2;
}

// ─── Init MediaPipe ────────────────────────────────────────────────
async function initFaceLandmarker() {
  statusEl.textContent = "Loading WASM runtime…";
  const resolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  statusEl.textContent = "Loading face model…";
  faceLandmarker = await FaceLandmarker.createFromOptions(resolver, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });
  statusEl.textContent = "Starting webcam…";
}

async function startWebcam() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });
  video.srcObject = stream;
  return new Promise(r => { video.onloadeddata = () => { video.play(); r(); }; });
}

// ─── Render depth mesh to offscreen + blur ─────────────────────────
function renderDepth(landmarks) {
  const W = rawCanvas.width;
  const H = rawCanvas.height;
  const power = powSlider.value / 100;

  rawCtx.fillStyle = "#000";
  rawCtx.fillRect(0, 0, W, H);

  for (let i = 0; i < TRIANGULATION.length; i += 3) {
    const i0 = TRIANGULATION[i];
    const i1 = TRIANGULATION[i + 1];
    const i2 = TRIANGULATION[i + 2];
    if (i0 >= landmarks.length || i1 >= landmarks.length || i2 >= landmarks.length) continue;

    const lm0 = landmarks[i0], lm1 = landmarks[i1], lm2 = landmarks[i2];
    const x0 = lm0.x * W, y0 = lm0.y * H;
    const x1 = lm1.x * W, y1 = lm1.y * H;
    const x2 = lm2.x * W, y2 = lm2.y * H;

    const avgD = (getDepth(lm0, i0) + getDepth(lm1, i1) + getDepth(lm2, i2)) / 3;
    const b = Math.round(Math.pow(avgD, power) * 255);

    rawCtx.beginPath();
    rawCtx.moveTo(x0, y0);
    rawCtx.lineTo(x1, y1);
    rawCtx.lineTo(x2, y2);
    rawCtx.closePath();
    rawCtx.fillStyle = `rgb(${b},${b},${b})`;
    rawCtx.fill();
  }

  const blurR = parseInt(blurSlider.value);
  blurCtx.clearRect(0, 0, blurCanv.width, blurCanv.height);
  blurCtx.filter = blurR > 0 ? `blur(${blurR}px)` : "none";
  blurCtx.drawImage(rawCanvas, 0, 0);
  blurCtx.filter = "none";
}

// ─── Build grid from blurred depth ─────────────────────────────────
function buildGrid() {
  const W = blurCanv.width;
  const H = blurCanv.height;
  const pixels = blurCtx.getImageData(0, 0, W, H).data;
  const maxDisp = parseInt(dispSlider.value);
  const grid = [];

  const margin = H * 0.04;
  const topY = margin;
  const bottomY = H - margin;

  for (let row = 0; row < NUM_LINES; row++) {
    const line = new Float32Array(LINE_SAMPLES);
    const py = Math.floor(topY + (row / (NUM_LINES - 1)) * (bottomY - topY));
    for (let col = 0; col < LINE_SAMPLES; col++) {
      const px = Math.floor((col / (LINE_SAMPLES - 1)) * (W - 1));
      const idx = (py * W + px) * 4;
      line[col] = (pixels[idx] / 255) * maxDisp;
    }
    grid.push(line);
  }
  return grid;
}

// ─── Temporal smoothing ────────────────────────────────────────────
function smoothGrid(newGrid) {
  if (!prevGrid) { prevGrid = newGrid; return newGrid; }
  const out = [];
  for (let row = 0; row < NUM_LINES; row++) {
    const line = new Float32Array(LINE_SAMPLES);
    for (let col = 0; col < LINE_SAMPLES; col++) {
      line[col] = prevGrid[row][col] * SMOOTH_FACTOR + newGrid[row][col] * (1 - SMOOTH_FACTOR);
    }
    out.push(line);
  }
  prevGrid = out;
  return out;
}

// ─── Draw ghost features (eyes/mouth) ON TOP of lines ──────────────
function drawGhostFeatures(landmarks) {
  const W = canvas.width;
  const H = canvas.height;
  const eyeOp   = eyeOpSlider.value / 100;
  const mouthOp = mouthOpSlider.value / 100;

  if (eyeOp > 0) {
    applyGlow(ctx);
    ctx.strokeStyle = getColour(eyeOp);
    ctx.lineWidth = 1.2;

    [LEFT_EYE_CONTOUR, RIGHT_EYE_CONTOUR].forEach(contour => {
      ctx.beginPath();
      contour.forEach((idx, j) => {
        if (idx >= landmarks.length) return;
        const lm = landmarks[idx];
        if (j === 0) ctx.moveTo(lm.x * W, lm.y * H);
        else ctx.lineTo(lm.x * W, lm.y * H);
      });
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = getColour(eyeOp * 0.3);
      ctx.fill();
    });
    clearGlow(ctx);
  }

  if (mouthOp > 0) {
    applyGlow(ctx);
    ctx.strokeStyle = getColour(mouthOp);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    OUTER_LIPS.forEach((idx, j) => {
      if (idx >= landmarks.length) return;
      const lm = landmarks[idx];
      if (j === 0) ctx.moveTo(lm.x * W, lm.y * H);
      else ctx.lineTo(lm.x * W, lm.y * H);
    });
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = getColour(mouthOp * 0.3);
    ctx.fill();
    clearGlow(ctx);
  }
}

// ─── Draw vertical accent lines through eyes/mouth ─────────────────
function drawVerticalLines(landmarks) {
  const W = canvas.width;
  const H = canvas.height;
  const eyeVertOp   = eyeVertSlider.value / 100;
  const mouthVertOp = mouthVertSlider.value / 100;
  const density     = parseInt(vertDensSlider.value);

  if (eyeVertOp <= 0 && mouthVertOp <= 0) return;

  // Helper: get bounding box of a set of landmark indices
  function getBBox(indices) {
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (const idx of indices) {
      if (idx >= landmarks.length) continue;
      const lm = landmarks[idx];
      if (lm.x < minX) minX = lm.x;
      if (lm.x > maxX) maxX = lm.x;
      if (lm.y < minY) minY = lm.y;
      if (lm.y > maxY) maxY = lm.y;
    }
    return { minX, maxX, minY, maxY };
  }

  // Draw vertical lines within a bbox region
  function drawVerts(indices, opacity) {
    if (opacity <= 0) return;
    const box = getBBox(indices);
    const padX = (box.maxX - box.minX) * 0.1;
    const left  = (box.minX - padX) * W;
    const right = (box.maxX + padX) * W;
    const top   = box.minY * H;
    const bot   = box.maxY * H;
    const step  = (right - left) / (density + 1);

    applyGlow(ctx);
    ctx.strokeStyle = getColour(opacity);
    ctx.lineWidth = 0.8;

    for (let i = 1; i <= density; i++) {
      const x = left + i * step;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bot);
      ctx.stroke();
    }
  }

  if (eyeVertOp > 0) {
    drawVerts(LEFT_EYE_CONTOUR, eyeVertOp);
    drawVerts(RIGHT_EYE_CONTOUR, eyeVertOp);
  }
  if (mouthVertOp > 0) {
    drawVerts(OUTER_LIPS, mouthVertOp);
  }
  clearGlow(ctx);
}

// ─── Draw Joy Division lines ───────────────────────────────────────
function drawLines(grid) {
  const W = canvas.width;
  const H = canvas.height;
  const margin  = H * 0.04;
  const topY    = margin;
  const bottomY = H - margin;
  const lineGap = (bottomY - topY) / (NUM_LINES - 1);
  const sampleW = W / (LINE_SAMPLES - 1);
  const colour  = getColour();

  for (let row = 0; row < NUM_LINES; row++) {
    const baseY = topY + row * lineGap;

    // Black occlusion fill (no glow on fill)
    clearGlow(ctx);
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let col = 0; col < LINE_SAMPLES; col++) {
      ctx.lineTo(col * sampleW, baseY - grid[row][col]);
    }
    ctx.lineTo(W, baseY);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = "#000";
    ctx.fill();

    // Coloured line stroke with glow
    applyGlow(ctx);
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let col = 0; col < LINE_SAMPLES; col++) {
      ctx.lineTo(col * sampleW, baseY - grid[row][col]);
    }
    ctx.lineTo(W, baseY);
    ctx.strokeStyle = colour;
    ctx.lineWidth   = thickSlider.value / 10;
    ctx.stroke();
    clearGlow(ctx);
  }
}

// ─── Face outline indices (silhouette) ─────────────────────────────
const FACE_OUTLINE = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,
  400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];

// ─── Draw point cloud ──────────────────────────────────────────────
function drawPointCloud(landmarks) {
  const W = canvas.width;
  const H = canvas.height;
  const dotR = pcSizeSlider.value / 10;
  const allOp     = pcAllSlider.value / 100;
  const eyeOp     = pcEyeSlider.value / 100;
  const mouthOp   = pcMouthSlider.value / 100;
  const outlineOp = pcOutlineSlider.value / 100;

  if (allOp <= 0 && eyeOp <= 0 && mouthOp <= 0 && outlineOp <= 0) return;

  // Build a set of which indices to draw and at what opacity
  const pointOpacity = new Float32Array(478);

  // All points (lowest priority)
  if (allOp > 0) {
    for (let i = 0; i < 478; i++) pointOpacity[i] = allOp;
  }

  // Outline (overrides all if higher)
  if (outlineOp > 0) {
    FACE_OUTLINE.forEach(i => {
      if (i < 478) pointOpacity[i] = Math.max(pointOpacity[i], outlineOp);
    });
  }

  // Eyes (overrides)
  if (eyeOp > 0) {
    [...LEFT_EYE_CONTOUR, ...RIGHT_EYE_CONTOUR, ...EYE_INDICES].forEach(i => {
      if (i < 478) pointOpacity[i] = Math.max(pointOpacity[i], eyeOp);
    });
  }

  // Mouth (overrides)
  if (mouthOp > 0) {
    [...OUTER_LIPS, ...MOUTH_INDICES].forEach(i => {
      if (i < 478) pointOpacity[i] = Math.max(pointOpacity[i], mouthOp);
    });
  }

  applyGlow(ctx);
  for (let i = 0; i < landmarks.length && i < 478; i++) {
    const op = pointOpacity[i];
    if (op <= 0) continue;

    const lm = landmarks[i];
    const x = lm.x * W;
    const y = lm.y * H;

    ctx.fillStyle = getColour(op);
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();
  }
  clearGlow(ctx);
}

// ─── Main render ───────────────────────────────────────────────────
function render(landmarks, grid) {
  const W = canvas.width;
  const H = canvas.height;

  // 1. Clear to black
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  // Mirror the canvas so it feels like a mirror
  ctx.save();
  ctx.translate(W, 0);
  ctx.scale(-1, 1);

  // 2. Joy Division horizontal lines (with occlusion)
  drawLines(grid);

  // 3. Ghost eye/mouth features (on top of lines)
  drawGhostFeatures(landmarks);

  // 4. Vertical accent lines
  drawVerticalLines(landmarks);

  // 5. Point cloud (on top of everything)
  drawPointCloud(landmarks);

  ctx.restore();
}

// ─── Render loop ───────────────────────────────────────────────────
function renderLoop() {
  if (!faceLandmarker) { requestAnimationFrame(renderLoop); return; }

  const now = performance.now();
  if (now <= lastTimestamp) { requestAnimationFrame(renderLoop); return; }
  lastTimestamp = now;

  const result = faceLandmarker.detectForVideo(video, now);

  if (result.faceLandmarks && result.faceLandmarks.length > 0) {
    currentLandmarks = result.faceLandmarks[0];
    renderDepth(currentLandmarks);
    let grid = buildGrid();
    grid = smoothGrid(grid);
    render(currentLandmarks, grid);
    statusEl.textContent = "";
  } else {
    const grid = prevGrid || Array.from({ length: NUM_LINES }, () => new Float32Array(LINE_SAMPLES));
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawLines(grid);
    statusEl.textContent = "No face detected";
  }

  requestAnimationFrame(renderLoop);
}

async function main() {
  try {
    await initFaceLandmarker();
    await startWebcam();
    statusEl.textContent = "Tracking…";
    renderLoop();
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
    console.error(err);
  }
}

main();
