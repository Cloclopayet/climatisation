/**
 * calc.js — Moteur de calcul DRV
 * Taux de connexion, débours, manchons, vérifications
 */

const Calc = (() => {

  /**
   * Calcule le bilan complet
   */
  function computeBilan(appState) {
    const { ue, units } = appState;
    const totalUI = units.reduce((s, u) => s + u.power, 0);
    const taux = ue && ue.kw > 0 ? (totalUI / ue.kw) * 100 : 0;
    const moy = units.length > 0 ? totalUI / units.length : 0;

    return {
      totalUI:    +totalUI.toFixed(2),
      totalUE:    ue ? ue.kw : null,
      taux:       +taux.toFixed(1),
      nbUI:       units.length,
      maxUI:      ue ? ue.maxUI : null,
      moyUI:      +moy.toFixed(2),
      taux_ok:    ue ? (taux >= ue.minTaux && taux <= ue.maxTaux) : false,
      taux_under: ue ? taux < ue.minTaux : false,
      taux_over:  ue ? taux > ue.maxTaux : false,
    };
  }

  /**
   * Calcule le tableau de débours tuyauteries
   */
  function computeTuyaux(appState) {
    const { ue, units } = appState;
    const totalUI = units.reduce((s, u) => s + u.power, 0);
    const rows = [];

    if (!ue || units.length === 0) return rows;

    // Tronçon principal UE → distributeur
    const mainPipe = getPipeDims(totalUI);
    const mainManch = getManchon(totalUI);
    const longueur = parseFloat(document.getElementById('longueur-totale').value) || 30;

    rows.push({
      troncon:  'UE → Dist. principal',
      kw:       totalUI,
      liq:      mainPipe.liq_mm + ' mm',
      gaz:      mainPipe.gaz_mm + ' mm',
      liq_in:   mainPipe.liq_in,
      gaz_in:   mainPipe.gaz_in,
      manchon:  mainManch.ref,
      manchon_desc: mainManch.desc,
      longueur: longueur + ' m',
      status:   'ok',
    });

    // Tronçons individuels
    units.forEach((u, idx) => {
      const pipe  = getPipeDims(u.power);
      const manch = getManchon(u.power);
      const lng = Math.round(longueur * 0.4 + idx * 2); // Estimation

      rows.push({
        troncon:  u.label || ('UI-' + u.id),
        kw:       u.power,
        liq:      pipe.liq_mm + ' mm',
        gaz:      pipe.gaz_mm + ' mm',
        liq_in:   pipe.liq_in,
        gaz_in:   pipe.gaz_in,
        manchon:  manch.ref,
        manchon_desc: manch.desc,
        longueur: lng + ' m',
        zone:     u.zone || '—',
        status:   'ok',
      });
    });

    return rows;
  }

  /**
   * Calcule la nomenclature des manchons
   */
  function computeManchons(appState) {
    const { units } = appState;
    if (units.length === 0) return [];

    const counter = {};
    const totalUI = units.reduce((s, u) => s + u.power, 0);

    // Manchon principal
    const mainManch = getManchon(totalUI);
    counter[mainManch.ref] = counter[mainManch.ref] || { ...mainManch, count: 0 };
    counter[mainManch.ref].count++;

    // Manchons terminaux
    units.forEach(u => {
      const m = getManchon(u.power);
      counter[m.ref] = counter[m.ref] || { ...m, count: 0 };
      counter[m.ref].count++;
    });

    return Object.values(counter).sort((a, b) => b.count - a.count);
  }

  /**
   * Génère la checklist de vérifications
   */
  function computeChecks(appState) {
    const { ue, units } = appState;
    const checks = [];
    const totalUI = units.reduce((s, u) => s + u.power, 0);
    const taux = ue && ue.kw > 0 ? (totalUI / ue.kw) * 100 : 0;
    const longueur = parseFloat(document.getElementById('longueur-totale')?.value) || 30;
    const denivele = parseFloat(document.getElementById('denivele')?.value) || 0;
    const longestBranch = parseFloat(document.getElementById('longest-branch')?.value) || 20;

    if (!ue) {
      checks.push({ status: 'err', text: 'Aucune unité extérieure sélectionnée' });
      return checks;
    }

    // UE OK
    checks.push({ status: 'ok', text: `UE : ${ue.model} — ${ue.kw} kW` });

    // Nb UI
    if (units.length === 0) {
      checks.push({ status: 'warn', text: 'Aucune unité intérieure ajoutée' });
    } else if (units.length > ue.maxUI) {
      checks.push({ status: 'err', text: `Trop d'UI : ${units.length} / max ${ue.maxUI}` });
    } else {
      checks.push({ status: 'ok', text: `Nb UI : ${units.length} / ${ue.maxUI} max` });
    }

    // Taux
    if (units.length > 0) {
      if (taux < ue.minTaux) {
        checks.push({ status: 'warn', text: `Taux connexion trop faible : ${taux.toFixed(0)}% (min ${ue.minTaux}%)` });
      } else if (taux > ue.maxTaux) {
        checks.push({ status: 'err', text: `Taux connexion dépassé : ${taux.toFixed(0)}% (max ${ue.maxTaux}%)` });
      } else {
        checks.push({ status: 'ok', text: `Taux connexion OK : ${taux.toFixed(0)}%` });
      }
    }

    // Longueur totale
    const maxLng = ue.longueur_max || 120;
    if (longueur > maxLng) {
      checks.push({ status: 'err', text: `Longueur réseau > ${maxLng} m (actuel: ${longueur} m)` });
    } else if (longueur > maxLng * 0.8) {
      checks.push({ status: 'warn', text: `Longueur proche limite : ${longueur} m / ${maxLng} m max` });
    } else {
      checks.push({ status: 'ok', text: `Longueur réseau : ${longueur} m / ${maxLng} m max` });
    }

    // Dénivelé
    const maxDenv = ue.denivele_max || 30;
    if (denivele > maxDenv) {
      checks.push({ status: 'err', text: `Dénivelé > ${maxDenv} m (actuel: ${denivele} m)` });
    } else {
      checks.push({ status: 'ok', text: `Dénivelé : ${denivele} m / ${maxDenv} m max` });
    }

    // Branche la plus longue
    if (longestBranch > maxLng * 0.7) {
      checks.push({ status: 'warn', text: `Branche longue : ${longestBranch} m — vérifier pertes` });
    } else {
      checks.push({ status: 'ok', text: `Branche max : ${longestBranch} m` });
    }

    // Fluide frigorigène OK
    checks.push({ status: 'ok', text: `Frigorigène : ${ue.refrig || 'R410A'}` });

    return checks;
  }

  /**
   * Met à jour tout le panneau droit
   */
  function updatePanel(appState) {
    const bilan = computeBilan(appState);
    const tuyaux = computeTuyaux(appState);
    const manchons = computeManchons(appState);
    const checks = computeChecks(appState);
    const brandData = BRANDS_DATA[appState.brandKey];

    // ---- Bilan ----
    const bUE = document.getElementById('b-ue');
    const bUI = document.getElementById('b-ui');
    const bNb = document.getElementById('b-nbui');
    const bMoy = document.getElementById('b-moy');
    const statUE = document.getElementById('stat-ue');
    const statNbUI = document.getElementById('stat-nb-ui');
    const statMaxUI = document.getElementById('stat-max-ui');

    bUE.textContent = bilan.totalUE ? bilan.totalUE + ' kW' : '-- kW';
    bUE.className = 'bilan-value ok';
    bUI.textContent = bilan.totalUI + ' kW';
    bUI.className = 'bilan-value' + (bilan.totalUI > 0 ? ' ok' : '');
    bNb.textContent = `${bilan.nbUI} / ${bilan.maxUI || '--'}`;
    bMoy.textContent = bilan.moyUI > 0 ? bilan.moyUI + ' kW' : '--';

    // Taux
    const tauxVal = document.getElementById('taux-value');
    const tauxFill = document.getElementById('taux-fill');
    const tauxBadge = document.getElementById('taux-badge');
    const t = bilan.taux;

    tauxVal.textContent = t.toFixed(0) + '%';
    tauxFill.style.width = Math.min(t, 140) + '%';

    if (!appState.ue || bilan.nbUI === 0) {
      tauxBadge.textContent = '—';
      tauxBadge.className = 'taux-badge';
      tauxFill.style.background = '#30363d';
    } else if (bilan.taux_under) {
      tauxBadge.textContent = 'FAIBLE';
      tauxBadge.className = 'taux-badge warn';
      tauxFill.style.background = '#d29922';
    } else if (bilan.taux_over) {
      tauxBadge.textContent = 'DÉPASSÉ';
      tauxBadge.className = 'taux-badge err';
      tauxFill.style.background = '#f85149';
    } else {
      tauxBadge.textContent = 'OK';
      tauxBadge.className = 'taux-badge ok';
      tauxFill.style.background = '#3fb950';
    }

    // Refrigerant label
    const refLabel = document.getElementById('refrigerant-label');
    if (refLabel && appState.ue) refLabel.textContent = appState.ue.refrig || 'R410A';

    // ---- Tuyaux table ----
    const tbody = document.getElementById('tuyaux-tbody');
    if (tuyaux.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Aucune unité ajoutée</td></tr>';
    } else {
      tbody.innerHTML = tuyaux.map(r => `
        <tr>
          <td class="td-label">${r.troncon}</td>
          <td class="td-ok">${r.liq}</td>
          <td style="color:#79c0ff;font-family:var(--font-mono)">${r.gaz}</td>
          <td><span class="manchon-chip">${r.manchon}</span></td>
          <td class="td-muted">${r.longueur}</td>
        </tr>`).join('');
    }

    // ---- Manchons nomenclature ----
    const manchDiv = document.getElementById('manchons-nomenclature');
    if (manchons.length === 0) {
      manchDiv.innerHTML = '<p class="empty-text">—</p>';
    } else {
      manchDiv.innerHTML = manchons.map(m => `
        <div class="manchon-row">
          <span class="manchon-count">×${m.count}</span>
          <span class="manchon-chip">${m.ref}</span>
          <span class="manchon-desc">${m.desc}</span>
        </div>`).join('');
    }

    // ---- Checklist ----
    const checkDiv = document.getElementById('checklist');
    checkDiv.innerHTML = checks.map(c => `
      <div class="check-item">
        <span class="check-dot ${c.status}"></span>
        <span class="check-text ${c.status}">${c.text}</span>
      </div>`).join('');
  }

  return { computeBilan, computeTuyaux, computeManchons, computeChecks, updatePanel };

})();
