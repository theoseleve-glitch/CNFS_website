// CNFS admin. Edits the same content document the public site renders from,
// so what you change here is what visitors get on the next request.
//
// Two rules this UI enforces on behalf of the data model:
//   - Props whose name starts with "_" are internal plumbing (bug-compat
//     flags, the contact form's Formsubmit wiring). They are never shown as
//     editable fields; exposing them would let a non-developer repoint where
//     the contact form posts, or delete the spam honeypot.
//   - Structural animation markup is not editable, only its text.

const state = { doc: null, theme: null, globals: null, page: 'index', dirty: false, section: 0 };

const $ = (id) => document.getElementById(id);
const api = (url, opts = {}) =>
  fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', 'X-CNFS-Admin': '1', ...(opts.headers || {}) } });

const TOKENS = {
  colors: {
    primary: ['--color-primary', 'Primary'], secondary: ['--color-secondary', 'Secondary'],
    accent: ['--color-accent', 'Accent'], text: ['--color-text', 'Body text'],
    dark: ['--color-dark', 'Dark'], primaryLight: ['--color-primary-light', 'Primary light'],
    secondaryLight: ['--color-secondary-light', 'Secondary light'], accentLight: ['--color-accent-light', 'Accent light']
  },
  fonts: { heading: ['--font-heading', 'Heading font'], body: ['--font-body', 'Body font'] },
  scale: {
    radius: ['--border-radius', 'Corner radius'], radiusLg: ['--border-radius-lg', 'Large radius'],
    containerMax: ['--container-max', 'Content width'], headerHeight: ['--header-height', 'Header height']
  }
};

const FONT_CHOICES = [
  "'Bebas Neue', 'Arial Narrow', sans-serif", "'Space Grotesk', 'Helvetica Neue', sans-serif",
  "'Space Mono', monospace", "Georgia, 'Times New Roman', serif", "system-ui, sans-serif"
];

/* ---------------------------------------------------------------- loading */

async function load() {
  const res = await api('/api/content');
  if (res.status === 401) { location.href = '/admin/login.html'; return; }
  const data = await res.json();
  state.doc = data.doc; state.theme = data.theme; state.globals = data.globals;
  if (!state.doc.pages[state.page]) state.page = Object.keys(state.doc.pages)[0];
  renderAll();
  setStatus(data.source === 'd1' ? '' : 'Showing bundled content — nothing saved yet');
}

function renderAll() {
  renderPageSelect(); renderSections(); renderEditor(); renderDesign(); renderPages(); refreshPreview();
}

function setStatus(text, kind = '') {
  const el = $('status'); el.textContent = text; el.className = 'status' + (kind ? ' status--' + kind : '');
}

function markDirty() {
  state.dirty = true;
  $('btn-save').disabled = false;
  setStatus('Unsaved changes', 'warn');
}

/* ------------------------------------------------------------------ pages */

function renderPageSelect() {
  const sel = $('page-select');
  sel.innerHTML = '';
  for (const key of Object.keys(state.doc.pages)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = state.doc.pages[key].title || key;
    if (key === state.page) opt.selected = true;
    sel.appendChild(opt);
  }
  sel.onchange = () => { state.page = sel.value; state.section = 0; renderSections(); renderEditor(); refreshPreview(); };
}

function renderPages() {
  const wrap = $('pages-panel');
  wrap.innerHTML = '<p class="hint">Pages on the site. The 404 page cannot be deleted — it is what visitors see for a bad link.</p>';
  for (const key of Object.keys(state.doc.pages)) {
    const page = state.doc.pages[key];
    const row = el('div', 'row');
    row.append(el('span', 'row__name', page.title || key));
    const meta = el('span', 'row__meta', '/' + (key === 'index' ? '' : key));
    row.append(meta);
    if (key !== '404' && key !== 'index') {
      const del = btn('Delete', 'btn--danger btn--sm', () => {
        if (!confirm(`Delete the page "${page.title || key}"? Its content is kept in history and can be restored.`)) return;
        delete state.doc.pages[key];
        if (state.page === key) state.page = 'index';
        markDirty(); renderAll();
      });
      row.append(del);
    }
    wrap.append(row);
  }

  const add = el('div', 'add');
  const input = el('input', 'field__input');
  input.placeholder = 'new-page-name';
  add.append(input, btn('Add page', 'btn--primary btn--sm', () => {
    const name = input.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
    if (!name) return;
    if (state.doc.pages[name]) { alert('A page with that name already exists.'); return; }
    const base = JSON.parse(JSON.stringify(state.doc.pages['about'] || state.doc.pages['index']));
    base.title = name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' - CNFS';
    base.path = name + '.html';
    state.doc.pages[name] = base;
    state.page = name; input.value = '';
    markDirty(); renderAll();
  }));
  wrap.append(add);
}

/* --------------------------------------------------------------- sections */

function currentPage() { return state.doc.pages[state.page]; }

function renderSections() {
  const list = $('section-list');
  list.innerHTML = '';
  const sections = currentPage().sections || [];
  sections.forEach((section, i) => {
    const row = el('div', 'sect' + (i === state.section ? ' is-active' : '') + (section.visible === false ? ' is-hidden' : ''));
    row.onclick = () => { state.section = i; renderSections(); renderEditor(); };
    row.append(el('span', 'sect__type', section.type));
    const tools = el('span', 'sect__tools');
    tools.append(
      icon('↑', 'Move up', (e) => { e.stopPropagation(); move(i, -1); }),
      icon('↓', 'Move down', (e) => { e.stopPropagation(); move(i, 1); }),
      icon(section.visible === false ? '○' : '●', 'Show / hide', (e) => {
        e.stopPropagation();
        section.visible = section.visible === false ? true : false;
        markDirty(); renderSections();
      }),
      icon('✕', 'Delete section', (e) => {
        e.stopPropagation();
        if (!confirm(`Delete this "${section.type}" section?`)) return;
        sections.splice(i, 1); state.section = Math.max(0, i - 1);
        markDirty(); renderSections(); renderEditor();
      })
    );
    row.append(tools);
    list.append(row);
  });
}

function move(i, delta) {
  const s = currentPage().sections;
  const j = i + delta;
  if (j < 0 || j >= s.length) return;
  [s[i], s[j]] = [s[j], s[i]];
  state.section = j;
  markDirty(); renderSections(); renderEditor();
}

/* ----------------------------------------------------------- field editor */

function renderEditor() {
  const wrap = $('editor');
  wrap.innerHTML = '';
  const section = (currentPage().sections || [])[state.section];
  if (!section) { wrap.append(el('p', 'hint', 'Select a section to edit it.')); return; }

  wrap.append(el('h2', 'editor__title', section.type));
  const props = section.props || {};
  const keys = Object.keys(props).filter((k) => !k.startsWith('_'));
  if (!keys.length) {
    wrap.append(el('p', 'hint', 'This section has no editable fields — its content is fixed by the design.'));
  }
  for (const key of keys) fields(wrap, props, key, label(key));

  const hidden = Object.keys(props).filter((k) => k.startsWith('_'));
  if (hidden.length) {
    wrap.append(el('p', 'hint hint--muted',
      `${hidden.length} internal setting${hidden.length > 1 ? 's' : ''} not shown — these control page plumbing, not content.`));
  }
}

function label(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).replace(/_/g, ' ');
}

function fields(parent, obj, key, labelText) {
  const value = obj[key];

  if (typeof value === 'string') {
    const long = value.length > 80 || /\n/.test(value);
    const field = el('label', 'field');
    field.append(el('span', 'field__label', labelText));
    const input = document.createElement(long ? 'textarea' : 'input');
    input.className = 'field__input';
    if (long) input.rows = Math.min(8, Math.ceil(value.length / 60) + 1);
    input.value = value;
    input.oninput = () => { obj[key] = input.value; markDirty(); };
    field.append(input);
    parent.append(field);
    return;
  }

  if (typeof value === 'boolean') {
    const field = el('label', 'field field--check');
    const input = document.createElement('input');
    input.type = 'checkbox'; input.checked = value;
    input.onchange = () => { obj[key] = input.checked; markDirty(); };
    field.append(input, el('span', 'field__label', labelText));
    parent.append(field);
    return;
  }

  if (typeof value === 'number') {
    const field = el('label', 'field');
    field.append(el('span', 'field__label', labelText));
    const input = document.createElement('input');
    input.type = 'number'; input.className = 'field__input'; input.value = value;
    input.oninput = () => { obj[key] = Number(input.value); markDirty(); };
    field.append(input);
    parent.append(field);
    return;
  }

  if (Array.isArray(value)) {
    const group = el('div', 'group');
    group.append(el('h3', 'group__title', labelText));
    value.forEach((item, i) => {
      const itemWrap = el('div', 'item');
      const head = el('div', 'item__head');
      head.append(el('span', 'item__n', `${i + 1}`));
      head.append(icon('✕', 'Remove', () => { value.splice(i, 1); markDirty(); renderEditor(); }));
      itemWrap.append(head);
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        for (const k of Object.keys(item).filter((k) => !k.startsWith('_'))) fields(itemWrap, item, k, label(k));
      } else {
        fields(itemWrap, value, i, 'Text');
      }
      group.append(itemWrap);
    });
    group.append(btn('+ Add', 'btn--sm', () => {
      const first = value[0];
      value.push(first && typeof first === 'object' && !Array.isArray(first)
        ? Object.fromEntries(Object.keys(first).map((k) => [k, typeof first[k] === 'string' ? '' : first[k]]))
        : '');
      markDirty(); renderEditor();
    }));
    parent.append(group);
    return;
  }

  if (value && typeof value === 'object') {
    const group = el('div', 'group');
    group.append(el('h3', 'group__title', labelText));
    for (const k of Object.keys(value).filter((k) => !k.startsWith('_'))) fields(group, value, k, label(k));
    parent.append(group);
  }
}

/* ----------------------------------------------------------- design panel */

function renderDesign() {
  const wrap = $('design-panel');
  wrap.innerHTML = '';
  wrap.append(el('p', 'hint',
    'These apply across every page. Anything you leave untouched keeps the value from the site stylesheet.'));

  state.theme.overrides = state.theme.overrides || {};
  const defaults = state.theme.defaults || {};

  for (const [group, tokens] of Object.entries(TOKENS)) {
    wrap.append(el('h3', 'group__title', label(group)));
    state.theme.overrides[group] = state.theme.overrides[group] || {};
    for (const [key, [, labelText]] of Object.entries(tokens)) {
      const current = state.theme.overrides[group][key] ?? (defaults[group] || {})[key] ?? '';
      const field = el('label', 'field');
      field.append(el('span', 'field__label', labelText));

      let input;
      if (group === 'colors') {
        input = document.createElement('input');
        input.type = 'color';
        input.className = 'field__color';
        input.value = /^#[0-9a-f]{6}$/i.test(current) ? current : '#000000';
      } else if (group === 'fonts') {
        input = document.createElement('select');
        input.className = 'field__input';
        for (const choice of [...new Set([current, ...FONT_CHOICES])].filter(Boolean)) {
          const o = document.createElement('option');
          o.value = choice; o.textContent = choice.split(',')[0].replace(/'/g, '');
          if (choice === current) o.selected = true;
          input.append(o);
        }
      } else {
        input = document.createElement('input');
        input.className = 'field__input';
        input.value = current;
      }

      input.oninput = () => {
        state.theme.overrides[group][key] = input.value;
        applyThemeToPreview();
        markDirty();
      };
      field.append(input);

      const reset = btn('Reset', 'btn--ghost btn--xs', () => {
        delete state.theme.overrides[group][key];
        applyThemeToPreview(); markDirty(); renderDesign();
      });
      field.append(reset);
      wrap.append(field);
    }
  }
}

// Live preview of token changes: the iframe is same-origin, so set the custom
// properties on its root element. This is the real stylesheet reacting, not a
// mock of it.
function applyThemeToPreview() {
  const doc = $('preview').contentDocument;
  if (!doc || !doc.documentElement) return;
  for (const [group, tokens] of Object.entries(TOKENS)) {
    const values = (state.theme.overrides || {})[group] || {};
    for (const [key, [cssVar]] of Object.entries(tokens)) {
      if (values[key]) doc.documentElement.style.setProperty(cssVar, values[key]);
      else doc.documentElement.style.removeProperty(cssVar);
    }
  }
}

/* --------------------------------------------------------------- preview */

function previewUrl() {
  const key = state.page;
  return (key === 'index' ? '/' : '/' + key) + '?preview=' + Date.now();
}

function refreshPreview() {
  const frame = $('preview');
  $('preview-url').textContent = state.page === 'index' ? 'cnfs.racing/' : 'cnfs.racing/' + state.page;
  frame.src = previewUrl();
  frame.onload = applyThemeToPreview;
}

/* ------------------------------------------------------------------ save */

async function save() {
  $('btn-save').disabled = true;
  setStatus('Publishing…');
  try {
    const res = await api('/api/content', {
      method: 'PUT',
      body: JSON.stringify({ doc: state.doc, theme: state.theme, globals: state.globals })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.error || 'Save failed', 'error');
      $('btn-save').disabled = false;
      return;
    }
    state.dirty = false;
    setStatus('Published', 'ok');
    refreshPreview();
    setTimeout(() => { if (!state.dirty) setStatus(''); }, 4000);
  } catch {
    setStatus('Network error — nothing was saved', 'error');
    $('btn-save').disabled = false;
  }
}

/* --------------------------------------------------------------- history */

async function openHistory() {
  const drawer = $('history-drawer');
  drawer.hidden = false;
  const list = $('version-list');
  list.innerHTML = '<li class="hint">Loading…</li>';
  const res = await api('/api/versions');
  const { versions = [] } = await res.json().catch(() => ({}));
  list.innerHTML = '';
  if (!versions.length) { list.innerHTML = '<li class="hint">No saves yet.</li>'; return; }
  for (const v of versions) {
    const li = el('li', 'version');
    li.append(el('span', 'version__when', new Date(v.created_at).toLocaleString()));
    li.append(el('span', 'version__who', v.author));
    if (v.note) li.append(el('span', 'version__note', v.note));
    li.append(btn('Restore', 'btn--sm', async () => {
      if (!confirm('Restore this version? The current content is saved to history first, so this is undoable.')) return;
      const r = await api('/api/versions', { method: 'POST', body: JSON.stringify({ id: v.id }) });
      if (r.ok) { drawer.hidden = true; await load(); setStatus('Restored', 'ok'); }
      else setStatus('Restore failed', 'error');
    }));
    list.append(li);
  }
}

/* ---------------------------------------------------------------- helpers */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
function btn(text, className, onClick) {
  const b = el('button', 'btn ' + (className || ''), text);
  b.type = 'button'; b.onclick = onClick;
  return b;
}
function icon(glyph, title, onClick) {
  const b = el('button', 'icon', glyph);
  b.type = 'button'; b.title = title; b.onclick = onClick;
  return b;
}

/* ------------------------------------------------------------------- wire */

$('btn-save').onclick = save;
$('btn-history').onclick = openHistory;
$('btn-close-history').onclick = () => { $('history-drawer').hidden = true; };
$('btn-refresh').onclick = refreshPreview;
$('btn-logout').onclick = async () => {
  await api('/api/auth/login', { method: 'DELETE' });
  location.href = '/admin/login.html';
};

document.querySelectorAll('.tab').forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-active', t === tab));
    document.querySelectorAll('.tabpanel').forEach((p) => p.classList.toggle('is-active', p.id === 'tab-' + tab.dataset.tab));
  };
});

window.addEventListener('beforeunload', (e) => {
  if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
});

load();
