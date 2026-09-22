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
