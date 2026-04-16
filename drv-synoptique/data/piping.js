/**
 * piping.js — Tables tuyauteries cuivre + refnets
 * Source : Airwell VRF Selection / EN378 / DTU 66.3
 */

/* Diamètres tuyauteries selon puissance cumulée aval (kW) */
const PIPE_TABLE = [
  { max: 2.0,  liq_mm: '6.35',  gaz_mm: '9.52',  liq_in: '1/4"',   gaz_in: '3/8"'   },
  { max: 4.0,  liq_mm: '6.35',  gaz_mm: '12.7',  liq_in: '1/4"',   gaz_in: '1/2"'   },
  { max: 7.1,  liq_mm: '9.52',  gaz_mm: '15.88', liq_in: '3/8"',   gaz_in: '5/8"'   },
  { max: 9.5,  liq_mm: '9.52',  gaz_mm: '19.05', liq_in: '3/8"',   gaz_in: '3/4"'   },
  { max: 14.0, liq_mm: '9.52',  gaz_mm: '22.22', liq_in: '3/8"',   gaz_in: '7/8"'   },
  { max: 22.4, liq_mm: '12.7',  gaz_mm: '25.4',  liq_in: '1/2"',   gaz_in: '1"'     },
  { max: 28.0, liq_mm: '12.7',  gaz_mm: '28.58', liq_in: '1/2"',   gaz_in: '1"1/8"' },
  { max: 36.0, liq_mm: '15.88', gaz_mm: '31.75', liq_in: '5/8"',   gaz_in: '1"1/4"' },
  { max: 48.0, liq_mm: '19.05', gaz_mm: '34.93', liq_in: '3/4"',   gaz_in: '1"3/8"' },
  { max: 999,  liq_mm: '22.22', gaz_mm: '41.28', liq_in: '7/8"',   gaz_in: '1"5/8"' },
];

/**
 * Retourne les dimensions de tuyau pour une puissance (kW)
 */
function getPipeDims(kw) {
  return PIPE_TABLE.find(r => kw <= r.max) || PIPE_TABLE[PIPE_TABLE.length - 1];
}

/**
 * Retourne le refnet/manchon approprié pour une puissance (kW)
 * Cherche d'abord dans la marque courante, sinon table générique
 */
function getRefnet(brandKeyOrKw, kwOrUndef) {
  // Signature: getRefnet(brandKey, kw)  ou  getRefnet(kw)
  let brandKey, kw;
  if (kwOrUndef === undefined) {
    kw = brandKeyOrKw;
    brandKey = null;
  } else {
    brandKey = brandKeyOrKw;
    kw = kwOrUndef;
  }

  if (brandKey && window.BRANDS_DATA && BRANDS_DATA[brandKey] && BRANDS_DATA[brandKey].refnet) {
    const list = BRANDS_DATA[brandKey].refnet;
    return list.find(r => kw <= r.max_kw) || list[list.length - 1];
  }

  // Table générique manchons
  const GENERIC = [
    { ref: 'Y-03',  desc: 'Manchon Y 2 voies — 3.5 kW',  max_kw: 3.5,  type: 'Y', color: '#d29922' },
    { ref: 'Y-09',  desc: 'Manchon Y 2 voies — 9 kW',    max_kw: 9.0,  type: 'Y', color: '#d29922' },
    { ref: 'T-14',  desc: 'Manchon T 3 voies — 14 kW',   max_kw: 14,   type: 'T', color: '#ff7b72' },
    { ref: 'T-22',  desc: 'Manchon T 3 voies — 22 kW',   max_kw: 22.4, type: 'T', color: '#ff7b72' },
    { ref: 'H-34',  desc: 'Manchon H 4 voies — 33.5 kW', max_kw: 33.5, type: 'H', color: '#a371f7' },
    { ref: 'H-56',  desc: 'Manchon H 4 voies — 56 kW',   max_kw: 999,  type: 'H', color: '#a371f7' },
  ];
  return GENERIC.find(r => kw <= r.max_kw) || GENERIC[GENERIC.length - 1];
}

/* Compatibilité ancienne API */
function getManchon(kw) { return getRefnet(kw); }
