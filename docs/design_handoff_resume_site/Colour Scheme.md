# Colour Scheme — Desktop & Phone

One palette for the whole site and the PDF CV: warm neutrals (based on Strata's `#1f1815` header) plus **one amber accent in two shades**. Contrast ratios are approximate (WCAG; 4.5:1 is the minimum for body text, 3:1 for large text and UI elements).

## Accent
| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--accent` | `#E8A33D` | Fills and highlights **on dark**: role line in the header, status pill, primary button background, active tab underline, focus ring on dark | 8.1:1 on `#1f1815` |
| `--accent-deep` | `#A0600A` | Accent **text on white**: links, result numbers, timeline dates, focus ring on white | 5.0:1 on white |
| `--accent-deeper` | `#7D4A06` | Link hover, tag text | 7.4:1 on white |
| `--accent-tint` | `#FBEFDC` | Tag/chip background, subtle highlighted rows | 6.5:1 with `--accent-deeper` |

**Rule:** never put `#E8A33D` text on white (2.2:1). On amber fills, use dark text (`#1f1815`), not white.

## Dark (header / identity)
| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--ink` | `#1F1815` | Desktop side panel, phone header and collapsed bar, dark buttons | — |
| `--on-ink` | `#FFFFFF` | Name, headings on dark | 17.5:1 |
| `--on-ink-muted` | `rgba(255,255,255,.75)` | Intro text on dark | ~11:1 |
| `--on-ink-subtle` | `rgba(255,255,255,.6)` | Small secondary text on dark (role in collapsed bar) | ~6:1 |
| `--on-ink-line` | `rgba(255,255,255,.2)` | Outline pills, dividers on dark | — |

## Light (content)
| Token | Hex | Use | Contrast on white |
|---|---|---|---|
| `--bg` | `#FFFFFF` | Main content background | — |
| `--surface` | `#F7F6F5` | Cards, featured project tiles, education box | — |
| `--surface-2` | `#F3F1EF` | Skill chips, secondary buttons | — |
| `--line` | `#EBE7E4` | Borders, dividers, timeline line (one value instead of today's three) | — |
| `--text-strong` | `#3D3735` | Headings, titles | 11.7:1 |
| `--text` | `#6E6662` | Body text | 5.6:1 |
| `--text-muted` | `#756D68` | Small meta text (company, dates, captions), inactive tabs | 5.1:1 |

## Replace these Strata defaults
- **`#49bf9d` (teal)** → `--accent` / `--accent-deep` depending on whether it sits on dark or on white.
- **`#a2a2a2` (body text)** → `--text`. Strata's grey body text is only about 2.6:1 on white, which is too light to read comfortably, especially on phones outdoors.
- **`#787878` (headings)** → `--text-strong`.
- Mockup leftovers `#8a817c` and `#a2a2a2` (meta text and inactive tabs) → `--text-muted`. Both are below 4.5:1 at small sizes.

## Desktop vs phone
Same palette and roles on both. Only the placement changes:
- **Desktop:** `--ink` side panel with photo, name in `--on-ink`, role in `--accent`. Primary CV button: `--accent` fill, `--ink` text. White content area to the right.
- **Phone:** `--ink` identity block that collapses into an `--ink` top bar. White content with tabs (active = `--text-strong` + `--accent` underline). The bottom action bar is translucent white with the `--accent` CV button, an `--ink` outlined LinkedIn button and a `--surface-2` email button.
- **Background photo** on the desktop panel: keep it dark (overlay at least 70% `--ink`) so the amber and white text keep their contrast.

## PDF CV
Use `--ink` for the name, `--accent-deep` for section headings or rules, and `--text` for body text. Avoid `--accent` on white paper; it prints weakly.

## CSS starting point
```css
:root{
  --accent:#E8A33D; --accent-deep:#A0600A; --accent-deeper:#7D4A06; --accent-tint:#FBEFDC;
  --ink:#1F1815; --on-ink:#FFFFFF; --on-ink-muted:rgba(255,255,255,.75);
  --on-ink-subtle:rgba(255,255,255,.6); --on-ink-line:rgba(255,255,255,.2);
  --bg:#FFFFFF; --surface:#F7F6F5; --surface-2:#F3F1EF; --line:#EBE7E4;
  --text-strong:#3D3735; --text:#6E6662; --text-muted:#756D68;
}
a{color:var(--accent-deep)} a:hover{color:var(--accent-deeper)}
#header a{color:var(--accent)}
:focus-visible{outline:2px solid var(--accent-deep);outline-offset:2px}
#header :focus-visible{outline-color:var(--accent)}
```
To migrate: search `main.css` for `#49bf9d`, `#a2a2a2` and `#787878` and swap them for the variables above.
