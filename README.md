# Søren K. Haug - Platform Engineer

Source for my resume site, [soren.haug.dk](https://soren.haug.dk/). I'm a Platform Engineer at SAAB Danmark A/S, building AI tooling for developers, with a background in test automation, CI/CD and embedded software.

## 📬 Get In Touch

- [Portfolio Website](https://soren.haug.dk/)
- [LinkedIn](https://www.linkedin.com/in/s%C3%B8ren-kj%C3%A6degaard-haug-0723855a/)

## Checking changes

The site has no build step, but it has a test suite. It opens the page in your installed Chrome at desktop, tablet and phone sizes, with and without JavaScript, then runs the HTML validator:

```
npm install
npm test
```

`npm run test:shots` also saves a screenshot of each state to `tests/shots/`. If Chrome isn't found, set `CHROME_PATH` to its executable.

## Generating the CV

The CV and cover letters are built with [Typst](https://typst.app/) 0.15.1 from the files in `cv/`:

- `cv/content.yaml` holds roles, education, skills and languages. Role titles, employers and dates must match the site's timeline; `npm test` fails if they drift.
- `cv/summary.md` is the summary on the public CV.
- `cv/cv.typ` and `cv/letter.typ` lay them out (the [modern-cv](https://typst.app/universe/package/modern-cv) and [neat-cv](https://typst.app/universe/package/neat-cv) templates). The fonts are vendored in `cv/fonts/`, so every machine produces the same PDF.

Install Typst once with `winget install Typst.Typst`, then open a new terminal.

Run `make` to see the shortcuts: `make cv`, `make new COMPANY="Acme" ROLE="Platform Engineer"`, `make app APP="Acme/Platform Engineer"` and `make test`. Each one runs the npm command shown below.

### The public CV

```
npm run cv
```

While `content.yaml` says `status: draft`, this writes a preview to `cv/.build/Resume-draft.pdf` and leaves `files/Resume.pdf` alone. Change it to `status: final` and the same command regenerates `files/Resume.pdf`, the file the site links to. From then on `npm test` fails whenever that PDF is older than its content, so commit them together.

### Applications

Each application gets a folder with a tailored `summary.md` and a `cover-letter.md`. The folders live outside the repo: copy `cv/local.example.json` to `cv/local.json` (gitignored) and set `applicationsDir`, your phone number and, optionally, the photo for cover letters. Without `cv/local.json`, applications go in `cv/applications/` (also gitignored).

```
npm run cv:new -- "Acme" "Platform Engineer"     # creates Acme/Platform Engineer/, seeded from your latest application
npm run cv -- "Acme/Platform Engineer"           # builds Resume.pdf and CoverLetter.pdf in that folder
```

- `summary.md` starts with front matter: `company`, `role` and, once sent, `sent: 2026-11-30` (the cover letter's date; today's date until then). Any other keys, such as `posting` or `notes`, are kept but ignored.
- `cover-letter.md` is the whole letter, greeting and sign-off included. A single line break stays a line break; a blank line starts a new paragraph.
- Both files are Markdown: `**bold**`, `*italic*` and `[links](https://…)` work.
- The build stops with an error if the CV runs past 2 pages or the letter past 1. Shorten the text rather than changing the layout.
- It never overwrites a PDF it didn't make, so older Word exports in the same folder are safe.

---

Feel free to explore my repositories to see more of my work, or reach out if you'd like to discuss potential opportunities.