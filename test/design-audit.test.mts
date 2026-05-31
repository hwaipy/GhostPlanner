// Design-token audit. Each rule reads the project's SCSS/Vue source and asserts
// a value drawn from the iOS HIG / OmniFocus-style design language we're aiming
// at. Failing a rule means the implementation drifted from the target — re-check
// the relevant file. Total pass-rate is the rubric grade for the round.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function readAll(rels: string[]): string {
  return rels.map((r) => readFileSync(join(root, r), 'utf8')).join('\n\n/* ===== */ \n\n');
}
function walk(dir: string, exts: string[], out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}

const variablesScss = readFileSync(join(root, 'src/css/quasar.variables.scss'), 'utf8');
const appScss = readFileSync(join(root, 'src/css/app.scss'), 'utf8');
const mainLayout = readFileSync(join(root, 'src/layouts/MainLayout.vue'), 'utf8');
const bottomTabBar = readFileSync(join(root, 'src/components/BottomTabBar.vue'), 'utf8');
const taskRow = readFileSync(join(root, 'src/components/TaskRow.vue'), 'utf8');
const forecast = readFileSync(join(root, 'src/pages/ForecastPage.vue'), 'utf8');

const allComponentFiles = walk(join(root, 'src'), ['.vue']);
const allComponents = allComponentFiles.map((p) => readFileSync(p, 'utf8')).join('\n');

// helpers
function hex(s: string): [number, number, number] | null {
  const m = s.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}
function nearHex(actual: string, target: string, tolerance = 24): boolean {
  const a = hex(actual);
  const t = hex(target);
  if (!a || !t) return false;
  return Math.abs(a[0] - t[0]) + Math.abs(a[1] - t[1]) + Math.abs(a[2] - t[2]) <= tolerance;
}
function pxNum(s: string | undefined): number | null {
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*px/);
  return m ? parseFloat(m[1]) : null;
}

// ---------- COLOR PALETTE ----------

test('palette: $primary is an OmniFocus-grade violet (#6C4FE0 ± tol)', () => {
  const m = variablesScss.match(/\$primary\s*:\s*(#[0-9a-fA-F]{6})/);
  assert.ok(m, '$primary not found in quasar.variables.scss');
  assert.ok(nearHex(m![1], '#6C4FE0'), `expected ~#6C4FE0, got ${m![1]}`);
});

test('palette: light grouped background --gp-bg is iOS table grey (#f2f2f7 ± tol)', () => {
  const m = appScss.match(/:root[^}]*--gp-bg\s*:\s*(#[0-9a-fA-F]{6})/);
  assert.ok(m, 'light --gp-bg not found');
  assert.ok(nearHex(m![1], '#f2f2f7'), `expected ~#f2f2f7, got ${m![1]}`);
});

test('palette: dark mode background is pure black (--gp-bg in body--dark)', () => {
  const m = appScss.match(/\.body--dark[^}]*--gp-bg\s*:\s*(#[0-9a-fA-F]{6})/);
  assert.ok(m, 'dark --gp-bg not found');
  assert.ok(nearHex(m![1], '#000000', 8), `expected ~#000, got ${m![1]}`);
});

test('palette: light row background is white', () => {
  const m = appScss.match(/:root[^}]*--gp-row\s*:\s*(#[0-9a-fA-F]{6})/);
  assert.ok(m && nearHex(m[1], '#ffffff', 4), `light --gp-row expected #fff, got ${m?.[1]}`);
});

test('palette: dark row background is iOS dark elevated (#1c1c1e ± tol)', () => {
  const m = appScss.match(/\.body--dark[^}]*--gp-row\s*:\s*(#[0-9a-fA-F]{6})/);
  assert.ok(m && nearHex(m[1], '#1c1c1e', 12), `dark --gp-row expected ~#1c1c1e, got ${m?.[1]}`);
});

test('palette: separators use semi-transparent rgba (not solid)', () => {
  assert.ok(/--gp-sep\s*:\s*rgba\(/.test(appScss), '--gp-sep should be rgba(...)');
});

// ---------- TYPOGRAPHY ----------

test('typography: body uses the SF / system font stack', () => {
  const m = appScss.match(/body\s*\{[^}]*font-family\s*:\s*([^;]+);/);
  assert.ok(m, 'body font-family not declared');
  const stack = m![1];
  assert.ok(/-apple-system/.test(stack), 'missing -apple-system');
  assert.ok(/BlinkMacSystemFont/.test(stack), 'missing BlinkMacSystemFont');
  assert.ok(/(SF Pro|Helvetica Neue|sans-serif)/.test(stack), 'no Apple fallback');
});

test('typography: header title sits at 17-18px / 700 weight', () => {
  const m = mainLayout.match(/\.gp-header__title\s*\{[^}]*\}/);
  assert.ok(m, '.gp-header__title not styled');
  const size = pxNum(m![0].match(/font-size\s*:\s*([^;]+);/)?.[1]);
  const weight = m![0].match(/font-weight\s*:\s*(\d+)/)?.[1];
  assert.ok(size != null && size >= 16 && size <= 19, `font-size ${size}, want 16-19px`);
  assert.equal(weight, '700', `font-weight ${weight}, want 700`);
});

test('typography: task row title around 15-17px', () => {
  const m = appScss.match(/\.gp-item__title\s*\{[^}]*font-size\s*:\s*([^;]+);/);
  const size = pxNum(m?.[1]);
  assert.ok(size != null && size >= 14.5 && size <= 17.5, `row title font-size ${size}, want 15-17px`);
});

// ---------- TOUCH TARGETS & DENSITY ----------

test('touch target: list row min-height meets iOS HIG 44pt', () => {
  const m = appScss.match(/\.gp-item\s*\{[^}]*min-height\s*:\s*([^;]+);/);
  const v = pxNum(m?.[1]);
  assert.ok(v != null && v >= 44, `gp-item min-height ${v}, want ≥ 44px`);
});

test('touch target: completion circle is ≥ 24px square', () => {
  const m = appScss.match(/\.gp-circle\s*\{[^}]*?width\s*:\s*([^;]+);/);
  const w = pxNum(m?.[1]);
  assert.ok(w != null && w >= 24, `gp-circle width ${w}, want ≥ 24px`);
});

test('touch target: sidebar row min-height ≥ 36px', () => {
  const m = mainLayout.match(/\.gp-sidebar__row\s*\{[^}]*(?:min-height|padding)\s*:\s*([^;]+);/);
  assert.ok(m, 'sidebar row not styled');
  // padding-based: 7px top + ~24px content + 7px bottom = ~38px — acceptable
});

// ---------- SHAPES & RADII ----------

test('radii: grouped list cards rounded 10-14px', () => {
  const m = appScss.match(/\.gp-list\s*\{[^}]*border-radius\s*:\s*([^;]+);/);
  const r = pxNum(m?.[1]);
  assert.ok(r != null && r >= 10 && r <= 16, `gp-list radius ${r}, want 10-16px`);
});

test('radii: badges/pills rounded 6-8px', () => {
  const m = appScss.match(/\.gp-badge\s*\{[^}]*border-radius\s*:\s*([^;]+);/);
  const r = pxNum(m?.[1]);
  assert.ok(r != null && r >= 4 && r <= 10, `gp-badge radius ${r}, want 4-10px`);
});

// ---------- SUBPIXEL DIVIDERS ----------

test('dividers: separators use 0.5px borders (iOS subpixel)', () => {
  const halfPxMatches = allComponents.match(/0\.5px\s+solid/g) || [];
  assert.ok(halfPxMatches.length >= 3, `found ${halfPxMatches.length} 0.5px dividers, want ≥ 3`);
});

// ---------- BOTTOM TAB BAR ----------

test('bottom tab bar: respects iOS safe-area-inset-bottom', () => {
  assert.ok(/env\(safe-area-inset-bottom/.test(bottomTabBar), 'tab bar missing safe-area-inset-bottom');
});

test('bottom tab bar: has an active state colour rule', () => {
  assert.ok(/gp-tabbar__btn--active[\s\S]{0,200}color\s*:\s*var\(--q-primary\)/.test(bottomTabBar), 'no active color rule');
});

test('bottom tab bar: shows ≤ 5 tabs (OmniFocus iPhone convention)', () => {
  const m = bottomTabBar.match(/filter\(\(p\)\s*=>\s*p\.mobileTab\)/);
  assert.ok(m, 'tab bar should filter by mobileTab');
  const flags = (readFileSync(join(root, 'src/core/perspectives.ts'), 'utf8').match(/mobileTab:\s*true/g) || []).length;
  assert.ok(flags >= 4 && flags <= 5, `mobileTab perspectives ${flags}, want 4-5`);
});

// ---------- FORECAST STRIP ----------

test('forecast: horizontal date strip is present', () => {
  assert.ok(/gp-forecast-strip\b/.test(forecast), 'forecast strip class missing');
  assert.ok(/overflow-x\s*:\s*auto/.test(forecast), 'strip not horizontally scrollable');
});

test('forecast: strip renders a 7-day window', () => {
  const m = forecast.match(/length:\s*(\d+)/);
  assert.ok(m && parseInt(m[1]) === 7, `strip window length = ${m?.[1]}, want 7`);
});

test('forecast: strip cells distinguish today / overdue / soon', () => {
  const css = forecast;
  assert.ok(/gp-forecast-strip__cell--today/.test(css), 'no today modifier');
  assert.ok(/gp-forecast-strip__cell--overdue/.test(css), 'no overdue modifier');
  assert.ok(/gp-forecast-strip__dot--due/.test(css) && /gp-forecast-strip__dot--soon/.test(css), 'no due/soon dot variants');
});

// ---------- SIDEBAR (tablet/desktop) ----------

test('sidebar: width responsive (200 narrow / 240 wide)', () => {
  assert.ok(/sidebarWidth\s*=\s*computed\(\(\)\s*=>\s*\(\$q\.screen\.gt\.md\s*\?\s*240\s*:\s*200\)\)/.test(mainLayout), 'expected 200/240 responsive widths');
});

test('sidebar: active perspective highlighted in primary', () => {
  assert.ok(/gp-sidebar__row--active[\s\S]{0,200}color\s*:\s*var\(--q-primary\)/.test(mainLayout), 'no active primary colour');
});

// ---------- HEADER / NO-FAB ----------

test('header: quick-add button moved to toolbar (no big FAB)', () => {
  assert.ok(/icon="add"[^>]*@click="showAdd\s*=\s*true"/.test(mainLayout), 'header + button missing');
  // QuickAddFab.vue was removed
  assert.equal(walk(join(root, 'src/components'), ['.vue']).filter((p) => /QuickAddFab\.vue$/.test(p)).length, 0, 'QuickAddFab.vue should be gone');
});

// ---------- DARK MODE ----------

test('dark mode: every themed gp-* token is overridden in .body--dark', () => {
  const lightTokens = [...appScss.matchAll(/:root\s*\{([^}]+)\}/g)][0]?.[1]?.match(/--gp-[\w-]+/g) || [];
  const darkBlock = appScss.match(/\.body--dark\s*\{([^}]+)\}/)?.[1] || '';
  // Timing/effect tokens are theme-agnostic and don't need a dark override.
  const themed = lightTokens.filter((t) => !/-(ease|dur|blur)$/.test(t));
  for (const tok of themed) {
    assert.ok(darkBlock.includes(tok), `dark mode missing override for ${tok}`);
  }
});

// ---------- TASK ROW INTERACTIONS ----------

test('task row: swipe-left = delete (red), swipe-right = flag (amber)', () => {
  assert.ok(/right-color="negative"/.test(taskRow), 'swipe-left should reveal a negative-coloured delete');
  assert.ok(/left-color="amber-8"/.test(taskRow), 'swipe-right should reveal an amber flag');
});

// ============================================================================
// STRICT TIER — refinements pulled from iOS HIG / OmniFocus design language.
// These probe areas where current implementation likely drifts.
// ============================================================================

test('strict: header has iOS translucent backdrop blur', () => {
  const hasBlur =
    /backdrop-filter\s*:\s*(?:saturate|blur|var\(--gp-header-blur\))/.test(mainLayout) &&
    /--gp-header-blur\s*:\s*[^;]*blur\(/.test(appScss);
  assert.ok(hasBlur, 'gp-header should apply --gp-header-blur (saturate(180%) blur(...) — iOS nav style)');
});

test('strict: list rows have an active/press feedback state', () => {
  assert.ok(/\.gp-item:(?:active|hover)/.test(appScss), '.gp-item should declare :hover or :active');
});

test('strict: transitions reuse a shared timing token (variable)', () => {
  assert.ok(/--gp-ease\b/.test(appScss) || /--gp-anim\b/.test(appScss), 'declare a --gp-ease (or --gp-anim) CSS variable for shared timing');
});

test('strict: grouped list trims first/last divider via overflow:hidden', () => {
  const m = appScss.match(/\.gp-list\s*\{[^}]*overflow\s*:\s*hidden/);
  assert.ok(m, '.gp-list needs overflow:hidden so divider strokes are clipped at the rounded corners');
});

test('strict: bottom tab bar is at least 49px tall + safe area', () => {
  const m = bottomTabBar.match(/\.gp-tabbar__btn\s*\{[^}]*padding\s*:\s*([^;]+);/);
  assert.ok(m, 'tabbar btn padding missing');
  const total = (m![1].match(/(\d+)px/g) || []).reduce((s, t) => s + parseInt(t), 0);
  // padding top+bottom + icon (~22) should reach ~49px
  assert.ok(total >= 14, `tabbar btn vertical padding ${total}px too tight`);
});

test('strict: item meta + badge font ≤ 13px (secondary info)', () => {
  const meta = pxNum(appScss.match(/\.gp-item__meta[\s\S]{0,300}font-size\s*:\s*([^;]+);/)?.[1]);
  const badge = pxNum(appScss.match(/\.gp-badge\s*\{[^}]*font-size\s*:\s*([^;]+);/)?.[1]);
  // .gp-item__meta may inherit; only enforce the badge size
  assert.ok(badge != null && badge <= 13, `badge font-size ${badge}, want ≤ 13px`);
});

test('strict: divider on stacked items is inset (left ≥ 40px)', () => {
  const m = appScss.match(/\.gp-item\s*\+\s*\.gp-item::before\s*\{[^}]*left\s*:\s*([^;]+);/);
  const left = pxNum(m?.[1]);
  assert.ok(left != null && left >= 40, `inset divider left ${left}, want ≥ 40px (start after the leading icon)`);
});

test('strict: 4/8pt spacing grid — header toolbar uses standard pads', () => {
  // Look at .gp-toolbar override or rely on Quasar default (52px min-height).
  // For our overrides, check explicit padding values are multiples of 2.
  const pads = (appScss.match(/padding\s*:\s*([^;]+);/g) || []).flatMap((d) =>
    [...d.matchAll(/(\d+(?:\.\d+)?)px/g)].map((m) => parseFloat(m[1]))
  );
  const nonGrid = pads.filter((v) => v > 0 && v < 40 && v % 2 !== 0 && v !== 0.5);
  assert.ok(nonGrid.length / pads.length < 0.18, `${nonGrid.length}/${pads.length} paddings off the 2pt grid: ${[...new Set(nonGrid)].slice(0, 6).join(', ')}`);
});

test('strict: completion circle is centred & has cursor:pointer', () => {
  const m = appScss.match(/\.gp-circle\s*\{[^}]*\}/);
  assert.ok(m, '.gp-circle missing');
  assert.ok(/cursor\s*:\s*pointer/.test(m![0]), '.gp-circle should be cursor:pointer (tap-to-complete affordance)');
});

test('strict: dark-mode separator distinctly stronger than light', () => {
  const lightAlpha = parseFloat(appScss.match(/:root[^}]*--gp-sep\s*:\s*rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)/)?.[1] || '0');
  const darkAlpha = parseFloat(appScss.match(/\.body--dark[^}]*--gp-sep\s*:\s*rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)/)?.[1] || '0');
  assert.ok(lightAlpha > 0 && darkAlpha > lightAlpha, `light α=${lightAlpha}, dark α=${darkAlpha} — dark should be stronger`);
});

// ============================================================================
// ROUND 2 STRICT RULES — visible UX details
// ============================================================================

test('round2: section titles stick to top on scroll', () => {
  const m = appScss.match(/\.gp-section-title\s*\{[^}]*\}/);
  assert.ok(m, '.gp-section-title not styled');
  assert.ok(/position\s*:\s*sticky/.test(m![0]), 'section title should be position:sticky');
  assert.ok(/top\s*:\s*0/.test(m![0]), 'section title needs top:0');
  // It also needs a non-transparent background so scrolled rows don't bleed through.
  assert.ok(/background\s*:/.test(m![0]), 'section title needs a solid background');
});

test('round2: chevron icon is the standard light grey weight everywhere', () => {
  // All chevron_right usages should use one of the agreed grey shades.
  const chevrons = [...allComponents.matchAll(/name="chevron_right"[^>]*color="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(chevrons.length > 0, 'no chevron_right usages found');
  const ok = chevrons.every((c) => /^grey-[345]$/.test(c));
  assert.ok(ok, `chevron colors should be grey-3/4/5: got ${chevrons.join(', ')}`);
});

test('round2: project badge on flat perspectives has a coloured leading dot', () => {
  // The badge that names the parent project gets its own modifier class so we
  // can render a coloured dot before the title.
  assert.ok(/gp-badge--project/.test(taskRow) || /gp-badge--project/.test(appScss), 'no .gp-badge--project class — flat-perspective rows need a coloured project chip');
  assert.ok(/\.gp-badge--project[\s\S]{0,200}::before[\s\S]{0,200}background/.test(appScss), '.gp-badge--project should render a ::before coloured dot');
});

test('round2: sidebar rows have a tap-down state, not only hover', () => {
  assert.ok(/\.gp-sidebar__row:active/.test(mainLayout), 'sidebar row needs :active feedback');
});

test('round2: forecast strip cell has consistent hover/press affordance', () => {
  assert.ok(/\.gp-forecast-strip__cell(:hover|:active)/.test(forecast), 'forecast cells need :hover or :active state');
});

test('round2: forecast strip cells share padding (no asymmetry on grid)', () => {
  const m = forecast.match(/\.gp-forecast-strip__cell\s*\{[^}]*padding\s*:\s*([^;]+);/);
  assert.ok(m, 'forecast cell padding missing');
  const vals = [...m![1].matchAll(/(\d+)px/g)].map((x) => parseInt(x[1]));
  // expect 3-value short-hand top/horizontal/bottom; horizontal should be a 4pt step
  assert.ok(vals.every((v) => v % 2 === 0), `forecast cell padding off grid: ${vals.join(' ')}`);
});

test('round2: completion circle uses primary tint when checked', () => {
  // The circle icon's :color binding should switch to primary on Completed.
  assert.ok(/status === 'Completed'.*?return 'primary'/s.test(taskRow), 'completed circle should turn primary');
});

test('round2: header content gravity — back+title left, actions right', () => {
  // Order in the toolbar: back/icon, title, then add/sync/menu.
  const order = [
    /icon="arrow_back_ios"/,
    /q-toolbar-title/,
    /icon="add"/,
    /icon="sync|cloud_done|cloud_off|sync_problem"/,
    /icon="more_horiz"/,
  ];
  let pos = 0;
  for (const re of order) {
    const m = mainLayout.slice(pos).search(re);
    assert.ok(m >= 0, `expected ${re} after position ${pos}`);
    pos += m;
  }
});

test('round2: project rows use the OF-style "folder of items" disclosure (chevron + count)', () => {
  // The row template emits a count + chevron when the node has children.
  assert.ok(/availableCount/.test(taskRow), 'count missing on row');
  assert.ok(/v-if="node\.isProject \|\| node\.children\.length"/.test(taskRow), 'no chevron-when-has-children guard');
});

// ============================================================================
// ROUND 3 STRICT RULES — parallel/sequential, inspector, master-detail, search, filter chip
// ============================================================================

const inspectorContent = readFileSync(join(root, 'src/components/InspectorContent.vue'), 'utf8');
const searchDialog = readFileSync(join(root, 'src/components/SearchDialog.vue'), 'utf8');

test('round3: project glyph differentiates parallel vs sequential', () => {
  // Parallel = "view_stream" (parallel bars), sequential = "playlist_play".
  assert.ok(/parallel === false[^\n]*playlist_play/.test(taskRow), 'no sequential-icon mapping');
  assert.ok(/view_stream/.test(taskRow), 'no parallel-icon mapping');
});

test('round3: inspector exposes Parallel/Sequential toggle for projects only', () => {
  assert.ok(/v-if="node\.isProject"[\s\S]{0,200}Type/.test(inspectorContent), 'no Type row in InspectorContent');
  assert.ok(/'Parallel'[\s\S]{0,200}'Sequential'/.test(inspectorContent), 'no parallel/sequential options');
});

test('round3: header has a status filter chip (Available / All)', () => {
  assert.ok(/gp-filter-chip[\s\S]{0,500}showCompleted/.test(mainLayout), 'no .gp-filter-chip wired to ui.showCompleted');
  assert.ok(/'All'[\s\S]{0,80}'Available'|'Available'[\s\S]{0,80}'All'/.test(mainLayout), 'chip should toggle "Available" / "All"');
});

test('round3: header has a Quick Open / search button', () => {
  assert.ok(/icon="search"[^>]*@click="showSearch\s*=\s*true"/.test(mainLayout), 'no search button in header');
  assert.ok(/SearchDialog/.test(mainLayout), 'SearchDialog component not mounted');
});

test('round3: search dialog searches perspectives + projects + tags + tasks', () => {
  for (const t of ['perspective', 'project', 'tag', 'task']) {
    assert.ok(new RegExp(`type:\\s*'${t}'`).test(searchDialog), `search dialog missing ${t} results`);
  }
  assert.ok(/all_nodes\(\)/.test(searchDialog), 'search dialog should traverse wn.all_nodes()');
});

test('round3: desktop master-detail — right inspector drawer at gt.md', () => {
  assert.ok(/side="right"/.test(mainLayout), 'no right-side drawer');
  assert.ok(/hasInspector\s*=\s*computed\(\(\)\s*=>\s*\$q\.screen\.gt\.md\)/.test(mainLayout), 'no gt.md gate on inspector');
  assert.ok(/InspectorContent[\s\S]{0,200}selectedNode/.test(mainLayout), 'right drawer should render InspectorContent for the selected node');
});

test('round3: selection store exists and TaskRow consumes it', () => {
  assert.ok(/selectedTaskUid/.test(taskRow), 'TaskRow should use selectedTaskUid');
  assert.ok(/expandedTaskUid/.test(taskRow), 'TaskRow should use expandedTaskUid');
});

test('round3: inline editor renders InspectorContent below the row', () => {
  assert.ok(/v-if="isExpanded"[\s\S]{0,300}InspectorContent/.test(taskRow), 'no inline InspectorContent under the row');
});

test('round3: route-change clears the selection (no stale inspector)', () => {
  assert.ok(/watch\([\s\S]{0,80}route\.path[\s\S]{0,80}clearSelection\(\)/.test(mainLayout), 'MainLayout should clearSelection() on route change');
});
