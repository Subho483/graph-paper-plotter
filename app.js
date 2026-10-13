// Millimeter (mm) Graph Paper Plotter — Constant A4 (210 × 297 mm) Physical Sheet

const THEMES = {
  green: {
    paperBg: "#ffffff",
    minorLine: "rgba(16, 185, 129, 0.30)",
    mediumLine: "rgba(5, 150, 105, 0.55)",
    majorLine: "rgba(4, 120, 87, 0.86)",
    borderLine: "#064e3b",
    axisColor: "#0f172a",
    curveColor: "#1d4ed8",
    pointFill: "#dc2626",
    pointRing: "#1e293b",
    dropLineColor: "rgba(220, 38, 38, 0.55)",
    mmRulerColor: "#047857"
  },
  orange: {
    paperBg: "#fffdf9",
    minorLine: "rgba(249, 115, 22, 0.28)",
    mediumLine: "rgba(234, 88, 12, 0.52)",
    majorLine: "rgba(194, 65, 12, 0.85)",
    borderLine: "#7c2d12",
    axisColor: "#0f172a",
    curveColor: "#1d4ed8",
    pointFill: "#1d4ed8",
    pointRing: "#0f172a",
    dropLineColor: "rgba(29, 78, 216, 0.5)",
    mmRulerColor: "#9a3412"
  },
  blue: {
    paperBg: "#ffffff",
    minorLine: "rgba(59, 130, 246, 0.26)",
    mediumLine: "rgba(37, 99, 235, 0.50)",
    majorLine: "rgba(29, 78, 216, 0.84)",
    borderLine: "#1e3a8a",
    axisColor: "#0f172a",
    curveColor: "#dc2626",
    pointFill: "#dc2626",
    pointRing: "#0f172a",
    dropLineColor: "rgba(220, 38, 38, 0.5)",
    mmRulerColor: "#1d4ed8"
  },
  gray: {
    paperBg: "#ffffff",
    minorLine: "rgba(148, 163, 184, 0.40)",
    mediumLine: "rgba(100, 116, 139, 0.64)",
    majorLine: "rgba(30, 41, 59, 0.88)",
    borderLine: "#0f172a",
    axisColor: "#000000",
    curveColor: "#000000",
    pointFill: "#000000",
    pointRing: "#000000",
    dropLineColor: "rgba(51, 65, 85, 0.55)",
    mmRulerColor: "#334155"
  }
};

// Constant Physical A4 Dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const GRID_WIDTH_MM = 180; // 18 cm standard active width on A4
const GRID_HEIGHT_MM = 240; // 24 cm standard active height on A4
const MARGIN_LEFT_MM = 20; // 20 mm left margin, 10 mm right margin -> 20 + 180 + 10 = 210 mm
const MARGIN_TOP_MM = 27; // 27 mm top margin, 30 mm bottom margin -> 27 + 240 + 30 = 297 mm

// Clean Initial State (Zero hardcoded experiment values)
const state = {
  gridSizeMm: 1,
  plotMode: "smooth",
  theme: "green",
  xName: "",
  xUnit: "",
  scaleXPerMm: 1,
  originX: 0,
  yName: "",
  yUnit: "",
  scaleYPerMm: 1,
  originY: 0,
  showMmRuler: true,
  showDropLines: true,
  showPointLabels: true,
  zoom: 1.0, // 1.0 = 100% Fit to Screen
  points: [],
  cachedLayout: null
};

const dom = {
  gridSizeMm: document.getElementById("gridSizeMm"),
  chips: document.querySelectorAll(".chip"),
  plotMode: document.getElementById("plotMode"),
  paperTheme: document.getElementById("paperTheme"),
  btnAutoScale: document.getElementById("btnAutoScale"),
  xName: document.getElementById("xName"),
  xUnit: document.getElementById("xUnit"),
  scaleXPerMm: document.getElementById("scaleXPerMm"),
  originX: document.getElementById("originX"),
  xScaleSubNote: document.getElementById("xScaleSubNote"),
  yName: document.getElementById("yName"),
  yUnit: document.getElementById("yUnit"),
  scaleYPerMm: document.getElementById("scaleYPerMm"),
  originY: document.getElementById("originY"),
  yScaleSubNote: document.getElementById("yScaleSubNote"),
  pillBtns: document.querySelectorAll(".pill-btn"),
  tabBoxes: document.querySelectorAll(".tab-box"),
  addXInput: document.getElementById("addXInput"),
  addYInput: document.getElementById("addYInput"),
  btnAddRow: document.getElementById("btnAddRow"),
  thInputX: document.getElementById("thInputX"),
  thInputY: document.getElementById("thInputY"),
  inputTableBody: document.getElementById("inputTableBody"),
  ptCountText: document.getElementById("ptCountText"),
  btnSortX: document.getElementById("btnSortX"),
  btnClearPts: document.getElementById("btnClearPts"),
  bulkTextarea: document.getElementById("bulkTextarea"),
  btnApplyBulk: document.getElementById("btnApplyBulk"),
  chkShowMmRuler: document.getElementById("chkShowMmRuler"),
  chkShowDropLines: document.getElementById("chkShowDropLines"),
  chkShowPointLabels: document.getElementById("chkShowPointLabels"),
  btnZoomOut: document.getElementById("btnZoomOut"),
  btnZoomIn: document.getElementById("btnZoomIn"),
  btnZoomReset: document.getElementById("btnZoomReset"),
  zoomReadout: document.getElementById("zoomReadout"),
  hoverStatusBar: document.getElementById("hoverStatusBar"),
  resultsScroll: document.getElementById("resultsScroll"),
  graphCanvas: document.getElementById("graphCanvas"),
  hoverCanvas: document.getElementById("hoverCanvas"),
  btnDownloadPNG: document.getElementById("btnDownloadPNG"),
  btnDownloadPDF: document.getElementById("btnDownloadPDF")
};

function fmt(val, maxDec = 4) {
  if (!Number.isFinite(val)) return "0";
  if (Math.abs(val) < 1e-11) return "0";
  return Number(val.toFixed(maxDec)).toString();
}

function snap(px) {
  return Math.round(px) + 0.5;
}

function getXDisplayName() {
  return state.xName.trim() || "X-Axis";
}

function getYDisplayName() {
  return state.yName.trim() || "Y-Axis";
}

/**
 * Calculate exact (mmX, mmY) for each point on the A4 millimeter grid:
 *   X_mm = (X - originX) / scaleXPerMm
 *   Y_mm = (Y - originY) / scaleYPerMm
 */
function getCalculatedPoints() {
  const sx = Math.max(1e-9, Number(state.scaleXPerMm) || 1);
  const sy = Math.max(1e-9, Number(state.scaleYPerMm) || 1);
  const ox = Number(state.originX) || 0;
  const oy = Number(state.originY) || 0;

  return state.points
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
    .map((p, i) => {
      const mmX = (p.x - ox) / sx;
      const mmY = (p.y - oy) / sy;
      return {
        index: i + 1,
        x: p.x,
        y: p.y,
        mmX: +mmX.toFixed(4),
        mmY: +mmY.toFixed(4)
      };
    });
}

/**
 * Auto-recommend a clean lab scale (1 mm = ...) and starting origin (X0, Y0) for the A4 grid
 */
function autoRecommendScale() {
  const valid = state.points.filter(
    (p) => Number.isFinite(p.x) && Number.isFinite(p.y)
  );
  if (valid.length === 0) return;

  let minX = Math.min(...valid.map((p) => p.x));
  let maxX = Math.max(...valid.map((p) => p.x));
  let minY = Math.min(...valid.map((p) => p.y));
  let maxY = Math.max(...valid.map((p) => p.y));

  if (minX === maxX) {
    minX = minX > 0 ? 0 : minX - 10;
    maxX = maxX + 10;
  }
  if (minY === maxY) {
    minY = minY > 0 ? 0 : minY - 10;
    maxY = maxY + 10;
  }

  const targetMmX = 140;
  const targetMmY = 180;

  const pickNicePerMm = (span, targetMm) => {
    const raw = span / targetMm;
    const exp = Math.floor(Math.log10(raw));
    const base = Math.pow(10, exp);
    const frac = raw / base;
    for (const nf of [1, 2, 2.5, 4, 5, 8, 10]) {
      if (frac <= nf + 1e-9) return +(nf * base).toPrecision(8);
    }
    return +(10 * base).toPrecision(8);
  };

  const spanX = maxX - minX;
  const startZeroX = minX >= 0 && minX <= spanX * 0.35;
  const scaleX = pickNicePerMm(startZeroX ? maxX : spanX, targetMmX);
  const origX = startZeroX
    ? 0
    : Math.floor((minX - scaleX) / (scaleX * 10)) * (scaleX * 10);

  const spanY = maxY - minY;
  const startZeroY = minY >= 0 && minY <= spanY * 0.35;
  const scaleY = pickNicePerMm(startZeroY ? maxY : spanY, targetMmY);
  const origY = startZeroY
    ? 0
    : Math.floor((minY - scaleY) / (scaleY * 10)) * (scaleY * 10);

  state.scaleXPerMm = scaleX;
  state.originX = +origX.toPrecision(8);
  state.scaleYPerMm = scaleY;
  state.originY = +origY.toPrecision(8);

  dom.scaleXPerMm.value = state.scaleXPerMm;
  dom.originX.value = state.originX;
  dom.scaleYPerMm.value = state.scaleYPerMm;
  dom.originY.value = state.originY;
}

/**
 * Compute Layout on the Constant A4 (210 × 297 mm) Sheet with 180 × 240 mm Grid
 */
function computeLayout() {
  const minorMm = Math.max(0.25, Math.min(20, Number(state.gridSizeMm) || 1));
  const mediumMm = +(minorMm * 5).toFixed(4);
  const majorMm = +(minorMm * 10).toFixed(4);

  const calcPts = getCalculatedPoints();

  const minMmX = calcPts.length ? Math.min(0, ...calcPts.map((p) => p.mmX)) : 0;
  const minMmY = calcPts.length ? Math.min(0, ...calcPts.map((p) => p.mmY)) : 0;

  const originOffsetMmX =
    minMmX < 0
      ? Math.min(
          GRID_WIDTH_MM - 20,
          Math.ceil(Math.abs(minMmX) / 10 + 1) * 10
        )
      : 10;
  const originOffsetMmY =
    minMmY < 0
      ? Math.min(
          GRID_HEIGHT_MM - 20,
          Math.ceil(Math.abs(minMmY) / 10 + 1) * 10
        )
      : 10;

  return {
    minorMm,
    mediumMm,
    majorMm,
    calcPts,
    minMmX,
    minMmY,
    originOffsetMmX,
    originOffsetMmY,
    pageWidthMm: A4_WIDTH_MM,
    pageHeightMm: A4_HEIGHT_MM,
    gridWidthMm: GRID_WIDTH_MM,
    gridHeightMm: GRID_HEIGHT_MM,
    marginLeftMm: MARGIN_LEFT_MM,
    marginTopMm: MARGIN_TOP_MM
  };
}

function computeRegression(calcPts) {
  const n = calcPts.length;
  if (n < 2) return null;
  let sx = 0,
    sy = 0,
    sxy = 0,
    sxx = 0;
  for (const p of calcPts) {
    sx += p.x;
    sy += p.y;
    sxy += p.x * p.y;
    sxx += p.x * p.x;
  }
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-12) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

/**
 * Draw the Constant A4 (210 × 297 mm) Millimeter Graph Paper
 * @param {HTMLCanvasElement} canvas
 * @param {number} pxPerMm - pixels per 1 millimeter
 */
function drawMillimeterGraph(canvas, pxPerMm) {
  const layout = computeLayout();
  state.cachedLayout = layout;
  const theme = THEMES[state.theme] || THEMES.green;
  const {
    minorMm,
    calcPts,
    originOffsetMmX,
    originOffsetMmY,
    pageWidthMm,
    pageHeightMm,
    gridWidthMm,
    gridHeightMm,
    marginLeftMm,
    marginTopMm
  } = layout;

  const totalWidthPx = Math.round(pageWidthMm * pxPerMm);
  const totalHeightPx = Math.round(pageHeightMm * pxPerMm);

  canvas.width = totalWidthPx;
  canvas.height = totalHeightPx;

  const ctx = canvas.getContext("2d");
  ctx.save();

  // 1. A4 Paper Sheet Background
  ctx.fillStyle = theme.paperBg;
  ctx.fillRect(0, 0, totalWidthPx, totalHeightPx);

  const gridLeftPx = Math.round(marginLeftMm * pxPerMm);
  const gridTopPx = Math.round(marginTopMm * pxPerMm);
  const gridWidthPx = Math.round(gridWidthMm * pxPerMm);
  const gridHeightPx = Math.round(gridHeightMm * pxPerMm);
  const gridRightPx = gridLeftPx + gridWidthPx;
  const gridBottomPx = gridTopPx + gridHeightPx;

  layout.renderBounds = {
    pxPerMm,
    gridLeftPx,
    gridTopPx,
    gridRightPx,
    gridBottomPx
  };

  const mmToPx = (mmFromOriginX, mmFromOriginY) => ({
    x: gridLeftPx + (originOffsetMmX + mmFromOriginX) * pxPerMm,
    y: gridBottomPx - (originOffsetMmY + mmFromOriginY) * pxPerMm
  });

  // 2. Top A4 Margin Header: Title & Scale
  const xDisp = getXDisplayName();
  const yDisp = getYDisplayName();
  const xUnitStr = state.xUnit.trim();
  const yUnitStr = state.yUnit.trim();

  const xLabelFull = xUnitStr ? `${xDisp} (${xUnitStr})` : xDisp;
  const yLabelFull = yUnitStr ? `${yDisp} (${yUnitStr})` : yDisp;

  const titleText =
    state.xName.trim() || state.yName.trim()
      ? `${xDisp} vs ${yDisp} (${minorMm} mm A4 Graph Paper — 210 × 297 mm)`
      : `${minorMm} mm A4 Graph Paper (210 × 297 mm)`;

  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `bold ${Math.round(4.0 * pxPerMm)}px sans-serif`;
  ctx.fillText(titleText, totalWidthPx / 2, Math.round(5.5 * pxPerMm));

  ctx.fillStyle = "#065f46";
  ctx.font = `bold ${Math.round(2.85 * pxPerMm)}px sans-serif`;
  const xUnitSuffix = xUnitStr ? ` ${xUnitStr}` : "";
  const yUnitSuffix = yUnitStr ? ` ${yUnitStr}` : "";
  const xOriginNote =
    state.originX !== 0 ? ` (Origin = ${fmt(state.originX)}${xUnitSuffix})` : "";
  const yOriginNote =
    state.originY !== 0 ? ` (Origin = ${fmt(state.originY)}${yUnitSuffix})` : "";

  ctx.fillText(
    `SCALE — X-Axis: 1 mm = ${fmt(state.scaleXPerMm)}${xUnitSuffix} (10 mm = ${fmt(state.scaleXPerMm * 10)}${xUnitSuffix})${xOriginNote}   |   Y-Axis: 1 mm = ${fmt(state.scaleYPerMm)}${yUnitSuffix} (10 mm = ${fmt(state.scaleYPerMm * 10)}${yUnitSuffix})${yOriginNote}`,
    totalWidthPx / 2,
    Math.round(12.2 * pxPerMm)
  );

  const spanMmX = calcPts.length ? Math.max(...calcPts.map((p) => p.mmX)) : 0;
  const spanMmY = calcPts.length ? Math.max(...calcPts.map((p) => p.mmY)) : 0;
  ctx.fillStyle = "#475569";
  ctx.font = `600 ${Math.round(2.45 * pxPerMm)}px sans-serif`;
  ctx.fillText(
    `A4 Active Grid: 180 × 240 mm   |   Plotted Span: ${fmt(spanMmX, 1)} mm horizontally × ${fmt(spanMmY, 1)} mm vertically`,
    totalWidthPx / 2,
    Math.round(18.0 * pxPerMm)
  );

  // 3. Draw Constant 180 × 240 mm Grid Lines on the A4 Sheet
  const numMinorX = Math.round(gridWidthMm / minorMm);
  const numMinorY = Math.round(gridHeightMm / minorMm);

  // Minor lines (every 1 mm)
  ctx.beginPath();
  ctx.strokeStyle = theme.minorLine;
  ctx.lineWidth = Math.max(0.8, 0.14 * pxPerMm);
  for (let i = 0; i <= numMinorX; i++) {
    if (i % 5 === 0) continue;
    const x = snap(gridLeftPx + i * minorMm * pxPerMm);
    ctx.moveTo(x, gridTopPx);
    ctx.lineTo(x, gridBottomPx);
  }
  for (let j = 0; j <= numMinorY; j++) {
    if (j % 5 === 0) continue;
    const y = snap(gridBottomPx - j * minorMm * pxPerMm);
    ctx.moveTo(gridLeftPx, y);
    ctx.lineTo(gridRightPx, y);
  }
  ctx.stroke();

  // Medium lines (every 5 divisions = 5 mm)
  ctx.beginPath();
  ctx.strokeStyle = theme.mediumLine;
  ctx.lineWidth = Math.max(1.1, 0.24 * pxPerMm);
  for (let i = 0; i <= numMinorX; i += 5) {
    if (i % 10 === 0) continue;
    const x = snap(gridLeftPx + i * minorMm * pxPerMm);
    ctx.moveTo(x, gridTopPx);
    ctx.lineTo(x, gridBottomPx);
  }
  for (let j = 0; j <= numMinorY; j += 5) {
    if (j % 10 === 0) continue;
    const y = snap(gridBottomPx - j * minorMm * pxPerMm);
    ctx.moveTo(gridLeftPx, y);
    ctx.lineTo(gridRightPx, y);
  }
  ctx.stroke();

  // Major lines (every 10 divisions = 10 mm / 1 cm)
  ctx.beginPath();
  ctx.strokeStyle = theme.majorLine;
  ctx.lineWidth = Math.max(1.5, 0.36 * pxPerMm);
  for (let i = 0; i <= numMinorX; i += 10) {
    const x = snap(gridLeftPx + i * minorMm * pxPerMm);
    ctx.moveTo(x, gridTopPx);
    ctx.lineTo(x, gridBottomPx);
  }
  for (let j = 0; j <= numMinorY; j += 10) {
    const y = snap(gridBottomPx - j * minorMm * pxPerMm);
    ctx.moveTo(gridLeftPx, y);
    ctx.lineTo(gridRightPx, y);
  }
  ctx.stroke();

  // Outer Grid Border
  ctx.strokeStyle = theme.borderLine;
  ctx.lineWidth = Math.max(2.0, 0.48 * pxPerMm);
  ctx.strokeRect(gridLeftPx, gridTopPx, gridWidthPx, gridHeightPx);

  // 4. Draw Axes & Tick Labels along the 180 × 240 mm Grid
  const originPx = mmToPx(0, 0);
  const ox = snap(originPx.x);
  const oy = snap(originPx.y);

  ctx.strokeStyle = theme.axisColor;
  ctx.fillStyle = theme.axisColor;
  ctx.lineWidth = Math.max(2.0, 0.52 * pxPerMm);

  ctx.beginPath();
  ctx.moveTo(gridLeftPx, oy);
  ctx.lineTo(gridRightPx, oy);
  ctx.moveTo(ox, gridBottomPx);
  ctx.lineTo(ox, gridTopPx);
  ctx.stroke();

  // Axis Break Kink Symbol (~) on Y-axis if originY != 0
  if (state.originY !== 0) {
    const kinkY = oy - 3.5 * pxPerMm;
    if (kinkY > gridTopPx + 10) {
      ctx.save();
      ctx.fillStyle = theme.paperBg;
      ctx.fillRect(
        ox - 1.5 * pxPerMm,
        kinkY - 1.2 * pxPerMm,
        3 * pxPerMm,
        2.4 * pxPerMm
      );
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = Math.max(1.4, 0.4 * pxPerMm);
      ctx.beginPath();
      ctx.moveTo(ox, kinkY + 1.4 * pxPerMm);
      ctx.lineTo(ox - 1.4 * pxPerMm, kinkY + 0.5 * pxPerMm);
      ctx.lineTo(ox + 1.4 * pxPerMm, kinkY - 0.5 * pxPerMm);
      ctx.lineTo(ox, kinkY - 1.4 * pxPerMm);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Major Tick Marks & Labels every 10 minor divisions (10 mm = 1 cm)
  const originMinorIdxX = Math.round(originOffsetMmX / minorMm);
  const originMinorIdxY = Math.round(originOffsetMmY / minorMm);
  const tickLen = 1.1 * pxPerMm;

  // X-Axis Ticks
  for (let i = 0; i <= numMinorX; i += 5) {
    const kMinor = i - originMinorIdxX;
    if (kMinor < 0 && layout.minMmX >= 0) continue;
    const mmFromOrig = kMinor * minorMm;
    const px = mmToPx(mmFromOrig, 0);

    ctx.beginPath();
    ctx.strokeStyle = theme.axisColor;
    ctx.lineWidth = Math.max(1, 0.3 * pxPerMm);
    const tL = kMinor % 10 === 0 ? tickLen : tickLen * 0.6;
    ctx.moveTo(snap(px.x), oy - tL);
    ctx.lineTo(snap(px.x), oy + tL);
    ctx.stroke();

    if (kMinor % 10 === 0) {
      const val = state.originX + mmFromOrig * state.scaleXPerMm;
      const txt = fmt(val, 3);
      ctx.font = `bold ${Math.round(2.45 * pxPerMm)}px sans-serif`;
      const tw = ctx.measureText(txt).width;

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(
        px.x - tw / 2 - 1,
        oy + 1.3 * pxPerMm,
        tw + 2,
        2.7 * pxPerMm
      );

      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(txt, px.x, oy + 1.4 * pxPerMm);

      if (state.showMmRuler) {
        ctx.font = `600 ${Math.round(2.0 * pxPerMm)}px Consolas, monospace`;
        ctx.fillStyle = theme.mmRulerColor;
        ctx.fillText(
          `${fmt(mmFromOrig, 0)}mm`,
          px.x,
          gridBottomPx + 1.6 * pxPerMm
        );
      }
    }
  }

  // Y-Axis Ticks
  for (let j = 0; j <= numMinorY; j += 5) {
    const kMinor = j - originMinorIdxY;
    if (kMinor < 0 && layout.minMmY >= 0) continue;
    const mmFromOrig = kMinor * minorMm;
    const px = mmToPx(0, mmFromOrig);

    ctx.beginPath();
    ctx.strokeStyle = theme.axisColor;
    ctx.lineWidth = Math.max(1, 0.3 * pxPerMm);
    const tL = kMinor % 10 === 0 ? tickLen : tickLen * 0.6;
    ctx.moveTo(ox - tL, snap(px.y));
    ctx.lineTo(ox + tL, snap(px.y));
    ctx.stroke();

    if (kMinor % 10 === 0) {
      const val = state.originY + mmFromOrig * state.scaleYPerMm;
      const txt = fmt(val, 3);
      ctx.font = `bold ${Math.round(2.4 * pxPerMm)}px sans-serif`;
      const tw = ctx.measureText(txt).width;

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(
        ox - tw - 1.8 * pxPerMm,
        px.y - 1.3 * pxPerMm,
        tw + 2,
        2.6 * pxPerMm
      );

      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, ox - 1.5 * pxPerMm, px.y);

      if (state.showMmRuler && kMinor > 0) {
        ctx.font = `600 ${Math.round(1.9 * pxPerMm)}px Consolas, monospace`;
        ctx.fillStyle = theme.mmRulerColor;
        ctx.textAlign = "left";
        ctx.fillText(
          `${fmt(mmFromOrig, 0)}mm`,
          gridRightPx + 1.0 * pxPerMm,
          px.y
        );
      }
    }
  }

  // 5. Clip Inside the 180 × 240 mm Grid Area for Curves, Drop Lines, and Points
  ctx.save();
  ctx.beginPath();
  ctx.rect(gridLeftPx, gridTopPx, gridWidthPx, gridHeightPx);
  ctx.clip();

  // Dashed Drop Lines to Axes
  if (state.showDropLines && calcPts.length > 0) {
    ctx.save();
    ctx.setLineDash([1.2 * pxPerMm, 1.2 * pxPerMm]);
    ctx.strokeStyle = theme.dropLineColor;
    ctx.lineWidth = Math.max(1.2, 0.28 * pxPerMm);
    for (const pt of calcPts) {
      const p = mmToPx(pt.mmX, pt.mmY);
      ctx.beginPath();
      ctx.moveTo(p.x, oy);
      ctx.lineTo(p.x, p.y);
      ctx.lineTo(ox, p.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Plot Curve / Line
  if (calcPts.length >= 2 && state.plotMode !== "scatter") {
    ctx.save();
    ctx.strokeStyle = theme.curveColor;
    ctx.lineWidth = Math.max(2.0, 0.52 * pxPerMm);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const screenPts = calcPts.map((pt) => mmToPx(pt.mmX, pt.mmY));

    if (state.plotMode === "connected") {
      ctx.beginPath();
      screenPts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    } else if (state.plotMode === "smooth") {
      ctx.beginPath();
      ctx.moveTo(screenPts[0].x, screenPts[0].y);
      for (let i = 0; i < screenPts.length - 1; i++) {
        const p0 = screenPts[i === 0 ? i : i - 1];
        const p1 = screenPts[i];
        const p2 = screenPts[i + 1];
        const p3 = screenPts[i + 2 < screenPts.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
      ctx.stroke();
    } else if (state.plotMode === "bestfit") {
      const reg = computeRegression(calcPts);
      if (reg) {
        const maxPosMmX = gridWidthMm - originOffsetMmX;
        const x1 = state.originX;
        const x2 = state.originX + maxPosMmX * state.scaleXPerMm;
        const y1 = reg.slope * x1 + reg.intercept;
        const y2 = reg.slope * x2 + reg.intercept;
        const p1 = mmToPx(0, (y1 - state.originY) / state.scaleYPerMm);
        const p2 = mmToPx(maxPosMmX, (y2 - state.originY) / state.scaleYPerMm);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Draw Plotted Data Points (Encircled Lab Dot ⊙ + Coordinate Label)
  for (const pt of calcPts) {
    const p = mmToPx(pt.mmX, pt.mmY);

    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = theme.pointRing;
    ctx.lineWidth = Math.max(1.4, 0.36 * pxPerMm);
    ctx.arc(p.x, p.y, 1.35 * pxPerMm, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = theme.pointFill;
    ctx.arc(p.x, p.y, 0.56 * pxPerMm, 0, Math.PI * 2);
    ctx.fill();

    if (state.showPointLabels) {
      const labelStr = `(${fmt(pt.x)}, ${fmt(pt.y)})`;
      ctx.font = `bold ${Math.round(2.25 * pxPerMm)}px sans-serif`;
      const tw = ctx.measureText(labelStr).width;

      const flipLeft = p.x + tw + 3 * pxPerMm > gridRightPx;
      const lx = flipLeft ? p.x - tw - 1.8 * pxPerMm : p.x + 1.8 * pxPerMm;
      const ly = p.y - 1.4 * pxPerMm;

      ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
      ctx.fillRect(
        lx - 0.4 * pxPerMm,
        ly - 2.0 * pxPerMm,
        tw + 0.8 * pxPerMm,
        2.5 * pxPerMm
      );

      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(labelStr, lx, ly + 0.3 * pxPerMm);
    }
  }

  ctx.restore(); // End grid clip

  // 6. Axis Titles on A4 Margin
  ctx.fillStyle = "#0f172a";
  ctx.font = `bold ${Math.round(3.3 * pxPerMm)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(
    `${xLabelFull}  \u2192`,
    gridLeftPx + gridWidthPx / 2,
    gridBottomPx + 6.5 * pxPerMm
  );

  ctx.save();
  ctx.translate(gridLeftPx - 12.5 * pxPerMm, gridTopPx + gridHeightPx / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`${yLabelFull}  \u2192`, 0, 0);
  ctx.restore();

  ctx.restore();
}

/**
 * Update Sidebar Input Table Headers and Millimeter Badges
 */
function updateSidebarReadouts() {
  const xDisp = getXDisplayName();
  const yDisp = getYDisplayName();
  const xUnitStr = state.xUnit.trim();
  const yUnitStr = state.yUnit.trim();

  dom.thInputX.textContent = xUnitStr ? `${xDisp} (${xUnitStr})` : xDisp;
  dom.thInputY.textContent = yUnitStr ? `${yDisp} (${yUnitStr})` : yDisp;

  const xSuffix = xUnitStr ? ` ${xUnitStr}` : "";
  const ySuffix = yUnitStr ? ` ${yUnitStr}` : "";

  dom.xScaleSubNote.textContent = `10 mm (1 cm) = ${fmt(state.scaleXPerMm * 10)}${xSuffix}`;
  dom.yScaleSubNote.textContent = `10 mm (1 cm) = ${fmt(state.scaleYPerMm * 10)}${ySuffix}`;
  dom.ptCountText.textContent = `${state.points.length} point${state.points.length === 1 ? "" : "s"}`;

  const xBadges = dom.inputTableBody.querySelectorAll(".mm-x-cell");
  const yBadges = dom.inputTableBody.querySelectorAll(".mm-y-cell");
  state.points.forEach((pt, idx) => {
    if (xBadges[idx] && yBadges[idx]) {
      if (Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
        const mx = (pt.x - state.originX) / state.scaleXPerMm;
        const my = (pt.y - state.originY) / state.scaleYPerMm;
        xBadges[idx].textContent = `${fmt(mx, 2)} mm`;
        yBadges[idx].textContent = `${fmt(my, 2)} mm`;
      } else {
        xBadges[idx].textContent = "—";
        yBadges[idx].textContent = "—";
      }
    }
  });
}

/**
 * Compute CSS Display Dimensions that Fit Any Screen Size cleanly at 100% Zoom
 */
function applyResponsiveCanvasSize() {
  const availW = Math.max(260, dom.resultsScroll.clientWidth - 24);
  const availH = Math.max(260, dom.resultsScroll.clientHeight - 24);

  const a4Aspect = A4_WIDTH_MM / A4_HEIGHT_MM; // 210 / 297 = 0.70707

  let fitH = availH;
  let fitW = fitH * a4Aspect;

  if (fitW > availW) {
    fitW = availW;
    fitH = fitW / a4Aspect;
  }

  const cssW = Math.round(fitW * state.zoom);
  const cssH = Math.round(fitH * state.zoom);

  dom.graphCanvas.style.width = `${cssW}px`;
  dom.graphCanvas.style.height = `${cssH}px`;

  dom.hoverCanvas.style.width = `${cssW}px`;
  dom.hoverCanvas.style.height = `${cssH}px`;

  dom.zoomReadout.textContent = `${Math.round(state.zoom * 100)}%`;
}

/**
 * Render the Constant A4 Sheet at High Internal Resolution & Fit to Screen
 */
function renderScreen() {
  const layout = computeLayout();

  // Internal canvas resolution: exact integer pixels per minor division (around 8 px/mm) for zero moiré
  const pxPerMinor = Math.max(4, Math.round(8 * layout.minorMm));
  const internalPxPerMm = pxPerMinor / layout.minorMm;

  drawMillimeterGraph(dom.graphCanvas, internalPxPerMm);
  updateSidebarReadouts();

  dom.hoverCanvas.width = dom.graphCanvas.width;
  dom.hoverCanvas.height = dom.graphCanvas.height;

  applyResponsiveCanvasSize();
}

/**
 * Draw fast 60 FPS Hover Crosshair on hoverCanvas
 */
function renderHoverCrosshair(e) {
  const ctx = dom.hoverCanvas.getContext("2d");
  ctx.clearRect(0, 0, dom.hoverCanvas.width, dom.hoverCanvas.height);
  if (!e || !state.cachedLayout || !state.cachedLayout.renderBounds) return;

  const layout = state.cachedLayout;
  const { pxPerMm, gridLeftPx, gridTopPx, gridRightPx, gridBottomPx } =
    layout.renderBounds;
  const rect = dom.hoverCanvas.getBoundingClientRect();

  const scaleX = dom.hoverCanvas.width / rect.width;
  const scaleY = dom.hoverCanvas.height / rect.height;

  const canvasX = (e.clientX - rect.left) * scaleX;
  const canvasY = (e.clientY - rect.top) * scaleY;

  if (
    canvasX < gridLeftPx ||
    canvasX > gridRightPx ||
    canvasY < gridTopPx ||
    canvasY > gridBottomPx
  ) {
    dom.hoverStatusBar.innerHTML =
      `Move cursor over the millimeter graph paper to inspect exact <strong>mm position</strong> and <strong>(X, Y) value</strong>`;
    return;
  }

  const mmFromLeft = (canvasX - gridLeftPx) / pxPerMm;
  const mmFromBottom = (gridBottomPx - canvasY) / pxPerMm;

  const mmX = mmFromLeft - layout.originOffsetMmX;
  const mmY = mmFromBottom - layout.originOffsetMmY;

  const valX = state.originX + mmX * state.scaleXPerMm;
  const valY = state.originY + mmY * state.scaleYPerMm;

  const xDisp = getXDisplayName();
  const yDisp = getYDisplayName();
  const xUnitSuffix = state.xUnit.trim() ? ` ${state.xUnit.trim()}` : "";
  const yUnitSuffix = state.yUnit.trim() ? ` ${state.yUnit.trim()}` : "";

  dom.hoverStatusBar.innerHTML =
    `A4 Paper Position: <strong>X = ${fmt(mmX, 2)} mm, Y = ${fmt(mmY, 2)} mm</strong> &nbsp;&bull;&nbsp; ` +
    `Value: <strong>${xDisp} = ${fmt(valX, 2)}${xUnitSuffix}, ${yDisp} = ${fmt(valY, 2)}${yUnitSuffix}</strong>`;

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(15, 23, 42, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(snap(canvasX), gridTopPx);
  ctx.lineTo(snap(canvasX), gridBottomPx);
  ctx.moveTo(gridLeftPx, snap(canvasY));
  ctx.lineTo(gridRightPx, snap(canvasY));
  ctx.stroke();
  ctx.restore();
}

/**
 * Rebuild Left Input Rows Table
 */
function rebuildInputTable() {
  dom.inputTableBody.innerHTML = "";

  state.points.forEach((pt, idx) => {
    const tr = document.createElement("tr");

    const tdIdx = document.createElement("td");
    tdIdx.className = "idx-col";
    tdIdx.textContent = idx + 1;

    const tdX = document.createElement("td");
    const inpX = document.createElement("input");
    inpX.type = "number";
    inpX.step = "any";
    inpX.className = "row-val-input";
    inpX.value = Number.isFinite(pt.x) ? pt.x : "";
    inpX.addEventListener("input", () => {
      state.points[idx].x = parseFloat(inpX.value);
      renderScreen();
    });

    const tdY = document.createElement("td");
    const inpY = document.createElement("input");
    inpY.type = "number";
    inpY.step = "any";
    inpY.className = "row-val-input";
    inpY.value = Number.isFinite(pt.y) ? pt.y : "";
    inpY.addEventListener("input", () => {
      state.points[idx].y = parseFloat(inpY.value);
      renderScreen();
    });

    const tdMmX = document.createElement("td");
    tdMmX.className = "calc-mm-badge mm-x-cell";

    const tdMmY = document.createElement("td");
    tdMmY.className = "calc-mm-badge mm-y-cell";

    const tdDel = document.createElement("td");
    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "del-row-btn";
    btnDel.innerHTML = "&times;";
    btnDel.title = "Delete point";
    btnDel.addEventListener("click", () => {
      state.points.splice(idx, 1);
      rebuildInputTable();
      renderScreen();
    });
    tdDel.appendChild(btnDel);

    tdX.appendChild(inpX);
    tdY.appendChild(inpY);
    tr.appendChild(tdIdx);
    tr.appendChild(tdX);
    tr.appendChild(tdY);
    tr.appendChild(tdMmX);
    tr.appendChild(tdMmY);
    tr.appendChild(tdDel);
    dom.inputTableBody.appendChild(tr);
  });
}

/**
 * Pure-JS True-Scale A4 PDF Generator (Exact 210 × 297 mm = 595.28 × 841.89 pt)
 */
function canvasToA4PdfBlob(canvas) {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.96);
  const base64 = dataUrl.split(",")[1];
  const bin = atob(base64);
  const imgBytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) imgBytes[i] = bin.charCodeAt(i);

  const pageW = 595.28;
  const pageH = 841.89;

  const chunks = [];
  const offsets = [];
  let len = 0;
  const enc = new TextEncoder();

  const pushStr = (s) => {
    const b = enc.encode(s);
    chunks.push(b);
    len += b.length;
  };
  const pushBytes = (b) => {
    chunks.push(b);
    len += b.length;
  };
  const startObj = (id) => {
    offsets[id] = len;
    pushStr(`${id} 0 obj\n`);
  };
  const endObj = () => pushStr("\nendobj\n");

  pushStr("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");
  startObj(1);
  pushStr("<< /Type /Catalog /Pages 2 0 R >>");
  endObj();
  startObj(2);
  pushStr("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  endObj();
  startObj(3);
  pushStr(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`
  );
  endObj();
  startObj(4);
  pushStr(
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`
  );
  pushBytes(imgBytes);
  pushStr("\nendstream");
  endObj();
  const stream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  startObj(5);
  pushStr(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  endObj();

  const xref = len;
  pushStr("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 1; i <= 5; i++) {
    pushStr(String(offsets[i]).padStart(10, "0") + " 00000 n \n");
  }
  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks, { type: "application/pdf" });
}

function bindEvents() {
  dom.gridSizeMm.addEventListener("input", () => {
    const v = parseFloat(dom.gridSizeMm.value);
    if (v > 0) {
      state.gridSizeMm = v;
      dom.chips.forEach((c) =>
        c.classList.toggle("active", parseFloat(c.dataset.mm) === v)
      );
      renderScreen();
    }
  });

  dom.chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const v = parseFloat(chip.dataset.mm);
      state.gridSizeMm = v;
      dom.gridSizeMm.value = v;
      dom.chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderScreen();
    });
  });

  dom.plotMode.addEventListener("change", () => {
    state.plotMode = dom.plotMode.value;
    renderScreen();
  });

  dom.paperTheme.addEventListener("change", () => {
    state.theme = dom.paperTheme.value;
    renderScreen();
  });

  [
    ["xName", dom.xName, false],
    ["xUnit", dom.xUnit, false],
    ["scaleXPerMm", dom.scaleXPerMm, true],
    ["originX", dom.originX, true],
    ["yName", dom.yName, false],
    ["yUnit", dom.yUnit, false],
    ["scaleYPerMm", dom.scaleYPerMm, true],
    ["originY", dom.originY, true]
  ].forEach(([key, el, isNum]) => {
    el.addEventListener("input", () => {
      if (isNum) {
        const val = parseFloat(el.value);
        if (Number.isFinite(val)) {
          if ((key === "scaleXPerMm" || key === "scaleYPerMm") && val <= 0) return;
          state[key] = val;
          renderScreen();
        }
      } else {
        state[key] = el.value;
        renderScreen();
      }
    });
  });

  dom.btnAutoScale.addEventListener("click", () => {
    autoRecommendScale();
    renderScreen();
  });

  dom.pillBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      dom.pillBtns.forEach((b) => b.classList.remove("active"));
      dom.tabBoxes.forEach((box) => box.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  const addNewPoint = () => {
    const x = parseFloat(dom.addXInput.value);
    const y = parseFloat(dom.addYInput.value);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      state.points.push({ x, y });
      dom.addXInput.value = "";
      dom.addYInput.value = "";
      rebuildInputTable();
      renderScreen();
      dom.addXInput.focus();
    }
  };
  dom.btnAddRow.addEventListener("click", addNewPoint);
  dom.addXInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      dom.addYInput.focus();
    }
  });
  dom.addYInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNewPoint();
    }
  });

  dom.btnSortX.addEventListener("click", () => {
    state.points.sort((a, b) => (a.x || 0) - (b.x || 0));
    rebuildInputTable();
    renderScreen();
  });

  dom.btnClearPts.addEventListener("click", () => {
    state.points = [];
    rebuildInputTable();
    renderScreen();
    dom.addXInput.focus();
  });

  dom.btnApplyBulk.addEventListener("click", () => {
    const raw = dom.bulkTextarea.value.trim();
    if (!raw) return;
    const pts = [];
    for (const line of raw.split(/\r?\n/)) {
      const parts = line.trim().split(/[\s,;]+/);
      if (parts.length >= 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          pts.push({ x, y });
        }
      }
    }
    if (pts.length > 0) {
      state.points = pts;
      rebuildInputTable();
      renderScreen();
      document.querySelector('[data-tab="tabRows"]').click();
    }
  });

  dom.chkShowMmRuler.addEventListener("change", () => {
    state.showMmRuler = dom.chkShowMmRuler.checked;
    renderScreen();
  });
  dom.chkShowDropLines.addEventListener("change", () => {
    state.showDropLines = dom.chkShowDropLines.checked;
    renderScreen();
  });
  dom.chkShowPointLabels.addEventListener("change", () => {
    state.showPointLabels = dom.chkShowPointLabels.checked;
    renderScreen();
  });

  dom.btnZoomOut.addEventListener("click", () => {
    state.zoom = Math.max(0.5, +(state.zoom - 0.15).toFixed(2));
    applyResponsiveCanvasSize();
  });
  dom.btnZoomIn.addEventListener("click", () => {
    state.zoom = Math.min(3.0, +(state.zoom + 0.15).toFixed(2));
    applyResponsiveCanvasSize();
  });
  dom.btnZoomReset.addEventListener("click", () => {
    state.zoom = 1.0;
    applyResponsiveCanvasSize();
  });

  window.addEventListener("resize", () => {
    applyResponsiveCanvasSize();
  });

  dom.hoverCanvas.addEventListener("mousemove", renderHoverCrosshair);
  dom.hoverCanvas.addEventListener("mouseleave", () => renderHoverCrosshair(null));

  // Download High-Res A4 PNG (300+ DPI)
  dom.btnDownloadPNG.addEventListener("click", () => {
    const exportCanvas = document.createElement("canvas");
    drawMillimeterGraph(exportCanvas, 12); // 12 px/mm = 2520 x 3564 px (304.8 DPI A4)
    const a = document.createElement("a");
    const filePrefix =
      state.xName.trim() && state.yName.trim()
        ? `${state.xName.trim()}-vs-${state.yName.trim()}`
        : `graph-paper-${state.gridSizeMm}mm`;
    a.download = `${filePrefix}-A4.png`;
    a.href = exportCanvas.toDataURL("image/png");
    a.click();
  });

  // Download Printable True-Scale A4 PDF (210 × 297 mm)
  dom.btnDownloadPDF.addEventListener("click", () => {
    const exportCanvas = document.createElement("canvas");
    drawMillimeterGraph(exportCanvas, 12);
    const blob = canvasToA4PdfBlob(exportCanvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filePrefix =
      state.xName.trim() && state.yName.trim()
        ? `${state.xName.trim()}-vs-${state.yName.trim()}`
        : `graph-paper-${state.gridSizeMm}mm`;
    a.download = `${filePrefix}-A4.pdf`;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
}

function init() {
  rebuildInputTable();
  bindEvents();
  renderScreen();
}

init();
