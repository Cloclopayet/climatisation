/**
 * piping.js — Tables de dimensionnement tuyauteries & manchons
 * Conforme préconisations fabricants VRF / EN378 / DTU 66.3
 */

/**
 * TABLE TUYAUTERIES CUIVRE
 * Sélection diamètre selon puissance frigorifique cumulée du tronçon
 * Colonnes: max kW, Ø liquide (mm), Ø gaz (mm), pouces liquide, pouces gaz
 */
const PIPE_TABLE = [
  { max: 2.0,  liq_mm: '6.35',  gaz_mm: '9.52',  liq_in: '1/4"',    gaz_in: '3/8"',    liq_ext: 'Ø6',   gaz_ext: 'Ø10'  },
  { max: 4.0,  liq_mm: '6.35',  gaz_mm: '12.7',  liq_in: '1/4"',    gaz_in: '1/2"',    liq_ext: 'Ø6',   gaz_ext: 'Ø12'  },
  { max: 7.1,  liq_mm: '9.52',  gaz_mm: '15.88', liq_in: '3/8"',    gaz_in: '5/8"',    liq_ext: 'Ø10',  gaz_ext: 'Ø16'  },
  { max: 9.5,  liq_mm: '9.52',  gaz_mm: '19.05', liq_in: '3/8"',    gaz_in: '3/4"',    liq_ext: 'Ø10',  gaz_ext: 'Ø20'  },
  { max: 14.0, liq_mm: '9.52',  gaz_mm: '22.22', liq_in: '3/8"',    gaz_in: '7/8"',    liq_ext: 'Ø10',  gaz_ext: 'Ø22'  },
  { max: 22.4, liq_mm: '12.7',  gaz_mm: '25.4',  liq_in: '1/2"',    gaz_in: '1"',      liq_ext: 'Ø12',  gaz_ext: 'Ø25'  },
  { max: 28.0, liq_mm: '12.7',  gaz_mm: '28.58', liq_in: '1/2"',    gaz_in: '1"1/8"',  liq_ext: 'Ø12',  gaz_ext: 'Ø28'  },
  { max: 36.0, liq_mm: '15.88', gaz_mm: '31.75', liq_in: '5/8"',    gaz_in: '1"1/4"',  liq_ext: 'Ø16',  gaz_ext: 'Ø32'  },
  { max: 48.0, liq_mm: '19.05', gaz_mm: '34.93', liq_in: '3/4"',    gaz_in: '1"3/8"',  liq_ext: 'Ø20',  gaz_ext: 'Ø35'  },
  { max: 999,  liq_mm: '22.22', gaz_mm: '41.28', liq_in: '7/8"',    gaz_in: '1"5/8"',  liq_ext: 'Ø22',  gaz_ext: 'Ø42'  },
];

/**
 * TABLE MANCHONS / DISTRIBUTEURS
 * Sélection manchon selon puissance cumulée UI raccordés
 * Type Y = 2 départs, Type T = 3 départs, Type H = 4 départs
 */
const MANCHON_TABLE = [
  { max: 3.5,  ref: 'Y-03',   type: 'Y', desc: 'Manchon Y 2 voies — 3.5 kW max',    connects: 2 },
  { max: 5.6,  ref: 'Y-05',   type: 'Y', desc: 'Manchon Y 2 voies — 5.6 kW max',    connects: 2 },
  { max: 9.0,  ref: 'Y-09',   type: 'Y', desc: 'Manchon Y 2 voies — 9 kW max',      connects: 2 },
  { max: 14.0, ref: 'T-14',   type: 'T', desc: 'Manchon T 3 voies — 14 kW max',     connects: 3 },
  { max: 22.4, ref: 'T-22',   type: 'T', desc: 'Manchon T 3 voies — 22.4 kW max',   connects: 3 },
  { max: 33.5, ref: 'H-34',   type: 'H', desc: 'Manchon H 4 voies — 33.5 kW max',   connects: 4 },
  { max: 48.0, ref: 'H-48',   type: 'H', desc: 'Manchon H 4 voies — 48 kW max',     connects: 4 },
  { max: 999,  ref: 'H-56',   type: 'H', desc: 'Manchon H 4 voies — 56+ kW',        connects: 4 },
];

/**
 * COEFFICIENTS PERTES DE CHARGE (approximatif, à affiner selon fabricant)
 * Perte de charge par mètre selon Ø tube (mbar/m)
 */
const PRESSURE_DROP = {
  '6.35':  { liq: 0.25, gaz: 0.15 },
  '9.52':  { liq: 0.18, gaz: 0.10 },
  '12.7':  { liq: 0.12, gaz: 0.07 },
  '15.88': { liq: 0.08, gaz: 0.05 },
  '19.05': { liq: 0.06, gaz: 0.04 },
  '22.22': { liq: 0.05, gaz: 0.03 },
  '25.4':  { liq: 0.04, gaz: 0.025 },
  '28.58': { liq: 0.03, gaz: 0.02 },
  '31.75': { liq: 0.025, gaz: 0.015 },
};

/**
 * Retourne les dimensions de tuyau pour une puissance donnée
 * @param {number} kw — puissance en kW
 * @returns {object}
 */
function getPipeDims(kw) {
  return PIPE_TABLE.find(r => kw <= r.max) || PIPE_TABLE[PIPE_TABLE.length - 1];
}

/**
 * Retourne le manchon adapté pour une puissance donnée
 * @param {number} kw — puissance en kW
 * @returns {object}
 */
function getManchon(kw) {
  return MANCHON_TABLE.find(r => kw <= r.max) || MANCHON_TABLE[MANCHON_TABLE.length - 1];
}

/**
 * Calcule la perte de charge approximative sur un tronçon
 * @param {string} diam_mm — diamètre en mm (string)
 * @param {number} longueur — longueur en mètres
 * @param {'liq'|'gaz'} type — type de fluide
 * @returns {number} — perte de charge en mbar
 */
function calcPertesCharge(diam_mm, longueur, type) {
  const coeff = PRESSURE_DROP[diam_mm];
  if (!coeff) return null;
  return +(coeff[type] * longueur).toFixed(2);
}
