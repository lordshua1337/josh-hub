const images = [
  {
    name: "Mythic Sentinel",
    tag: "Prometheus figure",
    file: "assets/generated/mythic-sentinel.png",
    bestFor: "hero posts, thought leadership, AI superpowers",
    focalHint: { x: 0.68, y: 0.45 },
    recipe:
      "Faceless obsidian Prometheus-inspired AI sentinel, controlled flame, city-water reflection, dusk bokeh, matte black and ember copper.",
  },
  {
    name: "Neural Forge",
    tag: "workflow systems",
    file: "assets/generated/neural-forge.png",
    bestFor: "automation, systems cleanup, process transformation",
    focalHint: { x: 0.67, y: 0.44 },
    recipe:
      "Molten data forge, business workflows cast into luminous rails, APIs, dashboards, and neural pathways, black ceramic and hot glass.",
  },
  {
    name: "Human Superpowers",
    tag: "people first",
    file: "assets/generated/human-superpowers.png",
    bestFor: "training, enablement, human-centric AI",
    focalHint: { x: 0.66, y: 0.5 },
    recipe:
      "Professional team empowered by ember-like AI light, grounded operations room, warm faces, subtle interface glow, no robot takeover mood.",
  },
  {
    name: "Milwaukee Firefront",
    tag: "Midwest roots",
    file: "assets/generated/milwaukee-firefront.png",
    bestFor: "local posts, founder story, regional credibility",
    focalHint: { x: 0.67, y: 0.5 },
    recipe:
      "Blue-hour waterfront skyline, reflective water, controlled Promethean firelight, intelligent data streams, cinematic Midwest atmosphere.",
  },
  {
    name: "Compliance Oracle",
    tag: "governed AI",
    file: "assets/generated/compliance-oracle.png",
    bestFor: "regulated industries, governance, risk-aware AI",
    focalHint: { x: 0.55, y: 0.48 },
    recipe:
      "Regulated-industry command room, audit trails and safeguards as luminous geometric inscriptions around a controlled central flame.",
  },
  {
    name: "Agent Constellation",
    tag: "AI agents",
    file: "assets/generated/agent-constellation.png",
    bestFor: "agentic workflows, orchestration, automation posts",
    focalHint: { x: 0.56, y: 0.5 },
    recipe:
      "Autonomous AI agent constellation orbiting an ember core, fine data threads, deep control-room mood, crisp cyan trails.",
  },
  {
    name: "Revenue Engine",
    tag: "growth ops",
    file: "assets/generated/revenue-engine.png",
    bestFor: "pipeline, CRM, revenue recovery, advisor growth",
    focalHint: { x: 0.64, y: 0.46 },
    recipe:
      "Revenue operations engine in matte black glass and brass, clean pipeline motion, controlled flame, executive mechanical realism.",
  },
  {
    name: "Tool That Exists",
    tag: "custom software",
    file: "assets/generated/tool-that-exists.png",
    bestFor: "custom builds, internal tools, workflow automation",
    focalHint: { x: 0.62, y: 0.48 },
    recipe:
      "Custom software interface forged from light and controlled fire, modular panels, glowing connectors, practical automation flows.",
  },
  {
    name: "Titan Blueprint",
    tag: "strategy",
    file: "assets/generated/titan-blueprint.png",
    bestFor: "roadmaps, implementation strategy, transformation plans",
    focalHint: { x: 0.6, y: 0.5 },
    recipe:
      "Dark drafting-table AI transformation blueprint, contour lines, architecture paths, human workflows, cyan linework and ember flame.",
  },
  {
    name: "Responsible Flame",
    tag: "safe power",
    file: "assets/generated/responsible-flame.png",
    bestFor: "responsible AI, trust, safety, executive posts",
    focalHint: { x: 0.62, y: 0.48 },
    recipe:
      "Controlled flame in transparent AI containment vessel, subtle human presence, geometric safeguards, editorial still life realism.",
  },
];

const presets = {
  "instagram-square": {
    label: "Instagram / LinkedIn square",
    width: 1080,
    height: 1080,
  },
  "instagram-portrait": {
    label: "Instagram portrait feed",
    width: 1080,
    height: 1350,
  },
  "instagram-story": {
    label: "Stories / Reels / Shorts",
    width: 1080,
    height: 1920,
  },
  "linkedin-link": {
    label: "LinkedIn link preview",
    width: 1200,
    height: 627,
  },
  "linkedin-banner": {
    label: "LinkedIn profile banner",
    width: 1584,
    height: 396,
  },
  "x-landscape": {
    label: "X landscape post",
    width: 1600,
    height: 900,
  },
  "facebook-landscape": {
    label: "Facebook landscape post",
    width: 1200,
    height: 630,
  },
  "youtube-thumbnail": {
    label: "YouTube thumbnail",
    width: 1280,
    height: 720,
  },
  "presentation-wide": {
    label: "Presentation / website wide",
    width: 1920,
    height: 1080,
  },
};

const els = {
  stageImage: document.querySelector("#stageImage"),
  stageName: document.querySelector("#stageName"),
  stageTag: document.querySelector("#stageTag"),
  stageBest: document.querySelector("#stageBest"),
  stageRecipe: document.querySelector("#stageRecipe"),
  gallery: document.querySelector("#gallery"),
  postPreset: document.querySelector("#postPreset"),
  presetSize: document.querySelector("#presetSize"),
  focusX: document.querySelector("#focusX"),
  focusY: document.querySelector("#focusY"),
  autoFocus: document.querySelector("#autoFocus"),
  autoFocusToggle: document.querySelector("#autoFocusToggle"),
  guidePreset: document.querySelector("#guidePreset"),
  brandOverlay: document.querySelector("#brandOverlay"),
  cropPreview: document.querySelector("#cropPreview"),
  cropPreviewImage: document.querySelector("#cropPreviewImage"),
  focalPoint: document.querySelector("#focalPoint"),
  renderedOutput: document.querySelector("#renderedOutput"),
  renderedImage: document.querySelector("#renderedImage"),
  downloadRendered: document.querySelector("#downloadRendered"),
  openRendered: document.querySelector("#openRendered"),
  qualityScore: document.querySelector("#qualityScore"),
  qualityList: document.querySelector("#qualityList"),
  batchMode: document.querySelector("#batchMode"),
  batchCount: document.querySelector("#batchCount"),
  renderBatch: document.querySelector("#renderBatch"),
  batchOutput: document.querySelector("#batchOutput"),
  carouselSlides: document.querySelector("#carouselSlides"),
  carouselPreset: document.querySelector("#carouselPreset"),
  carouselSize: document.querySelector("#carouselSize"),
  renderCarousel: document.querySelector("#renderCarousel"),
  carouselOutput: document.querySelector("#carouselOutput"),
  stripPreview: document.querySelector("#stripPreview"),
  panelOutput: document.querySelector("#panelOutput"),
  downloadSelected: document.querySelector("#downloadSelected"),
  openSelected: document.querySelector("#openSelected"),
  copyRecipe: document.querySelector("#copyRecipe"),
  exportSized: document.querySelector("#exportSized"),
  sendToHub: document.querySelector("#sendToHub"),
  hubLink: document.querySelector("#hubLink"),
  hubUrl: document.querySelector("#hubUrl"),
  copyHubUrl: document.querySelector("#copyHubUrl"),
  toast: document.querySelector("#toast"),
};

let selectedIndex = 0;
let focusRequestId = 0;
const sourceCache = new Map();
const focalCache = new Map();

function renderGallery() {
  els.gallery.innerHTML = images.map((image, index) => `
    <button class="image-card" type="button" data-index="${index}" aria-label="${image.name}">
      <img src="${image.file}" alt="${image.name} social media background" loading="${index < 2 ? "eager" : "lazy"}" />
      <span class="image-scrim"></span>
      <span class="image-label">
        <span>${String(index + 1).padStart(2, "0")} / ${image.tag}</span>
        <strong>${image.name}</strong>
      </span>
    </button>
  `).join("");

  document.querySelectorAll(".image-card").forEach((card, index) => {
    card.addEventListener("click", () => selectImage(index));
  });
}

function selectImage(index) {
  selectedIndex = index;
  const image = images[index];
  els.stageImage.src = image.file;
  els.stageImage.alt = `${image.name} generated Prometheus Consulting background`;
  els.stageName.textContent = image.name;
  els.stageTag.textContent = image.tag;
  els.stageBest.textContent = image.bestFor;
  els.stageRecipe.textContent = image.recipe;
  els.downloadSelected.href = image.file;
  els.downloadSelected.download = `${slug(image.name)}-prometheus-background.png`;
  els.openSelected.href = image.file;
  els.cropPreviewImage.src = image.file;
  els.renderedOutput.hidden = true;
  els.carouselOutput.hidden = true;
  document.querySelectorAll(".image-card").forEach((card, cardIndex) => {
    card.classList.toggle("active", cardIndex === index);
  });
  if (els.autoFocusToggle.checked) {
    applySmartFocus(true);
  } else {
    updateCropPreview();
  }
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function copyRecipe() {
  const image = images[selectedIndex];
  const text = [
    `${image.name}`,
    `Use: ${image.bestFor}`,
    `Visual recipe: ${image.recipe}`,
    "Brand notes: matte black, cream, ember copper, controlled gold fire, subtle cyan or verified green accent, no readable text or logo baked into the art.",
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.append(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }

  showToast("Recipe copied");
}

function updateCropPreview() {
  const preset = presets[els.postPreset.value];
  const x = `${els.focusX.value}%`;
  const y = `${els.focusY.value}%`;
  els.presetSize.textContent = `${preset.width} x ${preset.height}`;
  els.cropPreview.style.aspectRatio = `${preset.width} / ${preset.height}`;
  els.cropPreview.className = `crop-preview guide-${els.guidePreset.value} overlay-${els.brandOverlay.value}`;
  els.cropPreviewImage.style.objectPosition = `${x} ${y}`;
  els.focalPoint.style.left = x;
  els.focalPoint.style.top = y;
  els.renderedOutput.hidden = true;
  els.carouselOutput.hidden = true;
  els.batchOutput.hidden = true;
  updateCarouselSize();
  updateBatchCount();
}

function getCoverCrop(sourceWidth, sourceHeight, outputWidth, outputHeight, focusX, focusY) {
  const sourceRatio = sourceWidth / sourceHeight;
  const outputRatio = outputWidth / outputHeight;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (sourceRatio > outputRatio) {
    cropWidth = sourceHeight * outputRatio;
  } else {
    cropHeight = sourceWidth / outputRatio;
  }

  const maxX = sourceWidth - cropWidth;
  const maxY = sourceHeight - cropHeight;
  return {
    sx: maxX * focusX,
    sy: maxY * focusY,
    sw: cropWidth,
    sh: cropHeight,
  };
}

function updateCarouselSize() {
  const preset = presets[els.carouselPreset.value];
  const slides = Number(els.carouselSlides.value);
  els.carouselSize.textContent = `${slides} x ${preset.width} x ${preset.height}`;
}

function updateCarouselSettings() {
  updateCarouselSize();
  els.carouselOutput.hidden = true;
}

function updateBatchCount() {
  const mode = els.batchMode.value;
  const count = mode === "selected-all-sizes" ? Object.keys(presets).length : images.length;
  els.batchCount.textContent = `${count} outputs`;
}

function loadSource(file) {
  if (sourceCache.has(file)) return sourceCache.get(file);
  const request = new Promise((resolve, reject) => {
    const source = new Image();
    source.onload = () => resolve(source);
    source.onerror = reject;
    source.src = file;
  });
  sourceCache.set(file, request);
  return request;
}

async function detectFocalPoint(file) {
  if (focalCache.has(file)) return focalCache.get(file);

  const source = await loadSource(file);
  const width = 180;
  const height = Math.max(1, Math.round(width * source.naturalHeight / source.naturalWidth));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  let total = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const saturation = (max - min) / 255;
      const warmth = Math.max(0, r - b) / 255;
      const cyan = Math.max(0, Math.min(g, b) - r * 0.6) / 255;

      const right = ((y * width + x + 1) * 4);
      const down = (((y + 1) * width + x) * 4);
      const edge = (
        Math.abs(r - data[right]) +
        Math.abs(g - data[right + 1]) +
        Math.abs(b - data[right + 2]) +
        Math.abs(r - data[down]) +
        Math.abs(g - data[down + 1]) +
        Math.abs(b - data[down + 2])
      ) / 1530;

      const nx = x / (width - 1);
      const ny = y / (height - 1);
      const borderFalloff = Math.min(1, Math.min(nx, 1 - nx, ny, 1 - ny) / 0.18);
      const usefulLight = smoothstep(0.08, 0.86, luminance) * (1 - smoothstep(0.9, 1, luminance) * 0.35);
      const score = Math.max(0, (edge * 3.2 + saturation * 1.4 + warmth * 1.1 + cyan * 0.9 + usefulLight * 0.45) * borderFalloff);

      total += score;
      weightedX += x * score;
      weightedY += y * score;
    }
  }

  const fallback = { x: 0.5, y: 0.5 };
  const focal = total > 0
    ? {
      x: clamp(weightedX / total / width, 0.18, 0.82),
      y: clamp(weightedY / total / height, 0.18, 0.82),
    }
    : fallback;

  focalCache.set(file, focal);
  return focal;
}

async function applySmartFocus(silent = false) {
  const requestId = ++focusRequestId;
  const image = images[selectedIndex];
  const detected = await getSmartFocal(image);
  if (requestId !== focusRequestId) return;
  const focal = detected;
  els.focusX.value = String(Math.round(focal.x * 100));
  els.focusY.value = String(Math.round(focal.y * 100));
  updateCropPreview();
  if (!silent) showToast(`Smart focus ${els.focusX.value}% / ${els.focusY.value}%`);
}

async function getSmartFocal(image) {
  const detected = await detectFocalPoint(image.file);
  return image.focalHint
    ? {
      x: detected.x * 0.34 + image.focalHint.x * 0.66,
      y: detected.y * 0.5 + image.focalHint.y * 0.5,
    }
    : detected;
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function exportSizedImage() {
  const image = images[selectedIndex];
  const preset = presets[els.postPreset.value];
  const canvas = await renderImageCanvas(image, preset, {
    focusX: Number(els.focusX.value) / 100,
    focusY: Number(els.focusY.value) / 100,
    overlay: els.brandOverlay.value,
  });
  const dataUrl = canvas.toDataURL("image/png");
  const filename = `${slug(image.name)}-${els.postPreset.value}-${preset.width}x${preset.height}.png`;
  els.renderedImage.src = dataUrl;
  els.downloadRendered.href = dataUrl;
  els.downloadRendered.download = filename;
  els.openRendered.href = dataUrl;
  els.renderedOutput.hidden = false;
  renderQuality(canvas, preset);
  showToast(`${preset.width} x ${preset.height} rendered`);
}

async function renderImageCanvas(image, preset, options) {
  const source = await loadSource(image.file);
  const canvas = document.createElement("canvas");
  canvas.width = preset.width;
  canvas.height = preset.height;
  const ctx = canvas.getContext("2d");
  const crop = getCoverCrop(
    source.naturalWidth,
    source.naturalHeight,
    preset.width,
    preset.height,
    options.focusX,
    options.focusY,
  );
  ctx.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, preset.width, preset.height);
  drawBrandOverlay(ctx, preset.width, preset.height, options.overlay);
  return canvas;
}

function drawBrandOverlay(ctx, width, height, mode) {
  if (mode === "none") return;

  if (mode === "fade-only" || mode === "full-brand") {
    const leftFade = ctx.createLinearGradient(0, 0, width * 0.58, 0);
    leftFade.addColorStop(0, "rgba(8,5,4,0.72)");
    leftFade.addColorStop(0.62, "rgba(8,5,4,0.32)");
    leftFade.addColorStop(1, "rgba(8,5,4,0)");
    ctx.fillStyle = leftFade;
    ctx.fillRect(0, 0, width, height);
  }

  if (mode === "corner-mark" || mode === "wordmark" || mode === "full-brand") {
    const pad = Math.round(Math.min(width, height) * 0.06);
    const markSize = Math.round(Math.min(width, height) * 0.058);
    ctx.save();
    ctx.fillStyle = "rgba(8,5,4,0.48)";
    roundedRect(ctx, pad, height - pad - markSize, markSize, markSize, Math.max(6, markSize * 0.16));
    ctx.fill();
    ctx.strokeStyle = "rgba(242,179,109,0.86)";
    ctx.lineWidth = Math.max(2, markSize * 0.045);
    ctx.stroke();
    drawMiniFlame(ctx, pad + markSize / 2, height - pad - markSize / 2, markSize * 0.34);

    if (mode === "wordmark" || mode === "full-brand") {
      ctx.fillStyle = "rgba(245,241,234,0.94)";
      ctx.font = `800 ${Math.round(Math.min(width, height) * 0.034)}px Inter, sans-serif`;
      ctx.letterSpacing = "0px";
      ctx.fillText("PROMETHEUS", pad + markSize + Math.round(markSize * 0.32), height - pad - markSize * 0.36);
      ctx.fillStyle = "rgba(242,179,109,0.86)";
      ctx.font = `700 ${Math.round(Math.min(width, height) * 0.016)}px "JetBrains Mono", monospace`;
      ctx.fillText("// AI CONSULTING", pad + markSize + Math.round(markSize * 0.34), height - pad);
    }
    ctx.restore();
  }
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawMiniFlame(ctx, x, y, size) {
  const flame = ctx.createLinearGradient(x, y - size, x, y + size);
  flame.addColorStop(0, "#fff2c5");
  flame.addColorStop(0.48, "#f2b36d");
  flame.addColorStop(1, "#c96b3c");
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.bezierCurveTo(x + size * 0.7, y - size * 0.2, x + size * 0.42, y + size * 0.8, x, y + size);
  ctx.bezierCurveTo(x - size * 0.5, y + size * 0.36, x - size * 0.48, y - size * 0.35, x, y - size);
  ctx.fill();
}

function renderQuality(canvas, preset) {
  const result = scoreCanvas(canvas, preset);
  els.qualityScore.textContent = `Quality score ${result.score}/100`;
  els.qualityList.innerHTML = result.notes.map((note) => `<li>${note}</li>`).join("");
}

function scoreCanvas(canvas, preset) {
  const sampleWidth = 120;
  const sampleHeight = Math.max(1, Math.round(sampleWidth * canvas.height / canvas.width));
  const sample = document.createElement("canvas");
  sample.width = sampleWidth;
  sample.height = sampleHeight;
  const ctx = sample.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);
  const { data } = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
  let luminanceTotal = 0;
  let leftDetail = 0;
  let clipped = 0;

  for (let y = 1; y < sampleHeight - 1; y += 1) {
    for (let x = 1; x < sampleWidth - 1; x += 1) {
      const i = (y * sampleWidth + x) * 4;
      const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      luminanceTotal += lum;
      if (lum > 0.96 || lum < 0.02) clipped += 1;
      if (x < sampleWidth * 0.36) {
        const right = (y * sampleWidth + x + 1) * 4;
        leftDetail += Math.abs(data[i] - data[right]) + Math.abs(data[i + 1] - data[right + 1]) + Math.abs(data[i + 2] - data[right + 2]);
      }
    }
  }

  const pixels = (sampleWidth - 2) * (sampleHeight - 2);
  const mean = luminanceTotal / pixels;
  const clipRatio = clipped / pixels;
  const leftNoise = leftDetail / (pixels * 0.36 * 765);
  const focusX = Number(els.focusX.value) / 100;
  const focusY = Number(els.focusY.value) / 100;

  const exposureScore = Math.round(30 * (1 - Math.min(1, Math.abs(mean - 0.36) / 0.36)));
  const clippingScore = Math.round(20 * (1 - Math.min(1, clipRatio / 0.22)));
  const focusScore = Math.round(25 * (focusX > 0.12 && focusX < 0.88 && focusY > 0.12 && focusY < 0.88 ? 1 : 0.55));
  const copyScore = Math.round(25 * (1 - Math.min(1, leftNoise / 0.13)));
  const score = Math.max(0, Math.min(100, exposureScore + clippingScore + focusScore + copyScore));

  return {
    score,
    notes: [
      focusScore > 20 ? "Focal point stays inside the crop." : "Focal point is near an edge; nudge the sliders.",
      copyScore > 15 ? "Left-side copy area is reasonably calm." : "Left-side copy area is busy; use CTA-safe fade or shift focus.",
      exposureScore > 18 ? "Exposure is usable for social overlays." : "Crop may be too dark or too bright.",
      clippingScore > 13 ? "Highlights and shadows are not heavily clipped." : "Some detail is getting crushed or blown out.",
    ],
  };
}

async function renderCarouselPanels() {
  const image = images[selectedIndex];
  const source = await loadSource(image.file);
  const preset = presets[els.carouselPreset.value];
  const slides = Number(els.carouselSlides.value);
  const stripWidth = preset.width * slides;
  const stripHeight = preset.height;
  const focusX = Number(els.focusX.value) / 100;
  const focusY = Number(els.focusY.value) / 100;

  const strip = document.createElement("canvas");
  strip.width = stripWidth;
  strip.height = stripHeight;
  const stripCtx = strip.getContext("2d");
  const crop = getCoverCrop(source.naturalWidth, source.naturalHeight, stripWidth, stripHeight, focusX, focusY);
  stripCtx.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, stripWidth, stripHeight);

  const stripUrl = strip.toDataURL("image/png");
  const breaks = Array.from({ length: slides - 1 }, (_, index) => {
    const left = ((index + 1) / slides) * 100;
    return `<span class="strip-break" style="left:${left}%"><span>${index + 1}|${index + 2}</span></span>`;
  }).join("");
  els.stripPreview.innerHTML = `<img src="${stripUrl}" alt="Continuous carousel strip preview" />${breaks}`;
  els.panelOutput.innerHTML = "";

  for (let index = 0; index < slides; index += 1) {
    const panel = document.createElement("canvas");
    panel.width = preset.width;
    panel.height = preset.height;
    const panelCtx = panel.getContext("2d");
    panelCtx.drawImage(strip, index * preset.width, 0, preset.width, preset.height, 0, 0, preset.width, preset.height);
    drawBrandOverlay(panelCtx, preset.width, preset.height, els.brandOverlay.value);
    const panelUrl = panel.toDataURL("image/png");
    const filename = `${slug(image.name)}-carousel-${String(index + 1).padStart(2, "0")}-${preset.width}x${preset.height}.png`;

    const card = document.createElement("div");
    card.className = "panel-card";
    card.innerHTML = `
      <img src="${panelUrl}" alt="${image.name} carousel panel ${index + 1}" />
      <div>
        <strong>Panel ${index + 1} of ${slides}</strong>
        <a href="${panelUrl}" download="${filename}">
          <i data-lucide="download"></i>
          <span>Download</span>
        </a>
      </div>
    `;
    els.panelOutput.append(card);
  }

  const note = document.createElement("p");
  note.className = "continuity-note";
  note.textContent = "Swipe breaks are marked on the strip; each panel is sliced from the same continuous canvas, so edges line up when swiped.";
  els.panelOutput.prepend(note);
  els.carouselOutput.hidden = false;
  if (window.lucide) window.lucide.createIcons();
  showToast(`${slides} seamless panels rendered`);
}

async function renderBatch() {
  els.batchOutput.hidden = false;
  els.batchOutput.innerHTML = "";
  const jobs = [];

  if (els.batchMode.value === "selected-all-sizes") {
    const image = images[selectedIndex];
    Object.entries(presets).forEach(([presetKey, preset]) => {
      jobs.push({ image, presetKey, preset, focal: getCurrentFocal() });
    });
  } else {
    const presetKey = els.postPreset.value;
    const preset = presets[presetKey];
    for (const image of images) {
      jobs.push({ image, presetKey, preset, focal: null });
    }
  }

  els.batchCount.textContent = `rendering ${jobs.length}`;

  for (const [index, job] of jobs.entries()) {
    const focal = job.focal || await getSmartFocal(job.image);
    const canvas = await renderImageCanvas(job.image, job.preset, {
      focusX: focal.x,
      focusY: focal.y,
      overlay: els.brandOverlay.value,
    });
    const dataUrl = canvas.toDataURL("image/png");
    const filename = `${slug(job.image.name)}-${job.presetKey}-${job.preset.width}x${job.preset.height}.png`;
    els.batchOutput.append(makeOutputCard({
      imageUrl: dataUrl,
      title: job.image.name,
      subtitle: `${job.preset.label} · ${job.preset.width}x${job.preset.height}`,
      filename,
    }));
    els.batchCount.textContent = `${index + 1}/${jobs.length} rendered`;
  }

  if (window.lucide) window.lucide.createIcons();
  showToast(`${jobs.length} batch outputs rendered`);
}

function getCurrentFocal() {
  return {
    x: Number(els.focusX.value) / 100,
    y: Number(els.focusY.value) / 100,
  };
}

function makeOutputCard({ imageUrl, title, subtitle, filename }) {
  const card = document.createElement("div");
  card.className = "batch-card";
  card.innerHTML = `
    <img src="${imageUrl}" alt="${title} rendered output" />
    <div>
      <strong>${title}</strong>
      <span>${subtitle}</span>
      <a href="${imageUrl}" download="${filename}">
        <i data-lucide="download"></i>
        <span>Download</span>
      </a>
    </div>
  `;
  return card;
}

function applyCropPreset(presetName) {
  const values = {
    "text-left": [66, 48],
    "subject-right": [72, 48],
    center: [50, 50],
    skyline: [50, 38],
  }[presetName];

  if (!values) return;
  els.focusX.value = String(values[0]);
  els.focusY.value = String(values[1]);
  updateCropPreview();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 1400);
}

document.querySelector("#shuffleImage").addEventListener("click", () => {
  const next = (selectedIndex + 1 + Math.floor(Math.random() * (images.length - 1))) % images.length;
  selectImage(next);
});

els.copyRecipe.addEventListener("click", copyRecipe);
els.autoFocus.addEventListener("click", applySmartFocus);
els.exportSized.addEventListener("click", exportSizedImage);

// ─── Send rendered image to the Hub (Supabase Storage upload) ──────────
// If the forge was opened from the wizard (?return=wizard), this also
// postMessages the parent window with the resulting URL and closes the
// forge tab so Josh doesn't have to copy-paste anything.
const isFromWizard = new URLSearchParams(location.search).get("return") === "wizard";

async function sendRenderedToHub() {
  const image = images[selectedIndex];
  const preset = presets[els.postPreset.value];
  if (!preset) return;
  els.sendToHub.disabled = true;
  els.sendToHub.querySelector("span").textContent = "Uploading…";
  try {
    const canvas = await renderImageCanvas(image, preset, {
      focusX: Number(els.focusX.value) / 100,
      focusY: Number(els.focusY.value) / 100,
      overlay: els.brandOverlay.value,
    });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.92));
    if (!blob) throw new Error("canvas toBlob failed");
    const filename = `${slug(image.name)}-${els.postPreset.value}-${preset.width}x${preset.height}.png`;
    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("slug", `${slug(image.name)}-${els.postPreset.value}`);
    const res = await fetch("/api/forge/upload", { method: "POST", body: formData });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
    els.hubUrl.value = json.url;
    els.hubLink.hidden = false;

    if (isFromWizard && window.opener) {
      // Round-trip: hand the URL back to the wizard tab and close ourselves.
      window.opener.postMessage(
        { type: "forge:image-ready", url: json.url, sourceImage: image.name },
        location.origin
      );
      showToast("Sent to wizard. Closing…");
      setTimeout(() => window.close(), 700);
    } else {
      showToast("Uploaded — copy URL into wizard");
    }
  } catch (e) {
    showToast(`Upload failed: ${e.message}`);
  } finally {
    els.sendToHub.disabled = false;
    els.sendToHub.querySelector("span").textContent = isFromWizard ? "Use in wizard" : "Send to Hub";
  }
}

// Surface the round-trip mode in the button label so Josh knows what it does.
if (isFromWizard && els.sendToHub) {
  els.sendToHub.querySelector("span").textContent = "Use in wizard";
}
els.sendToHub.addEventListener("click", sendRenderedToHub);

// Wizard return banner — surface a prominent CTA at the very top so
// Josh doesn't have to dig for the "Send to Hub" button hidden in the
// rendered-output panel.
if (isFromWizard) {
  const banner = document.querySelector("#wizardBanner");
  if (banner) {
    banner.hidden = false;
    document.querySelector("#wizardSendNow").addEventListener("click", sendRenderedToHub);
  }
}
els.copyHubUrl.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(els.hubUrl.value);
    showToast("URL copied");
  } catch {
    els.hubUrl.select();
    document.execCommand("copy");
    showToast("URL copied");
  }
});
els.postPreset.addEventListener("change", updateCropPreview);
els.focusX.addEventListener("input", updateCropPreview);
els.focusY.addEventListener("input", updateCropPreview);
els.guidePreset.addEventListener("change", updateCropPreview);
els.brandOverlay.addEventListener("change", updateCropPreview);
els.batchMode.addEventListener("change", updateBatchCount);
els.renderBatch.addEventListener("click", renderBatch);
els.carouselSlides.addEventListener("change", updateCarouselSettings);
els.carouselPreset.addEventListener("change", updateCarouselSettings);
els.renderCarousel.addEventListener("click", renderCarouselPanels);
document.querySelectorAll("[data-crop-preset]").forEach((button) => {
  button.addEventListener("click", () => applyCropPreset(button.dataset.cropPreset));
});

renderGallery();
selectImage(0);

if (window.lucide) {
  window.lucide.createIcons();
}
