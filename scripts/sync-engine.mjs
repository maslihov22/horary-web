// Copies the rules engine from the standalone `horary` repo into `engine/`.
//
// The engine is vendored here (not linked) so Turbopack and Vercel resolve it
// from a single repository. That means it lives in two places, and this script
// is the only sanctioned direction of travel:
//
//   horary/src  ->  horary-web/engine     (yes)
//   horary-web/engine  ->  horary/src     (never)
//
// Lilly's rules are verified by the test suite and the two gates in `horary`.
// A rule edited here would ship without ever meeting them.
//
// Usage: npm run sync:engine [-- --check]
//   --check  report drift and exit non-zero, changing nothing

import { readdirSync, readFileSync, mkdirSync, rmSync, copyFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DEST = resolve(here, '..', 'engine');
const SRC = process.env.HORARY_ENGINE_SRC
  ? resolve(process.env.HORARY_ENGINE_SRC)
  : resolve(here, '..', '..', 'horary', 'src');

const checkOnly = process.argv.includes('--check');

if (!existsSync(SRC)) {
  console.error(`Engine source not found: ${SRC}`);
  console.error('Set HORARY_ENGINE_SRC if the `horary` repo lives elsewhere.');
  process.exit(1);
}

/** Relative paths of every file under `dir`. */
function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (entry.isFile()) out.push(relative(base, full));
  }
  return out.sort();
}

const srcFiles = walk(SRC);
const destFiles = existsSync(DEST) ? walk(DEST) : [];

const same = (rel) => {
  const a = join(SRC, rel);
  const b = join(DEST, rel);
  if (!existsSync(b)) return false;
  if (statSync(a).size !== statSync(b).size) return false;
  return readFileSync(a).equals(readFileSync(b));
};

const added = srcFiles.filter((f) => !destFiles.includes(f));
const removed = destFiles.filter((f) => !srcFiles.includes(f));
const changed = srcFiles.filter((f) => destFiles.includes(f) && !same(f));

if (checkOnly) {
  const drift = added.length + removed.length + changed.length;
  if (drift === 0) {
    console.log(`engine/ is in sync with ${SRC}`);
    process.exit(0);
  }
  for (const f of added) console.log(`  missing here: ${f}`);
  for (const f of changed) console.log(`  differs:      ${f}`);
  for (const f of removed) console.log(`  stale here:   ${f}`);
  console.error(`\n${drift} file(s) out of sync. Run: npm run sync:engine`);
  process.exit(1);
}

for (const rel of removed) rmSync(join(DEST, rel));
for (const rel of [...added, ...changed]) {
  const to = join(DEST, rel);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(join(SRC, rel), to);
}

const touched = added.length + changed.length + removed.length;
console.log(
  touched === 0
    ? `engine/ already up to date with ${SRC}`
    : `engine/ synced from ${SRC} — ${added.length} added, ${changed.length} updated, ${removed.length} removed`
);
