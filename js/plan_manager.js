/**
 * plan_manager.js — Gestion du fond de plan (PDF / Image)
 */
const PlanManager = (() => {
  let pdfDoc = null, currentPage = 1, opacity = 0.35, planImage = null;

  function loadPDFjs(cb) {
    if (window.pdfjsLib) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      cb();
    };
    document.head.appendChild(s);
  }

  function load(input) {
    const file = input.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      setStatus('Chargement PDF...');
      loadPDFjs(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
          window.pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise.then(pdf => {
            pdfDoc = pdf;
            document.getElementById('pdf-page').max = pdf.numPages;
            document.getElementById('pdf-page').value = 1;
            currentPage = 1;
            renderPage(1);
            setStatus('PDF chargé — ' + pdf.numPages + ' page(s)');
          }).catch(err => setStatus('Erreur: ' + err.message));
        };
        reader.readAsArrayBuffer(file);
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { planImage = e.target.result; pdfDoc = null; renderImageSVG(e.target.result); setStatus('Image chargée'); };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  function renderPage(num) {
    if (!pdfDoc) return;
    currentPage = num;
    setStatus('Rendu page ' + num + '...');
    pdfDoc.getPage(num).then(page => {
      const area = document.getElementById('canvas-area');
      const W = area.clientWidth || 900, H = area.clientHeight || 650;
      const vp0 = page.getViewport({ scale: 1 });
      const scale = Math.min(W / vp0.width, H / vp0.height) * 0.95;
      const vp = page.getViewport({ scale });
      const c = document.createElement('canvas');
      c.width = vp.width; c.height = vp.height;
      page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(() => {
        planImage = c.toDataURL('image/png');
        renderImageSVG(planImage, vp.width, vp.height);
        setStatus('Page ' + num + '/' + pdfDoc.numPages);
        hideDZ();
      });
    });
  }

  function renderImageSVG(dataUrl, w, h) {
    const gPlan = document.getElementById('g-plan');
    gPlan.innerHTML = '';
    const area = document.getElementById('canvas-area');
    const W = w || area.clientWidth || 900, H = h || area.clientHeight || 650;
    const NS = 'http://www.w3.org/2000/svg';
    const img = document.createElementNS(NS, 'image');
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
    img.setAttribute('x', '0'); img.setAttribute('y', '0');
    img.setAttribute('width', W); img.setAttribute('height', H);
    img.setAttribute('opacity', opacity);
    img.setAttribute('id', 'plan-img');
    img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    gPlan.appendChild(img);
    hideDZ();
  }

  function setOpacity(v) {
    opacity = v / 100;
    const img = document.getElementById('plan-img');
    if (img) img.setAttribute('opacity', opacity);
  }

  function setPage(v) {
    const p = parseInt(v);
    if (pdfDoc && p >= 1 && p <= pdfDoc.numPages) renderPage(p);
  }

  function clear() {
    document.getElementById('g-plan').innerHTML = '';
    pdfDoc = null; planImage = null;
    showDZ(); setStatus('Plan effacé');
  }

  function fitToCanvas() {
    const img = document.getElementById('plan-img');
    if (!img) return;
    const area = document.getElementById('canvas-area');
    img.setAttribute('width', area.clientWidth);
    img.setAttribute('height', area.clientHeight);
  }

  function getImage() { return planImage; }
  function hasImage() { return !!planImage; }
  function hideDZ() { const d = document.getElementById('dz'); if (d) d.classList.add('hidden'); }
  function showDZ() { const d = document.getElementById('dz'); if (d) d.classList.remove('hidden'); }
  function setStatus(m) { const s = document.getElementById('sbar'); if (s) s.textContent = m; }

  return { load, renderPage, setOpacity, setPage, clear, fitToCanvas, getImage, hasImage };
})();
