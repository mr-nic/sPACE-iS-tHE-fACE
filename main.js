// main.js — sPACE iS tHE faCE
import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
import { TRIANGULATION } from "./triangulation.js";
const { FaceLandmarker, FilesetResolver } = vision;

const NUM_LINES = 23, LINE_SAMPLES = 300, SMOOTH_FACTOR = 0.25;

const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const sl = id => document.getElementById(id);

const SLIDER_IDS = [
  "blurSlider","dispSlider","powSlider","thickSlider",
  "eyeSlider","mouthSlider","camMixSlider",
  "eyeOpSlider","mouthOpSlider","ghostSubSlider","ghostPullSlider",
  "eyeVertSlider","mouthVertSlider","vertDensSlider",
  "pcAllSlider","pcEyeSlider","pcMouthSlider","pcOutlineSlider","pcSizeSlider",
  "glowSlider","glowSpreadSlider",
  "ghostScaleSlider","vertScaleSlider","pcScaleSlider",
  "ghostRotSlider","vertRotSlider","pcRotSlider",
  "camPixelSlider","camLumaSlider","camContrastSlider","camScaleSlider","camBlurSlider",
  "stretchOpSlider","stretchAmtSlider","stretchPosSlider",
  "stretchDensSlider","stretchContSlider","stretchHueSlider","stretchScaleSlider","stretchExplodeSlider",
  "audioMixSlider","audioGainSlider","audioScrollSlider",
  "globalZoomSlider","safeAreaSlider","trailSlider","colourCycleSlider",
  "morphTimeSlider"
];

// ─── Section groups for reset/randomise ────────────────────────────
const SECTIONS = {
  lines:      { sliders:["blurSlider","dispSlider","powSlider","thickSlider"] },
  depth:      { sliders:["eyeSlider","mouthSlider"] },
  ghost:      { sliders:["eyeOpSlider","mouthOpSlider","ghostSubSlider","ghostPullSlider"] },
  vlines:     { sliders:["eyeVertSlider","mouthVertSlider","vertDensSlider"] },
  pc:         { sliders:["pcAllSlider","pcEyeSlider","pcMouthSlider","pcOutlineSlider","pcSizeSlider"] },
  style:      { sliders:["glowSlider","glowSpreadSlider"], colour:true },
  transforms: { sliders:["ghostScaleSlider","vertScaleSlider","pcScaleSlider","ghostRotSlider","vertRotSlider","pcRotSlider"], trackballs:["ghost","vert","pc"] },
  cam:        { sliders:["camMixSlider","camPixelSlider","camLumaSlider","camContrastSlider","camBlurSlider","camScaleSlider"], trackballs:["cam"], selects:["camFxMode"], checkboxes:["camDispLock"] },
  stretch:    { sliders:["stretchOpSlider","stretchAmtSlider","stretchPosSlider","stretchDensSlider","stretchContSlider","stretchHueSlider","stretchScaleSlider","stretchExplodeSlider"], trackballs:["stretch"], selects:["stretchBlend"] },
  audio:      { sliders:["audioMixSlider","audioGainSlider","audioScrollSlider"], checkboxes:["audioFaceLock"], selects:["audioMode"] },
  global:     { sliders:["globalZoomSlider","safeAreaSlider"], checkboxes:["safeFlipCheck","zoomAllCheck"] },
  fx:         { sliders:["trailSlider","colourCycleSlider"], checkboxes:["trailSafeClip"] }
};

// ─── Slider wiring ─────────────────────────────────────────────────
const fmts = {
  blurSlider: s=>s.value, dispSlider: s=>s.value,
  powSlider: s=>(s.value/100).toFixed(2), thickSlider: s=>(s.value/10).toFixed(1),
  eyeSlider: s=>(s.value/100).toFixed(2), mouthSlider: s=>(s.value/100).toFixed(2),
  camMixSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  eyeOpSlider: s=>(s.value/100).toFixed(2), mouthOpSlider: s=>(s.value/100).toFixed(2),
  ghostSubSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  ghostPullSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  eyeVertSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  mouthVertSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  vertDensSlider: s=>s.value,
  pcAllSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  pcEyeSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  pcMouthSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  pcOutlineSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  pcSizeSlider: s=>(s.value/10).toFixed(1),
  glowSlider: s=>s.value==0?"off":s.value, glowSpreadSlider: s=>s.value,
  ghostScaleSlider: s=>(s.value/100).toFixed(2), vertScaleSlider: s=>(s.value/100).toFixed(2),
  pcScaleSlider: s=>(s.value/100).toFixed(2),
  ghostRotSlider: s=>s.value+"°", vertRotSlider: s=>s.value+"°", pcRotSlider: s=>s.value+"°",
  camPixelSlider: s=>s.value<=1?"off":s.value+"px",
  camLumaSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  camContrastSlider: s=>(s.value/100).toFixed(2),
  camScaleSlider: s=>(s.value/100).toFixed(2),
  camBlurSlider: s=>s.value==0?"off":s.value,
  stretchOpSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  stretchAmtSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  stretchPosSlider: s=>(s.value/100).toFixed(2),
  stretchDensSlider: s=>s.value,
  stretchContSlider: s=>(s.value/100).toFixed(2),
  stretchHueSlider: s=>s.value==0?"off":s.value,
  stretchScaleSlider: s=>(s.value/100).toFixed(2),
  stretchExplodeSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  audioMixSlider: s=>(s.value/100).toFixed(2),
  audioGainSlider: s=>(s.value/100).toFixed(2),
  audioScrollSlider: s=>s.value==0?"stop":(s.value>0?"→ "+s.value:"← "+Math.abs(s.value)),
  globalZoomSlider: s=>(s.value/100).toFixed(2),
  safeAreaSlider: s=>s.value==0?"off":s.value+"%",
  trailSlider: s=>s.value==0?"off":(s.value/100).toFixed(2),
  colourCycleSlider: s=>s.value==0?"off":s.value,
  morphTimeSlider: s=>s.value==0?"snap":(s.value/10).toFixed(1)+"s"
};

function valId(sid) { return sid.replace("Slider","Val"); }

SLIDER_IDS.forEach(id => {
  const s = sl(id), v = sl(valId(id));
  if (!s || !v) return;
  s.oninput = () => {
    v.textContent = fmts[id](s);
    if (id === "eyeSlider" || id === "mouthSlider") updateAnatomical();
  };
});

const colourPicker = sl("colourPicker"), colourValEl = sl("colourVal");
colourPicker.oninput = () => colourValEl.textContent = colourPicker.value;

// ─── Section lock state ────────────────────────────────────────────
const sectionLocks = {};

window.toggleLock = function(name, btn) {
  sectionLocks[name] = !sectionLocks[name];
  if (btn) btn.classList.toggle('locked', sectionLocks[name]);
};

function isLocked(name) { return !!sectionLocks[name]; }

// ─── Morph transition system ───────────────────────────────────────
let morphTargets = null, morphStart = null, morphDuration = 0, morphStartState = null;

function getMorphTime() {
  const s = sl("morphTimeSlider");
  return s ? +s.value / 10 : 0; // seconds
}

function startMorph(targetState) {
  const dur = getMorphTime();
  if (dur <= 0) {
    applyTargetState(targetState);
    return;
  }
  morphStartState = {};
  SLIDER_IDS.forEach(id => { const s = sl(id); if (s) morphStartState[id] = +s.value; });
  morphStartState.colour = colourPicker.value;
  // Capture current trackball positions
  morphStartState.trackballs = {};
  Object.keys(trackballState).forEach(k => {
    morphStartState.trackballs[k] = {x:trackballState[k].x, y:trackballState[k].y};
  });
  morphTargets = targetState;
  morphDuration = dur * 1000;
  morphStart = performance.now();
}

function applyTargetState(state) {
  SLIDER_IDS.forEach(id => {
    const s = sl(id);
    if (s && state[id] !== undefined) { s.value = state[id]; if (s.oninput) s.oninput(); }
  });
  if (state.colour) { colourPicker.value = state.colour; colourValEl.textContent = state.colour; }
  if (state.trackballs) {
    Object.keys(state.trackballs).forEach(k => {
      if (!trackballState[k]) return;
      trackballState[k] = state.trackballs[k];
      const d = sl("dot" + k.charAt(0).toUpperCase() + k.slice(1));
      if (d) { d.style.left = ((state.trackballs[k].x+1)/2*100)+"%"; d.style.top = ((state.trackballs[k].y+1)/2*100)+"%"; }
    });
  }
}

function tickMorph() {
  if (!morphTargets || !morphStart) return;
  const elapsed = performance.now() - morphStart;
  const t = Math.min(1, elapsed / morphDuration);
  const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  SLIDER_IDS.forEach(id => {
    if (morphTargets[id] === undefined || morphStartState[id] === undefined) return;
    const s = sl(id);
    if (!s) return;
    s.value = Math.round(morphStartState[id] + (morphTargets[id] - morphStartState[id]) * ease);
    if (s.oninput) s.oninput();
  });

  // Morph colour
  if (morphTargets.colour && morphStartState.colour) {
    const sc = morphStartState.colour, tc = morphTargets.colour;
    const sr = parseInt(sc.slice(1, 3), 16), sg = parseInt(sc.slice(3, 5), 16), sb = parseInt(sc.slice(5, 7), 16);
    const tr = parseInt(tc.slice(1, 3), 16), tg = parseInt(tc.slice(3, 5), 16), tb = parseInt(tc.slice(5, 7), 16);
    const r = Math.round(sr + (tr - sr) * ease), g = Math.round(sg + (tg - sg) * ease), b = Math.round(sb + (tb - sb) * ease);
    const hex = '#' + [r, g, b].map(v => Math.max(0,Math.min(255,v)).toString(16).padStart(2, '0')).join('');
    colourPicker.value = hex; colourValEl.textContent = hex;
  }

  // Morph trackballs
  if (morphTargets.trackballs && morphStartState.trackballs) {
    Object.keys(morphTargets.trackballs).forEach(k => {
      if (!morphStartState.trackballs[k] || !trackballState[k]) return;
      const sx = morphStartState.trackballs[k].x, sy = morphStartState.trackballs[k].y;
      const tx = morphTargets.trackballs[k].x, ty = morphTargets.trackballs[k].y;
      trackballState[k].x = sx + (tx - sx) * ease;
      trackballState[k].y = sy + (ty - sy) * ease;
      const d = sl("dot" + k.charAt(0).toUpperCase() + k.slice(1));
      if (d) {
        d.style.left = ((trackballState[k].x+1)/2*100)+"%";
        d.style.top = ((trackballState[k].y+1)/2*100)+"%";
      }
    });
  }

  if (t >= 1) { morphTargets = null; morphStart = null; morphStartState = null; }
}

// ─── Section reset / randomise (lock-aware + morph) ────────────────
function resetSlider(id) {
  const s = sl(id);
  if (s && s.dataset.default !== undefined) { s.value = s.dataset.default; if (s.oninput) s.oninput(); }
}

function genRandomSliderVal(id) {
  const s = sl(id);
  if (!s) return undefined;
  const min = +s.min, max = +s.max;
  let val = Math.floor(Math.random() * (max - min + 1)) + min;
  if (OPACITY_SLIDERS.has(id) && val < Math.floor(min + (max - min) * 0.2)) {
    val = Math.floor(min + (max - min) * 0.2 + Math.random() * (max - min) * 0.8);
  }
  return val;
}

function randomSlider(id) {
  const s = sl(id);
  if (!s) return;
  s.value = genRandomSliderVal(id);
  if (s.oninput) s.oninput();
}

function resetTrackball(key) {
  trackballState[key] = {x:0, y:0};
  const d = sl("dot" + key.charAt(0).toUpperCase() + key.slice(1));
  if (d) { d.style.left = "50%"; d.style.top = "50%"; }
}

function randomTrackball(key) {
  const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1;
  trackballState[key] = {x, y};
  const d = sl("dot" + key.charAt(0).toUpperCase() + key.slice(1));
  if (d) { d.style.left = ((x+1)/2*100)+"%"; d.style.top = ((y+1)/2*100)+"%"; }
}

const OPACITY_SLIDERS = new Set([
  "camMixSlider","eyeOpSlider","mouthOpSlider","eyeVertSlider","mouthVertSlider",
  "pcAllSlider","pcEyeSlider","pcMouthSlider","pcOutlineSlider",
  "stretchOpSlider","stretchAmtSlider","glowSlider","audioMixSlider"
]);

window.resetSection = function(name) {
  if (isLocked(name)) return;
  const sec = SECTIONS[name];
  if (!sec) return;
  if (sec.sliders) sec.sliders.forEach(id => resetSlider(id));
  if (sec.trackballs) sec.trackballs.forEach(k => resetTrackball(k));
  if (sec.selects) sec.selects.forEach(id => { const el = sl(id); if (el) el.selectedIndex = 0; });
  if (sec.checkboxes) sec.checkboxes.forEach(id => { const el = sl(id); if (el) el.checked = false; });
  if (sec.colour) { colourPicker.value = "#ffffff"; colourValEl.textContent = "#fff"; }
};

// Gentle return to home — uses morph system to smoothly ease back to defaults
window.homeSection = function(name) {
  if (isLocked(name)) return;
  const sec = SECTIONS[name];
  if (!sec) return;
  const target = {};
  if (sec.sliders) sec.sliders.forEach(id => {
    const s = sl(id);
    if (s && s.dataset.default !== undefined) target[id] = +s.dataset.default;
  });
  if (sec.trackballs) {
    target.trackballs = {};
    sec.trackballs.forEach(k => { target.trackballs[k] = {x:0, y:0}; });
  }
  if (sec.colour) target.colour = "#ffffff";
  // Force a gentle morph regardless of morphTimeSlider (minimum 2s)
  const dur = Math.max(2, getMorphTime());
  morphStartState = {};
  SLIDER_IDS.forEach(id => { const s = sl(id); if (s) morphStartState[id] = +s.value; });
  morphStartState.colour = colourPicker.value;
  morphStartState.trackballs = {};
  Object.keys(trackballState).forEach(k => {
    morphStartState.trackballs[k] = {x:trackballState[k].x, y:trackballState[k].y};
  });
  morphTargets = target;
  morphDuration = dur * 1000;
  morphStart = performance.now();
};

window.randomSection = function(name) {
  if (isLocked(name)) return;
  const sec = SECTIONS[name];
  if (!sec) return;
  const morphTime = getMorphTime();

  if (morphTime > 0) {
    const target = {};
    if (sec.sliders) sec.sliders.forEach(id => { target[id] = genRandomSliderVal(id); });
    if (sec.colour) {
      target.colour = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
    }
    if (sec.trackballs) {
      target.trackballs = {};
      sec.trackballs.forEach(k => {
        target.trackballs[k] = {x: Math.random()*2-1, y: Math.random()*2-1};
      });
    }
    startMorph(target);
  } else {
    if (sec.sliders) sec.sliders.forEach(id => randomSlider(id));
    if (sec.colour) {
      const rh = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
      colourPicker.value = rh; colourValEl.textContent = rh;
    }
    if (sec.trackballs) sec.trackballs.forEach(k => randomTrackball(k));
  }
  // Selects always snap
  if (sec.selects) sec.selects.forEach(id => {
    const el = sl(id);
    if (el) el.selectedIndex = Math.floor(Math.random() * el.options.length);
  });
};

window.resetAll = function() {
  Object.keys(SECTIONS).forEach(k => { if (!isLocked(k)) window.resetSection(k); });
};

window.randomAll = function() {
  const morphTime = getMorphTime();
  if (morphTime > 0) {
    const target = { trackballs: {} };
    Object.keys(SECTIONS).forEach(k => {
      if (isLocked(k)) return;
      const sec = SECTIONS[k];
      if (sec.sliders) sec.sliders.forEach(id => { target[id] = genRandomSliderVal(id); });
      if (sec.colour) {
        target.colour = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
      }
      if (sec.trackballs) {
        sec.trackballs.forEach(tb => {
          target.trackballs[tb] = {x: Math.random()*2-1, y: Math.random()*2-1};
        });
      }
    });
    startMorph(target);
    // Selects snap
    Object.keys(SECTIONS).forEach(k => {
      if (isLocked(k)) return;
      const sec = SECTIONS[k];
      if (sec.selects) sec.selects.forEach(id => {
        const el = sl(id);
        if (el) el.selectedIndex = Math.floor(Math.random() * el.options.length);
      });
    });
  } else {
    Object.keys(SECTIONS).forEach(k => { if (!isLocked(k)) window.randomSection(k); });
  }
};

window.gentleResetAll = function() {
  // Build a morph target of all defaults for unlocked sections
  const target = { trackballs: {}, colour: "#ffffff" };
  Object.keys(SECTIONS).forEach(k => {
    if (isLocked(k)) return;
    const sec = SECTIONS[k];
    if (sec.sliders) sec.sliders.forEach(id => {
      const s = sl(id);
      if (s && s.dataset.default !== undefined) target[id] = +s.dataset.default;
    });
    if (sec.trackballs) {
      sec.trackballs.forEach(tb => { target.trackballs[tb] = {x:0, y:0}; });
    }
  });
  // Use morph time if set, otherwise default to 3 seconds
  const dur = Math.max(3, getMorphTime());
  morphStartState = {};
  SLIDER_IDS.forEach(id => { const s = sl(id); if (s) morphStartState[id] = +s.value; });
  morphStartState.colour = colourPicker.value;
  morphStartState.trackballs = {};
  Object.keys(trackballState).forEach(k => {
    morphStartState.trackballs[k] = {x:trackballState[k].x, y:trackballState[k].y};
  });
  morphTargets = target;
  morphDuration = dur * 1000;
  morphStart = performance.now();
};

// ─── Trackball pads ────────────────────────────────────────────────
const trackballState = { ghost:{x:0,y:0}, vert:{x:0,y:0}, pc:{x:0,y:0}, cam:{x:0,y:0}, stretch:{x:0,y:0} };

function initTrackball(tbId, dotId, key) {
  const tb = sl(tbId), dot = sl(dotId);
  if (!tb || !dot) return;
  let dragging = false;
  function upd(e) {
    const r = tb.getBoundingClientRect();
    if(r.width===0||r.height===0)return;
    const x = Math.max(-1,Math.min(1,((e.clientX-r.left)/r.width)*2-1));
    const y = Math.max(-1,Math.min(1,((e.clientY-r.top)/r.height)*2-1));
    trackballState[key] = {x,y};
    dot.style.left=((x+1)/2*100)+"%"; dot.style.top=((y+1)/2*100)+"%";
  }
  function rst() { trackballState[key]={x:0,y:0}; dot.style.left="50%"; dot.style.top="50%"; }
  rst();
  tb.addEventListener("mousedown",e=>{dragging=true;upd(e);e.preventDefault();});
  window.addEventListener("mousemove",e=>{if(dragging)upd(e);});
  window.addEventListener("mouseup",()=>{dragging=false;});
  tb.addEventListener("dblclick",rst);
  tb.addEventListener("touchstart",e=>{dragging=true;upd(e.touches[0]);e.preventDefault();},{passive:false});
  window.addEventListener("touchmove",e=>{if(dragging)upd(e.touches[0]);},{passive:false});
  window.addEventListener("touchend",()=>{dragging=false;});
}
initTrackball("tbGhost","dotGhost","ghost");
initTrackball("tbVert","dotVert","vert");
initTrackball("tbPC","dotPC","pc");
initTrackball("tbCam","dotCam","cam");
initTrackball("tbStretch","dotStretch","stretch");

// ─── Helpers ───────────────────────────────────────────────────────
function getColour(a) {
  const h=colourPicker.value,r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
  return a!==undefined?`rgba(${r},${g},${b},${a})`:h;
}
function applyGlow(c) {
  const a=+sl("glowSlider").value,s=+sl("glowSpreadSlider").value;
  if(a>0){c.shadowColor=getColour(a/100);c.shadowBlur=s;}else{c.shadowColor="transparent";c.shadowBlur=0;}
}
function clearGlow(c){c.shadowColor="transparent";c.shadowBlur=0;}

function applyLayerTransform(key,scaleId,rotId,fcx,fcy) {
  const off=trackballState[key], scale=sl(scaleId).value/100, rot=sl(rotId).value*Math.PI/180;
  const ox=off.x*canvas.width*0.3, oy=off.y*canvas.height*0.3;
  ctx.save(); ctx.translate(fcx+ox,fcy+oy); ctx.rotate(rot); ctx.scale(scale,scale); ctx.translate(-fcx,-fcy);
}
function restoreLayerTransform(){ctx.restore();}

// ─── Offscreen ─────────────────────────────────────────────────────
const rawCanvas=document.createElement("canvas"),rawCtx=rawCanvas.getContext("2d");
const blurCanv=document.createElement("canvas"),blurCtx=blurCanv.getContext("2d",{willReadFrequently:true});
const camWork=document.createElement("canvas"),camWorkCtx=camWork.getContext("2d",{willReadFrequently:true});
const camPrev=document.createElement("canvas"),camPrevCtx=camPrev.getContext("2d");
const stretchWork=document.createElement("canvas"),stretchWorkCtx=stretchWork.getContext("2d",{willReadFrequently:true});

let faceLandmarker=null,lastTimestamp=-1,prevGrid=null,currentLandmarks=null;
let faceCentre={x:0.5,y:0.5};
let lastGrid=null;

function resize(){
  canvas.width=window.innerWidth;canvas.height=window.innerHeight;
  rawCanvas.width=Math.floor(canvas.width*0.5);rawCanvas.height=Math.floor(canvas.height*0.5);
  blurCanv.width=rawCanvas.width;blurCanv.height=rawCanvas.height;
}
window.addEventListener("resize",resize);resize();

// ─── Anatomical depth ──────────────────────────────────────────────
const aDepth=new Float32Array(478).fill(0.32);
const EYE_INDICES=[22,23,24,25,26,27,28,29,30,31,33,110,111,112,113,130,133,145,153,154,155,157,158,159,160,161,163,173,190,243,244,245,246,247,252,253,254,255,256,257,258,259,260,261,263,339,340,341,342,359,362,374,380,381,382,384,385,386,387,388,390,398,414,463,464,465,466,467];
const MOUTH_INDICES=[0,11,12,13,14,15,16,17,37,38,39,40,41,42,61,62,72,73,74,76,77,78,80,81,82,84,85,86,87,88,89,90,91,95,96,146,178,179,180,181,183,184,185,191,267,268,269,270,271,272,291,292,302,303,304,306,307,308,310,311,312,314,315,316,317,318,319,320,321,324,325,375,402,403,404,405,407,408,409,415];
const LEFT_EYE_CONTOUR=[33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246,30,29,28,27,56,190,243,112,26,22,23,24,110,25];
const RIGHT_EYE_CONTOUR=[263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466,260,259,258,257,286,414,463,341,256,252,253,254,339,255];
const OUTER_LIPS=[61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185];
const FACE_OUTLINE=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];

const eyeSet=new Set([...LEFT_EYE_CONTOUR,...RIGHT_EYE_CONTOUR,...EYE_INDICES]);
const mouthSet=new Set([...OUTER_LIPS,...MOUTH_INDICES]);

function setBaseAnatomical(){
  aDepth.fill(0.32);
  [1,2,3,4,5,6,19,94,141,370].forEach(i=>aDepth[i]=1.0);
  [168,197,195,9,8].forEach(i=>{if(i<478)aDepth[i]=0.82;});
  [48,49,50,51,97,98,115,131,134,198,209,217,218,219,220,278,279,280,281,327,328,344,360,363,429,437,438,439,440].forEach(i=>{if(i<478)aDepth[i]=0.65;});
  [36,50,101,116,117,118,119,123,126,142,203,205,206,207,212,266,280,330,345,346,347,348,352,355,371,423,425,426,427,432].forEach(i=>{if(i<478)aDepth[i]=0.52;});
  [10,21,54,67,68,69,103,104,108,109,151,234,251,284,297,298,299,332,333,337,338,66,105,63,70,107,336,296,334,293,300].forEach(i=>{if(i<478)aDepth[i]=0.48;});
  [63,66,70,105,107,46,53,52,65,55,285,295,282,283,296,336,334,293,300,276].forEach(i=>{if(i<478)aDepth[i]=0.55;});
  [148,149,150,152,169,170,171,172,175,176,199,200,208,210,211,214,32,377,378,379,394,395,396,397,400,401,428,430,431,434,262].forEach(i=>{if(i<478)aDepth[i]=0.35;});
  [93,127,132,136,137,138,139,140,162,164,165,166,167,177,192,213,215,356,361,365,366,367,368,369,391,411,416,435,454,58,288,323,389].forEach(i=>{if(i<478)aDepth[i]=0.03;});
}
function updateAnatomical(){
  setBaseAnatomical();
  EYE_INDICES.forEach(i=>{if(i<478)aDepth[i]=sl("eyeSlider").value/100;});
  MOUTH_INDICES.forEach(i=>{if(i<478)aDepth[i]=sl("mouthSlider").value/100;});
}
setBaseAnatomical();
EYE_INDICES.forEach(i=>{if(i<478)aDepth[i]=0.08;});
MOUTH_INDICES.forEach(i=>{if(i<478)aDepth[i]=0.52;});

function getDepth(lm,i){const rz=Math.max(0,Math.min(1,(-lm.z*4)+0.5));return aDepth[i]*0.8+rz*0.2;}

// ─── MediaPipe ─────────────────────────────────────────────────────
async function initFaceLandmarker(){
  statusEl.textContent="Loading WASM…";
  const r=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
  statusEl.textContent="Loading model…";
  faceLandmarker=await FaceLandmarker.createFromOptions(r,{baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",delegate:"GPU"},runningMode:"VIDEO",numFaces:1});
  statusEl.textContent="Starting webcam…";
}
async function startWebcam(){
  const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:640},height:{ideal:480}},audio:false});
  video.srcObject=s;return new Promise(r=>{video.onloadeddata=()=>{video.play();r();};});
}

// ─── Render depth ──────────────────────────────────────────────────
function renderDepth(landmarks){
  const W=rawCanvas.width,H=rawCanvas.height,power=sl("powSlider").value/100;
  rawCtx.fillStyle="#000";rawCtx.fillRect(0,0,W,H);
  for(let i=0;i<TRIANGULATION.length;i+=3){
    const i0=TRIANGULATION[i],i1=TRIANGULATION[i+1],i2=TRIANGULATION[i+2];
    if(i0>=landmarks.length||i1>=landmarks.length||i2>=landmarks.length)continue;
    const l0=landmarks[i0],l1=landmarks[i1],l2=landmarks[i2];
    const avg=(getDepth(l0,i0)+getDepth(l1,i1)+getDepth(l2,i2))/3;
    const b=Math.round(Math.pow(avg,power)*255);
    rawCtx.beginPath();rawCtx.moveTo(l0.x*W,l0.y*H);rawCtx.lineTo(l1.x*W,l1.y*H);rawCtx.lineTo(l2.x*W,l2.y*H);rawCtx.closePath();
    rawCtx.fillStyle=`rgb(${b},${b},${b})`;rawCtx.fill();
  }
  const br=+sl("blurSlider").value;
  blurCtx.clearRect(0,0,blurCanv.width,blurCanv.height);
  blurCtx.filter=br>0?`blur(${br}px)`:"none";
  blurCtx.drawImage(rawCanvas,0,0);blurCtx.filter="none";
  let cx=0,cy=0;for(const lm of landmarks){cx+=lm.x;cy+=lm.y;}
  faceCentre={x:cx/landmarks.length,y:cy/landmarks.length};
}

// ─── Audio reactive ────────────────────────────────────────────────
let audioCtx=null, analyser=null, micStream=null, audioWaveform=null;
const AUDIO_BUF_LEN=2048;
let audioBuf=new Float32Array(AUDIO_BUF_LEN);
let audioBufWritePos=0;
let audioScrollOffset=0;
let audioFreqData=null;
let audioBands=new Float32Array(NUM_LINES);

async function startMic(){
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==="suspended") await audioCtx.resume();
  micStream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
  const src=audioCtx.createMediaStreamSource(micStream);
  analyser=audioCtx.createAnalyser();
  analyser.fftSize=2048;
  analyser.smoothingTimeConstant=0.3;
  src.connect(analyser);
  audioWaveform=new Uint8Array(analyser.fftSize);
  audioFreqData=new Uint8Array(analyser.frequencyBinCount);
  audioBuf.fill(0);audioBufWritePos=0;audioScrollOffset=0;
  const btn=sl("micBtn");
  if(btn){btn.textContent="🎤 Mic ON";btn.style.borderColor="#0a0";btn.style.color="#0c0";}
}

function stopMic(){
  if(micStream){micStream.getTracks().forEach(t=>t.stop());micStream=null;}
  analyser=null;audioWaveform=null;audioFreqData=null;audioBuf.fill(0);audioLine.fill(0);audioBands.fill(0);
  const btn=sl("micBtn");
  if(btn){btn.textContent="🎤 Mic off";btn.style.borderColor="";btn.style.color="";}
}

window.toggleMic=function(){
  if(micStream)stopMic(); else startMic().catch(e=>console.error("Mic error:",e));
};

let audioLine=new Float32Array(LINE_SAMPLES);

function updateAudioWaveform(){
  if(!analyser||!audioWaveform){audioLine.fill(0);audioBands.fill(0);return;}
  const gain=sl("audioGainSlider")?sl("audioGainSlider").value/100:1;
  const mode=sl("audioMode")?sl("audioMode").value:"waveform";

  if(mode==="waveform"){
    analyser.getByteTimeDomainData(audioWaveform);
    const scrollSpeed=sl("audioScrollSlider")?+sl("audioScrollSlider").value:0;
    for(let i=0;i<audioWaveform.length;i++){
      audioBuf[audioBufWritePos]=((audioWaveform[i]-128)/128)*gain;
      audioBufWritePos=(audioBufWritePos+1)%AUDIO_BUF_LEN;
    }
    if(scrollSpeed!==0){
      audioScrollOffset+=scrollSpeed*0.3;
      if(audioScrollOffset>AUDIO_BUF_LEN) audioScrollOffset-=AUDIO_BUF_LEN;
      if(audioScrollOffset<0) audioScrollOffset+=AUDIO_BUF_LEN;
    }
    const readStart = scrollSpeed===0
      ? (audioBufWritePos - LINE_SAMPLES + AUDIO_BUF_LEN) % AUDIO_BUF_LEN
      : Math.floor(audioScrollOffset) % AUDIO_BUF_LEN;
    for(let col=0;col<LINE_SAMPLES;col++){
      audioLine[col]=audioBuf[(readStart+col)%AUDIO_BUF_LEN];
    }
  } else {
    // Frequency bands mode
    analyser.getByteFrequencyData(audioFreqData);
    const binCount=audioFreqData.length;
    for(let i=0;i<NUM_LINES;i++){
      const bandStart=Math.floor((i/NUM_LINES)*binCount);
      const bandEnd=Math.floor(((i+1)/NUM_LINES)*binCount);
      let sum=0,count=0;
      for(let b=bandStart;b<bandEnd;b++){sum+=audioFreqData[b];count++;}
      audioBands[NUM_LINES-1-i]=Math.min(1,((count>0?sum/count:0)/255)*gain);
    }
  }
}

// ─── Build grid ────────────────────────────────────────────────────
let cutMask = null;

function buildGrid(landmarks) {
  const W=blurCanv.width,H=blurCanv.height,px=blurCtx.getImageData(0,0,W,H).data;
  const maxD=+sl("dispSlider").value;
  const subAmt=sl("ghostSubSlider").value/100;
  const pullAmt=sl("ghostPullSlider").value/100;
  const grid=[];
  const m=H*0.04,tY=m,bY=H-m;

  let eyeMouthXMap = null;
  if ((subAmt > 0 || pullAmt > 0) && landmarks) {
    eyeMouthXMap = new Float32Array(W);
    const radius = W * 0.04;
    for (let i = 0; i < landmarks.length; i++) {
      if (!eyeSet.has(i) && !mouthSet.has(i)) continue;
      const lmx = landmarks[i].x * W;
      const left = Math.max(0, Math.floor(lmx - radius));
      const right = Math.min(W - 1, Math.ceil(lmx + radius));
      for (let x = left; x <= right; x++) {
        const dist = Math.abs(x - lmx) / radius;
        eyeMouthXMap[x] = Math.max(eyeMouthXMap[x], Math.max(0, 1 - dist));
      }
    }
  }

  cutMask = subAmt > 0 ? [] : null;

  for (let row = 0; row < NUM_LINES; row++) {
    const line = new Float32Array(LINE_SAMPLES);
    const cutRow = subAmt > 0 ? new Float32Array(LINE_SAMPLES) : null;
    const py = Math.floor(tY + (row / (NUM_LINES - 1)) * (bY - tY));
    const normalizedY = py / H;

    for (let col = 0; col < LINE_SAMPLES; col++) {
      const pxx = Math.floor((col / (LINE_SAMPLES - 1)) * (W - 1));
      let val = (px[(py * W + pxx) * 4] / 255) * maxD;

      if (eyeMouthXMap && landmarks) {
        const xInf = eyeMouthXMap[pxx] || 0;
        if (xInf > 0) {
          let yInf = 0;
          for (let i = 0; i < landmarks.length; i++) {
            if (!eyeSet.has(i) && !mouthSet.has(i)) continue;
            const dy = Math.abs(normalizedY - landmarks[i].y) * 4;
            if (dy < 1) yInf = Math.max(yInf, 1 - dy);
          }
          const combined = xInf * yInf;
          if (pullAmt > 0) val += combined * pullAmt * maxD * 0.6;
          if (subAmt > 0 && cutRow) cutRow[col] = combined * subAmt;
        }
      }

      line[col] = Math.max(0, val);
    }
    // Audio reactive: waveform or frequency bands
    const audioMix=sl("audioMixSlider")?sl("audioMixSlider").value/100:0;
    const faceLock=sl("audioFaceLock")?sl("audioFaceLock").checked:true;
    const audioMode=sl("audioMode")?sl("audioMode").value:"waveform";
    if(audioMix>0){
      if(audioMode==="waveform"){
        for(let col=0;col<LINE_SAMPLES;col++){
          if(!faceLock || line[col]>0.5){
            line[col]+=audioLine[col]*audioMix*maxD*0.4;
            if(line[col]<0)line[col]=0;
          }
        }
      } else {
        // Freq bands: uniform boost per line
        const bandVal=audioBands[row]||0;
        if(bandVal>0){
          for(let col=0;col<LINE_SAMPLES;col++){
            if(!faceLock || line[col]>0.5){
              line[col]+=bandVal*audioMix*maxD*0.5;
            }
          }
        }
      }
    }
    grid.push(line);
    if (cutMask) cutMask.push(cutRow);
  }
  return grid;
}

function smoothGrid(ng){
  if(!prevGrid){prevGrid=ng;return ng;}
  const o=[];for(let r=0;r<NUM_LINES;r++){const l=new Float32Array(LINE_SAMPLES);for(let c=0;c<LINE_SAMPLES;c++)l[c]=prevGrid[r][c]*SMOOTH_FACTOR+ng[r][c]*(1-SMOOTH_FACTOR);o.push(l);}
  prevGrid=o;return o;
}

// ─── Draw lines ────────────────────────────────────────────────────
function drawLines(grid, safeAmt, safeFlip){
  const W=canvas.width,H=canvas.height,m=H*0.04,tY=m,bY=H-m;
  const gap=(bY-tY)/(NUM_LINES-1),sw=W/(LINE_SAMPLES-1);
  const colour=getColour(),thick=sl("thickSlider").value/10;
  const cutThreshold = 0.5;

  const hasSafe=safeAmt>0;
  const safeL=hasSafe?W*safeAmt/100:0;
  const safeR=hasSafe?W-W*safeAmt/100:W;
  const safeT=hasSafe?H*safeAmt/100:0;
  const safeB=hasSafe?H-H*safeAmt/100:H;

  for(let row=0;row<NUM_LINES;row++){
    const baseY=tY+row*gap;
    const rowCut = cutMask ? cutMask[row] : null;

    // Build raw points
    const rawPts=[];
    for(let c=0;c<LINE_SAMPLES;c++){
      rawPts.push({x:c*sw, y:baseY-grid[row][c], cut:!!(rowCut&&rowCut[c]>=cutThreshold)});
    }

    // Process points for safe area
    let pts;
    if(hasSafe && safeFlip){
      // Flip mode: when line goes above safeT, redirect along the top edge
      // When line exits left/right, redirect down along the side
      pts=[];
      for(let i=0;i<rawPts.length;i++){
        const rp=rawPts[i];
        let x=rp.x, y=rp.y;

        // Clamp x to safe boundaries, redirect overshoot into y
        if(x < safeL){
          const over = safeL - x;
          x = safeL;
          y = y + over; // push down along left wall
        } else if(x > safeR){
          const over = x - safeR;
          x = safeR;
          y = y + over; // push down along right wall
        }

        // Clamp y to safe boundaries, redirect overshoot into x
        if(y < safeT){
          const over = safeT - y;
          y = safeT;
          // Push sideways along top: away from centre
          const cx = (safeL + safeR) / 2;
          x = x < cx ? x - over : x + over;
          // Re-clamp x
          x = Math.max(safeL, Math.min(safeR, x));
        }
        if(y > safeB) y = safeB;

        pts.push({x, y, cut:rp.cut});
      }
    } else {
      pts = rawPts;
    }

    // Black occlusion fill
    clearGlow(ctx);
    ctx.beginPath();
    const occL = hasSafe ? safeL : 0, occR = hasSafe ? safeR : W;
    const occB = hasSafe ? safeB : H;
    ctx.moveTo(occL, baseY);
    for(let i=0;i<pts.length;i++){
      let px=pts[i].x, py=pts[i].y;
      if(hasSafe && !safeFlip){
        px=Math.max(safeL,Math.min(safeR,px));
        py=Math.max(safeT,Math.min(safeB,py));
      }
      ctx.lineTo(px, py);
    }
    ctx.lineTo(occR, baseY);ctx.lineTo(occR, occB);ctx.lineTo(occL, occB);
    ctx.closePath();
    ctx.fillStyle="#000";ctx.fill();

    // Stroke the visible line
    applyGlow(ctx);
    ctx.strokeStyle=colour;ctx.lineWidth=thick;
    let inSegment=false;
    ctx.beginPath();

    for(let i=0;i<pts.length;i++){
      const p=pts[i];

      if(p.cut){
        if(inSegment){ctx.stroke();ctx.beginPath();inSegment=false;}
        continue;
      }

      // Non-flip clip mode
      if(hasSafe && !safeFlip){
        if(p.x<safeL||p.x>safeR||p.y<safeT||p.y>safeB){
          if(inSegment){ctx.stroke();ctx.beginPath();inSegment=false;}
          continue;
        }
      }

      if(!inSegment){ctx.moveTo(p.x,p.y);inSegment=true;}
      else{ctx.lineTo(p.x,p.y);}
    }

    if(inSegment){
      ctx.lineTo(hasSafe?safeR:W, baseY);
      ctx.stroke();
    }
    ctx.beginPath();
    clearGlow(ctx);
  }
}

// ─── Ghost features ────────────────────────────────────────────────
function drawGhostFeatures(lm){
  const W=canvas.width,H=canvas.height;
  const eyeOp=sl("eyeOpSlider").value/100,mouthOp=sl("mouthOpSlider").value/100;
  if(eyeOp<=0&&mouthOp<=0)return;
  const fcx=faceCentre.x*W,fcy=faceCentre.y*H;
  applyLayerTransform("ghost","ghostScaleSlider","ghostRotSlider",fcx,fcy);
  if(eyeOp>0){applyGlow(ctx);ctx.strokeStyle=getColour(eyeOp);ctx.lineWidth=1.2;
    [LEFT_EYE_CONTOUR,RIGHT_EYE_CONTOUR].forEach(cont=>{ctx.beginPath();cont.forEach((idx,j)=>{if(idx>=lm.length)return;const p=lm[idx];j===0?ctx.moveTo(p.x*W,p.y*H):ctx.lineTo(p.x*W,p.y*H);});ctx.closePath();ctx.stroke();ctx.fillStyle=getColour(eyeOp*0.3);ctx.fill();});clearGlow(ctx);}
  if(mouthOp>0){applyGlow(ctx);ctx.strokeStyle=getColour(mouthOp);ctx.lineWidth=1.2;ctx.beginPath();OUTER_LIPS.forEach((idx,j)=>{if(idx>=lm.length)return;const p=lm[idx];j===0?ctx.moveTo(p.x*W,p.y*H):ctx.lineTo(p.x*W,p.y*H);});ctx.closePath();ctx.stroke();ctx.fillStyle=getColour(mouthOp*0.3);ctx.fill();clearGlow(ctx);}
  restoreLayerTransform();
}

// ─── Vertical lines ───────────────────────────────────────────────
function drawVerticalLines(lm){
  const W=canvas.width,H=canvas.height;
  const eOp=sl("eyeVertSlider").value/100,mOp=sl("mouthVertSlider").value/100,dens=+sl("vertDensSlider").value;
  if(eOp<=0&&mOp<=0)return;
  const fcx=faceCentre.x*W,fcy=faceCentre.y*H;
  applyLayerTransform("vert","vertScaleSlider","vertRotSlider",fcx,fcy);
  function bbox(ids){let mx=1,Mx=0,my=1,My=0;ids.forEach(i=>{if(i>=lm.length)return;mx=Math.min(mx,lm[i].x);Mx=Math.max(Mx,lm[i].x);my=Math.min(my,lm[i].y);My=Math.max(My,lm[i].y);});return{mx,Mx,my,My};}
  function dv(ids,op){if(op<=0)return;const b=bbox(ids),px=(b.Mx-b.mx)*0.1,l=(b.mx-px)*W,r=(b.Mx+px)*W,t=b.my*H,bt=b.My*H,st=(r-l)/(dens+1);
    applyGlow(ctx);ctx.strokeStyle=getColour(op);ctx.lineWidth=0.8;for(let i=1;i<=dens;i++){const x=l+i*st;ctx.beginPath();ctx.moveTo(x,t);ctx.lineTo(x,bt);ctx.stroke();}clearGlow(ctx);}
  if(eOp>0){dv(LEFT_EYE_CONTOUR,eOp);dv(RIGHT_EYE_CONTOUR,eOp);}
  if(mOp>0){dv(OUTER_LIPS,mOp);}
  restoreLayerTransform();
}

// ─── Point cloud ───────────────────────────────────────────────────
function drawPointCloud(lm){
  const W=canvas.width,H=canvas.height,dotR=sl("pcSizeSlider").value/10;
  const allOp=sl("pcAllSlider").value/100,eyeOp=sl("pcEyeSlider").value/100;
  const mouthOp=sl("pcMouthSlider").value/100,outOp=sl("pcOutlineSlider").value/100;
  if(allOp<=0&&eyeOp<=0&&mouthOp<=0&&outOp<=0)return;
  const po=new Float32Array(478);
  if(allOp>0)for(let i=0;i<478;i++)po[i]=allOp;
  if(outOp>0)FACE_OUTLINE.forEach(i=>{if(i<478)po[i]=Math.max(po[i],outOp);});
  if(eyeOp>0)[...LEFT_EYE_CONTOUR,...RIGHT_EYE_CONTOUR,...EYE_INDICES].forEach(i=>{if(i<478)po[i]=Math.max(po[i],eyeOp);});
  if(mouthOp>0)[...OUTER_LIPS,...MOUTH_INDICES].forEach(i=>{if(i<478)po[i]=Math.max(po[i],mouthOp);});
  const fcx=faceCentre.x*W,fcy=faceCentre.y*H;
  applyLayerTransform("pc","pcScaleSlider","pcRotSlider",fcx,fcy);
  applyGlow(ctx);
  for(let i=0;i<lm.length&&i<478;i++){if(po[i]<=0)continue;ctx.fillStyle=getColour(po[i]);ctx.beginPath();ctx.arc(lm[i].x*W,lm[i].y*H,dotR,0,Math.PI*2);ctx.fill();}
  clearGlow(ctx);restoreLayerTransform();
}

// ─── Pixel stretch (glitch smear effect) ──────────────────────────
let stretchHueOffset=0;

function drawPixelStretch(){
  const amt=sl("stretchAmtSlider")?sl("stretchAmtSlider").value/100:0;
  const opacity=sl("stretchOpSlider")?sl("stretchOpSlider").value/100:0;
  if(amt<=0||opacity<=0||camWork.width<2)return;

  const W=canvas.width,H=canvas.height;
  const cW=camWork.width,cH=camWork.height;
  const pos=sl("stretchPosSlider")?sl("stretchPosSlider").value/100:0.5;
  const blend=sl("stretchBlend")?sl("stretchBlend").value:"normal";
  const dir=trackballState.stretch||{x:0,y:0};
  const density=sl("stretchDensSlider")?+sl("stretchDensSlider").value:1;
  const strContrast=sl("stretchContSlider")?sl("stretchContSlider").value/100:1;
  const hueSpeed=sl("stretchHueSlider")?+sl("stretchHueSlider").value:0;
  const strScale=sl("stretchScaleSlider")?sl("stretchScaleSlider").value/100:1;
  const explode=sl("stretchExplodeSlider")?sl("stretchExplodeSlider").value/100:0;

  if(hueSpeed!==0) stretchHueOffset=(stretchHueOffset+hueSpeed*2)%360;

  const rawH=1.0-Math.abs(dir.y);
  const rawV=1.0-Math.abs(dir.x);
  const hAmt=Math.max(0,rawH)*amt;
  const vAmt=Math.max(0,rawV)*amt;

  if(hAmt<=0&&vAmt<=0)return;

  if(stretchWork.width!==cW||stretchWork.height!==cH){
    stretchWork.width=cW;stretchWork.height=cH;
  }
  stretchWorkCtx.clearRect(0,0,cW,cH);
  stretchWorkCtx.imageSmoothingEnabled=false;

  for(let d=0;d<density;d++){
    let linePos;
    if(density===1){ linePos=pos; }
    else{
      const spread=(d/(density-1)-0.5);
      const explodeSpread=spread*(1+explode*4);
      linePos=pos+explodeSpread*0.5;
      if(linePos<0||linePos>1)continue;
    }

    if(hAmt>0.01){
      const srcRow=Math.max(0,Math.min(cH-1,Math.floor(linePos*cH)));
      const smearH=Math.floor(cH*hAmt/density);
      const smearTop=Math.floor(linePos*cH-smearH/2);
      stretchWorkCtx.drawImage(camWork, 0,srcRow, cW,1, 0,smearTop, cW,smearH);
    }

    if(vAmt>0.01){
      const srcCol=Math.max(0,Math.min(cW-1,Math.floor(linePos*cW)));
      const smearW=Math.floor(cW*vAmt/density);
      const smearLeft=Math.floor(linePos*cW-smearW/2);
      stretchWorkCtx.drawImage(camWork, srcCol,0, 1,cH, smearLeft,0, smearW,cH);
    }
  }

  // Post-process: contrast, hue shift
  if(strContrast!==1||hueSpeed!==0){
    const imgData=stretchWorkCtx.getImageData(0,0,cW,cH);
    const sd=imgData.data;
    const hueRad=stretchHueOffset*Math.PI/180;
    const cosH=Math.cos(hueRad),sinH=Math.sin(hueRad);

    for(let i=0;i<sd.length;i+=4){
      if(sd[i+3]===0)continue;
      let r=sd[i],g=sd[i+1],b=sd[i+2];

      if(strContrast!==1){
        r=Math.max(0,Math.min(255,((r-128)*strContrast)+128));
        g=Math.max(0,Math.min(255,((g-128)*strContrast)+128));
        b=Math.max(0,Math.min(255,((b-128)*strContrast)+128));
      }

      if(hueSpeed!==0){
        const nr=r*(.213+.787*cosH-.213*sinH)+g*(.715-.715*cosH-.715*sinH)+b*(.072-.072*cosH+.928*sinH);
        const ng=r*(.213-.213*cosH+.143*sinH)+g*(.715+.285*cosH+.140*sinH)+b*(.072-.072*cosH-.283*sinH);
        const nb=r*(.213-.213*cosH-.787*sinH)+g*(.715-.715*cosH+.715*sinH)+b*(.072+.928*cosH+.072*sinH);
        r=Math.max(0,Math.min(255,Math.round(nr)));
        g=Math.max(0,Math.min(255,Math.round(ng)));
        b=Math.max(0,Math.min(255,Math.round(nb)));
      }

      sd[i]=r;sd[i+1]=g;sd[i+2]=b;
    }
    stretchWorkCtx.putImageData(imgData,0,0);
  }

  // Pixel-level blend
  if(blend!=="normal"){
    const stretchData=stretchWorkCtx.getImageData(0,0,cW,cH);
    const feedData=camWorkCtx.getImageData(0,0,cW,cH);
    const sd=stretchData.data, fd=feedData.data;

    for(let i=0;i<sd.length;i+=4){
      if(sd[i+3]===0)continue;
      const sr=sd[i],sg=sd[i+1],sb=sd[i+2];
      const fr=fd[i],fg=fd[i+1],fb=fd[i+2];

      if(blend==="feedCuts"){
        const feedLuma=(fr*0.299+fg*0.587+fb*0.114)/255;
        sd[i+3]=Math.round(sd[i+3]*(1-feedLuma));
      }else if(blend==="stretchCuts"){
        sd[i]=Math.max(0,fr-sr);sd[i+1]=Math.max(0,fg-sg);sd[i+2]=Math.max(0,fb-sb);sd[i+3]=255;
      }else if(blend==="xor"){
        sd[i]=Math.round(Math.abs(sr-fr));sd[i+1]=Math.round(Math.abs(sg-fg));sd[i+2]=Math.round(Math.abs(sb-fb));
        const diff=Math.abs((sr*0.299+sg*0.587+sb*0.114)-(fr*0.299+fg*0.587+fb*0.114))/255;
        sd[i+3]=Math.round(diff*255);
      }else if(blend==="mask"){
        const feedLuma=(fr*0.299+fg*0.587+fb*0.114)/255;
        sd[i+3]=Math.round(sd[i+3]*(1-feedLuma));
      }else if(blend==="burn"){
        sd[i]=fr>0?Math.max(0,255-Math.floor((255-sr)*255/fr)):0;
        sd[i+1]=fg>0?Math.max(0,255-Math.floor((255-sg)*255/fg)):0;
        sd[i+2]=fb>0?Math.max(0,255-Math.floor((255-sb)*255/fb)):0;
        sd[i+3]=255;
      }
    }
    stretchWorkCtx.putImageData(stretchData,0,0);
  }

  // Draw to main canvas with scale
  const camScale=sl("camScaleSlider")?sl("camScaleSlider").value/100:1;
  const camOff=trackballState.cam||{x:0,y:0};
  const baseDw=W*camScale, baseDh=H*camScale;
  const baseDx=(W-baseDw)/2+camOff.x*W*0.5;
  const baseDy=(H-baseDh)/2+camOff.y*H*0.5;
  const cx=baseDx+baseDw/2, cy=baseDy+baseDh/2;
  const dw=baseDw*strScale, dh=baseDh*strScale;
  const dx=cx-dw/2, dy=cy-dh/2;

  ctx.save();
  ctx.globalAlpha=opacity;
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(stretchWork,dx,dy,dw,dh);
  ctx.imageSmoothingEnabled=true;
  ctx.globalAlpha=1;
  ctx.restore();
}

// ─── Webcam feed overlay (drawn LAST) ─────────────────────────────
let camPrevInitialised = false;

function drawWebcamOverlay(){
  const op=sl("camMixSlider").value/100;
  if(op<=0)return;

  const W=canvas.width, H=canvas.height;
  const pixelSize=+sl("camPixelSlider").value;
  const lumaKey=sl("camLumaSlider").value/100;
  const contrast=sl("camContrastSlider").value/100;
  const scale=sl("camScaleSlider").value/100;
  const mode=sl("camFxMode")?sl("camFxMode").value:"normal";
  const off=trackballState.cam;
  const locked=sl("camDispLock")&&sl("camDispLock").checked;

  let workW, workH;
  if(pixelSize>1){
    workW=Math.max(4,Math.floor(W/pixelSize));
    workH=Math.max(4,Math.floor(H/pixelSize));
  }else{
    workW=Math.floor(W*0.5);
    workH=Math.floor(H*0.5);
  }

  if(camWork.width!==workW||camWork.height!==workH){
    camWork.width=workW;camWork.height=workH;
  }

  camWorkCtx.save();
  camWorkCtx.translate(workW,0);camWorkCtx.scale(-1,1);
  camWorkCtx.drawImage(video,0,0,workW,workH);
  camWorkCtx.restore();

  // Cam displacement lock
  if(locked && lastGrid){
    const srcData=camWorkCtx.getImageData(0,0,workW,workH);
    const dst=camWorkCtx.createImageData(workW,workH);
    const sd=srcData.data,dd=dst.data;
    const m=workH*0.04,tY=m,bY=workH-m;
    const gridScaleY=(bY-tY)/(NUM_LINES-1);

    for(let y=0;y<workH;y++){
      const gridY=(y-tY)/gridScaleY;
      if(gridY<0||gridY>=NUM_LINES-1){
        for(let x=0;x<workW;x++){const i=(y*workW+x)*4;dd[i]=sd[i];dd[i+1]=sd[i+1];dd[i+2]=sd[i+2];dd[i+3]=sd[i+3];}
        continue;
      }
      const rowLow=Math.floor(gridY),rowHigh=Math.min(rowLow+1,NUM_LINES-1);
      const frac=gridY-rowLow;
      for(let x=0;x<workW;x++){
        const colClamped=Math.min(Math.floor((x/workW)*LINE_SAMPLES),LINE_SAMPLES-1);
        const disp=lastGrid[rowLow][colClamped]*(1-frac)+lastGrid[rowHigh][colClamped]*frac;
        const srcY=Math.max(0,Math.min(workH-1,Math.round(y+(disp/H)*workH*0.5)));
        const si=(srcY*workW+x)*4;const di=(y*workW+x)*4;
        dd[di]=sd[si];dd[di+1]=sd[si+1];dd[di+2]=sd[si+2];dd[di+3]=sd[si+3];
      }
    }
    camWorkCtx.putImageData(dst,0,0);
  }

  const imgData=camWorkCtx.getImageData(0,0,workW,workH);
  const d=imgData.data;
  const contrastFactor=contrast;

  for(let i=0;i<d.length;i+=4){
    let r=d[i],g=d[i+1],b=d[i+2];
    r=Math.max(0,Math.min(255,((r-128)*contrastFactor)+128));
    g=Math.max(0,Math.min(255,((g-128)*contrastFactor)+128));
    b=Math.max(0,Math.min(255,((b-128)*contrastFactor)+128));
    const luma=(r*0.299+g*0.587+b*0.114)/255;

    if(mode==="mono"){
      const grey=Math.round(r*0.299+g*0.587+b*0.114);
      const h=colourPicker.value;
      const cr=parseInt(h.slice(1,3),16)/255,cg=parseInt(h.slice(3,5),16)/255,cb=parseInt(h.slice(5,7),16)/255;
      r=Math.round(grey*cr);g=Math.round(grey*cg);b=Math.round(grey*cb);
    }else if(mode==="pxl2000"){
      let grey=Math.round(r*0.299+g*0.587+b*0.114);
      grey=Math.max(0,Math.min(255,((grey-128)*2.5)+128));
      const noise=(Math.random()-0.5)*40;
      grey=Math.max(0,Math.min(255,grey+noise));
      r=Math.min(255,Math.round(grey*1.05));g=Math.round(grey*0.95);b=Math.round(grey*0.85);
    }else if(mode==="1bit"){
      const grey=r*0.299+g*0.587+b*0.114;const v=grey>128?255:0;r=v;g=v;b=v;
    }

    if(lumaKey>0){
      const alpha=luma<lumaKey?0:Math.min(255,Math.round(((luma-lumaKey)/(1-lumaKey+0.001))*255));
      d[i+3]=alpha;
    }
    d[i]=r;d[i+1]=g;d[i+2]=b;
  }

  camWorkCtx.putImageData(imgData,0,0);

  if(mode==="pxl2000"){
    if(camPrev.width!==workW||camPrev.height!==workH){camPrev.width=workW;camPrev.height=workH;camPrevInitialised=false;}
    if(camPrevInitialised){camWorkCtx.globalAlpha=0.55;camWorkCtx.drawImage(camPrev,0,0);camWorkCtx.globalAlpha=1;}
    camPrevCtx.clearRect(0,0,workW,workH);camPrevCtx.drawImage(camWork,0,0);camPrevInitialised=true;
  }

  const ox=off.x*W*0.5,oy=off.y*H*0.5;
  const dw=W*scale,dh=H*scale;
  const dx=(W-dw)/2+ox,dy=(H-dh)/2+oy;
  const camBlur=+sl("camBlurSlider").value;

  ctx.save();
  ctx.globalAlpha=op;
  ctx.imageSmoothingEnabled=(pixelSize<=1);
  if(camBlur>0) ctx.filter=`blur(${camBlur}px)`;
  ctx.drawImage(camWork,dx,dy,dw,dh);
  ctx.filter="none";
  ctx.globalAlpha=1;
  ctx.imageSmoothingEnabled=true;
  ctx.restore();
}

// ─── FX triggers (keyboard-driven) ─────────────────────────────────
let fxPulse=0, fxInvert=false, fxStrobe=false, fxStrobeFrame=0;
let fxExplode=0, fxImplode=0;
let colourCycleHue=0;

// Trail: offscreen buffer for frame persistence
const trailCanvas=document.createElement("canvas"), trailCtx=trailCanvas.getContext("2d");

function updateFxState(){
  // Decay pulse
  if(fxPulse>0) fxPulse=Math.max(0,fxPulse-0.04);
  // Decay explode/implode
  if(fxExplode>0) fxExplode=Math.max(0,fxExplode-0.02);
  if(fxImplode>0) fxImplode=Math.max(0,fxImplode-0.02);
  // Strobe toggle
  if(fxStrobe) fxStrobeFrame++;
  // Colour cycle
  const cycleSpeed=sl("colourCycleSlider")?+sl("colourCycleSlider").value:0;
  if(cycleSpeed>0){
    colourCycleHue=(colourCycleHue+cycleSpeed*0.5)%360;
  }
}

// Keyboard handler
document.addEventListener("keydown",e=>{
  // Don't trigger if typing in an input
  if(e.target.tagName==="INPUT"||e.target.tagName==="SELECT"||e.target.tagName==="TEXTAREA")return;
  switch(e.code){
    case "Space": fxPulse=1; e.preventDefault(); break;
    case "KeyI": fxInvert=!fxInvert; break;
    case "KeyF": fxStrobe=!fxStrobe; fxStrobeFrame=0; break;
    case "KeyE": fxExplode=1; break;
    case "KeyR": fxImplode=1; break;
  }
});

// ─── Main render ───────────────────────────────────────────────────
function render(lm,grid){
  const W=canvas.width,H=canvas.height;
  updateFxState();

  const trailAmt=sl("trailSlider")?sl("trailSlider").value/100:0;

  // Start with black
  ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);

  // Colour cycle: temporarily override colour picker
  const origColour=colourPicker.value;
  const cycleSpeed=sl("colourCycleSlider")?+sl("colourCycleSlider").value:0;
  if(cycleSpeed>0){
    const h=colourCycleHue, s=100, l=60;
    const c=(1-Math.abs(2*l/100-1))*s/100, x=c*(1-Math.abs((h/60)%2-1)), m=l/100-c/2;
    let r1=0,g1=0,b1=0;
    if(h<60){r1=c;g1=x;}else if(h<120){r1=x;g1=c;}else if(h<180){g1=c;b1=x;}
    else if(h<240){g1=x;b1=c;}else if(h<300){r1=x;b1=c;}else{r1=c;b1=x;}
    const toHex=v=>Math.round((v+m)*255).toString(16).padStart(2,'0');
    colourPicker.value="#"+toHex(r1)+toHex(g1)+toHex(b1);
  }

  // Pulse: temporarily boost thickness
  let pulseThickBoost=0;
  if(fxPulse>0) pulseThickBoost=fxPulse*20;

  // Apply explode/implode to grid
  let modGrid=grid;
  if(fxExplode>0||fxImplode>0){
    modGrid=[];
    const centreRow=NUM_LINES/2, centreSample=LINE_SAMPLES/2;
    for(let row=0;row<NUM_LINES;row++){
      const newLine=new Float32Array(LINE_SAMPLES);
      for(let col=0;col<LINE_SAMPLES;col++){
        const dy=(row-centreRow)/centreRow;
        const dx=(col-centreSample)/centreSample;
        const dist=Math.sqrt(dx*dx+dy*dy);
        let boost=0;
        if(fxExplode>0) boost+=fxExplode*dist*80;
        if(fxImplode>0) boost-=fxImplode*dist*60;
        newLine[col]=Math.max(0,grid[row][col]+boost);
      }
      modGrid.push(newLine);
    }
  }

  // Global zoom
  const zoom=sl("globalZoomSlider")?sl("globalZoomSlider").value/100:1;
  const zoomAll=sl("zoomAllCheck")?sl("zoomAllCheck").checked:false;

  // Safe area
  const safeAmt=sl("safeAreaSlider")?+sl("safeAreaSlider").value:0;
  const safeFlip=sl("safeFlipCheck")?sl("safeFlipCheck").checked:false;

  // Post-everything zoom
  const postZoom=zoom!==1&&zoomAll;
  if(postZoom){
    ctx.save();
    ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-W/2,-H/2);
  }

  // Vis-only zoom
  const visZoom=zoom!==1&&!zoomAll;
  if(visZoom){
    ctx.save();
    ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-W/2,-H/2);
  }

  // Mirror transform
  ctx.save();ctx.translate(W,0);ctx.scale(-1,1);

  if(pulseThickBoost>0){
    const s=sl("thickSlider");
    const orig=+s.value;
    s.value=orig+pulseThickBoost*10;
    drawLines(modGrid, safeAmt, safeFlip);
    s.value=orig;
  } else {
    drawLines(modGrid, safeAmt, safeFlip);
  }

  drawGhostFeatures(lm);
  drawVerticalLines(lm);
  drawPointCloud(lm);
  ctx.restore(); // mirror

  if(visZoom) ctx.restore();

  drawWebcamOverlay();
  drawPixelStretch();

  if(postZoom) ctx.restore();

  // Strobe flash
  if(fxStrobe && fxStrobeFrame%4<2){
    ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
  }

  // Invert
  if(fxInvert){
    ctx.globalCompositeOperation="difference";
    ctx.fillStyle="#fff";ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation="source-over";
  }

  // Trail: blend previous finished frame ON TOP of current frame
  const trailOutside=sl("trailSafeClip")?sl("trailSafeClip").checked:false;
  if(trailAmt>0){
    if(trailCanvas.width!==W||trailCanvas.height!==H){trailCanvas.width=W;trailCanvas.height=H;}
    trailCtx.globalAlpha=1-trailAmt;
    trailCtx.drawImage(canvas,0,0);
    // Draw trail buffer onto main canvas
    if(!trailOutside && safeAmt>0){
      // Clip trail to safe area only
      const sx=W*safeAmt/100, sy=H*safeAmt/100;
      ctx.save();
      ctx.beginPath();ctx.rect(sx,sy,W-sx*2,H-sy*2);ctx.clip();
      ctx.drawImage(trailCanvas,0,0);
      ctx.restore();
    } else {
      // Trail everywhere
      ctx.drawImage(trailCanvas,0,0);
    }
    trailCtx.globalAlpha=1;
    trailCtx.clearRect(0,0,W,H);
    trailCtx.drawImage(canvas,0,0);
  }

  // Safe area border guide (always on top)
  if(safeAmt>0){
    const sx=W*safeAmt/100, sy=H*safeAmt/100;
    ctx.strokeStyle="rgba(255,0,0,0.15)";ctx.lineWidth=1;
    ctx.strokeRect(sx,sy,W-sx*2,H-sy*2);
  }

  // Restore colour picker
  if(cycleSpeed>0) colourPicker.value=origColour;
}

// ─── Recording ─────────────────────────────────────────────────────
let mediaRecorder=null,recordedChunks=[];
const recBtn=sl("recBtn");

function pickRecordingFormat(){
  const options=[
    {mimeType:"video/mp4;codecs=avc1.42E01E",ext:"mp4",type:"video/mp4"},
    {mimeType:"video/webm;codecs=h264",ext:"webm",type:"video/webm"},
    {mimeType:"video/webm;codecs=vp9",ext:"webm",type:"video/webm"},
    {mimeType:"video/webm;codecs=vp8",ext:"webm",type:"video/webm"},
    {mimeType:"video/webm",ext:"webm",type:"video/webm"}
  ];
  for(const o of options){ if(MediaRecorder.isTypeSupported(o.mimeType))return o; }
  return options[options.length-1];
}

recBtn.onclick=()=>{
  if(mediaRecorder&&mediaRecorder.state==="recording"){
    mediaRecorder.stop();recBtn.textContent="● REC";recBtn.classList.remove("recording");
  }else{
    recordedChunks=[];
    const fmt=pickRecordingFormat();
    const stream=canvas.captureStream(60);
    mediaRecorder=new MediaRecorder(stream,{mimeType:fmt.mimeType,videoBitsPerSecond:20_000_000});
    mediaRecorder.ondataavailable=e=>{if(e.data.size>0)recordedChunks.push(e.data);};
    mediaRecorder.onstop=()=>{
      const blob=new Blob(recordedChunks,{type:fmt.type});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download="space-is-the-face."+fmt.ext;a.click();URL.revokeObjectURL(url);
    };
    mediaRecorder.start();recBtn.textContent="■ STOP";recBtn.classList.add("recording");
    console.log("Recording:",fmt.mimeType,"@ 20Mbps");
  }
};

// ─── Presets ───────────────────────────────────────────────────────
function getState(){
  const state={colour:colourPicker.value,trackballs:{}};
  Object.keys(trackballState).forEach(k=>{state.trackballs[k]={...trackballState[k]};});
  state.camFxMode=sl("camFxMode")?sl("camFxMode").value:"normal";
  state.stretchBlend=sl("stretchBlend")?sl("stretchBlend").value:"normal";
  state.camDispLock=sl("camDispLock")?sl("camDispLock").checked:false;
  state.audioFaceLock=sl("audioFaceLock")?sl("audioFaceLock").checked:true;
  state.audioMode=sl("audioMode")?sl("audioMode").value:"waveform";
  state.safeFlipCheck=sl("safeFlipCheck")?sl("safeFlipCheck").checked:false;
  state.zoomAllCheck=sl("zoomAllCheck")?sl("zoomAllCheck").checked:false;
  state.trailSafeClip=sl("trailSafeClip")?sl("trailSafeClip").checked:false;
  SLIDER_IDS.forEach(id=>{const s=sl(id);if(s)state[id]=+s.value;});
  return state;
}
function setState(state){
  if(!state)return;
  SLIDER_IDS.forEach(id=>{const s=sl(id);if(s&&state[id]!==undefined){s.value=state[id];if(s.oninput)s.oninput();}});
  if(state.colour){colourPicker.value=state.colour;colourValEl.textContent=state.colour;}
  if(state.camFxMode){const fx=sl("camFxMode");if(fx)fx.value=state.camFxMode;}
  if(state.stretchBlend){const sb=sl("stretchBlend");if(sb)sb.value=state.stretchBlend;}
  if(state.camDispLock!==undefined){const c=sl("camDispLock");if(c)c.checked=state.camDispLock;}
  if(state.audioFaceLock!==undefined){const c=sl("audioFaceLock");if(c)c.checked=state.audioFaceLock;}
  if(state.audioMode){const m=sl("audioMode");if(m)m.value=state.audioMode;}
  if(state.safeFlipCheck!==undefined){const c=sl("safeFlipCheck");if(c)c.checked=state.safeFlipCheck;}
  if(state.zoomAllCheck!==undefined){const c=sl("zoomAllCheck");if(c)c.checked=state.zoomAllCheck;}
  if(state.trailSafeClip!==undefined){const c=sl("trailSafeClip");if(c)c.checked=state.trailSafeClip;}
  if(state.trackballs){Object.keys(state.trackballs).forEach(k=>{if(trackballState[k]){trackballState[k]=state.trackballs[k];const d=sl("dot"+k.charAt(0).toUpperCase()+k.slice(1));if(d){d.style.left=((state.trackballs[k].x+1)/2*100)+"%";d.style.top=((state.trackballs[k].y+1)/2*100)+"%";}}});}
}
window.savePreset=n=>{localStorage.setItem("sitf_preset_"+n,JSON.stringify(getState()));};
window.loadPreset=n=>{const d=localStorage.getItem("sitf_preset_"+n);if(d)setState(JSON.parse(d));};
window.exportPreset=()=>{const blob=new Blob([JSON.stringify(getState(),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="sitf-preset.json";a.click();};
sl("importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{setState(JSON.parse(r.result));}catch(err){console.error(err);}};r.readAsText(f);};

// ─── Render loop ───────────────────────────────────────────────────
function renderLoop(){
  if(!faceLandmarker){requestAnimationFrame(renderLoop);return;}
  const now=performance.now();if(now<=lastTimestamp){requestAnimationFrame(renderLoop);return;}
  lastTimestamp=now;
  tickMorph();
  updateAudioWaveform();
  const result=faceLandmarker.detectForVideo(video,now);
  if(result.faceLandmarks&&result.faceLandmarks.length>0){
    currentLandmarks=result.faceLandmarks[0];
    renderDepth(currentLandmarks);
    let grid=buildGrid(currentLandmarks);grid=smoothGrid(grid);
    lastGrid=grid;
    render(currentLandmarks,grid);statusEl.textContent="";
  }else{
    const grid=prevGrid||Array.from({length:NUM_LINES},()=>new Float32Array(LINE_SAMPLES));
    lastGrid=grid;
    const safeAmt=sl("safeAreaSlider")?+sl("safeAreaSlider").value:0;
    const safeFlip=sl("safeFlipCheck")?sl("safeFlipCheck").checked:false;
    ctx.fillStyle="#000";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save();ctx.translate(canvas.width,0);ctx.scale(-1,1);drawLines(grid,safeAmt,safeFlip);ctx.restore();
    drawWebcamOverlay();
    statusEl.textContent="No face detected";
  }
  requestAnimationFrame(renderLoop);
}

async function main(){
  try{await initFaceLandmarker();await startWebcam();statusEl.textContent="Tracking…";renderLoop();}
  catch(err){statusEl.textContent=`Error: ${err.message}`;console.error(err);}
}
main();
