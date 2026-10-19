# Handoff: Resume Site — Desktop Refresh + Dedicated Phone Layout

## Overview
Refresh of Søren K. Haug's personal resume site (repo `Haugenau20/Resume`, GitHub Pages, based on the HTML5 UP **Strata** template). The goals:
1. Make the site work as a **CV first, with projects as proof**: a recruiter should know who Søren is, what he does and how to contact him within 5 seconds.
2. Give phones a **dedicated layout** (not just Strata's stacked fallback), using the same design language.
3. Replace Strata's teal with a **personal amber accent**, and fix the template's low-contrast grey text.
4. Clean up template leftovers and accessibility issues.

Content on the site is currently being rewritten by Søren. Treat all copy, dates and numbers in the mockups as **placeholders** unless they match `index.html`.

## About the Design Files
The files in this bundle are **design references created in HTML**: prototypes showing the intended look and behaviour, not production code to copy. The task is to **recreate these designs in the existing codebase**: plain HTML5 + Strata's CSS (`assets/css/main.css`) + jQuery-based `assets/js/main.js`, hosted on GitHub Pages with no build step. Keep it that way. Don't introduce a framework.

The `.dc.html` mockups open directly in a browser (they need `support.js` and `images/` next to them). They use inline styles and a small component runtime for the demo interactions. **Don't port that structure.** Port the layout, values and behaviour into semantic HTML + CSS classes in `main.css`.

## Fidelity
**High fidelity for the phone layout and colours**: recreate the spacing, sizes, colours and typography as specified below.
**Medium fidelity for desktop**: keep Strata's desktop layout (fixed left panel + content column) and apply the changes listed. There's no desktop mockup.

---

## Breakpoints
Strata's breakpoints: xlarge ≤1800, large ≤1280, medium ≤980, small ≤736, xsmall ≤480.
- **> 736px**: desktop/tablet layout (Strata side panel; at ≤980 Strata stacks the panel on top, which is acceptable for tablets).
- **≤ 736px**: the **new phone layout** described below.

Use the **same HTML** for both. The phone layout comes from CSS inside `@media screen and (max-width: 736px)` plus a small JS module for tabs, the sticky collapse and the bottom sheet. Without JS, phones should simply show all sections stacked (progressive enhancement).

---

## Section order (both layouts)
1. About (short intro)
2. Experience (timeline)
3. Selected work (2–3 featured + "more")
4. Skills (new section)
5. Education (compact)
6. Contact (no form)

---

## Desktop changes (> 736px)

### Left panel (`#header`)
- Background `--ink` `#1F1815`. If keeping the background image, overlay ≥70% `#1F1815`.
- Avatar (existing `images/avatar.jpg` / `Mig_icon.png`) with `alt="Søren K. Haug"`.
- **Replace "Welcome!"** with: name (white, 700) + role line "Automation & Embedded Engineer" in `--accent` `#E8A33D`, 600.
- One-line hook under it (current role, what he's open to), `rgba(255,255,255,.75)`.
- **Buttons near the top of the panel** (not icons at the bottom):
  - Primary "Download CV": background `#E8A33D`, text `#1F1815`, 600, height 48px, radius 10px. Links to `files/Resume.pdf`, `target="_blank"`.
  - Secondary "LinkedIn": 2px border `#E8A33D` (on dark) or white, text white, same size.
- Keep the small icon row (GitHub, LinkedIn, Email) under the buttons if wanted.

### Experience
- Replace the logo-only grid with a **vertical timeline**: per item a logo (small circle, 44px), then years / role / company / one-line description. Use the same markup as the phone version (below); on desktop all descriptions are expanded.
- Show the LINAK intern → engineer progression as separate entries.

### Selected work
- **Featured row**: 2–3 larger cards (CMake build system, SAAB pytest framework, TTRPG apps). Each card leads with a **metric** (e.g. "79%", label "faster builds"), then title, company, short description and tech tags.
- **More work**: the remaining projects as a compact list or a smaller grid.
- Thumbnails: same aspect ratio (16:9 recommended), `object-fit: cover`.
- All external project links `target="_blank" rel="noopener"`, all inside the same `.project-links` wrapper.

### Skills (new)
Four groups, as chips: Test & automation · Embedded · Build & CI/CD · Web. Content from the PDF CV, trimmed. Chip: background `#F3F1EF`, text `#3D3735`, 15px, padding 6px 12px, radius 8px, gap 8px.

### Education
One compact block: SDU logo 36px + "B.Eng. Electronics" (600, `#3D3735`) + "University of Southern Denmark · exchange at University of Calgary" (13–14px, `--text-muted`). Thesis link optional.

### Contact
- **Remove the Formspree form entirely** (HTML, the `#six` section form, and any related JS).
- Primary: LinkedIn button. Secondary: a dedicated domain email (rotatable; Søren will provide it), **assembled with JS** so it isn't plain text in the HTML, e.g.:
  ```js
  const u='hello', d='example.dk';
  document.querySelectorAll('[data-mail]').forEach(a=>{a.href='mailto:'+u+'@'+d; if(a.dataset.mail==='show') a.textContent=u+'@'+d;});
  ```
- Leave a visible fallback text ("Email via LinkedIn") for no-JS.

---

## Phone layout (≤ 736px) — see `Mobile Layout v2 Amber.dc.html`
Reference frame: 390 × 844 (iPhone 14). Font: **Source Sans 3** (already Strata's family; weights 300/400/600/700).

### 1. Identity header (scrolls away)
- Background `#1F1815`, padding `64px 24px 28px` (top includes the status bar area; use `env(safe-area-inset-top)` + 20px in production), vertical gap 18px.
- Row: avatar 76×76, circle, 3px border `rgba(255,255,255,.15)`, gap 16px, then:
  - Name: 26px / 700 / line-height 1.1 / `#FFFFFF`
  - Role: 16px / 600 / `#E8A33D`
- Intro: 16px / line-height 1.5 / `rgba(255,255,255,.75)` / `text-wrap: pretty`. One sentence.
- Pills row, gap 8px:
  - "Denmark": 13px, `rgba(255,255,255,.8)`, 1px border `rgba(255,255,255,.2)`, radius 20px, padding 4px 12px
  - "Open to opportunities": 13px / 600, background `#E8A33D`, text `#1F1815`, radius 20px

### 2. Collapsed top bar (appears after scrolling)
- Shown when the scroll position is past the identity header (~190px in the mock; in production use an `IntersectionObserver` on the header).
- `position: fixed; top: 0`, height 52px + safe-area top (mock: 96px total incl. 44px status bar), background `#1F1815`, padding 0 20px, shadow `0 2px 10px rgba(0,0,0,.2)`, z-index above content.
- Avatar 34px circle, gap 12px, name 16px/600 white, role 13px `rgba(255,255,255,.6)`.
- Fade/slide in: `transform: translateY(-100%)` → `0`, 200ms ease-out (the mock just toggles it on and off).

### 3. Tab bar (sticky)
- `position: sticky`; `top: 0` normally, and the collapsed bar's height when that's visible.
- Background white, bottom border 1px `#EBE7E4`, 4 equal columns (`grid-template-columns: repeat(4,1fr)`), height 50px.
- Tabs: **Work · Career · Skills · About**. 15px / 600. Inactive `#756D68`, active `#1F1815` with 3px bottom border `#E8A33D`.
- Tapping a tab shows that panel, and if the user has scrolled past the header, scrolls back to just under it (mock: `scrollTop = 200`).
- Use `role="tablist"` / `role="tab"` / `aria-selected` / `role="tabpanel"`.
- Mapping to sections: Work = Selected work · Career = Experience + Education · Skills = Skills · About = About + GitHub/email links.

### 4. Work panel
- Section padding top 24px, gap 14px.
- Heading row (padding 0 20px): "Featured" 20px/700 `#4A4340`, hint "Swipe →" 13px `#756D68` aligned right.
- **Featured carousel**: horizontal scroll, `scroll-snap-type: x mandatory`, padding `0 20px 4px`, gap 12px, hidden scrollbar.
  - Card: 290px wide (`flex: 0 0 290px`), `scroll-snap-align: center`, radius 14px, background `#F7F6F5`, overflow hidden.
  - Image: height 150px, `object-fit: cover`, background `#2A2320` while loading.
  - Body padding `14px 16px 16px`, gap 6px:
    - Metric: 28px / 700 / line-height 1 / `#A0600A`
    - Metric label: 13px / `#756D68`
    - Title: 17px / 600 / line-height 1.25 / `#3D3735`
    - Company: 13px / `#756D68`
  - Tap opens the bottom sheet.
- "More work" heading: 20px/700, padding `12px 20px 0`.
- **List rows**: min-height 64px, padding 12px 20px, top border 1px `#EBE7E4`, gap 14px. Thumbnail 52×52, radius 10px. Title 16px/600 `#3D3735`; meta "Company · tech" 13px `#756D68`; chevron "›" 20px `#C4BDB8`. Tap opens the bottom sheet.

### 5. Career panel (timeline)
- Padding 24px 20px.
- Each entry: grid `44px 1fr`, gap 14px.
  - Left: 44px circle, white, 1px border `#E6E2DF`, logo 30×30 `object-fit: contain`. Below it a 2px vertical line `#EBE7E4`, filling the entry height (min 20px).
  - Right (padding-bottom 22px, gap 3px): years 13px/600 `#A0600A`, letter-spacing .04em · role 17px/600 `#3D3735` · company 14px `#756D68` · description (when expanded) 15px / line-height 1.5 / `#6E6662`, margin-top 6px.
- **Tap an entry to expand or collapse it** (accordion; one open at a time; the first is open by default). Use `<button aria-expanded>` for the entry header.
- Under the timeline, an education card: padding 16px, radius 12px, background `#F7F6F5`, SDU logo 36px, gap 12px, title 15px/600, meta 13px `#756D68`.

### 6. Skills panel
- Padding 24px 20px, group gap 22px.
- Group label: 13px / 700 / uppercase / letter-spacing .08em / `#756D68`.
- Chips: as on desktop (15px, `#F3F1EF` background, radius 8px, padding 6px 12px, gap 8px, wrap).

### 7. About panel
- Padding 24px 20px, gap 14px. Paragraphs 16px / line-height 1.6 / `#6E6662`.
- Link list: rows with min-height 52px and a bottom border `#EBE7E4`, label 16px `#3D3735`, right side "↗" or the email address (14px `#756D68`).

### 8. Bottom action bar (always visible)
- `position: fixed; bottom: 0`, full width, padding `12px 16px calc(12px + env(safe-area-inset-bottom))` (mock: 30px bottom).
- Background `rgba(255,255,255,.94)` + `backdrop-filter: blur(10px)`, top border 1px `#EBE7E4`.
- Grid `1fr 1fr 52px`, gap 8px. All buttons are 48px tall with radius 10px, 16px / 600:
  - "Download CV": background `#E8A33D`, text `#1F1815`
  - "LinkedIn": 2px border `#1F1815`, text `#1F1815`, transparent
  - Email icon button: background `#F3F1EF`, icon `#1F1815` (use a proper icon, e.g. Font Awesome `fa-envelope`, which Strata already ships), `aria-label="Email"`
- Add `padding-bottom: 96px` to the page so content isn't hidden behind the bar.

### 9. Project bottom sheet
- Opened by tapping a featured card or a list row.
- Backdrop: `rgba(20,15,12,.5)`; tapping it closes the sheet.
- Sheet: fixed bottom, max-height 78vh, scrollable, white, radius `22px 22px 0 0`.
  - Grab handle 40×5, radius 3px, `#DDDDDD`, padding 10px 0 4px.
  - Image: height 180px, margin `6px 16px 0`, radius 14px, cover.
  - Body padding `18px 20px 34px`, gap 10px: company 13px `#756D68`; title 22px/700/1.2 `#3D3735`; description 16px/1.55 `#6E6662`; tags (13px, text `#7D4A06`, background `#FBEFDC`, radius 6px, padding 4px 9px, gap 6px); project link buttons if any; "Close" button 48px, `#1F1815` background, white text, radius 10px.
- Production: open with `transform: translateY(100%)` → `0`, 250ms `cubic-bezier(.2,.8,.2,1)`; close on Esc, backdrop tap and swipe down (optional). Trap focus while open, and return focus to the card that opened it.

---

## Interactions & state (phone JS)
State: `activeTab` (work | career | skills | about), `headerCollapsed` (bool), `openJobIndex` (int, default 0), `openProject` (id or null).
- Tab click → set `activeTab`, toggle `hidden` on the panels, update `aria-selected`; scroll back to just under the header if needed.
- `IntersectionObserver` on the identity header → `headerCollapsed`.
- Timeline entry click → toggle `openJobIndex`.
- Project click → populate and open the sheet. Project data can come from `data-*` attributes or a hidden `<template>` per project.
- Init only when `matchMedia('(max-width: 736px)').matches`, and re-check on change (clean up when resizing back to desktop: show all panels, close the sheet).
- Respect `prefers-reduced-motion` (no slide animations).

---

## Design Tokens
The full colour scheme with usage rules and contrast ratios is in **`Colour Scheme.md`**. In short:
```css
:root{
  --accent:#E8A33D; --accent-deep:#A0600A; --accent-deeper:#7D4A06; --accent-tint:#FBEFDC;
  --ink:#1F1815; --on-ink:#FFFFFF; --on-ink-muted:rgba(255,255,255,.75);
  --on-ink-subtle:rgba(255,255,255,.6); --on-ink-line:rgba(255,255,255,.2);
  --bg:#FFFFFF; --surface:#F7F6F5; --surface-2:#F3F1EF; --line:#EBE7E4;
  --text-strong:#3D3735; --text:#6E6662; --text-muted:#756D68;
}
```
- Never use `#E8A33D` as text on white. On dark, or as a fill with dark text, only.
- Replace Strata's `#49bf9d` (teal), `#a2a2a2` (body text, ~2.6:1 on white) and `#787878` (headings) with the tokens above.
- Note: the mockup still uses `#8A817C` / `#A2A2A2` for small meta text and inactive tabs. **Use `--text-muted` `#756D68` instead** (the mockup is below 4.5:1 there).

**Typography**: Source Sans 3. Sizes used on phone: 13 (meta, pills, labels), 14, 15 (chips, tabs), 16 (body, buttons), 17 (card/entry titles), 20 (section headings), 22 (sheet title), 26 (name), 28 (metrics). Weights 400 / 600 / 700.
**Radii**: 6 (tags) · 8 (chips) · 10 (buttons, thumbnails) · 12 (info card) · 14 (project cards, sheet image) · 20 (pills) · 22 (sheet top) · 50% (avatars, logos).
**Spacing**: horizontal page padding 20px on phone (24px in the identity header); common gaps 6 / 8 / 12 / 14 / 18 / 22 / 24.
**Shadows**: only the collapsed bar, `0 2px 10px rgba(0,0,0,.2)`.
**Touch targets**: minimum 44px (buttons are 48, tabs 50, list rows 64).

---

## Code cleanup (both layouts)
- Delete the ~300-line commented-out Strata sample block in `index.html`.
- Logo hover overlays: either add the HTML (name + role/degree, as in `portfolioReq.md`) or remove the unused `.overlay` CSS. On phones, the timeline replaces this.
- Remove `user-scalable=no` from the viewport meta tag.
- `alt` on the avatar and all logos and thumbnails.
- `<title>Søren K. Haug — Automation & Embedded Engineer</title>` + `<meta name="description">` + Open Graph tags (title, description, image) for LinkedIn link previews.
- Fix the "Electroincs" typo in the README.
- Background images in the header are ~2.5 MB each. Compress them (WebP, < 300 KB) or drop them.

---

## Assets
All are from the repo (`images/`); copies are included for the mockup:
- `images/Mig_icon.png`: avatar used in the mock (production: use the full-size avatar photo).
- `images/logos/saab.svg`, `linak.svg`, `danish-army.svg`, `sdu.png`
- `images/thumbs/cmake.png`, `ttrpg.png`, `dnd.png`, `CBD6S.png`, `jenkins.svg`, `pclintplus.JPG`
- Note: the mock uses `ttrpg.png` as a stand-in for the SAAB pytest card. Use the correct TactiCall/pytest image.
- Icons: use Strata's bundled Font Awesome (the mock uses the text glyphs ✉ › ↗ as stand-ins).

## Files in this bundle
- `README.md`: this document
- `Colour Scheme.md`: full colour system, contrast ratios, CSS variables
- `Site Review Checklist.md`: the full content + layout review with the reasoning behind each item (also covers the PDF CV)
- `Mobile Layout v2 Amber.dc.html`: **the phone design reference** (amber; open in a browser)
- `Mobile Layout.dc.html`: the earlier teal version, for comparison only
- `support.js`: runtime needed to open the `.dc.html` files
- `images/`: assets used by the mockups
