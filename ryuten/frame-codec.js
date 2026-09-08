/* Shared, deterministic mapping from Onyx world objects to the renderer message. */
(function (global) {
  'use strict';
  function skinUrl(value) {
    try {
      var u = new URL(String(value || ''));
      return u.protocol === 'https:' ? u.href : '';
    } catch (_) { return ''; }
  }
  function capture(view) {
    if (!view || !view.camera || ![view.camera.x, view.camera.y, view.camera.zoom].every(Number.isFinite) || view.camera.zoom <= 0) return null;
    var cells = [], seen = new Set();
    for (var c of (view.cells || []).concat(view.food || [])) {
      if (!c || c.fadeStartTime || seen.has(c.id) || !Number.isSafeInteger(c.id) || c.id < 0) continue;
      var radius = Number(c.animRadius);
      if (![c.x, c.y, radius].every(Number.isFinite) || radius <= 0) continue;
      seen.add(c.id);
      var colour = c.colorObject || {}, player = c.parentPlayer || {};
      // Per-cell metadata prevents unrelated unknown player ids from sharing names/skins.
      cells.push({ id: c.id, x: c.x, y: c.y, radius: radius,
        type: c.isFood ? 4 : c.isVirus ? 3 : c.isEjected ? 2 : 1,
        pid: Number.isSafeInteger(c.parentPlayerID) ? c.parentPlayerID : -1,
        ownTab: c.isMine ? (c.isOwnTab === 2 ? 2 : 1) : 0,
        colour: [colour.r, colour.g, colour.b].map(function (v) { return Number.isFinite(v) ? Math.max(0, Math.min(255, v)) : 180; }),
        nick: String(c.nick || '').slice(0, 100), skin: skinUrl(c.skin),
        tag: String(player.parentClient && player.parentClient.tag || '').slice(0, 40)
      });
    }
    var bounds = view.bounds || {};
    if (![bounds.left, bounds.top, bounds.right, bounds.bottom].every(Number.isFinite) || bounds.right <= bounds.left || bounds.bottom <= bounds.top) {
      bounds = { left: -7000, top: -7000, right: 7000, bottom: 7000 };
    }
    return { kind: 'onyx-ryuten-frame', version: 1, cells: cells,
      bounds: { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom },
      camera: { x: view.camera.x, y: view.camera.y, zoom: view.camera.zoom }, activeTab: view.activeTab === 2 ? 2 : 1,
      server: String(view.server || '').slice(0, 80) };
  }
  global.OnyxRyutenFrame = { capture: capture };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.OnyxRyutenFrame;
})(typeof window !== 'undefined' ? window : globalThis);
