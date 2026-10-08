import './style.css';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import '@capgo/capacitor-transitions';
import {
  initCapTransitions,
  detectPlatform,
  detectNativePlatform,
  supportsViewTransitions,
} from '@capgo/capacitor-transitions';

initCapTransitions();

const DEMO_ITEMS = [
  { id: 'alpha', label: 'Alpha screen', subtitle: 'Forward transition' },
  { id: 'beta', label: 'Beta screen', subtitle: 'Try different easing' },
  { id: 'gamma', label: 'Gamma screen', subtitle: 'Open nested view' },
];

const state = {
  platform: 'auto',
  duration: 540,
  easing: 'ios',
  swipeGesture: 'auto',
  useViewTransitions: false,
  navAction: 'forward',
  navDirection: 'forward',
  route: 'home',
  routeParam: null,
};

const logs = [];
const maxLogs = 80;

function getOutlet() {
  return document.getElementById('outlet');
}

function logLine(message, level = 'info') {
  const entry = `[${new Date().toLocaleTimeString()}] ${message}`;
  logs.unshift({ entry, level });
  if (logs.length > maxLogs) logs.pop();
  document.querySelectorAll('[data-log-output]').forEach((el) => {
    el.textContent = logs.map((l) => l.entry).join('\n');
  });
}

function transitionConfig() {
  return {
    duration: state.duration,
    easing: state.easing,
    direction: state.navDirection,
    useViewTransitions: state.useViewTransitions,
  };
}

function applyOutletSettings() {
  const outlet = getOutlet();
  if (!outlet) return;
  outlet.setAttribute('platform', state.platform);
  outlet.setAttribute('duration', String(state.duration));
  outlet.setSwipeGesture(state.swipeGesture);
  outlet.getController().configure({
    platform: state.platform,
    duration: state.duration,
    easing: state.easing,
    useViewTransitions: state.useViewTransitions,
  });
}

function bindPageLifecycle(page, name) {
  const handlers = {
    'cap-will-enter': () => logLine(`${name}: will enter`),
    'cap-did-enter': () => logLine(`${name}: did enter`),
    'cap-will-leave': () => logLine(`${name}: will leave`),
    'cap-did-leave': () => logLine(`${name}: did leave`),
  };
  Object.entries(handlers).forEach(([event, fn]) => page.addEventListener(event, fn));
}

function chip(label, value, tone = 'neutral') {
  return `<span class="chip chip-${tone}" title="${label}"><span class="chip-label">${label}</span><span class="chip-value">${value}</span></span>`;
}

function statusChips() {
  const outlet = getOutlet();
  const controller = outlet?.getController();
  const native = detectNativePlatform();
  return [
    chip('Platform', detectPlatform()),
    chip('Native', native.platform),
    chip('Stack', outlet?.stackLength ?? 0),
    chip('Back', outlet?.canGoBack ? 'yes' : 'no'),
    chip('Animating', controller?.animating ? 'yes' : 'no'),
    chip('ViewTrans', supportsViewTransitions() ? 'yes' : 'no'),
  ].join('');
}

function controlsCard() {
  return `
    <section class="card">
      <h2 class="card-title">Transition settings</h2>
      <div class="field-grid">
        <label class="field">
          <span>Platform style</span>
          <select data-setting="platform">
            <option value="auto">auto</option>
            <option value="ios">ios</option>
            <option value="android">android</option>
          </select>
        </label>
        <label class="field">
          <span>Duration (ms)</span>
          <input type="number" data-setting="duration" min="0" max="2000" step="10" value="${state.duration}" />
        </label>
        <label class="field">
          <span>Easing</span>
          <select data-setting="easing">
            <option value="ios">ios</option>
            <option value="android">android</option>
            <option value="ease-out">ease-out</option>
            <option value="ease-in-out">ease-in-out</option>
            <option value="linear">linear</option>
          </select>
        </label>
        <label class="field">
          <span>Swipe back</span>
          <select data-setting="swipeGesture">
            <option value="auto">auto</option>
            <option value="true">enabled</option>
            <option value="false">disabled</option>
          </select>
        </label>
        <label class="field">
          <span>Next nav action</span>
          <select data-setting="navAction">
            <option value="forward">forward</option>
            <option value="back">back</option>
            <option value="root">root</option>
            <option value="none">none</option>
          </select>
        </label>
        <label class="field">
          <span>Next direction</span>
          <select data-setting="navDirection">
            <option value="forward">forward</option>
            <option value="back">back</option>
            <option value="root">root</option>
            <option value="none">none</option>
          </select>
        </label>
      </div>
      <label class="checkbox-row">
        <input type="checkbox" data-setting="useViewTransitions" ${state.useViewTransitions ? 'checked' : ''} />
        <span>Use View Transitions API when available</span>
      </label>
      <div class="actions-row">
        <button type="button" class="btn secondary" data-action="apply-settings">Apply to outlet</button>
        <button type="button" class="btn secondary" data-action="probe-api">Probe plugin API</button>
      </div>
    </section>
  `;
}

function homeContent() {
  const list = DEMO_ITEMS
    .map(
      (item) => `
      <button type="button" class="list-item" data-nav="details" data-id="${item.id}">
        <div>
          <div class="list-title">${item.label}</div>
          <div class="list-sub">${item.subtitle}</div>
        </div>
        <span class="chevron" aria-hidden="true">›</span>
      </button>`,
    )
    .join('');

  return `
    <div class="page-inner">
      <div class="chip-row" data-status-chips>${statusChips()}</div>
      ${controlsCard()}
      <section class="card">
        <h2 class="card-title">Navigate with transitions</h2>
        <p class="card-hint">Pick settings above, then open a screen. Use back or swipe from the left edge on supported platforms.</p>
        <div class="list">${list}</div>
      </section>
      <section class="card">
        <h2 class="card-title">Stack controls</h2>
        <div class="actions-row">
          <button type="button" class="btn" data-action="pop-stack">Pop (outlet.pop)</button>
          <button type="button" class="btn secondary" data-action="go-root">Reset stack (setRoot)</button>
        </div>
      </section>
      <section class="card log-card">
        <div class="log-header">
          <h2 class="card-title">Event log</h2>
          <button type="button" class="btn text" data-action="clear-log">Clear</button>
        </div>
        <pre class="log-output" data-log-output>${logs.map((l) => l.entry).join('\n')}</pre>
      </section>
    </div>
  `;
}

function detailsContent(id) {
  return `
    <div class="page-inner">
      <div class="chip-row" data-status-chips>${statusChips()}</div>
      <section class="card hero-card">
        <h2 class="hero-title">Details</h2>
        <p class="card-hint">You opened <strong>${id}</strong>. Transitions use your duration, easing, and platform settings from home.</p>
        <button type="button" class="btn" data-nav="nested" data-id="${id}">Go nested</button>
      </section>
      <section class="card">
        <h2 class="card-title">Scroll sample</h2>
        ${Array.from({ length: 12 }, (_, i) => `<p class="scroll-line">Line ${i + 1} keeps the content scrollable inside cap-content.</p>`).join('')}
      </section>
    </div>
  `;
}

function nestedContent(id) {
  return `
    <div class="page-inner">
      <div class="chip-row" data-status-chips>${statusChips()}</div>
      <section class="card hero-card">
        <h2 class="hero-title">Nested</h2>
        <p class="card-hint">Third level for item <strong>${id}</strong>. Back uses outlet.pop with a back animation.</p>
      </section>
    </div>
  `;
}

function pageToolbar(title, showBack) {
  const back = showBack
    ? `<button type="button" class="back-button" data-action="back" aria-label="Go back">‹ Back</button>`
    : '';
  return `
    <cap-header slot="header">
      <div class="toolbar ${showBack ? 'has-back' : ''}">
        ${back}
        <h1>${title}</h1>
      </div>
    </cap-header>
  `;
}

function buildPage(route, param) {
  const key = param ? `${route}-${param}` : route;
  let title = 'Home';
  let body = homeContent();
  let showBack = false;

  if (route === 'details') {
    title = `Details ${param}`;
    body = detailsContent(param);
    showBack = true;
  } else if (route === 'nested') {
    title = `Nested ${param}`;
    body = nestedContent(param);
    showBack = true;
  }

  const page = document.createElement('cap-page');
  page.setAttribute('key', key);
  page.innerHTML = `
    ${pageToolbar(title, showBack)}
    <cap-content slot="content">${body}</cap-content>
    <cap-footer slot="footer">
      <div class="tab-bar">
        <span class="tab ${route === 'home' ? 'active' : ''}">Home</span>
        <span class="tab">Transitions</span>
        <span class="tab">Log</span>
      </div>
    </cap-footer>
  `;
  bindPageLifecycle(page, title);
  wirePage(page);
  return page;
}

function refreshStatusChips() {
  document.querySelectorAll('[data-status-chips]').forEach((el) => {
    el.innerHTML = statusChips();
  });
}

function readSettingsFromDom(root = document) {
  const platform = root.querySelector('[data-setting="platform"]');
  if (platform) state.platform = platform.value;
  const duration = root.querySelector('[data-setting="duration"]');
  if (duration) state.duration = Number(duration.value) || 0;
  const easing = root.querySelector('[data-setting="easing"]');
  if (easing) state.easing = easing.value;
  const swipe = root.querySelector('[data-setting="swipeGesture"]');
  if (swipe) state.swipeGesture = swipe.value === 'true' ? true : swipe.value === 'false' ? false : 'auto';
  const navAction = root.querySelector('[data-setting="navAction"]');
  if (navAction) state.navAction = navAction.value;
  const navDirection = root.querySelector('[data-setting="navDirection"]');
  if (navDirection) state.navDirection = navDirection.value;
  const vt = root.querySelector('[data-setting="useViewTransitions"]');
  if (vt) state.useViewTransitions = vt.checked;
}

function syncSettingsToDom(root) {
  const setVal = (sel, val) => {
    const el = root.querySelector(`[data-setting="${sel}"]`);
    if (el) el.value = String(val);
  };
  setVal('platform', state.platform);
  setVal('duration', state.duration);
  setVal('easing', state.easing);
  setVal('swipeGesture', state.swipeGesture === true ? 'true' : state.swipeGesture === false ? 'false' : 'auto');
  setVal('navAction', state.navAction);
  setVal('navDirection', state.navDirection);
  const vt = root.querySelector('[data-setting="useViewTransitions"]');
  if (vt) vt.checked = state.useViewTransitions;
}

function hashForRoute(route, param) {
  if (route === 'home') return '#/';
  if (route === 'details') return `#/details/${param}`;
  return `#/nested/${param}`;
}

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const parts = raw.split('/').filter(Boolean);
  if (parts.length === 0) return { route: 'home', param: null };
  if (parts[0] === 'details' && parts[1]) return { route: 'details', param: parts[1] };
  if (parts[0] === 'nested' && parts[1]) return { route: 'nested', param: parts[1] };
  return { route: 'home', param: null };
}

function routeDepth(route) {
  if (route === 'nested') return 2;
  if (route === 'details') return 1;
  return 0;
}

function parsePageKey(key) {
  if (!key || key === 'home') return { route: 'home', param: null };
  const [route, ...rest] = key.split('-');
  const param = rest.join('-') || null;
  if (route === 'details' || route === 'nested') return { route, param };
  return { route: 'home', param: null };
}

function syncRouteFromStack() {
  const outlet = getOutlet();
  const current = outlet?.getController()?.currentPage;
  if (!current?.element) {
    state.route = 'home';
    state.routeParam = null;
    return;
  }
  const parsed = parsePageKey(current.element.getAttribute('key'));
  state.route = parsed.route;
  state.routeParam = parsed.param;
}

function getActivePageElement() {
  const outlet = getOutlet();
  const current = outlet?.getController()?.currentPage?.element;
  if (current) return current;
  const pages = outlet?.querySelectorAll('cap-page');
  return pages?.length ? pages[pages.length - 1] : outlet;
}

function updateHistory(route, param, { replace = false } = {}) {
  const url = hashForRoute(route, param);
  const data = { route, param };
  if (replace) {
    window.history.replaceState(data, '', url);
  } else {
    window.history.pushState(data, '', url);
  }
}

async function popSteps(count) {
  const outlet = getOutlet();
  for (let i = 0; i < count; i += 1) {
    if (outlet.stackLength <= 1) break;
    outlet.setNavigation('back', 'back');
    await outlet.pop({ ...transitionConfig(), direction: 'back' });
  }
  syncRouteFromStack();
}

async function navigateTo(route, param, { useHistory = true, historyMode = 'push' } = {}) {
  const outlet = getOutlet();
  const settingsRoot = getActivePageElement();
  readSettingsFromDom(settingsRoot);
  applyOutletSettings();

  syncRouteFromStack();

  if (route === state.route && param === state.routeParam) {
    refreshStatusChips();
    return;
  }

  const currentDepth = routeDepth(state.route);
  const targetDepth = routeDepth(route);

  if (targetDepth < currentDepth && outlet.stackLength > 1) {
    const pops = currentDepth - targetDepth;
    await popSteps(pops);
    if (useHistory) {
      updateHistory(state.route, state.routeParam, { replace: historyMode === 'replace' });
    }
    logLine(`Navigated back to ${state.route}${state.routeParam ? ` (${state.routeParam})` : ''}`);
    refreshStatusChips();
    return;
  }

  if (route === 'home' && outlet.stackLength > 1 && targetDepth === 0) {
    outlet.setNavigation('root', 'root');
    const home = buildPage('home', null);
    await outlet.setRoot(home, { ...transitionConfig(), direction: 'root' });
    state.route = 'home';
    state.routeParam = null;
    if (useHistory) updateHistory('home', null, { replace: historyMode === 'replace' });
    logLine('setRoot to home');
    refreshStatusChips();
    return;
  }

  outlet.setNavigation(state.navAction, state.navDirection);
  const page = buildPage(route, param);
  outlet.appendChild(page);
  state.route = route;
  state.routeParam = param;
  if (useHistory) updateHistory(route, param, { replace: historyMode === 'replace' });
  logLine(`Forward to ${route}${param ? ` (${param})` : ''}`);
  refreshStatusChips();
}

function wirePage(page) {
  syncSettingsToDom(page);

  page.querySelectorAll('[data-setting]').forEach((el) => {
    el.addEventListener('change', () => {
      readSettingsFromDom(page);
      applyOutletSettings();
      refreshStatusChips();
    });
  });

  page.querySelector('[data-action="apply-settings"]')?.addEventListener('click', () => {
    readSettingsFromDom(page);
    applyOutletSettings();
    logLine('Applied outlet settings');
    refreshStatusChips();
  });

  page.querySelector('[data-action="probe-api"]')?.addEventListener('click', () => {
    const outlet = getOutlet();
    const ctrl = outlet.getController();
    logLine(`detectPlatform: ${detectPlatform()}`);
    logLine(`detectNativePlatform: ${JSON.stringify(detectNativePlatform())}`);
    logLine(`supportsViewTransitions: ${supportsViewTransitions()}`);
    logLine(`stackLength: ${outlet.stackLength}, canGoBack: ${outlet.canGoBack}`);
    logLine(`controller.platform: ${ctrl.platform}, animating: ${ctrl.animating}`);
    refreshStatusChips();
  });

  page.querySelector('[data-action="pop-stack"]')?.addEventListener('click', async () => {
    const outlet = getOutlet();
    if (outlet.stackLength <= 1) {
      logLine('pop skipped: already at root');
      refreshStatusChips();
      return;
    }
    await popSteps(1);
    updateHistory(state.route, state.routeParam, { replace: true });
    logLine('pop completed');
    refreshStatusChips();
  });

  page.querySelector('[data-action="go-root"]')?.addEventListener('click', async () => {
    await navigateTo('home', null);
  });

  page.querySelector('[data-action="clear-log"]')?.addEventListener('click', () => {
    logs.length = 0;
    page.querySelector('[data-log-output]').textContent = '';
  });

  page.querySelector('[data-action="back"]')?.addEventListener('click', () => {
    if (state.route !== 'home') window.history.back();
  });

  page.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const target = btn.getAttribute('data-nav');
      const id = btn.getAttribute('data-id');
      if (target === 'details') await navigateTo('details', id);
      if (target === 'nested') await navigateTo('nested', id);
    });
  });
}

function boot() {
  const outlet = getOutlet();
  applyOutletSettings();
  const home = buildPage('home', null);
  outlet.appendChild(home);
  state.route = 'home';

  window.history.replaceState({ route: 'home', param: null }, '', hashForRoute('home', null));

  window.addEventListener('popstate', async () => {
    const { route, param } = parseHash();
    await navigateTo(route, param, { useHistory: false });
  });

  logLine(`Boot complete. Resolved platform: ${detectPlatform()}`);
  refreshStatusChips();

  if (Capacitor.isNativePlatform()) {
    CapacitorUpdater.notifyAppReady().catch((error) => {
      logLine(`notifyAppReady failed: ${error}`, 'error');
    });
  }
}

boot();
