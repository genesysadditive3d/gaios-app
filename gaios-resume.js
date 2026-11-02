/* GAIOS: page badalne ya refresh karne ke baad bhi chalta hua 3D order wapas dikhaye */
(function () {
  var KEY = 'gaios_active_order';
  function $(i) { return document.getElementById(i); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function idleButtons() {
    var b = $('gen3d-btn'); b.style.display = ''; b.disabled = !gaiosConsentOk(); b.textContent = '🚀 3D Model Generate Karo';
    var c = $('cancel-btn'); if (c) c.style.display = 'none';
  }
  function ready(id, sd, secs) {
    var u = DGX_API + '/outputs/' + id + '.glb?v=' + (sd.updated || Date.now());
    $('modelViewer').setAttribute('src', u);
    $('viewerSection').style.display = 'block';
    $('approvalBox').style.display = 'block';
    $('trackingBox').style.display = 'block';
    try { curModelUrl = u; } catch (e) {}
    try { gaiosWatchUpgrade(id, sd.updated || 0); } catch (e) {}
    try { doneProg(); setStep(4); } catch (e) {}
    showStat('Ok', '✅ 3D Model Ready!' + (secs ? ' (' + secs + 's)' : ''));
    idleButtons();
  }
  async function resume() {
    var a = load();
    if (!a || !a.id) return;
    if (Date.now() - a.t0 > 2 * 3600 * 1000) { clear(); return; }
    var sd;
    try { sd = await (await fetch(DGX_API + '/order/' + a.id)).json(); } catch (e) { return; }
    if (sd && sd.success === false && sd.error) { clear(); return; }
    if (sd && sd.status === 'ready') { ready(a.id, sd, 0); return; }
    // abhi bhi ban raha hai: progress wapas dikhao
    _cancelRequested = false;
    $('gen3d-btn').style.display = 'none';
    var cb = $('cancel-btn'); if (cb) { cb.style.display = ''; cb.addEventListener('click', clear); }
    $('viewerSection').style.display = 'none';
    $('approvalBox').style.display = 'none';
    $('trackingBox').style.display = 'none';
    try { startProg(); setStep(3); } catch (e) {}
    var t0 = a.t0;
    showStat('Proc', '⏳ 3D Model ban raha hai... ' + Math.round((Date.now() - t0) / 1000) + 's');
    if (_pollInterval) clearInterval(_pollInterval);
    _pollInterval = setInterval(async function () {
      var secs = Math.round((Date.now() - t0) / 1000);
      showStat('Proc', '⏳ 3D Model ban raha hai... ' + secs + 's');
      try {
        if (_cancelRequested) return;
        var d = await (await fetch(DGX_API + '/order/' + a.id)).json();
        if (d.status === 'ready') { clearInterval(_pollInterval); _pollInterval = null; ready(a.id, d, secs); return; }
      } catch (e) {}
      if (secs > 1800) {
        clearInterval(_pollInterval); _pollInterval = null;
        try { stopProg(); } catch (e) {}
        showStat('Err', '⏳ Timeout.'); idleButtons();
      }
    }, 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resume); else resume();
})();
