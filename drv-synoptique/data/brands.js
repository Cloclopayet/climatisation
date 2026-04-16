/**
 * brands.js — Données fabricants Westpoint & Airwell (Groupe Airwell)
 * Modèles Airwell extraits du document VRF Selection — BRED THALES
 */

const BRANDS_DATA = {

  /* ======================================================
     AIRWELL — Gamme VRF VVTA / CVQA (R410A)
  ====================================================== */
  airwell: {
    name: 'Airwell',
    shortName: 'AW',
    refrigerant: 'R410A',
    color: '#0066cc',

    ue: [
      { model: 'VVTA-224R-01T32', kw: 22.4, maxUI: 8,  minTaux: 50, maxTaux: 130, alimentation: '380~415V/3Ph', intensite: '—', cop_chaud: 3.93, eer_froid: 3.37, poids: '—', dimensions: '—', refrig: 'R410A', charge_refrig: '—', longueur_max: 120, denivele_max: 30, tube_liq: '3/8"', tube_gaz: '5/8"' },
      { model: 'VVTA-280R-01T32', kw: 28.0, maxUI: 10, minTaux: 50, maxTaux: 130, alimentation: '380~415V/3Ph', intensite: '—', cop_chaud: 3.93, eer_froid: 3.37, poids: '—', dimensions: '—', refrig: 'R410A', charge_refrig: '—', longueur_max: 130, denivele_max: 30, tube_liq: '1/2"', tube_gaz: '3/4"' },
      { model: 'VVTA-335R-01T32', kw: 33.5, maxUI: 13, minTaux: 50, maxTaux: 130, alimentation: '380~415V/3Ph', intensite: '—', cop_chaud: 3.93, eer_froid: 3.37, poids: '—', dimensions: '—', refrig: 'R410A', charge_refrig: '—', longueur_max: 140, denivele_max: 35, tube_liq: '1/2"', tube_gaz: '7/8"' },
      { model: 'VVTA-400R-01T32', kw: 40.0, maxUI: 16, minTaux: 50, maxTaux: 130, alimentation: '380~415V/3Ph', intensite: '—', cop_chaud: 3.93, eer_froid: 3.37, poids: '—', dimensions: '—', refrig: 'R410A', charge_refrig: '—', longueur_max: 150, denivele_max: 40, tube_liq: '5/8"', tube_gaz: '1"1/8"' },
      { model: 'VVTA-450R-01T32', kw: 45.0, maxUI: 18, minTaux: 50, maxTaux: 130, alimentation: '380~415V/3Ph', intensite: '—', cop_chaud: 3.93, eer_froid: 3.37, poids: '—', dimensions: '—', refrig: 'R410A', charge_refrig: '—', longueur_max: 150, denivele_max: 40, tube_liq: '5/8"', tube_gaz: '1"1/8"' },
      { model: 'VVTA-504R-01T32', kw: 50.4, maxUI: 20, minTaux: 50, maxTaux: 130, alimentation: '380~415V/3Ph', intensite: '—', cop_chaud: 3.93, eer_froid: 3.37, poids: '—', dimensions: '—', refrig: 'R410A', charge_refrig: '—', longueur_max: 165, denivele_max: 40, tube_liq: '5/8"', tube_gaz: '1"1/8"' },
      { model: 'VVTA-560R-01T32', kw: 56.0, maxUI: 20, minTaux: 50, maxTaux: 130, alimentation: '380~415V/3Ph', intensite: '46.3 A', mca: 46.3, mfa: 63, cop_chaud: 3.93, eer_froid: 3.37, poids: '385 kg', dimensions: '1690×1410×750 mm', refrig: 'R410A', charge_refrig: '10 kg', longueur_max: 165, denivele_max: 40, tube_liq: '5/8"', tube_gaz: '1"1/8"', notes: 'FL5 Top discharge' },
    ],

    ui: [
      { type: 'Cassette CVQA-025 (2.8 kW)', icon: '⊞', code: 'CVQA-025N-01M22', puissances: [2.8], kw_froid: 2.8, kw_chaud: 3.2, desc: 'Flow Logic V-Compact Cassette 575×575', dims: '260×570×570 mm', debit_air: '700 m³/h', poids: '16 kg', bruit: '29 dB(A)', alimentation: '220~240V/1Ph' },
      { type: 'Cassette CVQA-035 (3.6 kW)', icon: '⊞', code: 'CVQA-035N-01M22', puissances: [3.6], kw_froid: 3.6, kw_chaud: 4.0, desc: 'Flow Logic V-Compact Cassette 575×575', dims: '260×570×570 mm', debit_air: '700 m³/h', poids: '19 kg', bruit: '29 dB(A)', alimentation: '220~240V/1Ph' },
      { type: 'Cassette CVQA-045 (4.5 kW)', icon: '⊞', code: 'CVQA-045N-01M22', puissances: [4.5], kw_froid: 4.5, kw_chaud: 5.0, desc: 'Flow Logic V-Compact Cassette 575×575', dims: '260×570×570 mm', debit_air: '700 m³/h', poids: '19 kg', bruit: '29 dB(A)', alimentation: '220~240V/1Ph' },
      { type: 'Cassette CVQA-050 (5.6 kW)', icon: '⊞', code: 'CVQA-050N-01M22', puissances: [5.6], kw_froid: 5.6, kw_chaud: 6.3, desc: 'Flow Logic V-Compact Cassette 575×575', dims: '260×570×570 mm', debit_air: '700 m³/h', poids: '19 kg', bruit: '30 dB(A)', alimentation: '220~240V/1Ph' },
    ],

    refnet: [
      { ref: 'TAU335', desc: 'Refnet joint Y — ≤ 33.5 kW', max_kw: 33.5, type: 'Y' },
      { ref: 'TAU506', desc: 'Refnet joint Y — ≤ 50.6 kW', max_kw: 50.6, type: 'Y' },
      { ref: 'TAU730', desc: 'Refnet joint Y — ≤ 73.0 kW', max_kw: 73.0, type: 'Y' },
    ]
  },

  /* ======================================================
     WESTPOINT — Gamme DRV WMV série 4 (R410A)
  ====================================================== */
  westpoint: {
    name: 'Westpoint',
    shortName: 'WP',
    refrigerant: 'R410A',
    color: '#58a6ff',

    ue: [
      { model: 'WMV-160/4A', kw: 16.0, maxUI: 6,  minTaux: 50, maxTaux: 130, alimentation: '400V/3Ph', intensite: '26.5A', cop_chaud: 3.95, eer_froid: 3.40, poids: '98 kg',  dimensions: '940×330×1345 mm',  refrig: 'R410A', charge_refrig: '3.8 kg', longueur_max: 100, denivele_max: 30 },
      { model: 'WMV-224/4A', kw: 22.4, maxUI: 8,  minTaux: 50, maxTaux: 130, alimentation: '400V/3Ph', intensite: '37.2A', cop_chaud: 3.90, eer_froid: 3.35, poids: '115 kg', dimensions: '940×330×1690 mm',  refrig: 'R410A', charge_refrig: '4.5 kg', longueur_max: 120, denivele_max: 30 },
      { model: 'WMV-280/4A', kw: 28.0, maxUI: 10, minTaux: 50, maxTaux: 130, alimentation: '400V/3Ph', intensite: '46.0A', cop_chaud: 3.85, eer_froid: 3.30, poids: '135 kg', dimensions: '1160×330×1690 mm', refrig: 'R410A', charge_refrig: '5.5 kg', longueur_max: 120, denivele_max: 30 },
      { model: 'WMV-335/4A', kw: 33.5, maxUI: 13, minTaux: 50, maxTaux: 130, alimentation: '400V/3Ph', intensite: '55.5A', cop_chaud: 3.80, eer_froid: 3.25, poids: '148 kg', dimensions: '1380×345×1690 mm', refrig: 'R410A', charge_refrig: '6.8 kg', longueur_max: 150, denivele_max: 40 },
      { model: 'WMV-400/4A', kw: 40.0, maxUI: 16, minTaux: 50, maxTaux: 130, alimentation: '400V/3Ph', intensite: '65.8A', cop_chaud: 3.75, eer_froid: 3.20, poids: '172 kg', dimensions: '1600×345×1690 mm', refrig: 'R410A', charge_refrig: '8.2 kg', longueur_max: 150, denivele_max: 40 },
      { model: 'WMV-450/4A', kw: 45.0, maxUI: 18, minTaux: 50, maxTaux: 130, alimentation: '400V/3Ph', intensite: '74.0A', cop_chaud: 3.72, eer_froid: 3.18, poids: '195 kg', dimensions: '1600×345×1690 mm', refrig: 'R410A', charge_refrig: '9.0 kg', longueur_max: 165, denivele_max: 40 },
      { model: 'WMV-560/4A', kw: 56.0, maxUI: 22, minTaux: 50, maxTaux: 130, alimentation: '400V/3Ph', intensite: '92.0A', cop_chaud: 3.68, eer_froid: 3.15, poids: '235 kg', dimensions: '1800×390×1820 mm', refrig: 'R410A', charge_refrig: '11.5 kg', longueur_max: 165, denivele_max: 40 },
    ],

    ui: [
      { type: 'Cassette 4 voies',        icon: '⊞', code: 'WCC4', puissances: [2.5,3.5,5,7,9,12,14], desc: 'Encastrée plafond 4 directions', dims: '575×575×288 mm' },
      { type: 'Gainable basse pression',  icon: '▬', code: 'WGB',  puissances: [2.5,3.5,5,7,9,12,14], desc: 'Réseau gaines 50 Pa', dims: 'Variable' },
      { type: 'Mural',                    icon: '▪', code: 'WMU',  puissances: [1.5,2.5,3.5,5,7,9],   desc: 'Fixation murale silencieux', dims: '845×285×195 mm' },
      { type: 'Colonne / Armoire',        icon: '▐', code: 'WCA',  puissances: [7,9,12,14],             desc: 'Sol, forte puissance', dims: '500×245×1720 mm' },
      { type: 'Plancher-plafond',         icon: '═', code: 'WPP',  puissances: [2.5,3.5,5,7,9,12],    desc: 'Réversible plancher/plafond', dims: '700×230×580 mm' },
    ],

    refnet: [
      { ref: 'Y-03',  desc: 'Manchon Y — 3.5 kW',  max_kw: 3.5,  type: 'Y' },
      { ref: 'Y-09',  desc: 'Manchon Y — 9 kW',    max_kw: 9.0,  type: 'Y' },
      { ref: 'T-14',  desc: 'Manchon T — 14 kW',   max_kw: 14,   type: 'T' },
      { ref: 'T-22',  desc: 'Manchon T — 22 kW',   max_kw: 22.4, type: 'T' },
      { ref: 'H-34',  desc: 'Manchon H — 33.5 kW', max_kw: 33.5, type: 'H' },
      { ref: 'H-56',  desc: 'Manchon H — 56 kW',   max_kw: 56,   type: 'H' },
    ]
  },
};

/**
 * Sélectionne automatiquement la meilleure UE selon la puissance totale UI
 * Taux de connexion cible : 100-115%
 */
function autoSelectUE(brandKey, totalKW) {
  const brand = BRANDS_DATA[brandKey];
  if (!brand || totalKW <= 0) return null;
  const sorted = [...brand.ue].sort((a, b) => a.kw - b.kw);
  const t = totalKW;
  // Cherche UE avec taux entre 50% et maxTaux
  const candidates = sorted.filter(ue => t / ue.kw >= 0.50 && t / ue.kw <= ue.maxTaux / 100);
  if (candidates.length === 0) return sorted.find(ue => ue.kw >= t / 1.3) || sorted[sorted.length - 1];
  // Préférer taux entre 100-115%
  return candidates.find(ue => { const r = t / ue.kw * 100; return r >= 100 && r <= 115; }) || candidates[0];
}

/**
 * Retourne le raccord refnet approprié selon puissance cumulée
 */
function getRefnet(brandKey, kw) {
  const brand = BRANDS_DATA[brandKey];
  const list = (brand && brand.refnet) ? brand.refnet : [];
  return list.find(r => kw <= r.max_kw) || list[list.length - 1] || getManchon(kw);
}
