/**
 * refnet.js — Algorithme de routage réseau Refnet (TAU joints)
 * Construit un arbre de distribution depuis l'UE vers toutes les UI
 * Style: synoptique Airwell VRF Selection (arbre hiérarchique)
 */

const RefnetRouter = (() => {

  /**
   * Point d'entrée principal
   * @param {Array} units   - liste des unités intérieures
   * @param {Object} uePos  - {x, y} position centre UE
   * @param {SVGElement} pipesG   - layer tuyaux
   * @param {SVGElement} refnetG  - layer manchons
   * @param {Function} elFn  - createElement helper
   * @param {Function} txtFn - createText helper
   */
  function draw(units, uePos, pipesG, refnetG, elFn, txtFn) {
    if (!units || units.length === 0) return;

    const totalKW = units.reduce((s,u)=>s+u.power,0);

    // ---- Calcul positions colonnes ----
    // L'UE est à gauche, les UI sont réparties en colonnes
    // On crée un arbre binaire (Y-joints en cascade = style Airwell)

    const tree = buildTree(units);
    drawTree(tree, uePos, pipesG, refnetG, elFn, txtFn);
  }

  /**
   * Construit un arbre de distribution binaire
   * Chaque nœud = {power, children:[...], unit?}
   */
  function buildTree(units) {
    if (units.length === 0) return null;
    if (units.length === 1) return { power: units[0].power, unit: units[0] };

    // Trier par puissance décroissante pour équilibrer l'arbre
    const sorted = [...units].sort((a,b)=>b.power - a.power);

    // Split en deux groupes équilibrés en puissance
    const half = Math.ceil(sorted.length / 2);
    const left  = sorted.slice(0, half);
    const right = sorted.slice(half);

    return {
      power: units.reduce((s,u)=>s+u.power,0),
      children: [buildTree(left), buildTree(right)]
    };
  }

  /**
   * Dessine récursivement l'arbre depuis l'UE
   */
  function drawTree(node, uePos, pipesG, refnetG, el, txt) {
    if (!node) return;

    // Position de départ : sortie UE (droite)
    const startX = uePos.x + 75;
    const startY = uePos.y;

    // Collecter toutes les UI pour calculer l'étendue verticale
    const allUnits = collectUnits(node);
    const totalH = allUnits.length * 100;
    const startUIY = uePos.y - totalH/2 + 50;

    drawBranch(node, {x: startX, y: startY}, allUnits, startUIY, 0,
               pipesG, refnetG, el, txt);
  }

  function collectUnits(node) {
    if (!node) return [];
    if (node.unit) return [node.unit];
    return [...collectUnits(node.children[0]), ...collectUnits(node.children[1])];
  }

  /**
   * Dessine une branche récursivement
   * @param {Object} node      - nœud de l'arbre
   * @param {Object} entry     - point d'entrée {x,y} de cette branche
   * @param {Array}  allUnits  - toutes les UI dans cette sous-branche
   * @param {number} offsetY   - position Y de départ pour les feuilles
   * @param {number} depth     - profondeur (pour le spacing)
   */
  function drawBranch(node, entry, allUnits, offsetY, depth, pipesG, refnetG, el, txt) {
    if (!node) return;
    const LEVEL_W = 160; // largeur par niveau
    const UI_SPACING = 100;

    if (node.unit) {
      // Feuille — dessiner tuyau jusqu'à l'UI
      const u = node.unit;
      const ux = u.x;
      const uy = u.y + 30; // centre vertical

      const pipe = getPipeDims(u.power);
      const refnet = getRefnet(u.power);

      // --- Tuyau liquide ---
      const liq = el('path', {
        d: `M${entry.x} ${entry.y-5} L${ux} ${uy-5}`,
        fill:'none', stroke:'#ff7b72', 'stroke-width':'2.5',
        'stroke-linecap':'round', opacity:'0.85'
      });
      pipesG.appendChild(liq);

      // --- Tuyau gaz ---
      const gaz = el('path', {
        d: `M${entry.x} ${entry.y+5} L${ux} ${uy+5}`,
        fill:'none', stroke:'#79c0ff', 'stroke-width':'4',
        'stroke-linecap':'round', opacity:'0.80'
      });
      pipesG.appendChild(gaz);

      // Étiquette dimensions sur le tronçon
      const midX = (entry.x + ux) / 2;
      const liqLbl = txt(`Ø${pipe.liq}`, {
        x: midX, y: entry.y-10,
        fill:'#ff7b72','font-size':'8','font-family':'IBM Plex Mono,monospace', opacity:'0.8',
        'text-anchor':'middle'
      });
      pipesG.appendChild(liqLbl);

      return;
    }

    // Nœud interne — TAU joint
    if (!node.children || node.children.length < 2) return;

    const childUnitsL = collectUnits(node.children[0]);
    const childUnitsR = collectUnits(node.children[1]);

    const hL = childUnitsL.length * UI_SPACING;
    const hR = childUnitsR.length * UI_SPACING;

    // Y des deux branches
    const yL = entry.y - hR * 0.5;
    const yR = entry.y + hL * 0.5;

    const juncX = entry.x + LEVEL_W * 0.35;

    // Tuyau d'arrivée au joint (liquide)
    pipesG.appendChild(el('line', {
      x1:entry.x, y1:entry.y-5, x2:juncX, y2:entry.y-5,
      stroke:'#ff7b72','stroke-width':'2.5','stroke-linecap':'round',opacity:'0.9'
    }));
    // Tuyau d'arrivée au joint (gaz)
    pipesG.appendChild(el('line', {
      x1:entry.x, y1:entry.y+5, x2:juncX, y2:entry.y+5,
      stroke:'#79c0ff','stroke-width':'4','stroke-linecap':'round',opacity:'0.85'
    }));

    // === Raccord TAU ===
    const refnet = getRefnet(node.power);
    const juncY = entry.y;

    // Cercle TAU
    const tauGroup = el('g', { class:'tau-joint' });
    tauGroup.appendChild(el('circle', {
      cx:juncX, cy:juncY, r:'8',
      fill:'rgba(210,153,34,0.2)', stroke:'#d29922', 'stroke-width':'1.5'
    }));
    // Mini label ref
    const tagW = refnet.ref.length * 5.5 + 8;
    tauGroup.appendChild(el('rect', {
      x:juncX-tagW/2, y:juncY-20, width:tagW, height:12, rx:'3',
      fill:'rgba(210,153,34,0.12)',stroke:'rgba(210,153,34,0.4)','stroke-width':'0.8'
    }));
    tauGroup.appendChild(txt(refnet.ref, {
      x:juncX, y:juncY-11, 'text-anchor':'middle',
      fill:'#d29922','font-size':'7.5','font-family':'IBM Plex Mono,monospace'
    }));
    refnetG.appendChild(tauGroup);

    // Tuyau vers branche gauche (liquide + gaz)
    pipesG.appendChild(el('path', {
      d:`M${juncX} ${juncY-5} L${juncX} ${yL-5} L${juncX+LEVEL_W*0.65} ${yL-5}`,
      fill:'none',stroke:'#ff7b72','stroke-width':'2.2','stroke-linecap':'round',opacity:'0.85'
    }));
    pipesG.appendChild(el('path', {
      d:`M${juncX} ${juncY+5} L${juncX} ${yL+5} L${juncX+LEVEL_W*0.65} ${yL+5}`,
      fill:'none',stroke:'#79c0ff','stroke-width':'3.5','stroke-linecap':'round',opacity:'0.80'
    }));

    // Tuyau vers branche droite (liquide + gaz)
    pipesG.appendChild(el('path', {
      d:`M${juncX} ${juncY-5} L${juncX} ${yR-5} L${juncX+LEVEL_W*0.65} ${yR-5}`,
      fill:'none',stroke:'#ff7b72','stroke-width':'2.2','stroke-linecap':'round',opacity:'0.85'
    }));
    pipesG.appendChild(el('path', {
      d:`M${juncX} ${juncY+5} L${juncX} ${yR+5} L${juncX+LEVEL_W*0.65} ${yR+5}`,
      fill:'none',stroke:'#79c0ff','stroke-width':'3.5','stroke-linecap':'round',opacity:'0.80'
    }));

    // Points de connexion TAU sur les branches
    [yL, yR].forEach(yb=>{
      refnetG.appendChild(el('circle',{cx:juncX,cy:yb,r:'4',fill:'#d29922',opacity:'0.6'}));
    });

    // Récursion
    drawBranch(node.children[0], {x: juncX+LEVEL_W*0.65, y: yL},
               childUnitsL, offsetY, depth+1, pipesG, refnetG, el, txt);
    drawBranch(node.children[1], {x: juncX+LEVEL_W*0.65, y: yR},
               childUnitsR, offsetY + hL, depth+1, pipesG, refnetG, el, txt);
  }

  /**
   * Compte les raccords TAU utilisés
   */
  function countRefnets(units) {
    if (units.length <= 1) return [];
    const tree = buildTree(units);
    const counter = {};
    countNodes(tree, counter);
    return Object.entries(counter).map(([ref,count])=>({ref,count,...getRefnet(0)}))
      .map(r=>({...r,...getRefnetByRef(r.ref)}));
  }

  function getRefnetByRef(ref) {
    return REFNET_TABLE.find(r=>r.ref===ref) || REFNET_TABLE[0];
  }

  function countNodes(node, counter) {
    if (!node||node.unit) return;
    if(node.children) {
      const rf = getRefnet(node.power);
      counter[rf.ref] = (counter[rf.ref]||0)+1;
      node.children.forEach(c=>countNodes(c,counter));
    }
  }

  return { draw, countRefnets, buildTree };
})();
