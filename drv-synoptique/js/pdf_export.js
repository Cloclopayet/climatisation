/**
 * pdf_export.js v2 — Export dossier complet
 */
const PDF = (() => {

  function exportFull() {
    const s = App.getState();
    const {ue,units,brandKey} = s;
    const brand = BRANDS_DATA[brandKey];
    const proj  = document.getElementById('proj-name')?.value||'Projet DRV';
    const notes = document.getElementById('notes')?.value||'';
    const tuyaux = Calc.tuyaux(s);
    const rn = Calc.refnetNomen(s);
    const b  = Calc.bilan(s);
    const ch = Calc.checks(s);
    const lng = document.getElementById('p-lng')?.value||'—';
    const den = document.getElementById('p-den')?.value||'—';
    const today = new Date().toLocaleDateString('fr-FR',{year:'numeric',month:'long',day:'numeric'});
    const tauxC = b.taux_over?'#dc2626':b.taux_under?'#d97706':'#16a34a';

    // SVG snapshot
    const svg = document.getElementById('svg-main');
    const clone = svg.cloneNode(true);
    clone.setAttribute('width','100%'); clone.setAttribute('height','340');
    const svgStr = new XMLSerializer().serializeToString(clone);

    // Plan background image (if any)
    const planImg = PlanManager.getImage();

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Dossier VRF — ${proj}</title>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Rajdhani',sans-serif;color:#111;background:#fff;font-size:13px;line-height:1.5}
.page{max-width:210mm;margin:0 auto;padding:12mm 14mm 16mm}
@media print{.page{padding:8mm 10mm}.no-print{display:none!important}}
.dh{border-bottom:3px solid #0d1117;padding-bottom:11px;margin-bottom:16px;display:flex;align-items:flex-end;justify-content:space-between}
.dt{font-size:24px;font-weight:700;letter-spacing:4px}.dt span{color:#0066cc}
.dm{text-align:right;font-size:10px;color:#6b7280;font-family:'IBM Plex Mono',monospace;line-height:1.8}
.dm strong{color:#111}
.sec{margin-bottom:15px}
.sh{font-size:9px;font-weight:700;letter-spacing:2.5px;color:#6b7280;text-transform:uppercase;
  margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb;
  display:flex;align-items:center;gap:7px}
.sh::before{content:'';width:3px;height:11px;background:#0066cc;border-radius:2px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.card{background:#f8fafc;border:1px solid #e5e7eb;border-radius:7px;padding:8px 12px}
.cl{font-size:8px;color:#6b7280;letter-spacing:1px;font-weight:700;text-transform:uppercase}
.cv{font-size:14px;font-weight:700;font-family:'IBM Plex Mono',monospace;margin-top:2px}
.cv.ok{color:#16a34a}.cv.warn{color:#d97706}.cv.err{color:#dc2626}
.tbar{background:#e5e7eb;height:5px;border-radius:3px;overflow:hidden;margin-top:4px}
.tf{height:100%;border-radius:3px;background:${tauxC};width:${Math.min(b.taux,140)}%}
.ue-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:11px 14px;margin-bottom:12px}
.ue-box h3{font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:8px;letter-spacing:1px}
.props{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.pl{font-size:7.5px;color:#6b7280;font-weight:700;letter-spacing:.5px;text-transform:uppercase}
.pv{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#111;margin-top:1px}
.syno{background:#0d1117;border-radius:8px;overflow:hidden;margin-bottom:12px;padding:4px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{text-align:left;padding:5px 7px;background:#1a1a2e;color:#fff;font-size:8px;font-weight:700;letter-spacing:1.5px}
td{padding:5px 7px;border-bottom:1px solid #e5e7eb}
tr:nth-child(even) td{background:#f9fafb}
.mono{font-family:'IBM Plex Mono',monospace;font-size:10px}
.cok{color:#16a34a;font-family:'IBM Plex Mono',monospace;font-size:10px}
.cgaz{color:#2563eb;font-family:'IBM Plex Mono',monospace;font-size:10px}
.chip{display:inline-block;padding:1px 5px;background:#fef3c7;border:1px solid #fde68a;border-radius:3px;font-family:'IBM Plex Mono',monospace;font-size:9px;color:#92400e}
.rg{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.rnc{background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:8px 10px;text-align:center}
.rnc .rc{font-size:18px;font-weight:700;color:#b45309;font-family:'IBM Plex Mono',monospace}
.rnc .rr{font-size:10px;font-family:'IBM Plex Mono',monospace;margin:2px 0}
.rnc .rd{font-size:9px;color:#6b7280}
.chk{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.ci{display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #f1f5f9}
.dok{width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0}
.dwn{width:6px;height:6px;border-radius:50%;background:#f59e0b;flex-shrink:0}
.der{width:6px;height:6px;border-radius:50%;background:#ef4444;flex-shrink:0}
.ct{font-size:10px}.ctwn{color:#b45309}.cter{color:#dc2626}
.nbox{background:#f8fafc;border:1px solid #e5e7eb;border-radius:7px;padding:10px;min-height:45px;font-size:11px;line-height:1.8}
.foot{margin-top:16px;padding-top:8px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:9px;color:#9ca3af;font-family:'IBM Plex Mono',monospace}
</style></head><body><div class="page">

<header class="dh">
  <div>
    <div class="dt">DRV<span>SYNOP</span></div>
    <div style="font-size:9px;color:#6b7280;letter-spacing:2px;margin-top:2px">DOSSIER D'INSTALLATION VRF / DRV</div>
  </div>
  <div class="dm">
    <strong>${proj}</strong><br>
    Date : ${today}<br>
    Marque : ${brand?.name||'—'}<br>
    Réfrigérant : ${ue?.refrig||'R410A'}
  </div>
</header>

<div class="sec">
  <div class="sh">Bilan de Puissance</div>
  <div class="g3">
    <div class="card"><div class="cl">UE installée</div><div class="cv ok">${ue?ue.kw+' kW':'—'}</div><div style="font-size:9px;color:#6b7280">${ue?ue.model:'—'}</div></div>
    <div class="card"><div class="cl">Total UI</div><div class="cv">${b.totalUI} kW</div><div style="font-size:9px;color:#6b7280">${b.nbUI} unité(s)</div></div>
    <div class="card">
      <div class="cl">Taux connexion</div>
      <div class="cv ${b.taux_over?'err':b.taux_under?'warn':'ok'}">${b.taux.toFixed(0)}%</div>
      <div style="font-size:9px;color:#6b7280">Plage : ${ue?ue.minTaux:50}% → ${ue?ue.maxTaux:130}%</div>
      <div class="tbar"><div class="tf"></div></div>
    </div>
  </div>
</div>

${ue?`
<div class="sec">
  <div class="sh">Unité Extérieure</div>
  <div class="ue-box">
    <h3>${ue.model} — ${brand?.name||''}</h3>
    <div class="props">
      <div><div class="pl">Puissance</div><div class="pv">${ue.kw} kW</div></div>
      <div><div class="pl">Alimentation</div><div class="pv">${ue.alimentation||'—'}</div></div>
      <div><div class="pl">Intensité</div><div class="pv">${ue.intensite||'—'}</div></div>
      <div><div class="pl">Réfrigérant</div><div class="pv">${ue.refrig||'R410A'}</div></div>
      <div><div class="pl">Poids</div><div class="pv">${ue.poids||'—'}</div></div>
      <div><div class="pl">Dimensions</div><div class="pv">${ue.dimensions||'—'}</div></div>
      <div><div class="pl">Charge réfrig.</div><div class="pv">${ue.charge_refrig||'—'}</div></div>
      <div><div class="pl">COP / EER</div><div class="pv">${ue.cop_chaud||'—'} / ${ue.eer_froid||'—'}</div></div>
      <div><div class="pl">Long. max réseau</div><div class="pv">${ue.longueur_max||'—'} m</div></div>
      <div><div class="pl">Dénivelé max</div><div class="pv">${ue.denivele_max||'—'} m</div></div>
      <div><div class="pl">UI max</div><div class="pv">${ue.maxUI}</div></div>
      <div><div class="pl">Taux max</div><div class="pv">${ue.maxTaux}%</div></div>
    </div>
  </div>
</div>`:''}

<div class="sec">
  <div class="sh">Synoptique d'Installation</div>
  <div class="syno">${svgStr}</div>
</div>

${planImg?`
<div class="sec">
  <div class="sh">Plan de fond importé</div>
  <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <img src="${planImg}" style="width:100%;display:block" alt="Plan">
  </div>
</div>`:''}

<div class="sec">
  <div class="sh">Débours — Tuyauteries Cuivre (${ue?.refrig||'R410A'})</div>
  <table>
    <thead><tr><th>TRONÇON</th><th>PUISS.</th><th>Ø LIQUIDE</th><th>Ø GAZ</th><th>REFNET</th><th>L. EST.</th></tr></thead>
    <tbody>
      ${tuyaux.map(r=>`<tr><td style="font-weight:600">${r.troncon}</td><td class="mono">${r.kw} kW</td><td class="cok">${r.liq} (${r.liq_in})</td><td class="cgaz">${r.gaz} (${r.gaz_in})</td><td><span class="chip">${r.refnet}</span></td><td class="mono">${r.lng}</td></tr>`).join('')||'<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:12px">Aucune donnée</td></tr>'}
    </tbody>
  </table>
  <p style="font-size:9px;color:#9ca3af;margin-top:4px">* Diamètres selon puissance cumulée — tuyauteries cuivre recuit isolées — EN 378</p>
</div>

${rn.length>0?`
<div class="sec">
  <div class="sh">Nomenclature Refnet</div>
  <div class="rg">${rn.map(m=>`<div class="rnc"><div class="rc">×${m.count}</div><div class="rr">${m.ref}</div><div class="rd">${m.desc}</div></div>`).join('')}</div>
</div>`:''}

${units.length>0?`
<div class="sec">
  <div class="sh">Liste des Unités Intérieures (${units.length})</div>
  <table>
    <thead><tr><th>#</th><th>ÉTIQUETTE</th><th>MODÈLE</th><th>PUISS.</th><th>Ø LIQ.</th><th>Ø GAZ</th><th>REFNET</th><th>ZONE</th></tr></thead>
    <tbody>
      ${units.map((u,i)=>{const p=getPipeDims(u.power);const r=getRefnet(s.brandKey,u.power);return`<tr><td class="mono">${i+1}</td><td style="font-weight:600">${u.label||'—'}</td><td class="mono">${u.code||u.type}</td><td class="mono">${u.power} kW</td><td class="cok">${p.liq_mm} mm</td><td class="cgaz">${p.gaz_mm} mm</td><td><span class="chip">${r.ref}</span></td><td style="color:#6b7280">${u.zone||'—'}</td></tr>`;}).join('')}
    </tbody>
  </table>
</div>`:''}

<div class="sec">
  <div class="sh">Paramètres & Vérifications</div>
  <div class="g4" style="margin-bottom:10px">
    <div class="card"><div class="cl">Long. totale</div><div class="cv">${lng} m</div></div>
    <div class="card"><div class="cl">Dénivelé max</div><div class="cv">${den} m</div></div>
    <div class="card"><div class="cl">Nb UI</div><div class="cv">${b.nbUI}</div></div>
    <div class="card"><div class="cl">Réfrigérant</div><div class="cv">${ue?.refrig||'R410A'}</div></div>
  </div>
  <div class="chk">
    ${ch.map(c=>`<div class="ci"><span class="${c.s==='ok'?'dok':c.s==='warn'?'dwn':'der'}"></span><span class="ct ${c.s!=='ok'?'ct'+c.s:''}">${c.t}</span></div>`).join('')}
  </div>
</div>

${notes?`<div class="sec"><div class="sh">Notes de chantier</div><div class="nbox">${notes.replace(/\n/g,'<br>')}</div></div>`:''}

<footer class="foot">
  <span>DRV Synoptique v2.0</span>
  <span>${proj} — ${today}</span>
  <span>Conforme EN 378 / DTU 66.3</span>
</footer>

<div class="no-print" style="text-align:center;margin-top:20px">
  <button onclick="window.print()" style="padding:10px 26px;background:#0d1117;color:#fff;border:none;border-radius:7px;font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;cursor:pointer">
    🖨 IMPRIMER / ENREGISTRER PDF
  </button>
</div>
</div></body></html>`;

    const w = window.open('','_blank');
    w.document.write(html);
    w.document.close();
  }

  function printSynoptique() { window.print(); }
  return { export: exportFull, printSynoptique };
})();
