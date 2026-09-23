// Theme token renderer. No Node built-ins: this module is imported by the
// Cloudflare Workers runtime in Phase 2.

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

// Allow-list validation, per token group. Validated values are emitted RAW
// into the <style> block below — NOT passed through esc(). `<style>` is an
// HTML raw-text element: character references are not decoded inside it, so
// esc()-ing a value (e.g. turning `'` into `&#39;`) does not produce an
// equivalent CSS token — it corrupts it. `&#39;Bebas Neue&#39;` reaches the
// CSS parser as those six literal characters, the font-family value becomes
// invalid, and the browser silently falls back to a default font. HTML
// escaping is the wrong tool in a CSS context, one layer down from the
// original bug (unescaped `;`/`}` allowing a value like
// `red;}body{display:none}` to close the :root rule early and inject
// sibling CSS).
//
// Because nothing here is escaped, the allow-lists below are the ONLY
// defence and must remain exhaustive: colours are hex/rgb/hsl/keyword,
// fonts are letters/digits/spaces/`-`/`_`/`,`/`.`/`'`/`"`, and scale is
// number-plus-unit. None of these can form `<` or `>`, so none can close the
// enclosing `<style>` tag or open a new element. Do not widen any of these
// patterns to admit `<` or `>` without reintroducing an escaping strategy
// that is actually safe in a raw-text CSS context.
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
      decls.push(`${cssVar}:${str}`);
    }
  }

  if (decls.length === 0) return '';
  return `<style id="cnfs-theme">:root{${decls.join(';')}}</style>`;
}
