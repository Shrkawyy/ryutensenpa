(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var expected = params.get('parentOrigin');
  var parentOrigin = '';
  try { parentOrigin = new URL(expected || '').origin; } catch (_) { return; }
  if (!expected || expected !== parentOrigin || !/^https?:$/.test(new URL(expected).protocol)) return;

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d', { alpha: false });
  var state = { frame: null, lastFrameAt: 0, images: new Map(), imageBusy: new Set(), sentReady: false };
  var statusEl = document.getElementById('status');
  var serverName = document.getElementById('server-name');
  var serverMode = document.getElementById('server-mode');
  var errorEl = document.getElementById('error');

  function send(kind, detail) {
    if (window.parent !== window) window.parent.postMessage({ kind: kind, version: 1, detail: detail || null }, parentOrigin);
  }
  function resize() {
    var ratio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    var w = Math.max(1, Math.floor(innerWidth * ratio)), h = Math.max(1, Math.floor(innerHeight * ratio));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px'; }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function safeFrame(frame) {
    if (!frame || frame.kind !== 'onyx-ryuten-frame' || frame.version !== 1 || !Array.isArray(frame.cells) || frame.cells.length > 100000) return null;
    var c = frame.camera, b = frame.bounds;
    if (!c || !b || ![c.x,c.y,c.zoom,b.left,b.top,b.right,b.bottom].every(Number.isFinite) || c.zoom <= 0 || b.right <= b.left || b.bottom <= b.top) return null;
    return frame;
  }
  function loadSkin(url) {
    if (!url || state.images.has(url) || state.imageBusy.has(url)) return;
    state.imageBusy.add(url);
    var image = new Image(); image.crossOrigin = 'anonymous';
    image.onload = function () { state.imageBusy.delete(url); state.images.set(url, image); draw(); };
    image.onerror = function () { state.imageBusy.delete(url); state.images.set(url, null); };
    image.src = url;
  }
  function drawBackground(w, h, frame) {
    var gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#0c8190'); gradient.addColorStop(.48, '#145c76'); gradient.addColorStop(1, '#452448');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    var seed = frame ? Math.abs(Math.floor(frame.camera.x + frame.camera.y)) : 0;
    ctx.fillStyle = 'rgba(210,245,255,.48)';
    for (var i = 0; i < 75; i++) {
      var x = (i * 137 + seed * 0.23) % Math.max(1, w); var y = (i * 83 + seed * 0.11) % Math.max(1, h);
      ctx.beginPath(); ctx.arc(x, y, (i % 3) + 1, 0, Math.PI * 2); ctx.fill();
    }
  }
  function color(rgb) { return 'rgb(' + rgb.map(function (v) { return Math.round(Math.max(0, Math.min(255, Number(v) || 0))); }).join(',') + ')'; }
  function drawCell(cell, frame, w, h) {
    var zoom = Math.min(2, Math.max(.03, frame.camera.zoom));
    var x = (cell.x - frame.camera.x) * zoom + w / 2;
    var y = (cell.y - frame.camera.y) * zoom + h / 2;
    var radius = Math.max(2, Math.min(Math.max(w, h) * .65, cell.radius * zoom));
    if (x + radius < -40 || y + radius < -40 || x - radius > w + 40 || y - radius > h + 40) return;
    if (cell.skin) loadSkin(cell.skin);
    if (cell.type === 4) { ctx.fillStyle = color(cell.colour); ctx.beginPath(); ctx.arc(x, y, Math.max(2, radius), 0, Math.PI * 2); ctx.fill(); return; }
    if (cell.type === 3) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2); ctx.fillStyle = '#61dc55'; ctx.strokeStyle = '#d8ffb6'; ctx.lineWidth = Math.max(1, radius * .08); ctx.beginPath();
      for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8, r = i % 2 ? radius * .82 : radius; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); return;
    }
    var rgb = color(cell.colour), glow = ctx.createRadialGradient(x, y, radius * .45, x, y, radius * 1.25);
    glow.addColorStop(0, rgb); glow.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, radius * 1.28, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip();
    var image = cell.skin && state.images.get(cell.skin);
    if (image) { ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2); } else { ctx.fillStyle = rgb; ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = cell.ownTab ? '#fff0fb' : 'rgba(255,255,255,.72)'; ctx.lineWidth = Math.max(2, radius * .075); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
    if (cell.ownTab) { ctx.strokeStyle = cell.ownTab === 2 ? '#cb8cff' : '#ff8bd5'; ctx.lineWidth = Math.max(2, radius * .13); ctx.beginPath(); ctx.arc(x, y, radius * 1.09, 0, Math.PI * 2); ctx.stroke(); }
    if (radius > 17 && cell.nick) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 ' + Math.max(11, Math.min(23, radius * .28)) + 'px Segoe UI'; ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 4; ctx.fillText(cell.nick, x, y); ctx.shadowBlur = 0; }
  }
  function draw() {
    resize(); var w = innerWidth, h = innerHeight, frame = state.frame; drawBackground(w, h, frame);
    if (!frame) { statusEl.textContent = 'Waiting for Onyx world data…'; return; }
    var cells = frame.cells.slice().sort(function (a, b) { return b.radius - a.radius; }); cells.forEach(function (cell) { drawCell(cell, frame, w, h); });
    serverName.textContent = frame.server ? frame.server.split('—')[0].trim() : 'Senpa';
    serverMode.textContent = frame.server ? frame.server.split('—').slice(1).join('—').trim() : 'Ryuten connected view';
    statusEl.textContent = cells.length + ' objects · ' + Math.round(60) + ' FPS';
  }
  function loop() { draw(); requestAnimationFrame(loop); }
  addEventListener('resize', resize);
  addEventListener('message', function (event) {
    if (event.source !== window.parent || event.origin !== parentOrigin || !event.data) return;
    if (event.data.kind !== 'onyx-ryuten-frame') return;
    var frame = safeFrame(event.data); if (!frame) { errorEl.textContent = 'Invalid world data received'; errorEl.style.display = 'block'; send('onyx-ryuten-error', 'invalid frame'); return; }
    state.frame = frame; state.lastFrameAt = Date.now(); errorEl.style.display = 'none'; send('onyx-ryuten-ack');
  });
  send('onyx-ryuten-ready'); state.sentReady = true; resize(); loop();
})();
