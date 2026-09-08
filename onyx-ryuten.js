/* Keeps Onyx input, account/session and Senpa sockets in the parent document. */
(function (global) {
  'use strict';
  var scriptUrl = document.currentScript && document.currentScript.src;
  var base = global.__KATERONYX_BASE_URL || new URL('.', scriptUrl || location.href).href;
  var frame = null, ready = false, timer = null, watchdog = null, lastAck = 0, waiting = false;
  var frameOrigin = new URL(base, location.href).origin, button;
  var preference = 'ryuten';
  try { preference = localStorage.getItem('onyx:renderer') || 'ryuten'; } catch (_) {}
  function select(name) { preference = name; try { localStorage.setItem('onyx:renderer', name); } catch (_) {} }
  function restore(message) {
    global.__ONYX_RYUTEN_ACTIVE__ = false;
    document.documentElement.classList.remove('onyx-ryuten-active');
    ready = false; waiting = false;
    clearInterval(timer); clearInterval(watchdog);
    timer = watchdog = null;
    if (frame) { frame.remove(); frame = null; }
    if (button) { button.textContent = message || 'Onyx · Switch to Ryuten'; button.disabled = false; }
  }
  function sendFrame() {
    if (!ready || waiting || document.hidden || typeof global.__ONYX_RENDER_VIEW__ !== 'function') return;
    try {
      var packet = global.OnyxRyutenFrame.capture(global.__ONYX_RENDER_VIEW__());
      if (!packet) return;
      frame.contentWindow.postMessage(packet, frameOrigin); waiting = true;
    } catch (error) { console.error('[Ryuten renderer]', error); restore('Onyx · Retry Ryuten'); }
  }
  function start() {
    if (frame) return;
    button.textContent = 'Loading Ryuten…'; button.disabled = true;
    frame = document.createElement('iframe');
    frame.id = 'onyx-ryuten-frame'; frame.title = 'Ryuten game renderer';
    frame.tabIndex = -1; frame.setAttribute('aria-hidden', 'true');
    var url = new URL('ryuten/renderer.html', base);
    url.searchParams.set('parentOrigin', location.origin);
    url.searchParams.set('version', '1');
    frame.src = url.href;
    document.body.prepend(frame);
    lastAck = Date.now();
    watchdog = setInterval(function () {
      if (!document.hidden && Date.now() - lastAck > (ready ? 8000 : 45000)) restore('Onyx · Retry Ryuten');
    }, 1000);
  }
  global.addEventListener('message', function (event) {
    if (!frame || event.source !== frame.contentWindow || event.origin !== frameOrigin || !event.data || event.data.version !== 1) return;
    if (event.data.kind === 'onyx-ryuten-error') {
      console.error('[Ryuten renderer]', event.data.detail); restore('Onyx · Retry Ryuten');
    } else if (event.data.kind === 'onyx-ryuten-ready') {
      ready = true; lastAck = Date.now();
      global.__ONYX_RYUTEN_ACTIVE__ = true;
      document.documentElement.classList.add('onyx-ryuten-active');
      button.disabled = false; button.textContent = 'Ryuten · Switch to Onyx';
      clearInterval(timer); timer = setInterval(sendFrame, 1000 / 60);
      sendFrame();
    } else if (event.data.kind === 'onyx-ryuten-ack') {
      lastAck = Date.now(); waiting = false;
    }
  });
  global.addEventListener('pagehide', function () { restore(); });
  function boot() {
    if (document.getElementById('onyx-renderer-toggle')) return;
    var style = document.createElement('style');
    style.textContent = '#onyx-ryuten-frame{display:block!important;position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2;pointer-events:none;visibility:hidden}' +
      '.onyx-ryuten-active #onyx-ryuten-frame{visibility:visible}.onyx-ryuten-active #canvas{opacity:0!important}' +
      '#onyx-renderer-toggle{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:250;padding:8px 14px;border:1px solid #4b6071;border-radius:5px;background:#13202e;color:white;font:14px system-ui;cursor:pointer}';
    document.head.appendChild(style);
    button = document.createElement('button'); button.id = 'onyx-renderer-toggle'; button.type = 'button';
    button.textContent = 'Onyx · Switch to Ryuten';
    button.addEventListener('click', function () {
      if (ready) { select('onyx'); restore(); }
      else { select('ryuten'); start(); }
      button.blur();
    });
    document.body.appendChild(button);
    if (preference !== 'onyx') start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})(window);
