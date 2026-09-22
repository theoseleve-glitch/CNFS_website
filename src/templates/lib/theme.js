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

export function renderThemeVars(theme) {
  const overrides = (theme && theme.overrides) || {};
  const decls = [];

  for (const [group, tokens] of Object.entries(TOKEN_MAP)) {
    const values = overrides[group];
    if (!values) continue;
    for (const [key, cssVar] of Object.entries(tokens)) {
      const value = values[key];
      if (value === undefined || value === null || value === '') continue;
      decls.push(`${cssVar}:${esc(value)}`);
    }
  }

  if (decls.length === 0) return '';
  return `<style id="cnfs-theme">:root{${decls.join(';')}}</style>`;
}
