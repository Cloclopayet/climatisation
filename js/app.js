/**
 * app.js — Contrôleur principal de l'application DRV Synoptique
 */

const App = (() => {

  /* =========================================================
     STATE
  ========================================================= */
  let state = {
    brandKey:      'westpoint',
    ue:            null,
    units:         [],
    idCtr:         0,
    selectedUnitId: null,
  };

  /* =========================================================
     HELPERS
  ========================================================= */
  const getState   = () => state;
  const getUnit    = (id) => state.units.find(u => u.id === id) || null;

  /* =========================================================
     BRAND
  ========================================================= */
  function selectBrand(key) {
    state.brandKey = key;
    document.getElementById('btn-wp').classList.toggle('active', key === 'westpoint');
    document.getElementById('btn-ay').classList.toggle('active', key === 'ayrwell');

    const brand = BRANDS_DATA[key];

    // Populate UE select
    const ueSelect = document.getElementById('ue-select');
    ueSelect.innerHTML = '<option value="">— Sélectionner un modèle —</option>';
    brand.ue.forEach((u, i) => {
      ueSelect.innerHTML += `<option value="${i}">${u.model} — ${u.kw} kW — max ${u.maxUI} UI</option>`;
    });

    // Populate UI type select
    const uiSelect = document.getElementById('ui-type-select');
    uiSelect.innerHTML = '<option value="">— Choisir un type —</option>';
    brand.ui.forEach((u, i) => {
      uiSelect.innerHTML += `<option value="${i}">${u.icon} ${u.type}</option>`;
    });

    state.ue = null;
    document.getElementById('ue-power').textContent = '-- kW';
    document.getElementById('ue-maxui').textContent = '--';
    document.getElementById('ue-taux').textContent = '--%';
    document.getElementById('ue-refrig').textContent = brand.refrigerant;

    recalcAll();
    redraw();
  }

  /* =========================================================
     UE
  ========================================================= */
  function updateUE() {
    const idx = parseInt(document.getElementById('ue-select').value);
    const brand = BRANDS_DATA[state.brandKey];

    if (isNaN(idx)) {
      state.ue = null;
      document.getElementById('ue-power').textContent = '-- kW';
      document.getElementById('ue-maxui').textContent = '--';
      document.getElementById('ue-taux').textContent = '--%';
    } else {
      state.ue = brand.ue[idx];
      document.getElementById('ue-power').textContent = state.ue.kw + ' kW';
      document.getElementById('ue-maxui').textContent = state.ue.maxUI;
      document.getElementById('ue-taux').textContent = state.ue.maxTaux + '%';
      document.getElementById('ue-refrig').textContent = state.ue.refrig || 'R410A';
    }

    recalcAll();
    redraw();
    document.getElementById('status-bar').textContent =
      state.ue ? `UE sélectionnée : ${state.ue.model}` : 'Sélectionnez une UE';
  }

  /* =========================================================
     ADD UI
  ========================================================= */
  function addUI() {
    const typeIdx = parseInt(document.getElementById('ui-type-select').value);
    if (isNaN(typeIdx)) {
      showToast('Veuillez sélectionner un type d\'unité.', 'warn');
      return;
    }

    const power = parseFloat(document.getElementById('ui-power-select').value);
    const label = document.getElementById('ui-label').value.trim() || ('UI-' + (state.idCtr + 1));
    const zone  = document.getElementById('ui-zone').value.trim();
    const brand = BRANDS_DATA[state.brandKey];
    const type  = brand.ui[typeIdx];

    // Check UE limit
    if (state.ue && state.units.length >= state.ue.maxUI) {
      showToast(`Nombre max d'UI atteint (${state.ue.maxUI})`, 'warn');
      return;
    }

    const svg = document.getElementById('synoptique-svg');
    const W = svg.clientWidth || 900;
    const H = svg.clientHeight || 600;

    const unit = {
      id:    ++state.idCtr,
      type:  type.type,
      icon:  type.icon,
      power,
      label,
      zone,
      x: 280 + (state.units.length % 4) * 140,
      y: 80  + Math.floor(state.units.length / 4) * 110,
    };

    state.units.push(unit);
    document.getElementById('ui-label').value = '';
    document.getElementById('ui-zone').value = '';

    recalcAll();
    redraw();

    document.getElementById('status-bar').textContent =
      `UI ajoutée : ${label} — ${power} kW`;
    showToast(`${label} ajouté — ${power} kW`, 'ok');
  }

  /* =========================================================
     SELECT UNIT
  ========================================================= */
  function selectUnit(id) {
    state.selectedUnitId = id;
    redraw();
    if (id) {
      const u = getUnit(id);
      document.getElementById('status-bar').textContent =
        `Sélectionné : ${u.label} (${u.type}, ${u.power} kW)`;
    }
  }

  /* =========================================================
     DELETE UNIT
  ========================================================= */
  function deleteSelectedUnit() {
    if (!state.selectedUnitId) return;
    const u = getUnit(state.selectedUnitId);
    if (!u) return;
    state.units = state.units.filter(x => x.id !== state.selectedUnitId);
    state.selectedUnitId = null;
    recalcAll();
    redraw();
    document.getElementById('status-bar').textContent = 'Unité supprimée';
  }

  /* =========================================================
     RECALC
  ========================================================= */
  function recalcAll() {
    Calc.updatePanel(state);
  }

  /* =========================================================
     REDRAW
  ========================================================= */
  function redraw() {
    Canvas.draw(state);
  }

  /* =========================================================
     RESET
  ========================================================= */
  function resetCanvas() {
    showModal(
      'Réinitialiser le projet ?',
      'Toutes les unités seront supprimées. Cette action est irréversible.',
      () => {
        state.units = [];
        state.ue = null;
        state.selectedUnitId = null;
        state.idCtr = 0;
        document.getElementById('ue-select').value = '';
        document.getElementById('ue-power').textContent = '-- kW';
        document.getElementById('ue-maxui').textContent = '--';
        document.getElementById('ue-taux').textContent = '--%';
        recalcAll();
        redraw();
        document.getElementById('empty-hint').style.display = '';
        document.getElementById('status-bar').textContent = 'Projet réinitialisé';
        showToast('Projet réinitialisé', 'ok');
      }
    );
  }

  /* =========================================================
     DEMO
  ========================================================= */
  function loadDemo() {
    // Select brand & UE
    selectBrand('westpoint');
    setTimeout(() => {
      document.getElementById('ue-select').value = '2'; // WMV-280/4A 28kW
      updateUE();

      const svg = document.getElementById('synoptique-svg');
      const W = svg.clientWidth || 900;
      const H = svg.clientHeight || 600;

      const demoUnits = [
        { type: 0, power: 9,   label: 'Salle de réunion',  zone: 'RDC' },
        { type: 0, power: 5,   label: 'Bureau direction',  zone: 'RDC' },
        { type: 2, power: 3.5, label: 'Bureau 1',          zone: 'RDC' },
        { type: 2, power: 3.5, label: 'Bureau 2',          zone: 'R+1' },
        { type: 1, power: 5,   label: 'Couloir R+1',       zone: 'R+1' },
        { type: 4, power: 2.5, label: 'Accueil',           zone: 'RDC' },
      ];

      state.units = [];
      state.idCtr = 0;
      const brand = BRANDS_DATA[state.brandKey];

      demoUnits.forEach((d, idx) => {
        const t = brand.ui[d.type];
        state.units.push({
          id: ++state.idCtr,
          type: t.type, icon: t.icon,
          power: d.power, label: d.label, zone: d.zone,
          x: 280 + (idx % 3) * 180,
          y: 60  + Math.floor(idx / 3) * 150,
        });
      });

      document.getElementById('longueur-totale').value = 45;
      document.getElementById('denivele').value = 8;
      document.getElementById('longest-branch').value = 28;

      Canvas.autoLayout(state);
      recalcAll();
      document.getElementById('empty-hint').style.display = 'none';
      document.getElementById('status-bar').textContent = '✓ Démo chargée — 6 UI, Westpoint WMV-280 28 kW';
      showToast('Démo Westpoint chargée !', 'ok');
    }, 100);
  }

  /* =========================================================
     SAVE / LOAD / EXPORT JSON
  ========================================================= */
  function saveProject() {
    const data = {
      version: '1.0',
      projectName: document.getElementById('project-name').value,
      brandKey: state.brandKey,
      ueIndex: document.getElementById('ue-select').value,
      units: state.units,
      idCtr: state.idCtr,
      longueur: document.getElementById('longueur-totale').value,
      denivele: document.getElementById('denivele').value,
      longestBranch: document.getElementById('longest-branch').value,
      notes: document.getElementById('notes-chantier').value,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('drv-synoptique-save', JSON.stringify(data));
    showToast('Projet sauvegardé localement', 'ok');
  }

  function loadProject() {
    const raw = localStorage.getItem('drv-synoptique-save');
    if (!raw) { showToast('Aucune sauvegarde trouvée', 'warn'); return; }
    try {
      const data = JSON.parse(raw);
      document.getElementById('project-name').value = data.projectName || '';
      selectBrand(data.brandKey || 'westpoint');
      setTimeout(() => {
        document.getElementById('ue-select').value = data.ueIndex || '';
        updateUE();
        state.units = data.units || [];
        state.idCtr = data.idCtr || 0;
        document.getElementById('longueur-totale').value = data.longueur || 30;
        document.getElementById('denivele').value = data.denivele || 5;
        document.getElementById('longest-branch').value = data.longestBranch || 20;
        document.getElementById('notes-chantier').value = data.notes || '';
        recalcAll();
        redraw();
        if (state.units.length > 0) document.getElementById('empty-hint').style.display = 'none';
        showToast('Projet restauré', 'ok');
      }, 150);
    } catch(e) {
      showToast('Erreur lors du chargement', 'err');
    }
  }

  function exportJSON() {
    const data = {
      version: '1.0',
      projectName: document.getElementById('project-name').value,
      brandKey: state.brandKey,
      ue: state.ue,
      units: state.units,
      longueur: document.getElementById('longueur-totale').value,
      denivele: document.getElementById('denivele').value,
      notes: document.getElementById('notes-chantier').value,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (document.getElementById('project-name').value || 'drv-projet') + '.json';
    a.click();
    showToast('JSON exporté', 'ok');
  }

  /* =========================================================
     MODAL
  ========================================================= */
  function showModal(title, text, onConfirm) {
    const overlay = document.getElementById('modal-overlay');
    const box = document.getElementById('modal-box');
    box.innerHTML = `
      <div class="modal-title">${title}</div>
      <div class="modal-text">${text}</div>
      <div class="modal-actions">
        <button class="modal-btn cancel" id="modal-cancel">Annuler</button>
        <button class="modal-btn confirm" id="modal-confirm">Confirmer</button>
      </div>`;
    overlay.classList.remove('hidden');
    document.getElementById('modal-cancel').onclick = () => overlay.classList.add('hidden');
    document.getElementById('modal-confirm').onclick = () => {
      overlay.classList.add('hidden');
      onConfirm();
    };
  }

  /* =========================================================
     TOAST NOTIFICATIONS
  ========================================================= */
  function showToast(msg, type = 'ok') {
    const sb = document.getElementById('status-bar');
    const icons = { ok: '✓', warn: '⚠', err: '✗' };
    const colors = { ok: '#3fb950', warn: '#d29922', err: '#f85149' };
    sb.textContent = `${icons[type]} ${msg}`;
    sb.style.color = colors[type];
    setTimeout(() => {
      sb.style.color = '';
      sb.textContent = 'Prêt';
    }, 3000);
  }

  /* =========================================================
     KEYBOARD SHORTCUTS
  ========================================================= */
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedUnitId) {
      if (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA') return;
      deleteSelectedUnit();
    }
    if (e.key === 'Escape') { selectUnit(null); }
    if (e.key === '+' && e.ctrlKey) { e.preventDefault(); Canvas.zoomIn(); }
    if (e.key === '-' && e.ctrlKey) { e.preventDefault(); Canvas.zoomOut(); }
  });

  /* =========================================================
     INIT
  ========================================================= */
  function init() {
    // Set date
    document.getElementById('project-date').textContent =
      new Date().toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' });

    Canvas.init();
    selectBrand('westpoint');

    // Auto-load last save
    const raw = localStorage.getItem('drv-synoptique-save');
    if (raw) {
      setTimeout(() => {
        try {
          const data = JSON.parse(raw);
          if (data.units && data.units.length > 0) {
            showToast('Sauvegarde détectée — cliquez "Ouvrir" pour restaurer', 'warn');
          }
        } catch(e) {}
      }, 1500);
    }
  }

  /* =========================================================
     PUBLIC API
  ========================================================= */
  return {
    getState, getUnit,
    selectBrand, updateUE,
    addUI, selectUnit, deleteSelectedUnit,
    recalcAll, redraw,
    resetCanvas, loadDemo,
    saveProject, loadProject, exportJSON,
    init,
  };

})();

/* =========================================================
   BOOT
========================================================= */
window.addEventListener('DOMContentLoaded', () => App.init());
