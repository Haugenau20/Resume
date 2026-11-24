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

export function readCvFacts(content) {
  return {
    roles: (content.roles ?? []).map(({ title, org, years }) => ({ title, org, years })),
    education: (content.education ?? []).map(({ title, school, years }) => ({ title, school, years })),
  };
}

export function compareFacts(site, cv, omit = []) {
  const problems = [];
  const siteRoles = site.roles.filter(r => !omit.includes(r.title));
  const pairs = [
    ['role', siteRoles, cv.roles, ['title', 'org', 'years']],
    ['education', site.education, cv.education, ['title', 'school', 'years']],
  ];
  for (const [kind, want, have, fields] of pairs) {
    for (let i = 0; i < Math.max(want.length, have.length); i++) {
      const w = want[i], h = have[i];
      if (!h) { problems.push(`${kind} "${w.title}" is on the site but missing from the CV`); continue; }
      if (!w) { problems.push(`${kind} "${h.title}" is in the CV but not on the site`); continue; }
      for (const f of fields) {
        if (!same(w[f], h[f])) problems.push(`${kind} "${w.title}": ${f} differs (site "${w[f]}", CV "${h[f]}")`);
      }
    }
  }
  return problems;
}

export function loadContent(repo) {
  return YAML.parse(fs.readFileSync(path.join(repo, 'cv/content.yaml'), 'utf8'));
}
