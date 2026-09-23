import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSection, SECTIONS } from '../src/templates/sections/index.js';

test('page-header renders breadcrumb and title', () => {
  const html = renderSection({
    type: 'page-header',
    props: { breadcrumb: [{ label: 'Home', href: 'index.html' }, { label: 'About Us' }], title: 'About Us' }
  });
  assert.ok(html.includes('<a href="index.html">Home</a>'));
  assert.ok(html.includes('<span class="page-header__breadcrumb-sep">/</span>'));
  assert.ok(html.includes('<span>About Us</span>'));
  assert.ok(html.includes('<h1 class="page-header__title">About Us</h1>'));
});

test('a hidden section renders nothing', () => {
  assert.equal(renderSection({ type: 'page-header', visible: false, props: { title: 'x' } }), '');
});

test('an unknown section type fails loudly rather than silently', () => {
  assert.throws(() => renderSection({ type: 'nope', props: {} }), /Unknown section type: nope/);
});

test('about-preview omits the image block entirely when there is no image', () => {
  const html = renderSection({ type: 'about-preview', props: { title: 'T', body: ['p'] } });
  assert.ok(!html.includes('undefined'));
  assert.ok(!html.includes('src=""'));
  assert.ok(!html.includes('about-preview__image'));
});

test('RICH TEXT: about-preview body is intentionally raw and must be sanitised on write', () => {
  const html = renderSection({ type: 'about-preview', props: { title: 'T', body: ['<strong>bold</strong>'] } });
  assert.ok(html.includes('<strong>bold</strong>'));
  assert.ok(!html.includes('&lt;strong&gt;'));
});

test('cta-section omits the button group when there are no actions', () => {
  const html = renderSection({ type: 'cta-section', props: { title: 'T', text: 'x' } });
  assert.ok(!html.includes('btn-group'));
  assert.ok(!html.includes('undefined'));
});

test('card-grid renders one card per entry and omits absent icons', () => {
  const html = renderSection({
    type: 'card-grid',
    props: { cards: [{ title: 'A', text: 'a', icon: '&#9881;' }, { title: 'B', text: 'b' }] }
  });
  assert.equal(html.match(/class="card"/g).length, 2);
  assert.equal(html.match(/card__icon/g).length, 1);
  assert.ok(html.includes('&#9881;'));
  assert.ok(!html.includes('&amp;#9881;'));
});

test('every registered type is a function', () => {
  for (const [type, fn] of Object.entries(SECTIONS)) {
    assert.equal(typeof fn, 'function', `${type} is not a function`);
  }
});

// Ruling 15: the .section wrapper's --gray/--dark modifier is a `background`
// prop on every section type that renders it, not a hardcoded default.
for (const type of ['card-grid', 'about-preview', 'specs-grid']) {
  test(`${type} background prop selects the wrapper modifier`, () => {
    const base = type === 'card-grid'
      ? { cards: [] }
      : type === 'about-preview'
        ? { title: 'T', body: ['p'] }
        : { specs: [] };

    const noBg = renderSection({ type, props: base });
    assert.ok(noBg.includes('class="section"'), `${type} with no background should be class="section"`);
    assert.ok(!noBg.includes('section--gray') && !noBg.includes('section--dark'));

    const gray = renderSection({ type, props: { ...base, background: 'gray' } });
    assert.ok(gray.includes('class="section section--gray"'));

    const dark = renderSection({ type, props: { ...base, background: 'dark' } });
    assert.ok(dark.includes('class="section section--dark"'));

    // An unrecognised value must degrade to the safe plain default, never
    // emit an arbitrary class (these values will come from a CMS in a later
    // phase).
    const unknown = renderSection({ type, props: { ...base, background: 'blue' } });
    assert.ok(unknown.includes('class="section"'));
    assert.ok(!unknown.includes('section--blue'));
  });
}

test('cta-section threeD prop selects the cta-3d modifier', () => {
  const withThreeD = renderSection({ type: 'cta-section', props: { title: 'T', text: 'x', threeD: true } });
  assert.ok(withThreeD.includes('class="cta-section cta-3d"'));

  const withoutThreeD = renderSection({ type: 'cta-section', props: { title: 'T', text: 'x' } });
  assert.ok(withoutThreeD.includes('class="cta-section"'));
  assert.ok(!withoutThreeD.includes('cta-3d'));
});

// Ruling 21: card-grid/specs-grid gained an optional `label` prop (the
// section-label eyebrow) instead of forking into labeled-* sibling types.
test('card-grid renders the section-label span only when a label is given', () => {
  const withLabel = renderSection({ type: 'card-grid', props: { label: 'Our Mission', cards: [] } });
  assert.ok(withLabel.includes('<span class="section-label">Our Mission</span>'));

  const withoutLabel = renderSection({ type: 'card-grid', props: { cards: [] } });
  assert.ok(!withoutLabel.includes('section-label'));
});

test('specs-grid renders the section-label span only when a label is given', () => {
  const withLabel = renderSection({ type: 'specs-grid', props: { label: 'Centrale Nantes', specs: [] } });
  assert.ok(withLabel.includes('<span class="section-label">Centrale Nantes</span>'));

  const withoutLabel = renderSection({ type: 'specs-grid', props: { specs: [] } });
  assert.ok(!withoutLabel.includes('section-label'));
});

test('the label prop is escaped as text content, not rendered as live markup', () => {
  const html = renderSection({ type: 'card-grid', props: { label: '<b>x</b>', cards: [] } });
  assert.ok(html.includes('<span class="section-label">&lt;b&gt;x&lt;/b&gt;</span>'));
  assert.ok(!html.includes('<b>x</b>'));
});

test('dept-grid renders one dept-card per entry, omitting absent intro and icon', () => {
  const html = renderSection({
    type: 'dept-grid',
    props: { depts: [{ name: 'A', text: 'a' }, { name: 'B', text: 'b' }] }
  });
  assert.equal(html.match(/class="dept-card"/g).length, 2);
  assert.ok(!html.includes('undefined'));
  assert.ok(!html.includes('lead--centered'));
});

test('org-chart renders one org-chart__level per level', () => {
  const html = renderSection({
    type: 'org-chart',
    props: { levels: [[{ avatar: 'A', name: 'A', role: 'r' }], [{ avatar: 'B', name: 'B', role: 'r' }]] }
  });
  assert.equal(html.match(/class="org-chart__level"/g).length, 2);
});

test('org-chart derives team-member--president from position: only the first member of the first level gets it', () => {
  const html = renderSection({
    type: 'org-chart',
    props: {
      levels: [
        [{ avatar: 'A', name: 'A', role: 'President' }],
        [{ avatar: 'B', name: 'B', role: 'VP' }, { avatar: 'C', name: 'C', role: 'Treasurer' }]
      ]
    }
  });
  assert.equal(html.match(/team-member--president/g).length, 1);
});

test('org-chart escapes member name and role as text, not live markup', () => {
  const html = renderSection({
    type: 'org-chart',
    props: { levels: [[{ avatar: 'A', name: '<b>x</b>', role: '<i>y</i>' }]] }
  });
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
  assert.ok(html.includes('&lt;i&gt;y&lt;/i&gt;'));
  assert.ok(!html.includes('<b>x</b>'));
  assert.ok(!html.includes('<i>y</i>'));
});
