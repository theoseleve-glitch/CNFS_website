import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { normalizeHtml } from './normalize.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

// Returns the first differing position with surrounding context, so a failure
// points at the markup rather than dumping two 40KB strings.
export function compareToGolden(pageFile, rendered) {
  const expected = normalizeHtml(readFileSync(join(SRC, pageFile), 'utf8'));
  const actual = normalizeHtml(rendered);
  if (expected === actual) return { ok: true, message: '' };

  let i = 0;
  while (i < expected.length && i < actual.length && expected[i] === actual[i]) i++;
  const from = Math.max(0, i - 120);
  return {
    ok: false,
    message:
      `${pageFile}: first difference at character ${i}\n` +
      `--- context before ---\n${expected.slice(from, i)}\n` +
      `--- expected next ---\n${expected.slice(i, i + 200)}\n` +
      `--- actual next   ---\n${actual.slice(i, i + 200)}\n`
  };
}
