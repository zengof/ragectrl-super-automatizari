const canvas = document.querySelector("#posterCanvas");
const ctx = canvas.getContext("2d");

const imageInput = document.querySelector("#imageInput");
const imageInput2 = document.querySelector("#imageInput2");
const captionInput = document.querySelector("#captionInput");
const textSizeInput = document.querySelector("#textSizeInput");
const textOffsetYInput = document.querySelector("#textOffsetYInput");
const lineHeightInput = document.querySelector("#lineHeightInput");
const zoomInput = document.querySelector("#zoomInput");
const offsetXInput = document.querySelector("#offsetXInput");
const offsetYInput = document.querySelector("#offsetYInput");
const offsetX2Input = document.querySelector("#offsetX2Input");
const offsetY2Input = document.querySelector("#offsetY2Input");
const blendStartInput = document.querySelector("#blendStartInput");
const blendEndInput = document.querySelector("#blendEndInput");
const blendStrengthInput = document.querySelector("#blendStrengthInput");
const monoInput = document.querySelector("#monoInput");
const markdownInput = document.querySelector("#markdownInput");
const manualLinesInput = document.querySelector("#manualLinesInput");
const dualPhotoInput = document.querySelector("#dualPhotoInput");
const downloadButton = document.querySelector("#downloadButton");
const shareButton = document.querySelector("#shareButton");
const resetButton = document.querySelector("#resetButton");

const template = new Image();
template.src = "assets/postare-rage-template.png?v=10";

const state = {
  image: null,
  image2: null,
  caption: captionInput.value,
  textSize: Number(textSizeInput.value),
  textOffsetY: Number(textOffsetYInput.value),
  lineHeight: Number(lineHeightInput.value),
  zoom: Number(zoomInput.value),
  offsetX: Number(offsetXInput.value),
  offsetY: Number(offsetYInput.value),
  offsetX2: Number(offsetX2Input.value),
  offsetY2: Number(offsetY2Input.value),
  blendStart: Number(blendStartInput.value),
  blendEnd: Number(blendEndInput.value),
  blendStrength: Number(blendStrengthInput.value),
  mono: monoInput.checked,
  markdown: markdownInput.checked,
  manualLines: manualLinesInput.checked,
  dualPhoto: dualPhotoInput.checked,
  dragging: false,
  lastPoint: null,
};

const W = canvas.width;
const H = canvas.height;
const photoArea = { x: 0, y: 0, w: W, h: 900 };
const captionArea = { x: 115, y: 850, w: 770, h: 220 };
const captionFont = '"Bebas Neue", sans-serif';
const captionWhite = "#f7f7f7";
const logoGreen = "#05f439";

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawPhotoLayer();

  if (template.complete && template.naturalWidth) {
    ctx.drawImage(template, 0, 0, W, H);
  }

  drawCaption();
}

function drawPhotoLayer() {
  if (!state.image) {
    drawPlaceholder();
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(photoArea.x, photoArea.y, photoArea.w, photoArea.h);
  ctx.clip();

  const img = state.image;
  const cover = coverRect(img.width, img.height, photoArea.w, photoArea.h);
  const drawW = cover.w * state.zoom;
  const drawH = cover.h * state.zoom;
  const drawX = photoArea.x + (photoArea.w - drawW) / 2 + state.offsetX;
  const drawY = photoArea.y + (photoArea.h - drawH) / 2 + state.offsetY;

  if (state.mono) ctx.filter = "grayscale(1) contrast(1.08)";
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  if (state.dualPhoto && state.image2) {
    const img2 = state.image2;
    const cover2 = coverRect(img2.width, img2.height, photoArea.w, photoArea.h);
    const drawW2 = cover2.w * state.zoom;
    const drawH2 = cover2.h * state.zoom;
    const drawX2 = photoArea.x + (photoArea.w - drawW2) / 2 + state.offsetX;
    const drawY2 = photoArea.y + (photoArea.h - drawH2) / 2 + state.offsetY;

    const overlayCanvas = document.createElement("canvas");
    overlayCanvas.width = W;
    overlayCanvas.height = H;
    const overlayCtx = overlayCanvas.getContext("2d");
    overlayCtx.drawImage(img2, drawX2, drawY2, drawW2, drawH2);

    const blendStart = photoArea.x + photoArea.w * 0.35;
    const blendEnd = photoArea.x + photoArea.w * 0.65;
    const overlayMask = overlayCtx.createLinearGradient(blendStart, 0, blendEnd, 0);
    overlayMask.addColorStop(0, "rgba(0, 0, 0, 0)");
    overlayMask.addColorStop(1, "rgba(0, 0, 0, 1)");
    overlayCtx.globalCompositeOperation = "destination-in";
    overlayCtx.fillStyle = overlayMask;
    overlayCtx.fillRect(photoArea.x, photoArea.y, photoArea.w, photoArea.h);

    ctx.drawImage(overlayCanvas, 0, 0);
  }

  ctx.filter = "none";
  ctx.restore();
}

function drawPlaceholder() {
  ctx.save();
  ctx.fillStyle = "#f4f4f2";
  ctx.fillRect(0, 0, W, photoArea.h);
  ctx.fillStyle = "#dadbd8";
  ctx.beginPath();
  ctx.arc(W / 2, 286, 134, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(W / 2 - 220, 460, 440, 280, 150);
  ctx.fill();
  ctx.fillStyle = "#56585d";
  ctx.font = `700 34px ${captionFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("add a photo", W / 2, 430);
  ctx.restore();
}

function drawCaption() {
  const text = state.caption.trim() ? state.caption : "Your caption";
  const layout = fitText(text, captionArea.w, 3, state.textSize, 24);
  const fontSize = layout.fontSize;
  const lineHeight = Math.round(fontSize * state.lineHeight);
  const lines = layout.lines;
  const totalHeight = (lines.length - 1) * lineHeight + fontSize;
  const firstY = captionArea.y + (captionArea.h - totalHeight) / 2 + fontSize * 0.82 + state.textOffsetY;

  ctx.save();
  ctx.font = `700 ${fontSize}px ${captionFont}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  lines.forEach((line, index) => {
    drawRichLine(line, captionArea.x + captionArea.w / 2, firstY + index * lineHeight);
  });
  ctx.restore();
}

function fitText(text, maxWidth, maxLines, startSize, minSize) {
  for (let size = startSize; size >= minSize; size -= 1) {
    const lines = wrapRichText(text, maxWidth, size);
    if (lines.length <= maxLines) return { fontSize: size, lines };
  }

  return { fontSize: minSize, lines: wrapRichText(text, maxWidth, minSize).slice(0, maxLines) };
}

function coverRect(srcW, srcH, destW, destH) {
  const scale = Math.max(destW / srcW, destH / srcH);
  return { w: srcW * scale, h: srcH * scale };
}

function wrapRichText(text, maxWidth, fontSize) {
  ctx.font = `700 ${fontSize}px ${captionFont}`;
  if (!state.manualLines) return wrapParagraph(text.replace(/\s+/g, " ").trim(), maxWidth);

  const forcedLines = text.replace(/\r\n/g, "\n").split("\n");
  const lines = [];

  for (const forcedLine of forcedLines) {
    const lineText = forcedLine.replace(/[^\S\n]+/g, " ").trim();
    if (!lineText) {
      lines.push([]);
      continue;
    }
    lines.push(...wrapParagraph(lineText, maxWidth));
  }

  return lines.length ? lines : [[{ text: "Your caption", green: false }]];
}

function wrapParagraph(text, maxWidth) {
  const tokens = tokenizeSegments(parseMarkdownSegments(text));
  const lines = [];
  let line = [];
  let width = 0;
  let needsSpace = false;

  for (const token of tokens) {
    if (token.text === " ") {
      needsSpace = line.length > 0;
      continue;
    }

    const pieces = splitLongToken(token, maxWidth);
    for (const piece of pieces) {
      const spaceWidth = needsSpace && line.length ? measureText(" ") : 0;
      const pieceWidth = measureText(piece.text);

      if (line.length && width + spaceWidth + pieceWidth > maxWidth) {
        lines.push(line);
        line = [];
        width = 0;
        needsSpace = false;
      }

      if (needsSpace && line.length) {
        line.push({ text: " ", green: false });
        width += spaceWidth;
      }

      line.push(piece);
      width += pieceWidth;
      needsSpace = false;
    }
  }

  if (line.length) lines.push(line);
  return lines;
}

function parseMarkdownSegments(text) {
  if (!state.markdown) return [{ text, green: false }];

  const segments = [];
  let cursor = 0;

  while (cursor < text.length) {
    const start = text.indexOf("*", cursor);
    if (start === -1) {
      segments.push({ text: text.slice(cursor), green: false });
      break;
    }

    const end = text.indexOf("*", start + 1);
    if (end === -1) {
      segments.push({ text: text.slice(cursor), green: false });
      break;
    }

    if (start > cursor) segments.push({ text: text.slice(cursor, start), green: false });
    if (end > start + 1) segments.push({ text: text.slice(start + 1, end), green: true });
    cursor = end + 1;
  }

  return segments.filter((segment) => segment.text.length);
}

function tokenizeSegments(segments) {
  return segments.flatMap((segment) =>
    segment.text
      .split(/(\s+)/)
      .filter(Boolean)
      .map((part) => ({
        text: /\s+/.test(part) ? " " : part,
        green: segment.green && !/\s+/.test(part),
      })),
  );
}

function splitLongToken(token, maxWidth) {
  if (measureText(token.text) <= maxWidth) return [token];

  const pieces = [];
  let piece = "";
  for (const char of token.text) {
    if (measureText(piece + char) <= maxWidth) {
      piece += char;
    } else {
      if (piece) pieces.push({ text: piece, green: token.green });
      piece = char;
    }
  }

  if (piece) pieces.push({ text: piece, green: token.green });
  return pieces;
}

function drawRichLine(line, centerX, y) {
  const totalWidth = lineWidth(line);
  let x = centerX - totalWidth / 2;

  for (const token of line) {
    ctx.fillStyle = token.green ? logoGreen : captionWhite;
    ctx.fillText(token.text, x, y);
    x += measureText(token.text);
  }
}

function lineWidth(line) {
  return line.reduce((sum, token) => sum + measureText(token.text), 0);
}

function measureText(text) {
  return ctx.measureText(text).width;
}

function syncPositionControls() {
  const isSecond = state.dualPhoto && state.activeImage === "image2";
  offsetXInput.value = String(Math.round(isSecond ? state.offsetX2 : state.offsetX));
  offsetYInput.value = String(Math.round(isSecond ? state.offsetY2 : state.offsetY));
}

function handleActiveImageChange() {
  state.activeImage = activeImageInput.value;
  syncPositionControls();
  draw();
}

function updateFromControls() {
  state.caption = captionInput.value;
  state.textSize = Number(textSizeInput.value);
  state.textOffsetY = Number(textOffsetYInput.value);
  state.lineHeight = Number(lineHeightInput.value);
  state.zoom = Number(zoomInput.value);
  state.offsetX = Number(offsetXInput.value);
  state.offsetY = Number(offsetYInput.value);
  state.offsetX2 = Number(offsetX2Input.value);
  state.offsetY2 = Number(offsetY2Input.value);
  state.blendStart = Number(blendStartInput.value);
  state.blendEnd = Number(blendEndInput.value);
  state.blendStrength = Number(blendStrengthInput.value);
  state.mono = monoInput.checked;
  state.markdown = markdownInput.checked;
  state.manualLines = manualLinesInput.checked;
  state.dualPhoto = dualPhotoInput.checked;
  draw();
}

function resetAdjustments() {
  textOffsetYInput.value = "0";
  lineHeightInput.value = "1.22";
  zoomInput.value = "1";
  offsetXInput.value = "0";
  offsetYInput.value = "0";
  offsetX2Input.value = "0";
  offsetY2Input.value = "0";
  blendStartInput.value = "35";
  blendEndInput.value = "65";
  blendStrengthInput.value = "100";
  updateFromControls();
}

function resetSingleControl(controlId) {
  const control = document.querySelector(`#${controlId}`);
  if (!control) return;
  const defaults = {
    textSizeInput: "58",
    textOffsetYInput: "0",
    lineHeightInput: "1.22",
    zoomInput: "1",
    offsetXInput: "0",
    offsetYInput: "0",
    offsetX2Input: "0",
    offsetY2Input: "0",
    blendStartInput: "35",
    blendEndInput: "65",
    blendStrengthInput: "100",
  };
  control.value = defaults[controlId] || "0";
  updateFromControls();
}

async function loadImage(file, target = "image") {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    state[target] = image;
    shareButton.disabled = !navigator.canShare;
    draw();
  };
  image.src = url;
}

function exportBlob() {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.98);
  });
}

async function saveImage() {
  const blob = await exportBlob();
  const link = document.createElement("a");
  link.download = `rage-ctrl-${Date.now()}.png`;
  link.href = URL.createObjectURL(blob);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 500);
}

async function shareImage() {
  const blob = await exportBlob();
  const file = new File([blob], "rage-ctrl.png", { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "RageCTRL" });
    return;
  }

  await saveImage();
}

function pointFromEvent(event) {
  const touch = event.touches?.[0];
  const point = touch || event;
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((point.clientX - rect.left) / rect.width) * W,
    y: ((point.clientY - rect.top) / rect.height) * H,
  };
}

function startDrag(event) {
  if (!state.image) return;
  if (event.pointerType === "touch") return;
  state.dragging = true;
  state.lastPoint = pointFromEvent(event);
}

function moveDrag(event) {
  if (event.pointerType === "touch") return;
  if (!state.dragging || !state.lastPoint) return;
  event.preventDefault();
  const point = pointFromEvent(event);
  const dx = point.x - state.lastPoint.x;
  const dy = point.y - state.lastPoint.y;
  const useSecond = state.dualPhoto && state.activeImage === "image2";
  if (useSecond) {
    state.offsetX2 = clamp(state.offsetX2 + dx, Number(offsetXInput.min), Number(offsetXInput.max));
    state.offsetY2 = clamp(state.offsetY2 + dy, Number(offsetYInput.min), Number(offsetYInput.max));
  } else {
    state.offsetX = clamp(state.offsetX + dx, Number(offsetXInput.min), Number(offsetXInput.max));
    state.offsetY = clamp(state.offsetY + dy, Number(offsetYInput.min), Number(offsetYInput.max));
  }
  syncPositionControls();
  state.lastPoint = point;
  draw();
}

function endDrag() {
  state.dragging = false;
  state.lastPoint = null;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

imageInput.addEventListener("change", (event) => loadImage(event.target.files?.[0], "image"));
imageInput2.addEventListener("change", (event) => loadImage(event.target.files?.[0], "image2"));
captionInput.addEventListener("input", updateFromControls);
textSizeInput.addEventListener("input", updateFromControls);
textOffsetYInput.addEventListener("input", updateFromControls);
lineHeightInput.addEventListener("input", updateFromControls);
zoomInput.addEventListener("input", updateFromControls);
offsetXInput.addEventListener("input", updateFromControls);
offsetYInput.addEventListener("input", updateFromControls);
offsetX2Input.addEventListener("input", updateFromControls);
offsetY2Input.addEventListener("input", updateFromControls);
blendStartInput.addEventListener("input", updateFromControls);
blendEndInput.addEventListener("input", updateFromControls);
blendStrengthInput.addEventListener("input", updateFromControls);
monoInput.addEventListener("change", updateFromControls);
markdownInput.addEventListener("change", updateFromControls);
manualLinesInput.addEventListener("change", updateFromControls);
dualPhotoInput.addEventListener("change", updateFromControls);
downloadButton.addEventListener("click", saveImage);
shareButton.addEventListener("click", shareImage);
resetButton.addEventListener("click", resetAdjustments);
template.addEventListener("load", draw);
document.querySelectorAll("[data-reset]").forEach((button) => {
  button.addEventListener("click", () => resetSingleControl(button.dataset.reset));
});

if (document.fonts) {
  document.fonts.ready.then(draw);
  document.fonts.load(`700 48px ${captionFont}`).then(draw);
}

if (navigator.canShare) shareButton.disabled = false;

syncPositionControls();

if (window.PointerEvent) {
  canvas.addEventListener("pointerdown", startDrag);
  canvas.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

draw();
