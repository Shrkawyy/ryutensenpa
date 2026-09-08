/*
 * JAX-V5 Bot Control Panel
 *
 * UI/controls for the bot handler already created by bundle.js.
 * This file intentionally does not change the game server URL or the
 * onyx-ffa-adapter userscript.
 */
(function () {
  'use strict';

  if (window.__jaxBotPanelLoaded) return;
  window.__jaxBotPanelLoaded = true;

  var state = {
    open: false,
    autoSplit: false,
    autoSpawn: false,
    requestedCount: 5,
    connecting: false,
    session: 0
  };

  var ui = null;

  function handler() {
    return window.app && window.app.botHandler ? window.app.botHandler : null;
  }

  function bots() {
    var h = handler();
    return h && Array.isArray(h.bots) ? h.bots : [];
  }

  function isEditable(target) {
    if (!target) return false;
    var tag = String(target.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
      target.isContentEditable === true;
  }

  function safeNumber(value, fallback, min, max) {
    var n = parseInt(value, 10);
    if (!isFinite(n)) n = fallback;
    return Math.max(min, Math.min(max, n));
  }

  function emit(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    } catch (_) {}
  }

  function serverLabel() {
    var url = window.app && window.app.player && window.app.player.serverUrl;
    if (!url) return 'No server selected';
    try { return new URL(url).host; } catch (_) { return url; }
  }

  function injectStyles() {
    if (document.getElementById('jax-bot-panel-styles')) return;
    var style = document.createElement('style');
    style.id = 'jax-bot-panel-styles';
    style.textContent = [
      '.bot-hud { display: none !important; }',
      '.jax-bot-panel {',
      '  position: fixed;',
      '  top: 16px;',
      '  left: 16px;',
      '  z-index: 2147483000;',
      '  width: 278px;',
      '  display: none;',
      '  box-sizing: border-box;',
      '  padding: 13px;',
      '  color: #eafcff;',
      '  background: linear-gradient(145deg, rgba(13, 24, 34, .97), rgba(5, 10, 16, .96));',
      '  border: 1px solid rgba(79, 236, 255, .32);',
      '  border-radius: 10px;',
      '  box-shadow: 0 12px 38px rgba(0, 0, 0, .45), 0 0 22px rgba(0, 185, 232, .08);',
      '  font-family: "Titillium Web", Arial, sans-serif;',
      '  user-select: none;',
      '  pointer-events: auto;',
    '}',
      '.jax-bot-panel.jax-visible { display: block; }',
      '.jax-bot-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }',
      '.jax-bot-title { color: #4fecff; font-size: 17px; letter-spacing: 1.2px; line-height: 1; font-weight: 600; }',
      '.jax-bot-subtitle { margin-top: 4px; color: rgba(234, 252, 255, .52); font-size: 10px; letter-spacing: .7px; text-transform: uppercase; }',
      '.jax-bot-close { width: 25px; height: 25px; padding: 0; border: 0; border-radius: 5px; color: #9eb9c0; background: rgba(255,255,255,.06); cursor: pointer; font-size: 18px; line-height: 22px; }',
      '.jax-bot-close:hover { color: #fff; background: rgba(255, 68, 68, .28); }',
      '.jax-bot-status { display: flex; align-items: center; gap: 7px; min-height: 25px; margin-bottom: 9px; padding: 6px 8px; border: 1px solid rgba(255,255,255,.08); border-radius: 6px; background: rgba(255,255,255,.035); color: #a8bdc2; font-size: 12px; }',
      '.jax-bot-status-dot { width: 8px; height: 8px; flex: 0 0 8px; border-radius: 50%; background: #89959a; box-shadow: 0 0 0 transparent; }',
      '.jax-bot-status[data-tone="good"] .jax-bot-status-dot { background: #00ff88; box-shadow: 0 0 10px rgba(0,255,136,.65); }',
      '.jax-bot-status[data-tone="busy"] .jax-bot-status-dot { background: #4fecff; box-shadow: 0 0 10px rgba(79,236,255,.65); animation: jax-bot-pulse 1.1s ease-in-out infinite; }',
      '.jax-bot-status[data-tone="bad"] .jax-bot-status-dot { background: #ff5353; box-shadow: 0 0 10px rgba(255,83,83,.45); }',
      '@keyframes jax-bot-pulse { 50% { opacity: .35; } }',
      '.jax-bot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 9px; }',
      '.jax-bot-field { display: flex; flex-direction: column; gap: 3px; min-width: 0; }',
      '.jax-bot-field label { color: rgba(234,252,255,.62); font-size: 10px; letter-spacing: .7px; text-transform: uppercase; }',
      '.jax-bot-field input { width: 100%; height: 30px; box-sizing: border-box; padding: 4px 8px; outline: none; color: #fff; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.15); border-radius: 5px; font: 13px "Titillium Web", Arial, sans-serif; }',
      '.jax-bot-field input:focus { border-color: rgba(79,236,255,.75); box-shadow: 0 0 0 2px rgba(79,236,255,.1); }',
      '.jax-bot-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 10px; }',
      '.jax-bot-btn { min-height: 32px; padding: 5px 8px; border: 1px solid rgba(79,236,255,.38); border-radius: 5px; color: #4fecff; background: rgba(79,236,255,.12); cursor: pointer; font: 600 12px "Titillium Web", Arial, sans-serif; letter-spacing: .35px; transition: background .15s, transform .1s, border-color .15s; }',
      '.jax-bot-btn:hover { background: rgba(79,236,255,.24); border-color: rgba(79,236,255,.72); }',
      '.jax-bot-btn:active { transform: translateY(1px); }',
      '.jax-bot-btn:disabled { opacity: .45; cursor: not-allowed; }',
      '.jax-bot-btn.jax-danger { color: #ff8585; border-color: rgba(255,83,83,.35); background: rgba(255,83,83,.09); }',
      '.jax-bot-btn.jax-danger:hover { background: rgba(255,83,83,.2); border-color: rgba(255,83,83,.65); }',
      '.jax-bot-toggle { display: flex; align-items: center; justify-content: space-between; min-height: 32px; margin-top: 7px; padding: 0 8px; border-radius: 5px; background: rgba(255,255,255,.045); color: #d6e5e8; font-size: 13px; cursor: pointer; }',
      '.jax-bot-toggle:hover { background: rgba(255,255,255,.08); }',
      '.jax-bot-toggle input { width: 16px; height: 16px; margin: 0; accent-color: #4fecff; cursor: pointer; }',
      '.jax-bot-stats { display: flex; gap: 6px; margin-top: 10px; }',
      '.jax-bot-stat { flex: 1; padding: 5px 4px; text-align: center; border-radius: 5px; background: rgba(255,255,255,.035); color: #95adb2; font-size: 10px; text-transform: uppercase; letter-spacing: .45px; }',
      '.jax-bot-stat strong { display: block; margin-top: 1px; color: #fff; font-size: 15px; font-weight: 600; letter-spacing: 0; }',
      '.jax-bot-server { overflow: hidden; margin-top: 9px; color: rgba(234,252,255,.42); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }',
      '.jax-bot-help { margin-top: 7px; color: rgba(234,252,255,.34); font-size: 10px; }',
      '@media (max-width: 480px) { .jax-bot-panel { top: 9px; left: 9px; width: min(278px, calc(100vw - 18px)); } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function createPanel() {
    if (document.getElementById('jax-bot-panel')) return document.getElementById('jax-bot-panel');

    var panel = document.createElement('section');
    panel.id = 'jax-bot-panel';
    panel.className = 'jax-bot-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = [
      '<div class="jax-bot-head">',
      '  <div><div class="jax-bot-title">BOT CONTROL</div><div class="jax-bot-subtitle">MEGASPLIT / WINDBINE</div></div>',
      '  <button class="jax-bot-close" type="button" title="Close">×</button>',
      '</div>',
      '<div class="jax-bot-status" data-tone="neutral"><span class="jax-bot-status-dot"></span><span class="jax-bot-status-text">Waiting for bot engine</span></div>',
      '<div class="jax-bot-grid">',
      '  <div class="jax-bot-field"><label for="jax-bot-count">Bots</label><input id="jax-bot-count" type="number" min="1" max="50" step="1" value="5" inputmode="numeric"></div>',
      '  <div class="jax-bot-field"><label for="jax-bot-prefix">Name prefix</label><input id="jax-bot-prefix" type="text" maxlength="20" value="WindBot" autocomplete="off"></div>',
      '</div>',
      '<div class="jax-bot-actions">',
      '  <button class="jax-bot-btn" id="jax-bot-connect" type="button">CONNECT BOTS</button>',
      '  <button class="jax-bot-btn jax-danger" id="jax-bot-disconnect" type="button">DISCONNECT</button>',
      '</div>',
      '<label class="jax-bot-toggle"><span>Auto Split</span><input id="jax-bot-auto-split" type="checkbox"></label>',
      '<label class="jax-bot-toggle"><span>Auto Spawn</span><input id="jax-bot-auto-spawn" type="checkbox"></label>',
      '<div class="jax-bot-stats">',
      '  <div class="jax-bot-stat">Total<strong id="jax-bot-total">0</strong></div>',
      '  <div class="jax-bot-stat">Connected<strong id="jax-bot-connected">0</strong></div>',
      '  <div class="jax-bot-stat">Alive<strong id="jax-bot-alive">0</strong></div>',
      '</div>',
      '<div class="jax-bot-server" id="jax-bot-server">Server: waiting...</div>',
      '<div class="jax-bot-help">Double-press Shift to show/hide</div>'
    ].join('');

    document.body.appendChild(panel);
    ui = {
      panel: panel,
      close: panel.querySelector('.jax-bot-close'),
      status: panel.querySelector('.jax-bot-status'),
      statusText: panel.querySelector('.jax-bot-status-text'),
      count: panel.querySelector('#jax-bot-count'),
      prefix: panel.querySelector('#jax-bot-prefix'),
      connect: panel.querySelector('#jax-bot-connect'),
      disconnect: panel.querySelector('#jax-bot-disconnect'),
      autoSplit: panel.querySelector('#jax-bot-auto-split'),
      autoSpawn: panel.querySelector('#jax-bot-auto-spawn'),
      total: panel.querySelector('#jax-bot-total'),
      connected: panel.querySelector('#jax-bot-connected'),
      alive: panel.querySelector('#jax-bot-alive'),
      server: panel.querySelector('#jax-bot-server')
    };

    ['mousedown', 'mouseup', 'mousemove', 'click', 'keydown', 'keyup', 'wheel', 'touchstart', 'touchmove', 'touchend'].forEach(function (eventName) {
      panel.addEventListener(eventName, function (event) { event.stopPropagation(); });
    });

    ui.close.addEventListener('click', function () { setOpen(false); });
    ui.connect.addEventListener('click', connectBots);
    ui.disconnect.addEventListener('click', disconnectBots);
    ui.autoSplit.addEventListener('change', function () {
      state.autoSplit = !!ui.autoSplit.checked;
      var h = handler();
      if (h) h.autoSplitter = state.autoSplit;
      emit('jax:bot-auto-split', { enabled: state.autoSplit });
      refresh();
    });
    ui.autoSpawn.addEventListener('change', function () {
      state.autoSpawn = !!ui.autoSpawn.checked;
      var h = handler();
      if (h) h.autoRespawn = state.autoSpawn;
      emit('jax:bot-auto-spawn', { enabled: state.autoSpawn });
      refresh();
    });
    ui.count.addEventListener('change', function () {
      ui.count.value = safeNumber(ui.count.value, 5, 1, 50);
    });

    return panel;
  }

  function setStatus(text, tone) {
    if (!ui) return;
    ui.statusText.textContent = text;
    ui.status.setAttribute('data-tone', tone || 'neutral');
  }

  function setOpen(open) {
    state.open = !!open;
    if (!ui) return;
    ui.panel.classList.toggle('jax-visible', state.open);
    ui.panel.setAttribute('aria-hidden', state.open ? 'false' : 'true');
    if (state.open) refresh();
    emit('jax:bot-panel-toggle', { open: state.open });
  }

  function togglePanel() {
    setOpen(!state.open);
  }

  function disconnectBots() {
    var h = handler();
    state.session += 1;
    state.connecting = false;
    if (h) {
      var current = Array.isArray(h.bots) ? h.bots.slice() : [];
      current.forEach(function (bot) {
        try { if (bot && typeof bot.close === 'function') bot.close(); } catch (_) {}
      });
      if (Array.isArray(h.bots)) h.bots.length = 0;
      if (h.activeBots && typeof h.activeBots.clear === 'function') h.activeBots.clear();
      h.botCount = 0;
      h.autoSplitter = false;
      h.autoRespawn = false;
    }
    state.autoSplit = false;
    state.autoSpawn = false;
    if (ui) {
      ui.autoSplit.checked = false;
      ui.autoSpawn.checked = false;
    }
    emit('jax:bot-disconnect', {});
    setStatus('Bots disconnected', 'neutral');
    refresh();
  }

  function connectBots() {
    var h = handler();
    if (!h || typeof h.addBot !== 'function') {
      setStatus('Bot engine is not ready', 'bad');
      return;
    }

    var count = safeNumber(ui && ui.count ? ui.count.value : state.requestedCount, 5, 1, 50);
    var prefix = ui && ui.prefix ? String(ui.prefix.value || '').trim() : 'WindBot';
    if (!prefix) prefix = 'WindBot';
    state.requestedCount = count;
    if (bots().length) disconnectBots();
    state.session += 1;
    var session = state.session;
    state.connecting = true;
    setStatus('Connecting 0/' + count + '...', 'busy');
    emit('jax:bot-connect', { count: count, prefix: prefix, server: serverLabel() });

    function addNext(index) {
      if (session !== state.session) return;
      if (index >= count) {
        state.connecting = false;
        refresh();
        return;
      }
      try {
        h.botNickname = prefix + '-' + (index + 1);
        h.addBot();
      } catch (_) {
        setStatus('Could not start bot ' + (index + 1), 'bad');
      }
      refresh();
      window.setTimeout(function () { addNext(index + 1); }, 250);
    }

    addNext(0);
  }

  function autoSpawnTick() {
    if (!state.autoSpawn) return;
    bots().forEach(function (bot) {
      if (!bot || !bot.isConnected || !bot.clientReady || !bot.isDead || typeof bot.sendSpawn !== 'function') return;
      var now = Date.now();
      if (bot.__jaxSpawnPending || now - (bot.__jaxLastSpawn || 0) < 1600) return;
      bot.__jaxSpawnPending = true;
      bot.__jaxLastSpawn = now;
      try { bot.sendSpawn(); } catch (_) {}
      window.setTimeout(function () { bot.__jaxSpawnPending = false; }, 1300);
    });
  }

  function refresh() {
    if (!ui) return;
    var list = bots();
    var connected = list.filter(function (bot) { return !!(bot && bot.isConnected); }).length;
    var alive = list.filter(function (bot) { return !!(bot && bot.isAlive); }).length;
    ui.total.textContent = String(list.length);
    ui.connected.textContent = String(connected);
    ui.alive.textContent = String(alive);
    ui.server.textContent = 'Server: ' + serverLabel();
    ui.disconnect.disabled = list.length === 0;

    if (!list.length) {
      if (!state.connecting) setStatus('Ready — no bots connected', 'neutral');
    } else if (connected === list.length) {
      setStatus('Connected ' + connected + '/' + list.length, 'good');
    } else {
      setStatus('Connecting ' + connected + '/' + list.length + '...', 'busy');
    }
  }

  function bindHotkey() {
    var lastShift = 0;
    document.addEventListener('keydown', function (event) {
      if (event.repeat || isEditable(event.target)) return;
      if (event.key !== 'Shift' && event.code !== 'ShiftLeft' && event.code !== 'ShiftRight') return;
      var now = Date.now();
      if (now - lastShift <= 360) {
        lastShift = 0;
        event.preventDefault();
        event.stopPropagation();
        togglePanel();
      } else {
        lastShift = now;
      }
    }, true);

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !state.open) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }, true);
  }

  function init() {
    injectStyles();
    createPanel();
    bindHotkey();
    window.setInterval(function () {
      autoSpawnTick();
      refresh();
    }, 300);
    refresh();
  }

  window.JaxBotPanel = {
    open: function () { setOpen(true); },
    close: function () { setOpen(false); },
    toggle: togglePanel,
    connect: connectBots,
    disconnect: disconnectBots,
    getState: function () {
      return {
        open: state.open,
        autoSplit: state.autoSplit,
        autoSpawn: state.autoSpawn,
        total: bots().length,
        server: serverLabel()
      };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
