// CV generator checks: CV facts match the site, the Typst documents build, and the
// application workflow (cv:new, tailored builds) behaves.
//
// Usage: npm test   (or: node --test tests/cv.test.mjs)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { readSiteFacts, readCvFacts, compareFacts, loadContent } from '../cv/facts.mjs';
import { typstAvailable, compile, pageCount, queryText } from '../cv/typst.mjs';
import { loadConfig, readFrontMatter, findLatestApplication, newApplication, buildApplication, buildPublic } from '../cv/applications.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');

// ---------- facts: CV vs site ----------
test('site facts parse', () => {
  const f = readSiteFacts(html);
  assert.equal(f.roles.length, 6);
  assert.deepEqual(f.roles[0], { title: 'Platform Engineer', org: 'SAAB Danmark A/S', years: 'May 2026 – Present' });
  assert.equal(f.roles[3].org, 'LINAK A/S');
  assert.equal(f.roles[5].title, 'Sergeant & Guard Commander');
  assert.deepEqual(f.education[0], { title: 'B.Eng. Electronics', school: 'University of Southern Denmark', years: '2020–2024' });
});

test('compareFacts reports a changed date', () => {
  const site = { roles: [{ title: 'A', org: 'B', years: 'May 2025 – Apr 2026' }], education: [] };
  const cv = { roles: [{ title: 'A', org: 'B', years: 'May 2025 - Apr 2026 ' }], education: [] };
  assert.deepEqual(compareFacts(site, cv, []), []);
  cv.roles[0].years = 'Jun 2025 – Apr 2026';
  const diff = compareFacts(site, cv, []);
  assert.equal(diff.length, 1);
  assert.match(diff[0], /A.*years/);
});

test('compareFacts reports a role missing from the CV', () => {
  const site = { roles: [{ title: 'A', org: 'B', years: '2020' }, { title: 'C', org: 'D', years: '2019' }], education: [] };
  const cv = { roles: [{ title: 'A', org: 'B', years: '2020' }], education: [] };
  assert.match(compareFacts(site, cv, []).join('\n'), /C/);
});

test('compareFacts honours omit_from_cv', () => {
  const site = { roles: [{ title: 'A', org: 'B', years: '2020' }, { title: 'C', org: 'D', years: '2019' }], education: [] };
  const cv = { roles: [{ title: 'A', org: 'B', years: '2020' }], education: [] };
  assert.deepEqual(compareFacts(site, cv, ['C']), []);
});

test('compareFacts checks education', () => {
  const site = { roles: [], education: [{ title: 'X', school: 'Y', years: '2020–2024' }] };
  const cv = { roles: [], education: [{ title: 'X', school: 'Y', years: '2020–2023' }] };
  assert.match(compareFacts(site, cv, []).join('\n'), /X.*years/);
});

test('cv content matches site', () => {
  const content = loadContent(repo);
  assert.deepEqual(compareFacts(readSiteFacts(html), readCvFacts(content), content.omit_from_cv ?? []), []);
});

// ---------- Typst documents ----------
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-test-'));
const tmp = name => path.join(tmpDir, name);
const summary = fs.readFileSync(path.join(repo, 'cv/summary.md'), 'utf8');
const letterInputs = {
  letter: 'Dear hiring team,\n\nI would like to apply.\n\nKind regards,\\\nSøren K. Haug',
  company: 'Example & Sønner A/S', role: 'Platform Engineer', date: '30 November 2026',
  phone: '+45 12 34 56 78', photo: '/images/Mig_LINAK_close.jpg',
};

test('typst is installed', () => {
  assert.ok(typstAvailable(), 'Install Typst 0.15.1: winget install Typst.Typst');
});

test('public cv compiles to 1–2 pages without phone or photo', async () => {
  const out = tmp('public.pdf');
  await compile('cv', out, { summary, variant: 'public' });
  assert.ok(fs.statSync(out).size > 0);
  const pages = await pageCount('cv', { summary, variant: 'public' });
  assert.ok(pages >= 1 && pages <= 2, `got ${pages} pages`);
  const text = await queryText('cv', '<contact>', { summary, variant: 'public' });
  assert.doesNotMatch(text, /\+45/);
});

test('public cv build is deterministic', async () => {
  await compile('cv', tmp('a.pdf'), { summary, variant: 'public' });
  await compile('cv', tmp('b.pdf'), { summary, variant: 'public' });
  assert.ok(fs.readFileSync(tmp('a.pdf')).equals(fs.readFileSync(tmp('b.pdf'))));
});

test('tailored cv without phone fails', async () => {
  await assert.rejects(compile('cv', tmp('t.pdf'), { summary, variant: 'tailored' }), /phone is required for tailored builds/);
  assert.equal(fs.existsSync(tmp('t.pdf')), false);
});

test('tailored cv shows the phone number', async () => {
  const text = await queryText('cv', '<contact>', { summary, variant: 'tailored', phone: '+45 12 34 56 78' });
  assert.match(text, /\+45 12 34 56 78/);
});

test('special characters render literally', async () => {
  // Markdown syntax (*emphasis*, [links](…)) is meant to work; everything else stays literal.
  const special = 'C# and $5 for @acme <team> snake_case #1 \\ end';
  const text = await queryText('cv', '<summary>', { summary: special, variant: 'public' });
  for (const token of ['C#', '$5', '@acme', '<team>', 'snake_case', '#1', '\\ end'])
    assert.ok(text.includes(token), `missing ${JSON.stringify(token)} in ${JSON.stringify(text)}`);
});

test('overlong summary fails with page-limit message and leaves the old PDF alone', async () => {
  const out = tmp('long.pdf');
  fs.writeFileSync(out, 'old');
  await assert.rejects(compile('cv', out, { summary: 'word '.repeat(4000), variant: 'public' }),
    /CV is longer than 2 pages \(\d+\)\. Shorten the text; don't change the layout\./);
  assert.equal(fs.readFileSync(out, 'utf8'), 'old');
  assert.deepEqual(fs.readdirSync(tmpDir).filter(f => f.includes('.tmp')), []);
});

test('letter compiles with photo, company, role and date on 1 page', async () => {
  await compile('letter', tmp('letter.pdf'), letterInputs);
  assert.equal(await pageCount('letter', letterInputs), 1);
  const text = await queryText('letter', '<recipient>', letterInputs);
  assert.match(text, /Example & Sønner A\/S/);
});

test('letter keeps single line breaks, so the sign-off stays on two lines', async () => {
  const text = await queryText('letter', '<letter-body>', { ...letterInputs, letter: 'Dear team,\n\nHello.\n\nKind regards,\nSøren K. Haug' });
  assert.match(text, /Kind regards,\nSøren K\. Haug/);
});

test('letter without phone fails', async () => {
  const { phone, ...rest } = letterInputs;
  await assert.rejects(compile('letter', tmp('np.pdf'), rest), /phone is required/);
});

test('overlong letter fails with page-limit message', async () => {
  await assert.rejects(compile('letter', tmp('ll.pdf'), { ...letterInputs, letter: 'word '.repeat(2000) }),
    /Cover letter is longer than 1 page \(\d+\)/);
});

// ---------- applications and the build ----------
function makeConfig({ phone = '+45 00 00 00 00' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-apps-'));
  const applicationsDir = path.join(root, 'Arbejde & Uddannelse æøå');
  fs.mkdirSync(applicationsDir);
  const configPath = path.join(root, 'local.json');
  fs.writeFileSync(configPath, JSON.stringify(phone ? { applicationsDir, phone } : { applicationsDir }));
  return loadConfig(configPath, repo);
}
const writeApp = (config, rel, summaryMd, letterMd) => {
  const dir = path.join(config.applicationsDir, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'summary.md'), summaryMd);
  if (letterMd != null) fs.writeFileSync(path.join(dir, 'cover-letter.md'), letterMd);
  return dir;
};
const old = new Date('2025-01-01T00:00:00Z');

test('loadConfig falls back to cv/applications without local.json', () => {
  const c = loadConfig(path.join(os.tmpdir(), 'no-such-local.json'), repo);
  assert.equal(c.applicationsDir, path.join(repo, 'cv', 'applications'));
});

test('front matter parses with CRLF and BOM', () => {
  const { data, body } = readFrontMatter('﻿---\r\ncompany: Acme\r\nrole: X\r\n---\r\nHello');
  assert.equal(data.company, 'Acme');
  assert.equal(data.role, 'X');
  assert.equal(body, 'Hello');
  assert.deepEqual(readFrontMatter('Just text'), { data: {}, body: 'Just text' });
});

test('findLatestApplication prefers sent over mtime', () => {
  const config = makeConfig();
  const a = writeApp(config, 'A/Role', '---\nsent: 2026-12-01\n---\nA');
  fs.utimesSync(path.join(a, 'summary.md'), old, old);
  writeApp(config, 'B/Role', '---\ncompany: B\n---\nB');
  assert.equal(findLatestApplication(config.applicationsDir), a);
});

test('cv:new copies the latest summary and letter', () => {
  const config = makeConfig();
  writeApp(config, 'Old/Role', '---\ncompany: Old\nrole: Role\nsent: 2026-10-01\n---\nLatest summary.\n', 'Dear X,\n\nLatest letter.\n');
  const dir = newApplication(config, 'Acme & Co', 'Platform Engineer');
  assert.equal(dir, path.join(config.applicationsDir, 'Acme & Co', 'Platform Engineer'));
  const s = readFrontMatter(fs.readFileSync(path.join(dir, 'summary.md'), 'utf8'));
  assert.equal(s.data.company, 'Acme & Co');
  assert.equal(s.data.role, 'Platform Engineer');
  assert.equal(s.data.sent, undefined);
  assert.equal(s.body.trim(), 'Latest summary.');
  assert.equal(fs.readFileSync(path.join(dir, 'cover-letter.md'), 'utf8').trim(), 'Dear X,\n\nLatest letter.');
});

test('cv:new takes the letter from the latest application that has one', () => {
  const config = makeConfig();
  writeApp(config, 'Older/Role', '---\nsent: 2026-09-01\n---\nOlder summary.\n', 'Dear Older,\n\nOlder letter.\n');
  writeApp(config, 'Newer/Role', '---\nsent: 2026-10-01\n---\nNewer summary.\n'); // no cover-letter.md
  const dir = newApplication(config, 'Acme', 'Role');
  assert.equal(readFrontMatter(fs.readFileSync(path.join(dir, 'summary.md'), 'utf8')).body.trim(), 'Newer summary.');
  assert.equal(fs.readFileSync(path.join(dir, 'cover-letter.md'), 'utf8').trim(), 'Dear Older,\n\nOlder letter.');
});

test('cv:new without earlier applications seeds from cv/summary.md and a stub letter', () => {
  const config = makeConfig();
  const dir = newApplication(config, 'Acme', 'Role');
  assert.equal(readFrontMatter(fs.readFileSync(path.join(dir, 'summary.md'), 'utf8')).body.trim(), summary.trim());
  assert.match(fs.readFileSync(path.join(dir, 'cover-letter.md'), 'utf8'), /Kind regards,\nSøren K\. Haug/);
});

test('cv:new rejects invalid folder names', () => {
  const config = makeConfig();
  assert.throws(() => newApplication(config, 'Acme/Corp', 'Role'), /invalid/);
  assert.throws(() => newApplication(config, 'Acme', 'R&D: Lead?'), /invalid/);
  assert.throws(() => newApplication(config, 'Acme.', 'Role'), /invalid/);
  assert.deepEqual(fs.readdirSync(config.applicationsDir), []);
});

test('cv:new refuses an existing application', () => {
  const config = makeConfig();
  const dir = newApplication(config, 'Acme', 'Role');
  fs.writeFileSync(path.join(dir, 'summary.md'), 'edited');
  assert.throws(() => newApplication(config, 'Acme', 'Role'), /already exists/);
  assert.equal(fs.readFileSync(path.join(dir, 'summary.md'), 'utf8'), 'edited');
});

test('build works under a path with & and æøå', async () => {
  const config = makeConfig();
  const dir = newApplication(config, 'Ærø & Søn', 'Platform Engineer');
  const { resume, letter } = await buildApplication(config, 'Ærø & Søn/Platform Engineer');
  assert.equal(resume, path.join(dir, 'Resume.pdf'));
  assert.equal(letter, path.join(dir, 'CoverLetter.pdf'));
  assert.ok(fs.statSync(resume).size > 0 && fs.statSync(letter).size > 0);
  assert.deepEqual(fs.readFileSync(path.join(dir, '.generated'), 'utf8').trim().split(/\r?\n/).sort(), ['CoverLetter.pdf', 'Resume.pdf']);
  await buildApplication(config, 'Ærø & Søn/Platform Engineer'); // rebuilding its own PDFs is allowed
});

test('build refuses to overwrite a Word-exported PDF', async () => {
  const config = makeConfig();
  const dir = newApplication(config, 'Acme', 'Role');
  fs.writeFileSync(path.join(dir, 'Resume.pdf'), 'word export');
  await assert.rejects(buildApplication(config, 'Acme/Role'), /not generated/);
  assert.equal(fs.readFileSync(path.join(dir, 'Resume.pdf'), 'utf8'), 'word export');
  assert.equal(fs.existsSync(path.join(dir, 'CoverLetter.pdf')), false);
});

test('failed build leaves existing PDF untouched', async () => {
  const config = makeConfig();
  const dir = newApplication(config, 'Acme', 'Role');
  await buildApplication(config, 'Acme/Role');
  const before = fs.readFileSync(path.join(dir, 'Resume.pdf'));
  fs.writeFileSync(path.join(dir, 'summary.md'), '---\ncompany: Acme\nrole: Role\n---\n' + 'word '.repeat(4000));
  await assert.rejects(buildApplication(config, 'Acme/Role'), /CV is longer than 2 pages/);
  assert.ok(fs.readFileSync(path.join(dir, 'Resume.pdf')).equals(before));
});

test('tailored build without phone fails clearly', async () => {
  const config = makeConfig({ phone: null });
  newApplication(config, 'Acme', 'Role');
  await assert.rejects(buildApplication(config, 'Acme/Role'), /phone/);
});

test('build refuses a path outside the applications folder', async () => {
  const config = makeConfig();
  await assert.rejects(buildApplication(config, '../..'), /not an application/);
});

test('draft content never touches files/Resume.pdf', async () => {
  const resumePath = path.join(repo, 'files/Resume.pdf');
  const before = fs.readFileSync(resumePath);
  const out = await buildPublic(repo, { ...loadContent(repo), status: 'draft' });
  assert.equal(out, path.join(repo, 'cv/.build/Resume-draft.pdf'));
  assert.ok(fs.existsSync(out));
  assert.ok(fs.readFileSync(resumePath).equals(before));
});

// ---------- the published PDF ----------
const status = loadContent(repo).status;
test('files/Resume.pdf is up to date',
  { skip: status !== 'final' && 'CV content is draft; files/Resume.pdf is still the Word export' }, async () => {
    const fresh = tmp('fresh.pdf');
    await compile('cv', fresh, { summary, variant: 'public' });
    assert.ok(fs.readFileSync(fresh).equals(fs.readFileSync(path.join(repo, 'files/Resume.pdf'))),
      'files/Resume.pdf is out of date. Run npm run cv');
  });
