#!/usr/bin/env node
// One-off: reads the :root block from src/css/style.css and writes the
// editor's starting values into src/content/theme.json. Overrides stay empty.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const cssPath = join(__dirname, '..', 'src', 'css', 'style.css');
const outPath = join(__dirname, '..', 'src', 'content', 'theme.json');

const css = readFileSync(cssPath, 'utf8');
const root = css.match(/:root\s*\{([\s\S]*?)\}/);
if (!root) throw new Error('No :root block found in style.css');

const vars = {};
for (const line of root[1].split('\n')) {
  const m = line.match(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/i);
  if (m) vars[m[1]] = m[2].trim();
}

const theme = {
  defaults: {
    colors: {
      primary: vars['--color-primary'],
      primaryLight: vars['--color-primary-light'],
      secondary: vars['--color-secondary'],
      secondaryLight: vars['--color-secondary-light'],
      accent: vars['--color-accent'],
      accentLight: vars['--color-accent-light'],
      text: vars['--color-text'],
      dark: vars['--color-dark']
    },
    fonts: {
      heading: vars['--font-heading'],
      body: vars['--font-body']
    },
    scale: {
      radius: vars['--border-radius'],
      radiusLg: vars['--border-radius-lg'],
      containerMax: vars['--container-max'],
      headerHeight: vars['--header-height']
    }
  },
  overrides: {}
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(theme, null, 2) + '\n', 'utf8');
console.log('Wrote', outPath);
