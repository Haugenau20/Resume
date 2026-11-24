// Thin wrapper around the Typst CLI. Every build uses the repo as --root and only the
// fonts vendored in cv/fonts, so the output is the same on any machine.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MISSING = 'Install Typst 0.15.1: winget install Typst.Typst';
const DOCS = new Set(['cv', 'letter']);

export function typstAvailable() {
  return spawnSync('typst', ['--version']).status === 0;
}

function baseArgs(inputs) {
  const args = ['--root', repo, '--font-path', path.join(repo, 'cv/fonts'), '--ignore-system-fonts'];
  for (const [k, v] of Object.entries(inputs)) if (v != null) args.push('--input', `${k}=${v}`);
  return args;
}

function docPath(doc) {
  if (!DOCS.has(doc)) throw new Error(`unknown document "${doc}" (expected cv or letter)`);
  return path.join(repo, 'cv', `${doc}.typ`);
}

// Runs typst; resolves with stdout, rejects with Typst's first "error:" line.
function run(args) {
  return new Promise((resolve, reject) => {
    let child;
    try { child = spawn('typst', args, { windowsHide: true }); } catch { return reject(new Error(MISSING)); }
    let out = '', err = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('error', e => reject(e.code === 'ENOENT' ? new Error(MISSING) : e));
    child.on('close', code => {
      if (code === 0) return resolve(out);
      const line = err.split(/\r?\n/).find(l => l.startsWith('error:')) ?? err.trim();
      reject(new Error(line.replace(/^error:\s*(panicked with: )?/, '').replace(/^"(.*)"$/, '$1')));
    });
  });
}

// Compiles cv/<doc>.typ to `out`. Writes to a temp file next to `out` first, so a failed
// build never replaces an existing PDF.
export async function compile(doc, out, inputs) {
  const src = docPath(doc);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = `${out}.${process.pid}.tmp.pdf`;
  try {
    await run(['compile', ...baseArgs(inputs), src, tmp]);
    fs.renameSync(tmp, out);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

// Returns the elements matching a Typst selector (e.g. "<summary>") as parsed JSON.
export async function query(doc, selector, inputs) {
  return JSON.parse(await run(['eval', ...baseArgs(inputs), '--in', docPath(doc), `query(${selector})`]));
}

// The plain text of the elements matching `selector`, for checking what a document says.
export async function queryText(doc, selector, inputs) {
  const parts = [];
  const walk = node => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    if (node.func === 'space') parts.push(' ');
    if (node.func === 'linebreak' || node.func === 'parbreak') parts.push('\n');
    for (const key of ['text', 'value']) if (typeof node[key] === 'string') parts.push(node[key]);
    for (const v of Object.values(node)) if (typeof v === 'object') walk(v);
  };
  walk(await query(doc, selector, inputs));
  return parts.join('').replace(/ *\n */g, '\n'); // spaces at line edges don't render
}

export async function pageCount(doc, inputs) {
  const [meta] = await query(doc, '<page-count>', inputs);
  return meta.value;
}
