# Resume Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking. **Never commit in this repo; the owner commits.**

**Goal:** Rebuild the one-page resume site from the Claude Design handoff: CV first, an amber palette, a dedicated phone layout at 736px and below, and template cleanup. Keep the plain HTML/CSS/jQuery stack with no build step.

**Architecture:** One `index.html` serves both layouts. Desktop keeps Strata's fixed left panel. Phones get a separate presentation from a `@media (max-width: 736px)` block in `main.css` plus a vanilla JS module (`assets/js/phone.js`) for the tabs, the collapsing top bar, the timeline accordion and the project bottom sheet. Without JS, phones show every section stacked. The contact address is assembled by `assets/js/contact.js`.

**Tech Stack:** HTML5, Strata CSS (edited directly; `assets/sass/` is deleted), jQuery and Poptrox (existing), vanilla ES2017 for the new modules, GitHub Pages.

**Spec:** `docs/design_handoff_resume_site/README.md`, with `Colour Scheme.md`, `Site Review Checklist.md` and `Mobile Layout v2 Amber.dc.html`.

## Global Constraints

- No framework and no build step. Edit `assets/css/main.css` directly.
- Tokens are copied verbatim from `Colour Scheme.md`. Never put `#E8A33D` text on white.
- The handoff copy is a placeholder. Where it differs, follow these decisions:
  - Role: **Platform Engineer**. Don't play up embedded.
  - Contact: **contact@soren.haug.dk**, assembled with JS, with "Email via LinkedIn" as the no-JS fallback.
  - The featured projects are chosen by the owner later. A project becomes featured by moving its `<article>` into `.work-featured`; nothing else changes.
  - Don't add an "Open to opportunities" pill unless the owner confirms it.
- Canonical and `og:url` stay on `https://haugenau20.github.io/Resume/` until soren.haug.dk is live.
- Phone breakpoint is `max-width: 736px`, matching Strata's `small`.

## Decisions made while building (owner to confirm)

- The LINAK intern and Development Engineer split uses Feb 2023 – Jan 2024 and Feb 2024 – Jul 2024. These are inferred from the thesis end date, because the PDF only gives Feb 2023 – Jul 2024.
- Provisional featured projects: Muninn, NFC Party Controller and Project Build Automation. They're the ones with real images; two of them have real metrics.
- The skills list comes from the PDF plus the current projects, grouped Platform & AI / Build & CI/CD / Test & automation / Embedded / Web. The owner trims it.
- The header photo stays, recompressed, under a 70% `--ink` overlay. Phones get a solid `--ink` header and never download the photo.

## Review Focus

1. **Resizing across 736px** while the bottom sheet is open or a tab is hidden must restore the full desktop page: all sections visible and the sheet closed.
2. **Poptrox on phones:** tapping a project image must open the bottom sheet, not the lightbox. On desktop the lightbox must still work, including the NFC three-image gallery.
3. **No JS:** phones show every section stacked, the email link falls back to LinkedIn, and the tab bar, top bar and sheet stay hidden.
4. **Keyboard:** tabs work with arrow keys, the sheet closes on Esc and returns focus to its opener, and timeline entries toggle with Enter and Space.
5. **Content hidden behind fixed bars:** the last section isn't covered by the bottom action bar, and the sticky tabs aren't covered by the top bar.

---

### Task 1: Cleanup, metadata and assets
**Files:** `index.html`, `assets/css/main.css`, `images/`, `assets/sass/` (delete)
- [x] Delete the commented-out Strata sample block in `index.html`.
- [x] Viewport: `width=device-width, initial-scale=1`. Add `<title>Søren K. Haug — Platform Engineer</title>`, a meta description, Open Graph tags (absolute GitHub Pages URLs) and `<link rel="canonical">`.
- [x] Delete `assets/sass/`, plus the `.overlay`, `.text` and `.logo-container` CSS.
- [x] Recompress `images/bg.jpg` (target under 300 KB) and delete `images/background.jpg`.
- [x] Delete images that nothing references any more (checked by script after Task 4).
- **Verify:** `grep` finds no `user-scalable`, no `formspree` and no `.overlay`. Every local `src`/`href` resolves.

### Task 2: Colour tokens and typography
**Files:** `assets/css/main.css`
- [x] Add the `:root` tokens from `Colour Scheme.md` and switch the font import to Source Sans 3 (400/600/700 + italic 400).
- [x] Remap Strata's colours: `#49bf9d`→accent-deep (fills→accent with ink text), `#5cc6a7`/`#3eb08f`→hover and active amber, `#787878`→text-strong, `#333333`→text, `#b2b2b2`/`#a2a2a2`→text-muted, `#efefef`→line, `#f7f7f7`→surface, `rgba(73,191,157,.1)`→accent-tint.
- [x] Add `:focus-visible` rings: accent-deep on white, accent on dark.
- **Verify:** `grep` finds no `#49bf9d|#5cc6a7|#3eb08f|#787878|#a2a2a2`.

### Task 3: Left panel and contact
**Files:** `index.html`, `assets/css/main.css`, `assets/js/contact.js` (new), `assets/js/main.js`
- [x] Header: avatar (`alt="Søren K. Haug"`), `h1` name, role in `--accent`, one-line hook, a "Denmark" pill, then **Download CV** (accent fill, ink text, 48px, radius 10) and **LinkedIn** (2px accent border) buttons.
- [x] Overlay: `box-shadow: inset 0 0 0 100vmax rgba(31,24,21,.7)`.
- [x] Contact section: remove Formspree. Add a link list with LinkedIn, GitHub and email (`data-mail`). Point the footer email icon at `data-mail` too.
- [x] `contact.js` builds `mailto:` from parts, and fills in the address text where `data-mail="show"`.
- **Verify:** with JS on, the email links read `mailto:contact@soren.haug.dk`. With JS off, they point at LinkedIn.

### Task 4: Sections: About, Experience, Work, Skills, Education
**Files:** `index.html`, `assets/css/main.css`, `assets/js/main.js` (Poptrox caption)
- [x] Order the sections #about → #experience → #work → #skills → #education → #contact, each with `data-tab` = about / career / work / skills / career / about.
- [x] Experience: `<ol class="timeline">` with six entries, logo circles 44px, and years in accent-deep.
- [x] Work: `.work-featured` (large horizontal cards on desktop) and `.work-more` (two-column grid). Every article uses the same markup: thumb, optional `.work-metric`, `h3`, `.work-org`, `.work-desc`, `ul.tech-tags`, `.project-links`. Thumbnails are 16:9 with `object-fit: cover`.
- [x] Poptrox caption: the anchor's `title`, or failing that the article's `h3`.
- [x] Skills: groups of chips (`--surface-2`, `--text-strong`, 15px, radius 8).
- [x] Education: a compact card with SDU and NCO School rows.
- **Verify:** desktop screenshots at 1440 and 1024 wide. The lightbox opens and its captions are correct.

### Task 5: Phone layout (≤736px)
**Files:** `index.html` (tab bar, top bar, action bar, sheet markup), `assets/css/main.css`, `assets/js/phone.js` (new)
- [x] CSS to the handoff spec: identity header, sticky tabs, featured carousel, "more" list rows, timeline, chips, about link list, bottom bar, sheet, and a 96px bottom padding.
- [x] `phone.js` runs only while `matchMedia('(max-width: 736px)')` matches, and tears everything down when that stops matching. It handles:
  - tabs: `aria-selected`, arrow keys, and scrolling back to just under the header
  - an `IntersectionObserver` on `#header` that drives the collapsed bar
  - the timeline accordion, with the first entry open
  - the bottom sheet: built from the clicked article, closing on Esc, backdrop tap or the Close button, with a focus trap and focus returned to the opener, and Poptrox suppressed via a capture-phase click listener
  - respecting `prefers-reduced-motion`
- **Verify:** screenshots at 390×844 for each tab, the collapsed bar, and an open sheet. Resize across 736px with the sheet open.

### Task 6: Final verification
- [x] Run the HTML validator, check that every local link resolves, and grep for leftover teal.
- [x] Desktop and phone screenshots for the owner, and a summary of what changed. Don't commit.
