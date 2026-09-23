import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderThemeVars } from '../src/templates/lib/theme.js';

test('renders nothing when there are no overrides', () => {
  assert.equal(renderThemeVars({ defaults: { colors: { primary: '#1B2141' } }, overrides: {} }), '');
  assert.equal(renderThemeVars({ overrides: {} }), '');
  assert.equal(renderThemeVars({}), '');
  assert.equal(renderThemeVars(undefined), '');
});

test('renders only the overridden tokens', () => {
  const out = renderThemeVars({ overrides: { colors: { primary: '#FF0000' } } });
  assert.equal(out, '<style id="cnfs-theme">:root{--color-primary:#FF0000}</style>');
});

test('maps every supported token group to its CSS custom property', () => {
  const out = renderThemeVars({
    overrides: {
      colors: { secondary: '#000000' },
      fonts: { heading: 'Syne' },
      scale: { radius: '12px' }
    }
  });
  assert.equal(
    out,
    '<style id="cnfs-theme">:root{--color-secondary:#000000;--font-heading:Syne;--border-radius:12px}</style>'
  );
});

test('escapes values so a token cannot terminate the style element', () => {
  const out = renderThemeVars({ overrides: { colors: { primary: '</style><script>x' } } });
  assert.ok(!out.includes('<script>'));
  assert.ok(!out.includes('</style><script>'));
});

test('drops a color value that would close the :root rule early and inject sibling CSS', () => {
  const out = renderThemeVars({ overrides: { colors: { primary: 'red;}body{display:none}' } } });
  assert.equal(out, '');
  assert.ok(!out.includes('display:none'));
  assert.ok(!out.includes('body{'));
});

test('drops a color value using url()', () => {
  const out = renderThemeVars({ overrides: { colors: { primary: 'url(https://evil.example/x)' } } });
  assert.equal(out, '');
  assert.ok(!out.includes('url('));
});

test('renders valid values for each token group', () => {
  const out = renderThemeVars({
    overrides: {
      colors: { primary: '#FF0000' },
      fonts: { heading: "'Bebas Neue', 'Arial Narrow', sans-serif" },
      scale: { radius: '12px' }
    }
  });
  assert.ok(out.includes('--color-primary:#FF0000'));
  assert.ok(out.includes("--font-heading:'Bebas Neue', 'Arial Narrow', sans-serif"));
  assert.ok(out.includes('--border-radius:12px'));
});

test('emits only the valid declaration when one override in a mix is invalid', () => {
  const out = renderThemeVars({
    overrides: { colors: { primary: '#FF0000', secondary: 'red;}body{display:none}' } }
  });
  assert.equal(out, '<style id="cnfs-theme">:root{--color-primary:#FF0000}</style>');
});

test('INVARIANT: values are emitted raw, so no allow-list may admit < or >', () => {
  const out = renderThemeVars({ overrides: { colors: { primary: '</style><script>alert(1)</script>' } } });
  assert.equal(out, '');
  assert.ok(!out.includes('<script'));
  assert.ok(!out.includes('</style><'));
});
