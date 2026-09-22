// Theme token renderer. No Node built-ins: this module is imported by the
// Cloudflare Workers runtime in Phase 2.
import { esc } from './html.js';

// Maps the editable token names to the CSS custom properties already defined
// in src/css/style.css. Only tokens listed here can be overridden.
const TOKEN_MAP = {
  colors: {
    primary: '--color-primary',
    primaryLight: '--color-primary-light',
    secondary: '--color-secondary',
    secondaryLight: '--color-secondary-light',
    accent: '--color-accent',
    accentLight: '--color-accent-light',
    text: '--color-text',
    dark: '--color-dark'
  },
  fonts: {
    heading: '--font-heading',
    body: '--font-body'
  },
  scale: {
    radius: '--border-radius',
    radiusLg: '--border-radius-lg',
    containerMax: '--container-max',
    headerHeight: '--header-height'
  }
};

// Allow-list validation, per token group, BEFORE esc() ever sees the value.
// esc() only escapes `& < > " '` — it does NOT escape `;`, `}`, `(` or `)`,
// which are exactly the characters that matter inside a <style> block. A
// stored value like `red;}body{display:none}` would close the :root rule
// early and inject arbitrary sibling CSS (site defacement, exfiltration via
// attribute selectors / url()). It can't reach <script> or break out of
// <style> — those chars ARE escaped — so this is CSS injection, not XSS, but
// it's real. The project spec requires sanitisation on write AND escaping on
// render ("both, not either"): this render layer must be safe standing
// alone, so anything that doesn't match its group's shape is DROPPED rather
// than patched up. Do not remove this allow-list to "simplify" the renderer.
const HEX_COLOR = /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{4}$|^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{8}$/;
const FUNC_COLOR = /^(?:rgb|rgba|hsl|hsla)\([\d.,\s%/]+\)$/i;
const KEYWORD_COLOR = /^[a-zA-Z]+$/;
const FONT_VALUE = /^[A-Za-z0-9\s\-_,."']+$/;
const SCALE_VALUE = /^-?\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|ch)?$/;

const VALIDATORS = {
  colors: (value) => HEX_COLOR.test(value) || FUNC_COLOR.test(value) || KEYWORD_COLOR.test(value),
  fonts: (value) => FONT_VALUE.test(value),
  scale: (value) => SCALE_VALUE.test(value)
};

export function renderThemeVars(theme) {
  const overrides = (theme && theme.overrides) || {};
  const decls = [];

  for (const [group, tokens] of Object.entries(TOKEN_MAP)) {
    const values = overrides[group];
    if (!values) continue;
    const isValid = VALIDATORS[group];
    for (const [key, cssVar] of Object.entries(tokens)) {
      const value = values[key];
      if (value === undefined || value === null || value === '') continue;
      const str = String(value);
      if (!isValid(str)) continue;
      decls.push(`${cssVar}:${esc(str)}`);
    }
  }

  if (decls.length === 0) return '';
  return `<style id="cnfs-theme">:root{${decls.join(';')}}</style>`;
}
