// Site checks: static checks on index.html and main.css, then the page in headless Chrome at
// desktop, tablet and phone sizes, with and without JavaScript.
//
// Usage: npm test                      (from the repo root; also runs the HTML validator)
//        node tests/verify.mjs [--shots <dir>]   (saves screenshots of each state)
// Uses your installed Chrome. Set CHROME_PATH if it isn't found.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shotsIdx = process.argv.indexOf('--shots');
const shots = shotsIdx > 0 ? path.resolve(process.argv[shotsIdx + 1]) : null;
if (shots) fs.mkdirSync(shots, { recursive: true });
const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find(p => p && fs.existsSync(p));
if (!CHROME) {
  console.error('Chrome not found. Set CHROME_PATH to your Chrome or Chromium executable.');
  process.exit(2);
}
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

// ---------- static checks ----------
const html = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(repo, 'assets/css/main.css'), 'utf8');
check('viewport allows zoom', !/user-scalable/.test(html));
check('formspree removed', !/formspree/i.test(html));
check('template sample block removed', !/Fringilla|Lorem ipsum/i.test(html));
check('title names role', /<title>[^<]*Platform Engineer[^<]*<\/title>/.test(html));
check('meta description', /<meta name="description" content="[^"]{50,}"/.test(html));
check('og:image absolute', /<meta property="og:image" content="https:\/\/haugenau20\.github\.io\/Resume\/[^"]+"/.test(html));
check('canonical link', /<link rel="canonical" href="https:\/\/haugenau20\.github\.io\/Resume\/"/.test(html));
check('avatar alt text', /class="image avatar"[^>]*>\s*<img[^>]*alt="Søren K\. Haug"/.test(html));
const order = [...html.matchAll(/<section id="([a-z]+)"/g)].map(m => m[1]).join(',');
check('section order', order === 'about,experience,work,skills,education,contact', order);
check('no teal or Strata greys in css', !/#49bf9d|#5cc6a7|#3eb08f|#787878|#a2a2a2|73, 191, 157/i.test(css));
check('colour tokens defined', /--accent:\s*#E8A33D/i.test(css) && /--ink:\s*#1F1815/i.test(css));
check('unused overlay css removed', !/\.overlay\s*\{|\.logo-container/.test(css));
check('sass sources removed', !fs.existsSync(path.join(repo, 'assets/sass')));
check('unused background.jpg removed', !fs.existsSync(path.join(repo, 'images/background.jpg')));
const bgSize = fs.statSync(path.join(repo, 'images/bg.jpg')).size;
check('bg.jpg under 300 KB', bgSize < 300 * 1024, `${Math.round(bgSize / 1024)} KB`);
const htmlNoComments = html.replace(/<!--[\s\S]*?-->/g, '');
const refs = [...htmlNoComments.matchAll(/(?:src|href)="([^"#][^"]*)"/g)].map(m => m[1])
  .filter(r => !/^(https?:|mailto:|data:)/.test(r));
const cssRefs = [...css.matchAll(/url\("?([^")]+)"?\)/g)].map(m => m[1]).filter(r => !/^(https?:|data:)/.test(r))
  .map(r => path.posix.join('assets/css', r));
const missing = [...refs, ...cssRefs].filter(r => !fs.existsSync(path.join(repo, decodeURI(r))));
// Work cards. These check structure, not which projects are featured: moving an <article>
// between .work-featured and .work-more, or adding and removing cards, should keep them passing.
const articles = html.split('class="work-featured"')[1].split('id="skills"')[0]
  .split('<article class="work-item">').slice(1).map(a => a.split('</article>')[0]);
const cardTitle = a => (a.match(/<h3>([^<]+)<\/h3>/) || [])[1] || '?';
const parts = ['class="image thumb', '<div class="work-title">', 'class="work-org"', 'class="work-desc"', 'class="work-summary"', 'class="tech-tags"', 'class="project-links"'];
const incomplete = articles.filter(a => !parts.every(p => a.includes(p))).map(cardTitle);
check('every card has the parts both lists need', articles.length >= 2 && incomplete.length === 0, incomplete.join(', '));
check('work cards have real images', !/placeholder\.svg/.test(articles.join('')));
const untitled = [...html.matchAll(/<a href="[^"]+" class="image"(?![^>]*title=)[^>]*hidden>/g)].map(m => m[0]);
check('gallery images have captions', untitled.length === 0, untitled.join(' '));
// Content facts that hold wherever the card sits (and pass if the card is removed).
const build = articles.find(a => a.includes('<h3>Project Build Automation</h3>'));
check('build automation shows the 1.8× ratio and the chart', !build || (/<strong>1\.8×<\/strong>/.test(build) && /build-times\.svg/.test(build)));
check('no misleading 79% build-time claim', !/79%/.test(html));
// Every diagram with an editable source in docs/diagrams is published with outlined text.
for (const f of fs.readdirSync(path.join(repo, 'docs/diagrams')).filter(f => f.endsWith('.svg'))) {
  const published = path.join(repo, 'images/fulls', f);
  check(`${f} published with outlined text only`, fs.existsSync(published) && !/<text[\s>]/.test(fs.readFileSync(published, 'utf8')));
}
check('no Featured heading row', !/<h3>Featured<\/h3>/.test(html));
check('swipe hint shares a row with the section title', /<div class="work-intro">\s*<h2>Selected work<\/h2>\s*<span class="work-hint"/.test(html));
{
  // Buttons are named by destination and ordered live, code, documents.
  const kind = href => /github\.com/.test(href) ? 'code' : /\.pdf$/i.test(href) ? 'doc' : 'live';
  const label = { code: t => t === 'View code', doc: t => t === 'Read thesis (PDF)', live: t => /^Visit \S/.test(t) };
  const rank = { live: 0, code: 1, doc: 2 };
  const bad = [];
  for (const block of html.split('class="project-links"').slice(1)) {
    const links = [...block.split('</div>')[0].matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(m => ({ href: m[1], text: m[2], kind: kind(m[1]) }));
    links.forEach((l, i) => {
      if (!label[l.kind](l.text)) bad.push(`${l.text} (${l.href})`);
      if (i && rank[links[i - 1].kind] > rank[l.kind]) bad.push(`order: ${links[i - 1].text} before ${l.text}`);
    });
  }
  check('project links named by destination, live/code/docs order', bad.length === 0, bad.join('; '));
}
check('all local references resolve', missing.length === 0, missing.join(', '));

// ---------- browser checks ----------
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.pdf': 'application/pdf' };
const server = http.createServer((req, res) => {
  const p = path.join(repo, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(repo) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const visible = (page, sel) => page.$eval(sel, el => {
  const cs = getComputedStyle(el);
  return cs.display !== 'none' && cs.visibility !== 'hidden' && !!(el.offsetWidth || el.offsetHeight);
}).catch(() => false);
const shot = async (page, name, full = false) => { if (shots) await page.screenshot({ path: path.join(shots, name + '.png'), fullPage: full }); };

async function open(viewport, { js = true } = {}) {
  const page = await browser.newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => requests.push(r.url()));
  await page.setJavaScriptEnabled(js);
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await sleep(400);
  return { page, errors, requests };
}

try {
  // Desktop
  {
    const { page, errors } = await open({ width: 1440, height: 900 });
    check('desktop: no JS errors', errors.length === 0, errors.join(' | '));
    const allVisible = await page.$$eval('#main > section', s => s.length === 6 && s.every(x => x.offsetHeight > 0));
    check('desktop: all sections visible', allVisible);
    check('desktop: phone chrome hidden', !(await visible(page, '.phone-tabs')) && !(await visible(page, '#phone-actions')) && !(await visible(page, '#phone-topbar')));
    check('desktop: no divider above first section', (await page.$eval('#about', s => getComputedStyle(s).borderTopWidth)) === '0px');
    check('desktop: header name', (await page.$eval('#header h1', e => e.textContent)).includes('Søren K. Haug'));
    const mail = await page.$$eval('a[data-mail]', as => as.map(a => a.getAttribute('href')));
    check('desktop: email assembled', mail.length >= 2 && mail.every(h => h === 'mailto:contact@soren.haug.dk'), mail.join(', '));
    check('desktop: featured and more groups', (await page.$$('.work-featured .work-item')).length >= 2 && (await page.$$('.work-more .work-item')).length >= 2);
    await shot(page, 'desktop-1440', true);
    await shot(page, 'desktop-1440-viewport');
    const title = await page.$eval('.work-item', a => a.querySelector('h3').textContent.trim());
    await page.click('.work-item a.image');
    await sleep(900);
    check('desktop: lightbox opens', await visible(page, '.poptrox-popup'));
    const caption = await page.$eval('.poptrox-popup .caption', e => e.textContent.trim()).catch(() => '');
    check('desktop: lightbox caption', caption.length > 0 && (caption === title || caption.startsWith(title)), `${caption} vs ${title}`);
    await shot(page, 'desktop-lightbox');
    await page.close();
  }
  // Desktop: new card images and the Muninn gallery
  {
    const { page } = await open({ width: 1440, height: 900 });
    const broken = await page.$$eval('.work-item img', imgs => imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')));
    check('desktop: all work images load', broken.length === 0, broken.join(', '));
    const fit = await page.$$eval('.work-item .diagram img', imgs => imgs.map(i => getComputedStyle(i).objectFit));
    check('desktop: diagrams are not cropped', fit.every(f => f === 'contain'), fit.join(','));
    const cutBg = await page.$$eval('.work-item .image.thumb.cutout', as => as.map(a => getComputedStyle(a).backgroundColor));
    check('desktop: cutouts sit on white', cutBg.every(c => c === 'rgb(255, 255, 255)'), cutBg.join(','));
    const dims = await page.$$eval('.work-item .image.thumb', as => as.map(a => getComputedStyle(a, '::before').opacity).filter(o => o !== '0'));
    check('desktop: card images not dimmed at rest', dims.length === 0, dims.join(','));
    const rows = await page.$$eval('.work-more .work-item', items => items.map(item => {
      const shown = el => el && getComputedStyle(el).display !== 'none' && el.offsetHeight > 0;
      const links = [...item.querySelectorAll('.project-links a, .project-internal')].filter(shown);
      const summary = item.querySelector('.work-summary');
      const link = links[0];
      return {
        title: item.querySelector('h3').textContent,
        ok: shown(item.querySelector('.image.thumb')) && shown(item.querySelector('h3')) && shown(item.querySelector('.work-org')) &&
          shown(summary) && !shown(item.querySelector('.work-desc')) && !shown(item.querySelector('.work-metric')),
        tags: [...item.querySelectorAll('.tag')].filter(shown).length,
        links: links.length,
        linkRight: !!link && !!summary && link.getBoundingClientRect().left > summary.getBoundingClientRect().right,
        arrow: !!link && (link.classList.contains('project-internal') || getComputedStyle(link, '::after').content === '" →"'),
        thumb: item.querySelector('.image.thumb').offsetWidth,
      };
    }));
    check('desktop: more rows show thumb, title, org and summary only', rows.length >= 1 && rows.every(r => r.ok), JSON.stringify(rows.filter(r => !r.ok).map(r => r.title)));
    check('desktop: more rows show 1-3 tags', rows.every(r => r.tags >= 1 && r.tags <= 3), rows.map(r => r.tags).join(','));
    check('desktop: more rows end in one link or Internal, on the right', rows.every(r => r.links === 1 && r.linkRight && r.arrow), JSON.stringify(rows));
    check('desktop: more thumbnails are 128px', rows.every(r => r.thumb === 128), rows.map(r => r.thumb).join(','));
    const feat = await page.$$eval('.work-featured .work-item', items => items.map(item => {
      const shown = el => el && getComputedStyle(el).display !== 'none' && el.offsetHeight > 0;
      return shown(item.querySelector('.work-desc')) && !shown(item.querySelector('.work-summary')) && item.querySelectorAll('.project-links .button').length === [...item.querySelectorAll('.project-links .button')].filter(shown).length;
    }));
    check('desktop: featured cards keep full text and all buttons', feat.length >= 1 && feat.every(Boolean));
    const gap = await page.evaluate(() => document.querySelector('.work-more').previousElementSibling.getBoundingClientRect().top - document.querySelector('.work-featured').getBoundingClientRect().bottom);
    check('desktop: about 64px above More work', gap >= 60 && gap <= 68, gap);
    check('desktop: section title visible, swipe hint hidden', (await visible(page, '.work-intro h2')) && !(await visible(page, '.work-hint')));
    const edu = await page.evaluate(() => ({
      logos: [...document.querySelectorAll('.education-card img')].map(i => { const r = i.getBoundingClientRect(), ar = i.naturalWidth / i.naturalHeight; return Math.round(Math.min(r.width, r.height * ar)); }),
      title: getComputedStyle(document.querySelector('.education-title')).fontSize,
      meta: getComputedStyle(document.querySelector('.education-meta')).fontSize,
    }));
    check('desktop: education logos and text match the timeline scale', edu.logos.every(w => w >= 80) && edu.title === '17px' && edu.meta === '15px', JSON.stringify(edu));
    // The first card with extra (hidden) gallery images: the lightbox opens on its thumbnail's image and steps to the next one.
    const gallery = await page.$$eval('.work-item', items => {
      const i = items.findIndex(a => a.querySelector('a.image[hidden]'));
      if (i < 0) return null;
      const thumb = items[i].querySelector('a.image.thumb');
      return { index: i, first: thumb.getAttribute('title') || items[i].querySelector('h3').textContent, next: items[i].querySelector('a.image[hidden]').getAttribute('title') };
    });
    if (gallery) {
      await (await (await page.$$('.work-item'))[gallery.index].$('a.image.thumb')).click();
      await sleep(900);
      const cap1 = await page.$eval('.poptrox-popup .caption', e => e.textContent.trim()).catch(() => '');
      // Poptrox ignores navigation while an image is still loading, so wait for it to settle first.
      const settled = () => page.waitForFunction(() => { const p = document.querySelector('.poptrox-popup'); return p && !p.classList.contains('loading'); }, { timeout: 5000 }).catch(() => {});
      await settled();
      await sleep(300);
      await page.click('.poptrox-popup .nav-next').catch(() => {});
      await page.waitForFunction(c => (document.querySelector('.poptrox-popup .caption') || {}).textContent !== c, { timeout: 5000 }, cap1).catch(() => {});
      await settled();
      const cap2 = await page.$eval('.poptrox-popup .caption', e => e.textContent.trim()).catch(() => '');
      check('desktop: gallery opens on the card image', cap1 === gallery.first, `${cap1} vs ${gallery.first}`);
      check('desktop: gallery steps to the next image', cap2 === gallery.next, `${cap2} vs ${gallery.next}`);
      await shot(page, 'desktop-gallery');
    }
    await page.close();
  }
  // Tablet (Strata stacked layout)
  {
    const { page, errors } = await open({ width: 900, height: 1100 });
    check('tablet: no JS errors', errors.length === 0, errors.join(' | '));
    check('tablet: phone chrome hidden', !(await visible(page, '.phone-tabs')));
    await shot(page, 'tablet-900', true);
    await page.close();
  }
  // Phone
  {
    const { page, errors, requests } = await open({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    check('phone: no JS errors', errors.length === 0, errors.join(' | '));
    check('phone: header photo not downloaded', !requests.some(r => r.endsWith('/images/bg.jpg')));
    check('phone: tab bar visible', await visible(page, '.phone-tabs'));
    check('phone: action bar visible', await visible(page, '#phone-actions'));
    const sel = await page.$eval('.phone-tab[aria-selected="true"]', b => b.dataset.tab).catch(() => null);
    check('phone: work tab selected first', sel === 'work', sel);
    check('phone: swipe hint shown, section title hidden', (await visible(page, '.work-hint')) && !(await visible(page, '.work-intro h2')));
    check('phone: only work visible', (await visible(page, '#work')) && !(await visible(page, '#about')) && !(await visible(page, '#experience')));
    await shot(page, 'phone-work');
    await page.click('.phone-tab[data-tab="career"]');
    await sleep(200);
    check('phone: career shows experience + education', (await visible(page, '#experience')) && (await visible(page, '#education')) && !(await visible(page, '#work')));
    const exp = await page.$$eval('.timeline-head', hs => hs.map(h => h.getAttribute('aria-expanded')));
    check('phone: first job open, rest closed', exp[0] === 'true' && exp.slice(1).every(v => v === 'false'), exp.join(','));
    await page.click('.timeline-item:nth-child(2) .timeline-head');
    await sleep(100);
    const exp2 = await page.$$eval('.timeline-head', hs => hs.map(h => h.getAttribute('aria-expanded')));
    check('phone: accordion switches', exp2[0] === 'false' && exp2[1] === 'true', exp2.join(','));
    const descHidden = await page.$$eval('.timeline-desc', ds => ds.map(d => d.hidden));
    check('phone: collapsed descriptions hidden', descHidden[0] === true && descHidden[1] === false);
    await page.focus('.timeline-item:nth-child(3) .timeline-head');
    await page.keyboard.press('Enter');
    await sleep(100);
    check('phone: accordion keyboard', (await page.$eval('.timeline-item:nth-child(3) .timeline-head', h => h.getAttribute('aria-expanded'))) === 'true');
    await shot(page, 'phone-career');
    await page.focus('.phone-tab[data-tab="career"]');
    await page.keyboard.press('ArrowRight');
    await sleep(100);
    check('phone: arrow keys move tabs', (await page.$eval('.phone-tab[aria-selected="true"]', b => b.dataset.tab)) === 'skills');
    await shot(page, 'phone-skills');
    await page.click('.phone-tab[data-tab="about"]');
    await sleep(100);
    check('phone: about shows about + contact', (await visible(page, '#about')) && (await visible(page, '#contact')));
    await shot(page, 'phone-about');
    await page.click('.phone-tab[data-tab="work"]');
    await page.evaluate(() => window.scrollTo(0, 900));
    await sleep(500);
    check('phone: collapsed top bar after scroll', await visible(page, '#phone-topbar'));
    const tabsTop = await page.$eval('.phone-tabs', t => t.getBoundingClientRect().top);
    const barBottom = await page.$eval('#phone-topbar', t => t.getBoundingClientRect().bottom);
    check('phone: tabs sit below top bar', tabsTop >= barBottom - 1, `${tabsTop} vs ${barBottom}`);
    await shot(page, 'phone-collapsed');
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(300);
    const cardTitle = await page.$eval('.work-featured .work-item h3', h => h.textContent.trim());
    await page.click('.work-featured .work-item');
    await sleep(500);
    check('phone: sheet opens', await visible(page, '#project-sheet'));
    check('phone: sheet shows clicked project', (await page.$eval('#project-sheet', s => s.textContent)).includes(cardTitle));
    check('phone: lightbox suppressed', !(await visible(page, '.poptrox-popup')));
    check('phone: focus moved into sheet', await page.evaluate(() => document.getElementById('project-sheet').contains(document.activeElement)));
    check('phone: sheet image loaded', await page.$eval('#project-sheet .sheet-image img', i => i.complete && i.naturalWidth > 0));
    await shot(page, 'phone-sheet');
    await page.keyboard.press('Escape');
    await sleep(400);
    check('phone: Esc closes sheet', !(await visible(page, '#project-sheet')));
    check('phone: focus returns to opener', await page.evaluate(() => !!document.activeElement.closest('.work-featured .work-item')));
    const rows = await page.$$eval('.work-more .work-item', items => items.map(i => i.offsetHeight));
    check('phone: more-list rows stay compact', rows.length >= 1 && rows.every(h => h <= 90), rows.join(','));
    const hit = await page.$eval('.work-more .work-item', el => {
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { inView: r.top >= 0 && r.bottom <= innerHeight, hitItself: el.contains(top), hit: top && (top.id || top.className) };
    });
    check('phone: scrolled-to row clears the action bar', hit.inView && hit.hitItself, JSON.stringify(hit));
    await page.click('.work-more .work-item');
    await sleep(400);
    check('phone: more-list item opens sheet', await visible(page, '#project-sheet'));
    const sheetDesc = await page.$eval('#project-sheet .sheet-desc', e => e.textContent);
    const row = await page.$eval('.work-more .work-item', i => ({ desc: (i.querySelector('.work-desc') || {}).textContent, summary: (i.querySelector('.work-summary') || {}).textContent }));
    check('phone: sheet shows the full description', sheetDesc === row.desc && sheetDesc !== row.summary, sheetDesc.length);
    // For a diagram card and a cutout card, wherever they sit, the sheet copies the card's background and fit.
    for (const kind of ['diagram', 'cutout']) {
      const index = await page.$$eval('.work-item', (items, k) => items.findIndex(i => i.querySelector('a.image.thumb').classList.contains(k)), kind);
      if (index < 0) continue;
      await page.keyboard.press('Escape');
      await sleep(400);
      const item = (await page.$$('.work-item'))[index];
      await item.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' }));
      await sleep(300);
      await item.click();
      await sleep(400);
      const look = await page.evaluate(i => {
        const thumb = document.querySelectorAll('.work-item')[i].querySelector('a.image.thumb');
        const img = document.querySelector('#project-sheet .sheet-image img');
        const pair = (box, im) => [getComputedStyle(box).backgroundColor, getComputedStyle(im).objectFit].join(' ');
        return { card: pair(thumb, thumb.querySelector('img')), sheet: pair(img.parentNode, img) };
      }, index);
      check(`phone: sheet matches a ${kind} card's background and fit`, look.sheet === look.card && look.sheet.endsWith('contain'), JSON.stringify(look));
      await shot(page, `phone-sheet-${kind}`);
    }
    const padding = await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom));
    const barH = await page.$eval('#phone-actions', b => b.offsetHeight);
    check('phone: content clears action bar', padding >= barH, `${padding} vs ${barH}`);
    await page.setViewport({ width: 1200, height: 900 });
    await sleep(500);
    check('resize: sheet closed on desktop', !(await visible(page, '#project-sheet')));
    check('resize: all sections back', await page.$$eval('#main > section', s => s.length === 6 && s.every(x => x.offsetHeight > 0)));
    check('resize: phone chrome hidden', !(await visible(page, '.phone-tabs')) && !(await visible(page, '#phone-actions')));
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await sleep(500);
    check('resize back: tabs restored', (await visible(page, '.phone-tabs')) && !(await visible(page, '#about')));
    check('phone: no JS errors after interaction', errors.length === 0, errors.join(' | '));
    await page.close();
  }
  // Phone without JS
  {
    const { page } = await open({ width: 390, height: 844, isMobile: true }, { js: false });
    check('no-JS phone: all sections visible', await page.$$eval('#main > section', s => s.length === 6 && s.every(x => x.offsetHeight > 0)));
    check('no-JS phone: tab bar hidden', !(await visible(page, '.phone-tabs')));
    const narrow = await page.$$eval('.work-more .work-item', items => items.map(item => {
      const tags = item.querySelector('.tech-tags').getBoundingClientRect();
      const link = item.querySelector('.project-links').getBoundingClientRect();
      return { thumb: item.querySelector('.image.thumb').offsetWidth, below: link.top >= tags.bottom - 1 };
    }));
    check('no-JS phone: more rows narrow with link under tags', narrow.length >= 1 && narrow.every(r => r.thumb === 96 && r.below), JSON.stringify(narrow));
    check('no-JS phone: sheet hidden', !(await visible(page, '#project-sheet')));
    const mail = await page.$eval('a[data-mail]', a => a.getAttribute('href'));
    check('no-JS: email falls back to LinkedIn', mail.includes('linkedin.com'), mail);
    await shot(page, 'phone-nojs', true);
    await page.close();
  }
} catch (e) {
  check('browser run completed', false, e.message.split('\n')[0]);
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter(r => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail && !r.ok ? '  — ' + r.detail : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
