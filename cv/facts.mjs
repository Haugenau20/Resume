// Facts the CV shares with the site (job titles, employers, dates, education),
// read from both sides so the tests can catch drift.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };
const decode = s => s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e) => ENTITIES[e]);
const strip = s => decode(s.replace(/<[^>]+>/g, ''));
const beforeDot = s => s.split(' · ')[0];
const norm = s => String(s ?? '').replace(/[—–-]/g, '–').replace(/\s*–\s*/g, ' – ').replace(/\s+/g, ' ').trim();
// Ranges written without spaces ("2020–2024") and with them ("2020 – 2024") are the same fact.
const same = (a, b) => norm(a) === norm(b);

export function readSiteFacts(html) {
  const roles = [...html.matchAll(
    /class="timeline-years">([^<]*)<\/span>\s*<h3 class="timeline-role">([^<]*)<\/h3>\s*<span class="timeline-org">([^<]*)<\/span>/g,
  )].map(([, years, title, org]) => ({ title: decode(title).trim(), org: beforeDot(decode(org)).trim(), years: decode(years).trim() }));
  const education = [...html.matchAll(
    /class="education-title">([^<]*)<\/span>\s*<span class="education-meta">([\s\S]*?)<span class="education-years">([^<]*)<\/span>/g,
  )].map(([, title, meta, years]) => ({ title: decode(title).trim(), school: beforeDot(strip(meta)).trim(), years: decode(years).trim() }));
  return { roles, education };
}

// content.yaml's experience: employers, each with one or more positions.
export function readCvFacts(content) {
  return {
    jobs: (content.experience ?? []).map(({ org, years, positions = [] }) => ({
      org, years, positions: positions.map(({ title, years }) => ({ title, years })),
    })),
    education: (content.education ?? []).map(({ title, school, years }) => ({ title, school, years })),
  };
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// "May 2025" → a sortable month number; "Present" sorts last.
function monthOf(s) {
  const t = s.trim();
  if (/^present$/i.test(t)) return Infinity;
  const m = t.match(/^([A-Za-z]{3})[a-z]* (\d{4})$/);
  return m ? Number(m[2]) * 12 + MONTHS.indexOf(m[1].toLowerCase()) : Number(t) * 12;
}

// The span of several date ranges: earliest start to latest end.
function span(ranges) {
  const parts = ranges.map(r => norm(r).split(' – '));
  const start = parts.reduce((a, b) => (monthOf(b[0]) < monthOf(a[0]) ? b : a))[0];
  const end = parts.reduce((a, b) => (monthOf(b.at(-1)) > monthOf(a.at(-1)) ? b : a)).at(-1);
  return `${start} – ${end}`;
}

// Only facts are compared: every employer, title and date on the CV must agree with the
// site, and every employer and education entry on the site must be on the CV (unless
// listed in `omit`). Order, merging several site roles into one CV entry, and wording are free.
export function compareFacts(site, cv, omit = []) {
  const problems = [];
  const siteOrgs = site.roles.map(r => r.org).filter((o, i, all) => all.findIndex(x => same(x, o)) === i);
  for (const job of cv.jobs) {
    const atOrg = site.roles.filter(r => same(r.org, job.org));
    if (!atOrg.length) { problems.push(`employer "${job.org}" is in the CV but not on the site`); continue; }
    const want = span(atOrg.map(r => r.years));
    if (!same(want, job.years)) problems.push(`employer "${job.org}": dates differ (site "${want}", CV "${job.years}")`);
    for (const pos of job.positions) {
      const match = atOrg.find(r => same(r.title, pos.title));
      if (!match) problems.push(`role "${pos.title}" at "${job.org}" is in the CV but not on the site`);
      else if (pos.years && !same(match.years, pos.years))
        problems.push(`role "${pos.title}": dates differ (site "${match.years}", CV "${pos.years}")`);
    }
  }
  for (const org of siteOrgs)
    if (!omit.some(o => same(o, org)) && !cv.jobs.some(j => same(j.org, org)))
      problems.push(`employer "${org}" is on the site but missing from the CV`);
  for (const e of cv.education) {
    const match = site.education.find(s => same(s.title, e.title));
    if (!match) { problems.push(`education "${e.title}" is in the CV but not on the site`); continue; }
    for (const f of ['school', 'years'])
      if (!same(match[f], e[f])) problems.push(`education "${e.title}": ${f} differs (site "${match[f]}", CV "${e[f]}")`);
  }
  for (const s of site.education)
    if (!omit.some(o => same(o, s.title)) && !cv.education.some(e => same(e.title, s.title)))
      problems.push(`education "${s.title}" is on the site but missing from the CV`);
  return problems;
}

export function loadContent(repo) {
  return YAML.parse(fs.readFileSync(path.join(repo, 'cv/content.yaml'), 'utf8'));
}
