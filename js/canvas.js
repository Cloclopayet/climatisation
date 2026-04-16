/**
 * canvas.js — Moteur de dessin SVG synoptique DRV
 */

const Canvas = (() => {

  /* ---- State ---- */
  let state = {
    tool: 'select',
    zoom: 1,
    panX: 0,
    panY: 0,
    dragging: null,
    dragStart: null,
    unitStart: null,
    panning: false,
    panStart: null,
  };

  /* ---- Elements ---- */
  const getSVG    = () => document.getElementById('synoptique-svg');
  const getPipes  = () => document.getElementById('pipes-layer');
  const getManchL = () => document.getElementById('manchons-layer');
  const getUnits  = () => document.getElementById('units-layer');
  const getLabels = () => document.getElementById('labels-layer');
  const getGrid   = () => document.getElementById('grid-layer');

  /* ---- Namespace ---- */
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  };
  const txt = (content, attrs = {}) => {
    const e = el('text', attrs);
    e.textContent = content;
    return e;
  };

  /* ---- Grid ---- */
  function drawGrid() {
    const g = getGrid();
    g.innerHTML = '';
    const svg = getSVG();
    const W = svg.clientWidth || 900;
    const H = svg.clientHeight || 600;
    const step = 30;
    for (let x = 0; x < W + step; x += step) {
      for (let y = 0; y < H + step; y += step) {
        const d = el('circle', {
          cx: x, cy: y, r: '0.8',
          class: 'grid-dot', opacity: '0.4'
        });
        g.appendChild(d);
      }
    }
  }

  /* ---- SVG coordinate helpers ---- */
  function svgPoint(e) {
    const svg = getSVG();
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / state.zoom - state.panX,
      y: (e.clientY - rect.top) / state.zoom - state.panY
    };
  }

  /* ---- Draw UE ---- */
  function drawUE(ue, brand, cx, cy) {
    const g = el('g', { id: 'ue-group', transform: `translate(${cx},${cy})` });
    const W = 120, H = 90;
    const x = -W/2, y = -H/2;

    // Glow ring
    g.appendChild(el('rect', {
      x: x-3, y: y-3, width: W+6, height: H+6, rx: '12',
      fill: 'none', stroke: 'rgba(88,166,255,0.15)', 'stroke-width': '6'
    }));

    // Body
    g.appendChild(el('rect', {
      x, y, width: W, height: H, rx: '9',
      fill: 'rgba(88,166,255,0.10)', stroke: 'rgba(88,166,255,0.55)',
      'stroke-width': '1.5'
    }));

    // Header bar
    g.appendChild(el('rect', {
      x, y, width: W, height: 22, rx: '9',
      fill: 'rgba(88,166,255,0.20)', stroke: 'none'
    }));
    g.appendChild(el('rect', {
      x, y: y+13, width: W, height: 9,
      fill: 'rgba(88,166,255,0.20)', stroke: 'none'
    }));

    // Labels
    g.appendChild(txt('UE', {
      x: 0, y: y+14, 'text-anchor': 'middle',
      fill: '#a5d6ff', 'font-size': '9', 'font-family': 'Rajdhani,sans-serif',
      'font-weight': '700', 'letter-spacing': '2'
    }));
    g.appendChild(txt(brand.shortName, {
      x: 0, y: y+30, 'text-anchor': 'middle',
      fill: brand.color, 'font-size': '11', 'font-family': 'Rajdhani,sans-serif',
      'font-weight': '700', 'letter-spacing': '1'
    }));
    g.appendChild(txt(ue.model, {
      x: 0, y: y+44, 'text-anchor': 'middle',
      fill: '#c9d1d9', 'font-size': '9.5', 'font-family': 'IBM Plex Mono,monospace'
    }));
    g.appendChild(txt(ue.kw + ' kW', {
      x: 0, y: y+60, 'text-anchor': 'middle',
      fill: '#3fb950', 'font-size': '13', 'font-family': 'IBM Plex Mono,monospace',
      'font-weight': '600'
    }));
    g.appendChild(txt(ue.alimentation || '400V/3Ph', {
      x: 0, y: y+76, 'text-anchor': 'middle',
      fill: '#7d8590', 'font-size': '8.5', 'font-family': 'IBM Plex Mono,monospace'
    }));

    // Pipe stubs (right side)
    // Liquid pipe stub
    g.appendChild(el('line', {
      x1: W/2, y1: -12, x2: W/2 + 20, y2: -12,
      stroke: '#ff7b72', 'stroke-width': '3', 'stroke-linecap': 'round'
    }));
    g.appendChild(txt('L', {
      x: W/2+26, y: -9, fill: '#ff7b72', 'font-size': '8', 'font-family': 'IBM Plex Mono,monospace'
    }));

    // Gas pipe stub
    g.appendChild(el('line', {
      x1: W/2, y1: 0, x2: W/2 + 20, y2: 0,
      stroke: '#79c0ff', 'stroke-width': '5', 'stroke-linecap': 'round'
    }));
    g.appendChild(txt('G', {
      x: W/2+26, y: 3, fill: '#79c0ff', 'font-size': '8', 'font-family': 'IBM Plex Mono,monospace'
    }));

    // Comm stub
    g.appendChild(el('line', {
      x1: W/2, y1: 14, x2: W/2 + 20, y2: 14,
      stroke: '#3fb950', 'stroke-width': '1.5', 'stroke-dasharray': '4 3', 'stroke-linecap': 'round'
    }));

    return g;
  }

  /* ---- Draw UI unit ---- */
  function drawUI(unit, isSelected) {
    const W = 118, H = 72;
    const { x, y, id } = unit;
    const pipe = getPipeDims(unit.power);

    const g = el('g', {
      class: 'svg-unit' + (isSelected ? ' selected' : ''),
      'data-id': id
    });

    // Shadow/glow if selected
    if (isSelected) {
      g.appendChild(el('rect', {
        x: x-3, y: y-3, width: W+6, height: H+6, rx: '12',
        fill: 'none', stroke: 'rgba(88,166,255,0.4)', 'stroke-width': '4'
      }));
    }

    // Body
    const body = el('rect', {
      class: 'unit-body',
      x, y, width: W, height: H, rx: '9',
      fill: 'rgba(165,214,255,0.09)', stroke: 'rgba(165,214,255,0.40)',
      'stroke-width': '1.2'
    });
    g.appendChild(body);

    // Top accent bar
    g.appendChild(el('rect', {
      x, y, width: W, height: 18, rx: '9',
      fill: 'rgba(165,214,255,0.12)', stroke: 'none'
    }));
    g.appendChild(el('rect', {
      x, y: y+10, width: W, height: 8,
      fill: 'rgba(165,214,255,0.12)', stroke: 'none'
    }));

    // Icon
    g.appendChild(txt(unit.icon || '▪', {
      x: x+14, y: y+13, 'text-anchor': 'middle',
      fill: '#a5d6ff', 'font-size': '13', 'font-family': 'Rajdhani,sans-serif'
    }));

    // Label
    g.appendChild(txt(unit.label || ('UI-' + id), {
      x: x+W/2, y: y+13, 'text-anchor': 'middle',
      fill: '#e6edf3', 'font-size': '11', 'font-family': 'Rajdhani,sans-serif', 'font-weight': '700',
      'letter-spacing': '0.5'
    }));

    // Type (shortened)
    const typeShort = unit.type.length > 18 ? unit.type.substring(0,17)+'…' : unit.type;
    g.appendChild(txt(typeShort, {
      x: x+W/2, y: y+28, 'text-anchor': 'middle',
      fill: '#7d8590', 'font-size': '8.5', 'font-family': 'Rajdhani,sans-serif'
    }));

    // Power
    g.appendChild(txt(unit.power + ' kW', {
      x: x+W/2, y: y+44, 'text-anchor': 'middle',
      fill: '#3fb950', 'font-size': '13', 'font-family': 'IBM Plex Mono,monospace', 'font-weight': '600'
    }));

    // Pipe dims
    g.appendChild(txt(`Ø${pipe.liq_mm}/${pipe.gaz_mm} mm`, {
      x: x+W/2, y: y+58, 'text-anchor': 'middle',
      fill: '#6e7681', 'font-size': '8', 'font-family': 'IBM Plex Mono,monospace'
    }));

    // Zone badge
    if (unit.zone) {
      g.appendChild(el('rect', {
        x: x+W-36, y: y+60, width: 34, height: 10, rx: '3',
        fill: 'rgba(88,166,255,0.15)', stroke: 'rgba(88,166,255,0.3)', 'stroke-width': '0.5'
      }));
      g.appendChild(txt(unit.zone.substring(0,5), {
        x: x+W-19, y: y+68, 'text-anchor': 'middle',
        fill: '#58a6ff', 'font-size': '7.5', 'font-family': 'Rajdhani,sans-serif', 'font-weight': '600'
      }));
    }

    // Drag listeners
    g.addEventListener('mousedown', (e) => {
      if (state.tool !== 'select') return;
      e.stopPropagation();
      state.dragging = id;
      state.dragStart = { x: e.clientX, y: e.clientY };
      state.unitStart = { x: unit.x, y: unit.y };
      App.selectUnit(id);
    });

    return g;
  }

  /* ---- Draw pipes between UE and units ---- */
  function drawPipes(units, uePos) {
    const pipesLayer = getPipes();
    const manchLayer = getManchL();
    pipesLayer.innerHTML = '';
    manchLayer.innerHTML = '';

    if (!uePos || units.length === 0) return;

    const ueExitX = uePos.x + 80; // right side of UE
    const ueExitY = uePos.y;

    // Trunk entry point
    const trunkX = ueExitX + 40;
    const trunkY = ueExitY;

    // Main trunk junction point
    const juncX = trunkX + 30;

    units.forEach((u, idx) => {
      const uCX = u.x + 59; // center of unit
      const uCY = u.y + 36;
      const pipe = getPipeDims(u.power);
      const manchon = getManchon(u.power);

      // Compute route: L-shaped path
      const midX = Math.max(juncX + idx * 8, trunkX + 30);
      const midY = Math.min(trunkY, uCY - 20);

      // --- Liquid pipe ---
      const liqPath = el('path', {
        d: `M${trunkX} ${trunkY - 8} L${midX} ${trunkY - 8} L${midX} ${uCY - 8} L${uCX - 20} ${uCY - 8}`,
        fill: 'none', stroke: '#ff7b72', 'stroke-width': '2.5',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: '0.85'
      });
      pipesLayer.appendChild(liqPath);

      // Liquid pipe label
      const liqLbl = txt(`Ø${pipe.liq_mm}`, {
        x: midX + 4, y: trunkY - 12,
        fill: '#ff7b72', 'font-size': '8', 'font-family': 'IBM Plex Mono,monospace', opacity: '0.7'
      });
      pipesLayer.appendChild(liqLbl);

      // --- Gas pipe ---
      const gazPath = el('path', {
        d: `M${trunkX} ${trunkY + 4} L${midX + 6} ${trunkY + 4} L${midX + 6} ${uCY + 4} L${uCX - 20} ${uCY + 4}`,
        fill: 'none', stroke: '#79c0ff', 'stroke-width': '4',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: '0.80'
      });
      pipesLayer.appendChild(gazPath);

      // Gas pipe label
      const gazLbl = txt(`Ø${pipe.gaz_mm}`, {
        x: midX + 10, y: trunkY + 14,
        fill: '#79c0ff', 'font-size': '8', 'font-family': 'IBM Plex Mono,monospace', opacity: '0.7'
      });
      pipesLayer.appendChild(gazLbl);

      // --- Communication cable ---
      const commPath = el('path', {
        d: `M${trunkX} ${trunkY + 18} L${midX + 12} ${trunkY + 18} L${midX + 12} ${uCY + 18} L${uCX - 20} ${uCY + 18}`,
        fill: 'none', stroke: '#3fb950', 'stroke-width': '1',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'stroke-dasharray': '5 4', opacity: '0.5'
      });
      pipesLayer.appendChild(commPath);

      // --- Manchon dot ---
      const manchX = midX + 3;
      const manchY = trunkY - 2;

      const manchGroup = el('g', { class: 'manchon-marker' });

      manchGroup.appendChild(el('circle', {
        cx: manchX, cy: manchY + 6, r: '7',
        fill: 'rgba(210,153,34,0.15)', stroke: '#d29922', 'stroke-width': '1.5'
      }));
      manchGroup.appendChild(txt('M', {
        x: manchX, y: manchY + 9, 'text-anchor': 'middle',
        fill: '#d29922', 'font-size': '7', 'font-family': 'IBM Plex Mono,monospace', 'font-weight': '700'
      }));

      // Manchon ref tag
      const tagW = manchon.ref.length * 6 + 8;
      manchGroup.appendChild(el('rect', {
        x: manchX - tagW/2, y: manchY - 16, width: tagW, height: 12, rx: '3',
        fill: 'rgba(210,153,34,0.12)', stroke: 'rgba(210,153,34,0.35)', 'stroke-width': '0.8'
      }));
      manchGroup.appendChild(txt(manchon.ref, {
        x: manchX, y: manchY - 7, 'text-anchor': 'middle',
        fill: '#d29922', 'font-size': '7.5', 'font-family': 'IBM Plex Mono,monospace'
      }));

      manchLayer.appendChild(manchGroup);
    });

    // Main trunk line from UE
    const trunkLine = el('line', {
      x1: ueExitX, y1: trunkY - 2, x2: trunkX, y2: trunkY - 2,
      stroke: '#ff7b72', 'stroke-width': '3', 'stroke-linecap': 'round', opacity: '0.9'
    });
    pipesLayer.insertBefore(trunkLine, pipesLayer.firstChild);

    const trunkLineG = el('line', {
      x1: ueExitX, y1: trunkY + 6, x2: trunkX, y2: trunkY + 6,
      stroke: '#79c0ff', 'stroke-width': '5', 'stroke-linecap': 'round', opacity: '0.85'
    });
    pipesLayer.insertBefore(trunkLineG, pipesLayer.firstChild);
  }

  /* ---- Main draw function ---- */
  function draw(appState) {
    const unitsLayer = getUnits();
    const labelsLayer = getLabels();
    unitsLayer.innerHTML = '';
    labelsLayer.innerHTML = '';

    const svg = getSVG();
    if (!svg._listenersSet) {
      svg.addEventListener('mousedown', onSVGMouseDown);
      svg._listenersSet = true;
    }

    const { brand, ue, units, selectedUnitId } = appState;
    if (!brand && !ue && units.length === 0) return;

    const brandData = BRANDS_DATA[appState.brandKey];
    let uePos = null;

    // UE position
    if (ue) {
      const svgEl = getSVG();
      const H = svgEl.clientHeight || 600;
      uePos = { x: 100, y: H / 2 };
      const ueGroup = drawUE(ue, brandData, uePos.x, uePos.y);
      unitsLayer.appendChild(ueGroup);
    }

    // Draw pipes
    drawPipes(units, uePos);

    // Draw units
    units.forEach(u => {
      const g = drawUI(u, u.id === selectedUnitId);
      unitsLayer.appendChild(g);
    });

    // Empty hint
    const hint = document.getElementById('empty-hint');
    if (hint) hint.style.display = (units.length === 0 && !ue) ? '' : 'none';
  }

  /* ---- Auto-layout ---- */
  function autoLayout(appState) {
    if (appState.units.length === 0) return;
    const svg = getSVG();
    const W = svg.clientWidth || 900;
    const H = svg.clientHeight || 600;

    const cols = Math.ceil(Math.sqrt(appState.units.length));
    const rows = Math.ceil(appState.units.length / cols);

    const startX = 280;
    const endX   = W - 80;
    const startY = 60;
    const endY   = H - 60;

    const spacingX = cols > 1 ? (endX - startX) / (cols - 1) : 0;
    const spacingY = rows > 1 ? (endY - startY) / (rows - 1) : (H - 136) / 2;

    appState.units.forEach((u, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      u.x = startX + col * spacingX;
      u.y = startY + row * spacingY;
    });

    draw(appState);
    document.getElementById('status-bar').textContent =
      `Layout auto généré — ${appState.units.length} unités`;
  }

  /* ---- Tool management ---- */
  function setTool(t) {
    state.tool = t;
    document.getElementById('tool-select').classList.toggle('active', t === 'select');
    document.getElementById('tool-pipe').classList.toggle('active', t === 'pipe');
    document.getElementById('status-bar').textContent =
      t === 'pipe' ? 'Outil tuyau — Cliquez pour tracer' : 'Outil sélection';
    getSVG().style.cursor = t === 'pipe' ? 'crosshair' : 'default';
  }

  /* ---- Zoom ---- */
  function applyTransform() {
    const layers = ['grid-layer','pipes-layer','manchons-layer','units-layer','labels-layer'];
    layers.forEach(id => {
      const l = document.getElementById(id);
      if (l) l.setAttribute('transform',
        `translate(${state.panX * state.zoom},${state.panY * state.zoom}) scale(${state.zoom})`);
    });
  }

  function zoomIn()    { state.zoom = Math.min(3, state.zoom * 1.2); applyTransform(); }
  function zoomOut()   { state.zoom = Math.max(0.3, state.zoom / 1.2); applyTransform(); }
  function zoomReset() { state.zoom = 1; state.panX = 0; state.panY = 0; applyTransform(); }

  /* ---- Mouse events ---- */
  function onSVGMouseDown(e) {
    if (state.tool === 'select' && e.target === getSVG()) {
      App.selectUnit(null);
    }
  }

  document.addEventListener('mousemove', (e) => {
    if (!state.dragging) return;
    const unit = App.getUnit(state.dragging);
    if (!unit) return;
    const dx = (e.clientX - state.dragStart.x) / state.zoom;
    const dy = (e.clientY - state.dragStart.y) / state.zoom;
    unit.x = Math.round((state.unitStart.x + dx) / 10) * 10;
    unit.y = Math.round((state.unitStart.y + dy) / 10) * 10;
    App.redraw();
  });

  document.addEventListener('mouseup', () => {
    if (state.dragging) {
      state.dragging = null;
      document.getElementById('status-bar').textContent = 'Unité déplacée';
    }
  });

  /* ---- Init ---- */
  function init() {
    drawGrid();
    window.addEventListener('resize', () => { drawGrid(); App.redraw(); });
  }

  return { draw, autoLayout, setTool, zoomIn, zoomOut, zoomReset, init, drawGrid };

})();
