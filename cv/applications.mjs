// Application folders: creating them (cv:new) and building the tailored CV and cover
// letter inside them, plus the public CV build.
//
// An application is any folder under applicationsDir that contains summary.md.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { compile } from './typst.mjs';
import { loadContent } from './facts.mjs';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const DEFAULT_PHOTO = '/images/Mig_LINAK_close.jpg';
const STUB_LETTER = 'Dear hiring team,\n\n\n\nKind regards,\nSøren K. Haug\n';

export function loadConfig(configPath, repo) {
  const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  const applicationsDir = path.resolve(repo, config.applicationsDir ?? 'cv/applications');
  return { ...config, applicationsDir, repo };
}

export function readFrontMatter(text) {
  const t = text.replace(/^﻿/, '');
  const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!m) return { data: {}, body: text };
  return { data: YAML.parse(m[1]) ?? {}, body: t.slice(m[0].length) };
}

const readMd = file => readFrontMatter(fs.readFileSync(file, 'utf8'));

function* findSummaries(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* findSummaries(p);
    else if (entry.name === 'summary.md') yield p;
  }
}

// The application with the latest `sent` date; one without `sent` counts by when its
// summary.md was last changed, so a draft in progress is "latest" too. With `having`,
// only applications that also contain that file count.
export function findLatestApplication(appsDir, having = 'summary.md') {
  if (!fs.existsSync(appsDir)) return null;
  let best = null;
  for (const file of findSummaries(appsDir)) {
    if (!fs.existsSync(path.join(path.dirname(file), having))) continue;
    const { sent } = readMd(file).data;
    const when = sent ? new Date(sent).getTime() : fs.statSync(file).mtimeMs;
    if (!best || when > best.when) best = { dir: path.dirname(file), when };
  }
  return best?.dir ?? null;
}

const markerFile = pdfPath => path.join(path.dirname(pdfPath), '.generated');
const listedGenerated = pdfPath =>
  fs.existsSync(markerFile(pdfPath)) ? fs.readFileSync(markerFile(pdfPath), 'utf8').split(/\r?\n/).filter(Boolean) : [];

// A PDF may be (re)written if it doesn't exist yet or this build made it.
export function canWrite(pdfPath) {
  return !fs.existsSync(pdfPath) || listedGenerated(pdfPath).includes(path.basename(pdfPath));
}

export function markGenerated(pdfPath) {
  const names = listedGenerated(pdfPath);
  if (!names.includes(path.basename(pdfPath))) fs.writeFileSync(markerFile(pdfPath), [...names, path.basename(pdfPath)].join('\n') + '\n');
}

function checkName(kind, name) {
  if (!name?.trim() || /[<>:"/\\|?*\x00-\x1f]/.test(name) || /[ .]$/.test(name))
    throw new Error(`invalid ${kind} "${name}": folder names can't contain < > : " / \\ | ? * or end in a space or dot`);
}

export function newApplication(config, company, role) {
  checkName('company', company);
  checkName('role', role);
  const dir = path.join(config.applicationsDir, company, role);
  if (fs.existsSync(path.join(dir, 'summary.md'))) throw new Error(`${path.join(company, role)} already exists`);

  const latest = findLatestApplication(config.applicationsDir);
  const summaryBody = latest ? readMd(path.join(latest, 'summary.md')).body
    : fs.readFileSync(path.join(config.repo, 'cv/summary.md'), 'utf8');
  const withLetter = findLatestApplication(config.applicationsDir, 'cover-letter.md');
  const letterBody = withLetter ? readMd(path.join(withLetter, 'cover-letter.md')).body : STUB_LETTER;

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'summary.md'), `---\n${YAML.stringify({ company, role })}---\n${summaryBody}`);
  fs.writeFileSync(path.join(dir, 'cover-letter.md'), letterBody);
  return dir;
}

export function formatDate(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function letterDate(sent) {
  if (!sent) return formatDate(new Date());
  if (sent instanceof Date) return formatDate(sent);
  const m = String(sent).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`sent must be a date like 2026-11-30, not "${sent}"`);
  return formatDate(new Date(+m[1], +m[2] - 1, +m[3]));
}

// The photo as a root-relative path Typst can read; one outside the repo is copied in.
function photoInput(config) {
  if (!config.photo) return DEFAULT_PHOTO;
  const src = path.resolve(config.repo, config.photo);
  const rel = path.relative(config.repo, src);
  if (!rel.startsWith('..') && !path.isAbsolute(rel)) return '/' + rel.split(path.sep).join('/');
  const dest = path.join(config.repo, 'cv/.build', 'photo' + path.extname(src).toLowerCase());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return '/cv/.build/' + path.basename(dest);
}

export async function buildApplication(config, relPath) {
  const dir = path.resolve(config.applicationsDir, relPath);
  const inside = path.relative(config.applicationsDir, dir);
  if (inside.startsWith('..') || path.isAbsolute(inside) || !fs.existsSync(path.join(dir, 'summary.md')))
    throw new Error(`"${relPath}" is not an application: expected a folder under ${config.applicationsDir} with a summary.md`);
  if (!config.phone) throw new Error('phone is required for tailored builds: add "phone" to cv/local.json');

  const { data, body: summary } = readMd(path.join(dir, 'summary.md'));
  const letterFile = path.join(dir, 'cover-letter.md');
  const letter = fs.existsSync(letterFile) ? readMd(letterFile).body : '';
  if (!letter.trim()) throw new Error(`cover-letter.md in "${relPath}" is missing or empty`);

  const resume = path.join(dir, 'Resume.pdf');
  const coverLetter = path.join(dir, 'CoverLetter.pdf');
  for (const pdf of [resume, coverLetter])
    if (!canWrite(pdf)) throw new Error(`${pdf} was not generated by this build (an old Word export?); move it away first`);

  await compile('cv', resume, { summary, variant: 'tailored', phone: config.phone });
  markGenerated(resume);
  await compile('letter', coverLetter, {
    letter, phone: config.phone, photo: photoInput(config),
    company: data.company ?? '', role: data.role ?? '', date: letterDate(data.sent),
  });
  markGenerated(coverLetter);
  return { resume, letter: coverLetter };
}

// The public CV: files/Resume.pdf once content.yaml says `status: final`, a preview before that.
export async function buildPublic(repo, content = loadContent(repo)) {
  const summary = fs.readFileSync(path.join(repo, 'cv/summary.md'), 'utf8');
  const out = content.status === 'final'
    ? path.join(repo, 'files/Resume.pdf')
    : path.join(repo, 'cv/.build/Resume-draft.pdf');
  await compile('cv', out, { summary, variant: 'public' });
  return out;
}
