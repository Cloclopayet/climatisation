/**
 * pdf.js — Export & impression du dossier complet DRV
 * Génère une page d'impression HTML complète avec synoptique + tableaux
 */

const PDF = (() => {

  /**
   * Génère et ouvre le dossier d'installation complet
   */
  function exportFull() {
    const { brandKey, ue, units } = App.getState();
    const brandData = BRANDS_DATA[brandKey];
    const projectName = document.getElementById('project-name').value || 'Projet DRV';
    const notes = document.getElementById('notes-chantier').value || '';
    const tuyaux = Calc.computeTuyaux(App.getState());
    const manchons = Calc.computeManchons(App.getState());
    const bilan = Calc.computeBilan(App.getState());
    const checks = Calc.computeChecks(App.getState());
    const longueur = document.getElementById('longueur-totale').value || '—';
    const denivele = document.getElementById('denivele').value || '—';
    const refrigerant = (ue && ue.refrig) || 'R410A';
    const today = new Date().toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' });

    const svg = document.getElementById('synoptique-svg');
    const svgClone = svg.cloneNode(true);
    svgClone.setAttribute('width', '100%');
    svgClone.setAttribute('height', '400');
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgB64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

    const tauxClass = bilan.taux_over ? 'err' : (bilan.taux_under ? 'warn' : 'ok');
    const tauxColor = bilan.taux_over ? '#f85149' : (bilan.taux_under ? '#d29922' : '#3fb950');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Dossier DRV — ${projectName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Rajdhani',sans-serif;background:#fff;color:#1a1a2e;font-size:14px;line-height:1.5}
  .page{max-width:210mm;margin:0 auto;padding:15mm 15mm 20mm}
  @media print{.page{max-width:100%;padding:10mm 12mm};.no-print{display:none!important}}

  /* Header */
  .doc-header{border-bottom:3px solid #0d1117;padding-bottom:14px;margin-bottom:20px;display:flex;align-items:flex-end;justify-content:space-between}
  .doc-title{font-size:28px;font-weight:700;letter-spacing:4px;color:#0d1117}
  .doc-title span{color:#58a6ff}
  .doc-subtitle{font-size:12px;color:#7d8590;letter-spacing:2px;margin-top:2px}
  .doc-meta{text-align:right;font-size:11px;color:#7d8590;font-family:'IBM Plex Mono',monospace;line-height:1.8}
  .doc-meta strong{color:#1a1a2e}

  /* Section */
  .section{margin-bottom:20px}
  .section-title{font-size:11px;font-weight:700;letter-spacing:2.5px;color:#7d8590;text-transform:uppercase;
    margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:8px}
  .section-title::before{content:'';width:3px;height:12px;background:#58a6ff;border-radius:2px;display:inline-block}

  /* Info cards */
  .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
  .info-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px}
  .info-label{font-size:9px;color:#7d8590;letter-spacing:1px;font-weight:700;text-transform:uppercase}
  .info-value{font-size:16px;font-weight:700;font-family:'IBM Plex Mono',monospace;color:#1a1a2e;margin-top:3px}
  .info-value.ok{color:#2d9048}
  .info-value.warn{color:#b45309}
  .info-value.err{color:#dc2626}
  .info-sub{font-size:10px;color:#7d8590;margin-top:2px}

  /* UE detail */
  .ue-box{background:#f0f7ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 18px;margin-bottom:14px}
  .ue-box h3{font-size:14px;font-weight:700;letter-spacing:1px;color:#1d4ed8;margin-bottom:10px}
  .ue-props{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .ue-prop{font-size:11px}
  .ue-prop-label{color:#7d8590;font-size:9px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase}
  .ue-prop-val{font-family:'IBM Plex Mono',monospace;font-size:12px;color:#1a1a2e;margin-top:2px}

  /* Tables */
  table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px}
  th{text-align:left;padding:7px 10px;background:#1a1a2e;color:#fff;font-size:9px;font-weight:700;letter-spacing:1.5px}
  td{padding:7px 10px;border-bottom:1px solid #e2e8f0}
  tr:hover td{background:#f8fafc}
  tr:nth-child(even) td{background:#fafafa}
  .mono{font-family:'IBM Plex Mono',monospace;font-size:11px}
  .col-ok{color:#2d9048;font-family:'IBM Plex Mono',monospace;font-size:11px}
  .col-gaz{color:#1d4ed8;font-family:'IBM Plex Mono',monospace;font-size:11px}
  .chip{display:inline-block;padding:1px 7px;background:#eff6ff;border:1px solid #bfdbfe;
    border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:#1d4ed8}
  .badge-ok{background:#dcfce7;color:#166534;border:1px solid #86efac;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
  .badge-warn{background:#fef3c7;color:#92400e;border:1px solid #fcd34d;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
  .badge-err{background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}

  /* Synoptique */
  .synoptique-box{background:#0d1117;border-radius:10px;overflow:hidden;margin-bottom:14px;min-height:280px}
  .synoptique-box img,.synoptique-box svg{width:100%;display:block}

  /* Checklist */
  .check-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}
  .check-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f1f5f9}
  .dot-ok{width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0}
  .dot-warn{width:7px;height:7px;border-radius:50%;background:#f59e0b;flex-shrink:0}
  .dot-err{width:7px;height:7px;border-radius:50%;background:#ef4444;flex-shrink:0}
  .check-txt{font-size:11px;color:#374151}
  .check-txt.warn{color:#b45309}
  .check-txt.err{color:#dc2626}

  /* Manchons */
  .manchon-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .manchon-card{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;text-align:center}
  .manchon-card .count{font-size:22px;font-weight:700;color:#b45309;font-family:'IBM Plex Mono',monospace}
  .manchon-card .ref{font-size:12px;font-family:'IBM Plex Mono',monospace;color:#1a1a2e;margin:2px 0}
  .manchon-card .desc{font-size:10px;color:#7d8590}

  /* Notes */
  .notes-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;min-height:60px;font-size:12px;color:#374151;line-height:1.8}

  /* Footer */
  .doc-footer{margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#9ca3af;font-family:'IBM Plex Mono',monospace}
  .taux-bar-container{background:#e5e7eb;height:8px;border-radius:4px;overflow:hidden;margin-top:6px}
  .taux-bar-fill{height:100%;border-radius:4px;background:${tauxColor};width:${Math.min(bilan.taux,140)}%}
</style>
</head>
<body>
<div class="page">

  <!-- En-tête -->
  <header class="doc-header">
    <div>
      <div class="doc-title">DRV<span>SYNOP</span></div>
      <div class="doc-subtitle">DOSSIER D'INSTALLATION — SYSTÈME VRF/DRV</div>
    </div>
    <div class="doc-meta">
      <strong>${projectName}</strong><br>
      Date : ${today}<br>
      Marque : ${brandData ? brandData.name : '—'}<br>
      Réfrigérant : ${refrigerant}
    </div>
  </header>

  <!-- Bilan de puissance -->
  <div class="section">
    <div class="section-title">Bilan de Puissance</div>
    <div class="info-grid">
      <div class="info-card">
        <div class="info-label">Puissance UE</div>
        <div class="info-value ok">${ue ? ue.kw + ' kW' : '—'}</div>
        <div class="info-sub">${ue ? ue.model : '—'}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Puissance UI totale</div>
        <div class="info-value">${bilan.totalUI} kW</div>
        <div class="info-sub">${bilan.nbUI} unité(s) intérieure(s)</div>
      </div>
      <div class="info-card">
        <div class="info-label">Taux de connexion</div>
        <div class="info-value ${tauxClass}">${bilan.taux.toFixed(0)}%</div>
        <div class="info-sub">Plage : ${ue ? ue.minTaux : 50}% → ${ue ? ue.maxTaux : 130}%</div>
        <div class="taux-bar-container"><div class="taux-bar-fill"></div></div>
      </div>
    </div>
  </div>

  <!-- Unité extérieure -->
  ${ue ? `
  <div class="section">
    <div class="section-title">Unité Extérieure</div>
    <div class="ue-box">
      <h3>${ue.fullName || ue.model} — ${brandData ? brandData.name : ''}</h3>
      <div class="ue-props">
        <div class="ue-prop"><div class="ue-prop-label">Puissance</div><div class="ue-prop-val">${ue.kw} kW</div></div>
        <div class="ue-prop"><div class="ue-prop-label">Alimentation</div><div class="ue-prop-val">${ue.alimentation || '400V/3Ph'}</div></div>
        <div class="ue-prop"><div class="ue-prop-label">Intensité</div><div class="ue-prop-val">${ue.intensite || '—'}</div></div>
        <div class="ue-prop"><div class="ue-prop-label">Réfrigérant</div><div class="ue-prop-val">${ue.refrig || 'R410A'}</div></div>
        <div class="ue-prop"><div class="ue-prop-label">Poids</div><div class="ue-prop-val">${ue.poids || '—'}</div></div>
        <div class="ue-prop"><div class="ue-prop-label">Dimensions</div><div class="ue-prop-val">${ue.dimensions || '—'}</div></div>
        <div class="ue-prop"><div class="ue-prop-label">Charge réfrig.</div><div class="ue-prop-val">${ue.charge_refrig || '—'}</div></div>
        <div class="ue-prop"><div class="ue-prop-label">Long. max réseau</div><div class="ue-prop-val">${ue.longueur_max || '—'} m</div></div>
        <div class="ue-prop"><div class="ue-prop-label">Dénivelé max</div><div class="ue-prop-val">${ue.denivele_max || '—'} m</div></div>
        <div class="ue-prop"><div class="ue-prop-label">COP chauffage</div><div class="ue-prop-val">${ue.cop_chaud || '—'}</div></div>
        <div class="ue-prop"><div class="ue-prop-label">EER refroid.</div><div class="ue-prop-val">${ue.eer_froid || '—'}</div></div>
        <div class="ue-prop"><div class="ue-prop-label">UI max</div><div class="ue-prop-val">${ue.maxUI}</div></div>
      </div>
    </div>
  </div>` : ''}

  <!-- Synoptique -->
  <div class="section">
    <div class="section-title">Synoptique d'Installation</div>
    <div class="synoptique-box">
      ${svgString}
    </div>
  </div>

  <!-- Tableau débours tuyauteries -->
  <div class="section">
    <div class="section-title">Débours — Tuyauteries Cuivre</div>
    <table>
      <thead>
        <tr>
          <th>TRONÇON / LOCAL</th>
          <th>PUISS. (kW)</th>
          <th>Ø LIQUIDE</th>
          <th>Ø GAZ</th>
          <th>MANCHON</th>
          <th>LONGUEUR EST.</th>
          <th>ZONE</th>
        </tr>
      </thead>
      <tbody>
        ${tuyaux.map(r => `
        <tr>
          <td style="font-weight:600">${r.troncon}</td>
          <td class="mono">${r.kw} kW</td>
          <td class="col-ok">${r.liq} (${r.liq_in})</td>
          <td class="col-gaz">${r.gaz} (${r.gaz_in})</td>
          <td><span class="chip">${r.manchon}</span></td>
          <td class="mono">${r.longueur}</td>
          <td style="color:#7d8590;font-size:11px">${r.zone || '—'}</td>
        </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:16px">Aucune donnée</td></tr>'}
      </tbody>
    </table>
    <p style="font-size:10px;color:#9ca3af;margin-top:4px">* Diamètres selon puissance cumulée — R410A — Tuyauteries cuivre recuit isolées</p>
  </div>

  <!-- Nomenclature manchons -->
  ${manchons.length > 0 ? `
  <div class="section">
    <div class="section-title">Nomenclature Manchons & Distributeurs</div>
    <div class="manchon-grid">
      ${manchons.map(m => `
      <div class="manchon-card">
        <div class="count">×${m.count}</div>
        <div class="ref">${m.ref}</div>
        <div class="desc">${m.desc}</div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  <!-- Unités intérieures -->
  ${units.length > 0 ? `
  <div class="section">
    <div class="section-title">Liste des Unités Intérieures</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>ÉTIQUETTE / LOCAL</th>
          <th>TYPE</th>
          <th>PUISSANCE</th>
          <th>Ø LIQ.</th>
          <th>Ø GAZ</th>
          <th>MANCHON</th>
          <th>ZONE</th>
        </tr>
      </thead>
      <tbody>
        ${units.map((u, i) => {
          const pipe  = getPipeDims(u.power);
          const manch = getManchon(u.power);
          return `<tr>
            <td class="mono">${i+1}</td>
            <td style="font-weight:600">${u.label || '—'}</td>
            <td>${u.type}</td>
            <td class="mono">${u.power} kW</td>
            <td class="col-ok">${pipe.liq_mm} mm</td>
            <td class="col-gaz">${pipe.gaz_mm} mm</td>
            <td><span class="chip">${manch.ref}</span></td>
            <td style="color:#7d8590">${u.zone || '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- Paramètres réseau -->
  <div class="section">
    <div class="section-title">Paramètres Réseau</div>
    <div class="info-grid">
      <div class="info-card">
        <div class="info-label">Longueur totale</div>
        <div class="info-value">${longueur} m</div>
      </div>
      <div class="info-card">
        <div class="info-label">Dénivelé max</div>
        <div class="info-value">${denivele} m</div>
      </div>
      <div class="info-card">
        <div class="info-label">Réfrigérant</div>
        <div class="info-value">${refrigerant}</div>
      </div>
    </div>
  </div>

  <!-- Vérifications -->
  <div class="section">
    <div class="section-title">Vérifications Installation</div>
    <div class="check-grid">
      ${checks.map(c => `
      <div class="check-row">
        <span class="dot-${c.status}"></span>
        <span class="check-txt ${c.status !== 'ok' ? c.status : ''}">${c.text}</span>
      </div>`).join('')}
    </div>
  </div>

  <!-- Notes -->
  ${notes ? `
  <div class="section">
    <div class="section-title">Notes de chantier</div>
    <div class="notes-box">${notes.replace(/\n/g, '<br>')}</div>
  </div>` : ''}

  <!-- Footer -->
  <footer class="doc-footer">
    <span>DRV Synoptique v1.0 — ${brandData ? brandData.name : ''}</span>
    <span>${projectName} — ${today}</span>
    <span>Conforme EN 378 / DTU 66.3</span>
  </footer>

  <div class="no-print" style="text-align:center;margin-top:30px">
    <button onclick="window.print()"
      style="padding:12px 32px;background:#1a1a2e;color:#fff;border:none;border-radius:8px;
      font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;letter-spacing:2px;cursor:pointer">
      🖨 IMPRIMER / ENREGISTRER PDF
    </button>
  </div>

</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  }

  /**
   * Impression directe du synoptique seul
   */
  function printSynoptique() {
    window.print();
  }

  return { export: exportFull, printSynoptique };

})();
