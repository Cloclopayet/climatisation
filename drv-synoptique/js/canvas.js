/**
 * canvas.js v2 — Moteur SVG complet
 * - Fond de plan PDF/image
 * - Drag & drop unités + UE
 * - Tuyaux liquide/gaz/comm
 * - Réseau refnet arborescent automatique
 * - Zoom / pan
 */
const Canvas = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let zoom = 1, panX = 0, panY = 0;
  let dragging = null, dragStart = null, unitStart = null;
  let currentTool = 'select';

  /* helpers */
  const el = (tag, a={}) => {
    const e = document.createElementNS(NS, tag);
    Object.entries(a).forEach(([k,v]) => e.setAttribute(k,v));
    return e;
  };
  const tx = (t, a={}) => { const e = el('text', a); e.textContent = t; return e; };
  const $ = id => document.getElementById(id);

  /* ---- GRID ---- */
  function drawGrid() {
    const g = $('g-grid'); if (!g) return;
    g.innerHTML = '';
    const area = $('canvas-area');
    const W = area.clientWidth || 900, H = area.clientHeight || 650;
    for (let x = 0; x <= W+30; x += 30)
      for (let y = 0; y <= H+30; y += 30)
        g.appendChild(el('circle', {cx:x,cy:y,r:'0.7',fill:'#30363d',opacity:'0.4'}));
  }

  /* ---- DRAW UE ---- */
  function drawUE(ue, brandKey, cx, cy) {
    const brand = BRANDS_DATA[brandKey] || {};
    const W=128, H=88, x=cx-W/2, y=cy-H/2;
    const col = brand.color || '#58a6ff';
    const rgb = col === '#0066cc' ? '0,102,204' : '88,166,255';
    const g = el('g', {id:'ue-node',cursor:'move'});

    // glow
    g.appendChild(el('rect', {x:x-4,y:y-4,width:W+8,height:H+8,rx:'13',fill:'none',stroke:col,'stroke-width':'5',opacity:'0.12'}));
    // body
    g.appendChild(el('rect', {x,y,width:W,height:H,rx:'9',fill:`rgba(${rgb},0.10)`,stroke:col,'stroke-width':'1.5'}));
    // header
    g.appendChild(el('rect', {x,y,width:W,height:21,rx:'9',fill:`rgba(${rgb},0.22)`,stroke:'none'}));
    g.appendChild(el('rect', {x,y:y+13,width:W,height:8,fill:`rgba(${rgb},0.22)`,stroke:'none'}));

    g.appendChild(tx('UE — '+brand.shortName, {x:cx,y:y+14,'text-anchor':'middle',fill:col,'font-size':'9','font-family':'Rajdhani,sans-serif','font-weight':'700','letter-spacing':'1.5'}));
    g.appendChild(tx(ue.model, {x:cx,y:y+31,'text-anchor':'middle',fill:'#c9d1d9','font-size':'8.5','font-family':'IBM Plex Mono,monospace'}));
    g.appendChild(tx(ue.kw+' kW', {x:cx,y:y+48,'text-anchor':'middle',fill:'#3fb950','font-size':'13','font-family':'IBM Plex Mono,monospace','font-weight':'600'}));
    g.appendChild(tx(ue.alimentation||'400V/3Ph', {x:cx,y:y+64,'text-anchor':'middle',fill:'#7d8590','font-size':'8','font-family':'IBM Plex Mono,monospace'}));
    g.appendChild(tx('EER '+ue.eer_froid+' / COP '+ue.cop_chaud, {x:cx,y:y+79,'text-anchor':'middle',fill:'#6e7681','font-size':'7.5','font-family':'Rajdhani,sans-serif'}));

    // pipe stubs right
    const stubs = [{dy:-12,stroke:'#ff7b72',sw:2.5,dash:'none',lbl:'L'},{dy:0,stroke:'#79c0ff',sw:4.5,dash:'none',lbl:'G'},{dy:14,stroke:'#3fb950',sw:1.2,dash:'5 3',lbl:'C'}];
    stubs.forEach(s => {
      g.appendChild(el('line', {x1:x+W,y1:cy+s.dy,x2:x+W+22,y2:cy+s.dy,stroke:s.stroke,'stroke-width':s.sw,'stroke-dasharray':s.dash,'stroke-linecap':'round'}));
    });

    // drag
    g.addEventListener('mousedown', e => {
      if (currentTool !== 'select') return;
      e.stopPropagation();
      dragging = '__ue__';
      dragStart = {x:e.clientX,y:e.clientY};
      unitStart = {x:cx,y:cy};
    });
    return g;
  }

  /* ---- DRAW UI UNIT ---- */
  function drawUnit(unit, selected) {
    const W=112, H=70;
    const {x,y,id} = unit;
    const pipe = getPipeDims(unit.power);
    const g = el('g', {'data-id':id,cursor:'move'});

    if (selected)
      g.appendChild(el('rect',{x:x-4,y:y-4,width:W+8,height:H+8,rx:'13',fill:'none',stroke:'#58a6ff','stroke-width':'2.5',opacity:'0.7'}));

    g.appendChild(el('rect',{x,y,width:W,height:H,rx:'8',fill:'rgba(165,214,255,0.09)',stroke:'rgba(165,214,255,0.40)','stroke-width':'1.2'}));
    g.appendChild(el('rect',{x,y,width:W,height:18,rx:'8',fill:'rgba(165,214,255,0.15)',stroke:'none'}));
    g.appendChild(el('rect',{x,y:y+11,width:W,height:7,fill:'rgba(165,214,255,0.15)',stroke:'none'}));

    // icon left
    g.appendChild(tx(unit.icon||'⊞', {x:x+12,y:y+13,'text-anchor':'middle',fill:'#a5d6ff','font-size':'12','font-family':'Rajdhani,sans-serif'}));
    // label
    const lbl = (unit.label||'UI-'+id).substring(0,14);
    g.appendChild(tx(lbl, {x:x+W/2,y:y+13,'text-anchor':'middle',fill:'#e6edf3','font-size':'10','font-family':'Rajdhani,sans-serif','font-weight':'700'}));
    // code
    g.appendChild(tx(unit.code||unit.type.substring(0,16), {x:x+W/2,y:y+28,'text-anchor':'middle',fill:'#7d8590','font-size':'7.5','font-family':'IBM Plex Mono,monospace'}));
    // power
    g.appendChild(tx(unit.power+' kW', {x:x+W/2,y:y+44,'text-anchor':'middle',fill:'#3fb950','font-size':'12','font-family':'IBM Plex Mono,monospace','font-weight':'600'}));
    // pipe dims
    g.appendChild(tx('Ø'+pipe.liq_mm+'/'+pipe.gaz_mm, {x:x+W/2,y:y+58,'text-anchor':'middle',fill:'#6e7681','font-size':'7','font-family':'IBM Plex Mono,monospace'}));

    // zone badge
    if (unit.zone) {
      g.appendChild(el('rect',{x:x+W-36,y:y+61,width:34,height:10,rx:'3',fill:'rgba(88,166,255,0.14)',stroke:'rgba(88,166,255,0.3)','stroke-width':'0.5'}));
      g.appendChild(tx(unit.zone.substring(0,6),{x:x+W-19,y:y+69,'text-anchor':'middle',fill:'#58a6ff','font-size':'7','font-family':'Rajdhani,sans-serif','font-weight':'700'}));
    }

    g.addEventListener('mousedown', e => {
      if (currentTool !== 'select') return;
      e.stopPropagation();
      dragging = id;
      dragStart = {x:e.clientX,y:e.clientY};
      unitStart = {x:unit.x,y:unit.y};
      App.selectUnit(id);
    });
    return g;
  }

  /* ---- DRAW PIPES ---- */
  function drawPipes(units, ueX, ueY) {
    const g = $('g-pipes'); g.innerHTML = '';
    if (!ueX || units.length === 0) return;

    const exitX = ueX + 64 + 22; // right stub end
    const exitY = ueY;

    units.forEach(u => {
      const ucx = u.x + 56, ucy = u.y + 35;
      const pipe = getPipeDims(u.power);

      // Route: L-shaped  UE exit → corner → unit
      // Choose corner based on relative position
      const midX = exitX + 30 + (Math.abs(ucx - exitX) > 200 ? 20 : 0);

      // Liquid pipe (offset -10)
      g.appendChild(el('path',{d:`M${exitX} ${exitY-12} L${midX} ${exitY-12} L${midX} ${ucy-10} L${ucx-18} ${ucy-10}`,fill:'none',stroke:'#ff7b72','stroke-width':'2.5','stroke-linecap':'round','stroke-linejoin':'round',opacity:'0.9'}));

      // Gas pipe (offset +1, thicker)
      g.appendChild(el('path',{d:`M${exitX} ${exitY+1} L${midX+6} ${exitY+1} L${midX+6} ${ucy+2} L${ucx-18} ${ucy+2}`,fill:'none',stroke:'#79c0ff','stroke-width':'4.5','stroke-linecap':'round','stroke-linejoin':'round',opacity:'0.85'}));

      // Comm cable (dashed, offset +15)
      g.appendChild(el('path',{d:`M${exitX} ${exitY+15} L${midX+12} ${exitY+15} L${midX+12} ${ucy+16} L${ucx-18} ${ucy+16}`,fill:'none',stroke:'#3fb950','stroke-width':'1.2','stroke-dasharray':'5 4',opacity:'0.55'}));

      // Pipe size labels
      g.appendChild(tx('Ø'+pipe.liq_mm, {x:midX+2,y:exitY-16,fill:'#ff7b72','font-size':'7','font-family':'IBM Plex Mono,monospace',opacity:'0.75'}));
      g.appendChild(tx('Ø'+pipe.gaz_mm, {x:midX+8,y:exitY+14,fill:'#79c0ff','font-size':'7','font-family':'IBM Plex Mono,monospace',opacity:'0.75'}));
    });
  }

  /* ---- DRAW REFNET (arborescent) ---- */
  function drawRefnetTree(units, brandKey, ueX, ueY) {
    const g = $('g-refnet'); g.innerHTML = '';
    if (!ueX || units.length < 1) return;

    const exitX = ueX + 64 + 22;
    const exitY = ueY;

    // Build a simple binary tree grouping units in pairs
    // Each pair shares a refnet junction
    // Works for 1–20+ units
    const sorted = [...units].sort((a,b) => a.x - b.x || a.y - b.y);
    const groups = [];

    // Group units into pairs/triples
    for (let i = 0; i < sorted.length; i += 2) {
      const g1 = { units: [sorted[i]] };
      if (i+1 < sorted.length) g1.units.push(sorted[i+1]);
      groups.push(g1);
    }

    groups.forEach((grp, gi) => {
      const kwSum = grp.units.reduce((s, u) => s + u.power, 0);
      const rn = getRefnet(brandKey, kwSum);

      // Junction position: average of units in group, offset left
      const avgX = grp.units.reduce((s,u)=>s+u.x,0) / grp.units.length + 56;
      const avgY = grp.units.reduce((s,u)=>s+u.y,0) / grp.units.length + 35;
      const jx = Math.min(avgX - 20, exitX + 60 + gi * 15);
      const jy = exitY + (gi % 2 === 0 ? -15 : 15);

      // Line from junction to each unit
      grp.units.forEach(u => {
        const ucx = u.x + 56 - 18, ucy = u.y + 35;
        g.appendChild(el('line',{x1:jx,y1:jy,x2:ucx,y2:ucy,stroke:'#d29922','stroke-width':'0.8','stroke-dasharray':'3 2',opacity:'0.4'}));
      });

      // Refnet dot
      const dotCol = rn.color || '#d29922';
      g.appendChild(el('circle',{cx:jx,cy:jy,r:'7',fill:`${dotCol}22`,stroke:dotCol,'stroke-width':'1.5'}));
      // Type letter inside
      g.appendChild(tx(rn.type||'Y',{x:jx,y:jy+3,'text-anchor':'middle',fill:dotCol,'font-size':'8','font-family':'IBM Plex Mono,monospace','font-weight':'700'}));

      // Ref label bubble
      const rw = rn.ref.length * 5.8 + 8;
      g.appendChild(el('rect',{x:jx-rw/2,y:jy-20,width:rw,height:12,rx:'3',fill:`${dotCol}18`,stroke:`${dotCol}55`,'stroke-width':'0.8'}));
      g.appendChild(tx(rn.ref,{x:jx,y:jy-11,'text-anchor':'middle',fill:dotCol,'font-size':'7.5','font-family':'IBM Plex Mono,monospace'}));
    });

    // Main trunk distribution line
    if (groups.length > 1) {
      const firstJx = exitX + 60;
      const lastJx  = exitX + 60 + (groups.length-1) * 15;
      g.appendChild(el('line',{x1:exitX,y1:exitY,x2:exitX+50,y2:exitY,stroke:'#d29922','stroke-width':'2',opacity:'0.5'}));
    }
  }

  /* ---- FULL DRAW ---- */
  function draw(appState) {
    const gU = $('g-units'); gU.innerHTML = '';
    const {brandKey, ue, units, selectedId, uePos} = appState;

    if (ue) {
      if (!uePos) App.setUEPos({x:90, y:Math.round(($('canvas-area').clientHeight||600)/2)});
      gU.appendChild(drawUE(ue, brandKey, appState.uePos.x, appState.uePos.y));
    }

    drawPipes(units, uePos?uePos.x:null, uePos?uePos.y:null);
    drawRefnetTree(units, brandKey, uePos?uePos.x:null, uePos?uePos.y:null);
    units.forEach(u => gU.appendChild(drawUnit(u, u.id === selectedId)));

    if (units.length > 0 || ue || PlanManager.hasImage())
      $('dz')?.classList.add('hidden');
  }

  /* ---- AUTO LAYOUT ---- */
  function autoLayout() {
    const s = App.getState();
    if (s.units.length === 0) { App.setStatus('Ajoutez des unités intérieures'); return; }
    const area = $('canvas-area');
    const W = area.clientWidth||900, H = area.clientHeight||650;
    const cols = Math.ceil(Math.sqrt(s.units.length));
    const rows = Math.ceil(s.units.length / cols);
    const sx=260, ex=W-80, sy=55, ey=H-55;
    const spX = cols>1 ? (ex-sx)/(cols-1) : 0;
    const spY = rows>1 ? (ey-sy)/(rows-1) : (H-120)/2;
    s.units.forEach((u,i) => {
      u.x = Math.round(sx + (i%cols)*spX);
      u.y = Math.round(sy + Math.floor(i/cols)*spY);
    });
    draw(s);
    App.setStatus('Auto-layout : '+s.units.length+' UI positionnées');
  }

  /* ---- TOOL ---- */
  function tool(t) {
    currentTool = t;
    ['sel','move'].forEach(id => {
      const b = $('t-'+id);
      if (b) b.classList.toggle('active', id===(t==='select'?'sel':'move'));
    });
    $('svg-main').style.cursor = t==='move'?'grab':'default';
    App.setStatus(t==='move'?'Mode déplacement plan':'Mode sélection');
  }

  /* ---- ZOOM ---- */
  function applyT() {
    ['g-plan','g-grid','g-pipes','g-refnet','g-units'].forEach(id => {
      const l = $(id); if (l) l.setAttribute('transform',`translate(${panX},${panY}) scale(${zoom})`);
    });
  }
  function zoomIn()  { zoom = Math.min(5,zoom*1.2); applyT(); }
  function zoomOut() { zoom = Math.max(0.15,zoom/1.2); applyT(); }
  function zoomFit() { zoom=1; panX=0; panY=0; applyT(); }

  /* ---- PAN with middle mouse / move tool ---- */
  let panning=false, panStart=null, panOrigin=null;
  document.addEventListener('mousedown', e => {
    if (e.button===1 || (currentTool==='move' && e.button===0)) {
      panning=true; panStart={x:e.clientX,y:e.clientY}; panOrigin={x:panX,y:panY};
      e.preventDefault();
    }
  });

  /* ---- DRAG ---- */
  document.addEventListener('mousemove', e => {
    if (panning && panStart) {
      panX = panOrigin.x + (e.clientX-panStart.x);
      panY = panOrigin.y + (e.clientY-panStart.y);
      applyT(); return;
    }
    if (!dragging) return;
    const dx = (e.clientX-dragStart.x)/zoom;
    const dy = (e.clientY-dragStart.y)/zoom;
    if (dragging==='__ue__') {
      App.setUEPos({x:Math.round(unitStart.x+dx),y:Math.round(unitStart.y+dy)});
      App.redraw();
    } else {
      const u = App.getUnit(dragging);
      if (u) { u.x=Math.round((unitStart.x+dx)/10)*10; u.y=Math.round((unitStart.y+dy)/10)*10; App.redraw(); }
    }
  });

  document.addEventListener('mouseup', () => { dragging=null; panning=false; });

  /* ---- WHEEL ZOOM ---- */
  document.getElementById('canvas-area')?.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    zoom = Math.max(0.15, Math.min(5, zoom*factor));
    applyT();
  }, {passive:false});

  /* ---- INIT ---- */
  function init() {
    drawGrid();
    window.addEventListener('resize', ()=>{ drawGrid(); App.redraw(); });
  }

  return { draw, autoLayout, tool, zoomIn, zoomOut, zoomFit, init };
})();
