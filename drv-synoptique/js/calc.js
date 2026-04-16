/**
 * calc.js v2 — Calculs bilan, tuyaux, refnet, vérifications
 */
const Calc = (() => {

  function bilan(s) {
    const tot = s.units.reduce((a,u)=>a+u.power,0);
    const taux = s.ue && s.ue.kw>0 ? tot/s.ue.kw*100 : 0;
    return {
      totalUI: +tot.toFixed(2), taux: +taux.toFixed(1), nbUI: s.units.length,
      taux_ok: s.ue ? (taux>=s.ue.minTaux&&taux<=s.ue.maxTaux) : false,
      taux_under: s.ue ? taux<s.ue.minTaux : false,
      taux_over:  s.ue ? taux>s.ue.maxTaux : false,
    };
  }

  function tuyaux(s) {
    const {ue,units,brandKey} = s;
    const tot = units.reduce((a,u)=>a+u.power,0);
    if (!ue || units.length===0) return [];
    const lng = parseFloat(document.getElementById('p-lng')?.value)||30;
    const rows = [];
    rows.push({ troncon:'UE → Dist. principal', kw:tot,
      liq:getPipeDims(tot).liq_mm+' mm', gaz:getPipeDims(tot).gaz_mm+' mm',
      liq_in:getPipeDims(tot).liq_in, gaz_in:getPipeDims(tot).gaz_in,
      refnet:getRefnet(brandKey,tot).ref, lng:lng+' m' });
    units.forEach((u,i)=>{
      const pipe=getPipeDims(u.power);
      rows.push({ troncon:u.label||'UI-'+u.id, kw:u.power,
        liq:pipe.liq_mm+' mm', gaz:pipe.gaz_mm+' mm',
        liq_in:pipe.liq_in, gaz_in:pipe.gaz_in,
        refnet:getRefnet(brandKey,u.power).ref,
        lng:Math.round(lng*0.4+i*2)+' m', zone:u.zone||'—' });
    });
    return rows;
  }

  function refnetNomen(s) {
    if (s.units.length===0) return [];
    const tot = s.units.reduce((a,u)=>a+u.power,0);
    const cnt={};
    const add=r=>{ cnt[r.ref]=cnt[r.ref]||{...r,count:0}; cnt[r.ref].count++; };
    add(getRefnet(s.brandKey,tot));
    s.units.forEach(u=>add(getRefnet(s.brandKey,u.power)));
    return Object.values(cnt).sort((a,b)=>b.count-a.count);
  }

  function checks(s) {
    const {ue,units,brandKey}=s;
    const tot=units.reduce((a,u)=>a+u.power,0);
    const taux=ue&&ue.kw>0?tot/ue.kw*100:0;
    const lng=parseFloat(document.getElementById('p-lng')?.value)||0;
    const den=parseFloat(document.getElementById('p-den')?.value)||0;
    const c=[];
    if(!ue){c.push({s:'err',t:'Aucune UE sélectionnée'});return c;}
    c.push({s:'ok',t:'UE : '+ue.model+' — '+ue.kw+' kW'});
    if(units.length===0){c.push({s:'warn',t:'Aucune UI ajoutée'});return c;}
    if(units.length>ue.maxUI) c.push({s:'err',t:`Trop d'UI : ${units.length} / max ${ue.maxUI}`});
    else c.push({s:'ok',t:`UI : ${units.length} / ${ue.maxUI} max`});
    if(taux<ue.minTaux) c.push({s:'warn',t:`Taux faible : ${taux.toFixed(0)}% (min ${ue.minTaux}%)`});
    else if(taux>ue.maxTaux) c.push({s:'err',t:`Taux dépassé : ${taux.toFixed(0)}% (max ${ue.maxTaux}%)`});
    else c.push({s:'ok',t:`Taux connexion OK : ${taux.toFixed(0)}%`});
    const maxL=ue.longueur_max||120;
    if(lng>maxL) c.push({s:'err',t:`Longueur > ${maxL} m (${lng} m)`});
    else c.push({s:'ok',t:`Longueur : ${lng} m / ${maxL} m max`});
    const maxD=ue.denivele_max||30;
    if(den>maxD) c.push({s:'err',t:`Dénivelé > ${maxD} m (${den} m)`});
    else c.push({s:'ok',t:`Dénivelé : ${den} m / ${maxD} m max`});
    c.push({s:'ok',t:'Réfrigérant : '+(ue.refrig||'R410A')});
    return c;
  }

  function updatePanel(s) {
    const b=bilan(s), t=tuyaux(s), rn=refnetNomen(s), ch=checks(s);
    const $=id=>document.getElementById(id);

    // bilan
    const bue=$('b-ue'); if(bue){bue.textContent=s.ue?s.ue.kw+' kW':'-- kW';bue.className='bv ok';}
    const bui=$('b-ui'); if(bui){bui.textContent=b.totalUI+' kW';bui.className='bv'+(b.totalUI>0?' ok':'');}
    const bnb=$('b-nb'); if(bnb) bnb.textContent=b.nbUI;
    const bcop=$('b-cop'); if(bcop&&s.ue) bcop.textContent=(s.ue.eer_froid||'--')+' / '+(s.ue.cop_chaud||'--');

    // taux
    const tv=$('taux-val'),tf=$('taux-fill'),tb=$('taux-badge');
    const tm=$('ue-taux-mini'), ueKw=$('ue-kw');
    if(tv) tv.textContent=b.taux.toFixed(0)+'%';
    if(tm) tm.textContent=b.taux.toFixed(0)+'%';
    if(ueKw&&s.ue) ueKw.textContent=s.ue.kw+' kW';
    if(tf){ tf.style.width=Math.min(b.taux,140)+'%'; }
    if(tb&&tf){
      if(!s.ue||b.nbUI===0){tb.textContent='—';tb.className='taux-badge';tf.style.background='#30363d';}
      else if(b.taux_under){tb.textContent='FAIBLE';tb.className='taux-badge warn';tf.style.background='#d29922';}
      else if(b.taux_over){tb.textContent='DÉPASSÉ';tb.className='taux-badge err';tf.style.background='#f85149';}
      else{tb.textContent='OK';tb.className='taux-badge ok';tf.style.background='#3fb950';}
    }

    // refrig
    const rl=$('r-refrig'); if(rl&&s.ue) rl.textContent=s.ue.refrig||'R410A';
    const rer=$('ue-refrig'); if(rer&&s.ue) rer.textContent=s.ue.refrig||'R410A';
    const max=$('ue-maxui'); if(max&&s.ue) max.textContent=s.ue.maxUI;

    // auto badge
    const abt=$('ue-auto-badge'),abtxt=$('ue-auto-text');
    if(abt&&abtxt){
      if(!s.ue){abt.className='ue-auto-badge warn';abtxt.textContent='Ajoutez des UI';}
      else if(b.taux_over){abt.className='ue-auto-badge err';abtxt.textContent=s.ue.model+' — DÉPASSÉ';}
      else if(b.taux_under){abt.className='ue-auto-badge warn';abtxt.textContent=s.ue.model+' — taux faible';}
      else if(b.nbUI===0){abt.className='ue-auto-badge warn';abtxt.textContent=s.ue.model+' — ajoutez UI';}
      else{abt.className='ue-auto-badge ok';abtxt.textContent=s.ue.model+' ✓';}
    }

    // tuyaux table
    const tbody=$('tuyaux-tbody');
    if(tbody) tbody.innerHTML = t.length===0
      ? '<tr class="erow"><td colspan="5">Aucune unité</td></tr>'
      : t.map(r=>`<tr><td class="td-lbl">${r.troncon}</td><td class="td-ok">${r.liq}</td><td class="td-gaz">${r.gaz}</td><td><span class="chip refnet">${r.refnet}</span></td><td class="td-m">${r.lng}</td></tr>`).join('');

    // refnet nomen
    const rnDiv=$('refnet-nomen');
    if(rnDiv) rnDiv.innerHTML = rn.length===0
      ? '<p style="font-size:10px;color:var(--muted)">—</p>'
      : rn.map(m=>`<div class="refnet-row"><span class="rn-count">×${m.count}</span><span class="chip refnet">${m.ref}</span><span class="rn-desc">${m.desc}</span></div>`).join('');

    // checklist
    const chDiv=$('checklist');
    if(chDiv) chDiv.innerHTML=ch.map(c=>`<div class="chi"><span class="chd ${c.s}"></span><span class="cht ${c.s!=='ok'?c.s:''}">${c.t}</span></div>`).join('');
  }

  return {bilan,tuyaux,refnetNomen,checks,updatePanel};
})();
