#!/usr/bin/env node
/**
 * CNFS Website Build Script
 * Copies src/ to dist/, minifies CSS and JS.
 * No dependencies required — uses Node built-ins only.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const DIST = path.join(__dirname, '..', 'dist');

function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  mkdirp(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')     // strip comments
    .replace(/\s*([{}:;,>~+])\s*/g, '$1') // strip whitespace around selectors
    .replace(/;\}/g, '}')                  // remove trailing semicolons
    .replace(/\s{2,}/g, ' ')              // collapse whitespace
    .trim();
}

function minifyJS(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')               // strip block comments
    .replace(/\/\/.*$/gm, '')                        // strip line comments
    .replace(/^\s+/gm, '')                           // strip leading whitespace
    .replace(/\n{2,}/g, '\n')                        // collapse blank lines
    .trim();
}

// Clean dist
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true });
}

// Copy everything
console.log('Copying src/ → dist/');
copyDir(SRC, DIST);

// Minify CSS
const cssDir = path.join(DIST, 'css');
if (fs.existsSync(cssDir)) {
  for (const file of fs.readdirSync(cssDir)) {
    if (file.endsWith('.css')) {
      const p = path.join(cssDir, file);
      const original = fs.readFileSync(p, 'utf8');
      const minified = minifyCSS(original);
      fs.writeFileSync(p, minified);
      const pct = ((1 - minified.length / original.length) * 100).toFixed(0);
      console.log(`  CSS: ${file} — ${original.length} → ${minified.length} bytes (${pct}% smaller)`);
    }
  }
}

// Minify JS
const jsDir = path.join(DIST, 'js');
if (fs.existsSync(jsDir)) {
  for (const file of fs.readdirSync(jsDir)) {
    if (file.endsWith('.js')) {
      const p = path.join(jsDir, file);
      const original = fs.readFileSync(p, 'utf8');
      const minified = minifyJS(original);
      fs.writeFileSync(p, minified);
      const pct = ((1 - minified.length / original.length) * 100).toFixed(0);
      console.log(`  JS:  ${file} — ${original.length} → ${minified.length} bytes (${pct}% smaller)`);
    }
  }
}

console.log('\nBuild complete → dist/');
