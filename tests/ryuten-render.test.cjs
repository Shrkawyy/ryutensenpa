const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function load() {
  const context = vm.createContext({ console, URL, Set, Number, Array, Math });
  context.window = context;
  vm.runInContext(fs.readFileSync(path.join(root, 'ryuten/frame-codec.js'), 'utf8'), context);
  return context.OnyxRyutenFrame;
}

test('capture maps Onyx animRadius and keeps only render-safe fields', () => {
  const codec = load();
  const packet = codec.capture({
    camera: { x: 10, y: 20, zoom: 0.2 },
    bounds: { left: -100, top: -200, right: 300, bottom: 400 },
    activeTab: 2,
    server: 'Zephyr — Dual',
    cells: [{
      id: 7, x: 100, y: 200, animRadius: 40, isFood: false, isVirus: false, isEjected: false,
      isMine: true, isOwnTab: false, parentPlayerID: 12, colorObject: { r: 255, g: 10, b: 20 },
      nick: 'P1', skin: 'https://example.com/skin.png', parentPlayer: { parentClient: { tag: 'T' } },
      secretToken: 'must not escape'
    }, { id: 8, x: 0, y: 0, animRadius: 2, isFood: true, isVirus: false, isEjected: false, colorObject: {} }],
    food: []
  });
  assert.equal(packet.kind, 'onyx-ryuten-frame');
  assert.equal(packet.camera.zoom, 0.2);
  assert.equal(packet.activeTab, 2);
  assert.equal(packet.server, 'Zephyr — Dual');
  assert.equal(packet.cells[0].radius, 40);
  assert.equal(packet.cells[0].ownTab, 1);
  assert.equal('secretToken' in packet.cells[0], false);
  assert.equal(packet.cells[1].type, 4);
});

test('capture rejects missing camera and bad radius', () => {
  const codec = load();
  assert.equal(codec.capture({ camera: { x: 0, y: 0, zoom: 0 }, cells: [] }), null);
  const packet = codec.capture({ camera: { x: 0, y: 0, zoom: 1 }, cells: [{ id: 1, x: 0, y: 0, animRadius: -1 }] });
  assert.equal(packet.cells.length, 0);
});

test('page includes the bridge after the Onyx engine', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.indexOf('src="./deo.onyx.beautified.js') < html.indexOf('src="ryuten/frame-codec.js"'));
  assert.ok(html.indexOf('src="ryuten/frame-codec.js"') < html.indexOf('src="onyx-ryuten.js"'));
  const userscript = fs.readFileSync(path.join(root, 'kateronyx.user.js'), 'utf8');
  assert.ok(userscript.indexOf('injectScript(frameCodecJs') < userscript.indexOf('injectScript(ryutenJs'));
});
