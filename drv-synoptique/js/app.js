/**
 * app.js v2 — Contrôleur principal
 */
const App = (() => {
  let state = {
    brandKey: 'airwell', ue: null, units: [], idCtr: 0,
    selectedId: null, uePos: null, ueForced: false,
  };

  const getState  = () => state;
  const getUnit   = id => state.units.find(u=>u.id===id)||null;
  const setUEPos  = p  => { state.uePos=p; };
  const setStatus = m  => { const s=document.getElementById('sbar'); if(s) s.textContent=m; };

  /* ---- BRAND ---- */
  function setBrand(key) {
    state.brandKey = key;
    document.getElementById('btn-aw').className = 'bbtn'+(key==='airwell'?' aw-active':'');
    document.getElementById('btn-wp').className = 'bbtn'+(key==='westpoint'?' active':'');
    const badge = document.getElementById('proj-badge');
    if(badge){ badge.className='hbadge '+(key==='airwell'?'hb-aw':'hb-wp'); badge.textContent=key==='airwell'?'AIRWELL':'WESTPOINT'; }

    const brand = BRANDS_DATA[key];
    // UI types
    const uiSel = document.getElementById('ui-type');
    uiSel.innerHTML = '<option value="">— Choisir un type —</option>';
    brand.ui.forEach((u,i)=>{ uiSel.innerHTML+=`<option value="${i}">${u.icon} ${u.code} — ${u.type}</option>`; });

    // Force UE list
    const fSel = document.getElementById('ue-force');
    fSel.innerHTML = '<option value="">— Auto selon UI —</option>';
    brand.ue.forEach((u,i)=>{ fSel.innerHTML+=`<option value="${i}">${u.model} — ${u.kw} kW (max ${u.maxUI} UI)</option>`; });

    updatePowerSelect();
    autoSelectAndUpdate();
    redraw();
  }

  function updatePowerSelect() {
    const typeIdx = parseInt(document.getElementById('ui-type').value);
    const brand = BRANDS_DATA[state.brandKey];
    const pwSel = document.getElementById('ui-power');
    pwSel.innerHTML = '';
    const powers = (!isNaN(typeIdx) && brand.ui[typeIdx])
      ? brand.ui[typeIdx].puissances
      : [1.5,2.5,2.8,3.5,3.6,4.5,5,5.6,7,9,12,14];
    powers.forEach(p=>{ pwSel.innerHTML+=`<option value="${p}">${p} kW</option>`; });
  }

  /* ---- AUTO UE ---- */
  function autoSelectAndUpdate() {
    if (state.ueForced) { recalc(); return; }
    const tot = state.units.reduce((a,u)=>a+u.power,0);
    const newUE = autoSelectUE(state.brandKey, tot);
    if (newUE && (!state.ue || state.ue.model!==newUE.model)) {
      state.ue = newUE;
      if(tot>0) setStatus('⚡ UE auto : '+newUE.model+' ('+newUE.kw+' kW)');
    } else if (!newUE) { state.ue=null; }
    recalc();
  }

  function forceUE() {
    const idx = parseInt(document.getElementById('ue-force').value);
    const brand = BRANDS_DATA[state.brandKey];
    if (isNaN(idx)||idx===-1) { state.ueForced=false; autoSelectAndUpdate(); }
    else { state.ue=brand.ue[idx]; state.ueForced=true; recalc(); redraw(); setStatus('UE forcée : '+state.ue.model); }
  }

  /* ---- ADD UI ---- */
  function addUI() {
    const typeIdx = parseInt(document.getElementById('ui-type').value);
    if (isNaN(typeIdx)) { alert('Sélectionnez un type d\'unité.'); return; }
    const power = parseFloat(document.getElementById('ui-power').value);
    const label = (document.getElementById('ui-label').value.trim()) || ('UI-'+(state.idCtr+1));
    const zone  = document.getElementById('ui-zone').value.trim();
    const brand = BRANDS_DATA[state.brandKey];
    const type  = brand.ui[typeIdx];
    const area  = document.getElementById('canvas-area');
    const W=area.clientWidth||900, H=area.clientHeight||650;

    state.units.push({
      id: ++state.idCtr, type:type.type, icon:type.icon, code:type.code,
      power, label, zone,
      x: Math.round(265 + (state.units.length%5)*128),
      y: Math.round(58  + Math.floor(state.units.length/5)*115),
    });

    document.getElementById('ui-label').value = '';
    if (!state.ueForced) autoSelectAndUpdate(); else recalc();
    refreshUIList();
    redraw();
    document.getElementById('dz')?.classList.add('hidden');
    setStatus('+ '+label+' ('+type.code+' '+power+' kW)');
  }

  /* ---- UI LIST ---- */
  function refreshUIList() {
    const list = document.getElementById('ui-list');
    const cnt  = document.getElementById('ui-count');
    if(cnt) cnt.textContent = state.units.length;
    if(!list) return;
    list.innerHTML = state.units.map(u=>`
      <div class="ui-chip ${u.id===state.selectedId?'sel':''}" onclick="App.selectUnit(${u.id})">
        <span>${u.icon} <b>${u.label}</b></span>
        <span style="color:var(--green);font-family:var(--mono);font-size:10px;margin-left:4px">${u.power} kW</span>
        <span class="ui-chip-del" onclick="event.stopPropagation();App.deleteUnit(${u.id})">✕</span>
      </div>`).join('');
  }

  function selectUnit(id) { state.selectedId=id; refreshUIList(); redraw(); }

  function deleteUnit(id) {
    state.units = state.units.filter(u=>u.id!==id);
    if(state.selectedId===id) state.selectedId=null;
    if(!state.ueForced) autoSelectAndUpdate(); else recalc();
    refreshUIList(); redraw();
    setStatus('Unité supprimée');
  }

  /* ---- RECALC / REDRAW ---- */
  function recalc() { Calc.updatePanel(state); }
  function redraw() { Canvas.draw(state); }

  /* ---- RESET ---- */
  function reset() {
    showModal('Réinitialiser le projet ?','Toutes les unités seront supprimées.',()=>{
      state={brandKey:state.brandKey,ue:null,units:[],idCtr:0,selectedId:null,uePos:null,ueForced:false};
      document.getElementById('ue-force').value='';
      refreshUIList(); recalc(); redraw();
      document.getElementById('dz')?.classList.remove('hidden');
      setStatus('Projet réinitialisé');
    });
  }

  /* ---- DEMO BRED THALES ---- */
  function loadDemo() {
    setBrand('airwell');
    setTimeout(()=>{
      const brand = BRANDS_DATA['airwell'];
      // Force VVTA-560R
      const ueIdx = brand.ue.findIndex(u=>u.model.includes('560'));
      if(ueIdx>=0){ state.ue=brand.ue[ueIdx]; state.ueForced=true; document.getElementById('ue-force').value=ueIdx; }

      state.units=[]; state.idCtr=0;
      // 14×CVQA-025 + 2×CVQA-035 + 3×CVQA-045 + 1×CVQA-050 = 20 UI
      const cfg=[
        {ti:0,p:2.8,labels:['Bureau 01','Bureau 02','Bureau 03','Bureau 04','Bureau 05','Bureau 06','Bureau 07','Bureau 08','Bureau 09','Bureau 10','Bureau 11','Bureau 12','Bureau 13','Bureau 14'],zone:'RDC'},
        {ti:1,p:3.6,labels:['Salle conf. A','Salle conf. B'],zone:'R+1'},
        {ti:2,p:4.5,labels:['Hall entrée','Espace accueil','Zone attente'],zone:'RDC'},
        {ti:3,p:5.6,labels:['Grande salle'],zone:'R+1'},
      ];
      cfg.forEach(grp=>{
        const type=brand.ui[grp.ti];
        grp.labels.forEach(lbl=>{
          const n=state.units.length;
          state.units.push({id:++state.idCtr,type:type.type,icon:type.icon,code:type.code,
            power:grp.p,label:lbl,zone:grp.zone,
            x:260+(n%5)*128, y:58+Math.floor(n/5)*115});
        });
      });
      document.getElementById('p-lng').value=120;
      document.getElementById('p-den').value=8;
      document.getElementById('proj-name').value='BRED THALES';

      refreshUIList(); recalc();
      Canvas.autoLayout();
      document.getElementById('dz')?.classList.add('hidden');
      setStatus('✓ Démo BRED THALES — 20 UI / Airwell VVTA-560R 56 kW — Taux '+Math.round(65.45/56*100)+'%');
    },120);
  }

  /* ---- SAVE / LOAD / JSON ---- */
  function save() {
    const d={v:'2',brandKey:state.brandKey,ue:state.ue,units:state.units,
      idCtr:state.idCtr,uePos:state.uePos,ueForced:state.ueForced,
      projName:document.getElementById('proj-name')?.value,
      lng:document.getElementById('p-lng')?.value,
      den:document.getElementById('p-den')?.value,
      notes:document.getElementById('notes')?.value,
      at:new Date().toISOString()};
    localStorage.setItem('drv-synop-v2',JSON.stringify(d));
    setStatus('✓ Sauvegardé localement');
  }

  function load() {
    const raw=localStorage.getItem('drv-synop-v2');
    if(!raw){setStatus('⚠ Aucune sauvegarde trouvée');return;}
    try {
      const d=JSON.parse(raw);
      setBrand(d.brandKey||'airwell');
      setTimeout(()=>{
        state.ue=d.ue||null; state.units=d.units||[]; state.idCtr=d.idCtr||0;
        state.uePos=d.uePos||null; state.ueForced=d.ueForced||false;
        if(d.projName) document.getElementById('proj-name').value=d.projName;
        if(d.lng) document.getElementById('p-lng').value=d.lng;
        if(d.den) document.getElementById('p-den').value=d.den;
        if(d.notes) document.getElementById('notes').value=d.notes;
        if(state.ue){ const idx=BRANDS_DATA[state.brandKey].ue.findIndex(u=>u.model===state.ue.model); if(idx>=0) document.getElementById('ue-force').value=idx; }
        refreshUIList(); recalc(); redraw();
        if(state.units.length>0) document.getElementById('dz')?.classList.add('hidden');
        setStatus('✓ Projet restauré ('+state.units.length+' UI)');
      },150);
    } catch(e){ setStatus('✗ Erreur chargement: '+e.message); }
  }

  function exportJSON() {
    const d={v:'2',brandKey:state.brandKey,ue:state.ue,units:state.units,
      projName:document.getElementById('proj-name')?.value,at:new Date().toISOString()};
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));
    a.download=(document.getElementById('proj-name')?.value||'drv-projet')+'.json';
    a.click();
    setStatus('✓ JSON exporté');
  }

  /* ---- MODAL ---- */
  function showModal(title,text,onOK) {
    const ov=document.getElementById('modal-ov'), box=document.getElementById('modal-box');
    box.innerHTML=`<div class="modal-title">${title}</div><div class="modal-text">${text}</div><div class="modal-acts"><button class="mbtn canc" id="mc">Annuler</button><button class="mbtn conf" id="mk">Confirmer</button></div>`;
    ov.classList.remove('hidden');
    document.getElementById('mc').onclick=()=>ov.classList.add('hidden');
    document.getElementById('mk').onclick=()=>{ ov.classList.add('hidden'); onOK(); };
  }

  /* ---- KEYBOARD ---- */
  document.addEventListener('keydown',e=>{
    const tag=document.activeElement?.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return;
    if((e.key==='Delete'||e.key==='Backspace')&&state.selectedId) deleteUnit(state.selectedId);
    if(e.key==='Escape') selectUnit(null);
    if(e.ctrlKey&&e.key==='+'){e.preventDefault();Canvas.zoomIn();}
    if(e.ctrlKey&&e.key==='-'){e.preventDefault();Canvas.zoomOut();}
  });

  /* ---- INIT ---- */
  function init() {
    Canvas.init();
    document.getElementById('ui-type').addEventListener('change',updatePowerSelect);
    setBrand('airwell');
    setStatus('Prêt — Importez un plan PDF ou cliquez "Charger démo BRED THALES"');
  }

  return { getState,getUnit,setUEPos,setStatus,
    setBrand,forceUE,addUI,selectUnit,deleteUnit,
    recalc,redraw,reset,loadDemo,
    save,load,exportJSON,refreshUIList };
})();

window.addEventListener('DOMContentLoaded', App.init);
