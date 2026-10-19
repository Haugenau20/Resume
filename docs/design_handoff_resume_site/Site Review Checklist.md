# Resume Site — Review Checklist

## 1. Purpose & structure
*Why: A site that tries to be both a CV and a portfolio ends up doing neither well. Visitors (mostly recruiters and hiring managers) arrive with one question: "Is this person relevant for my role?" The layout should answer that in seconds, then offer proof for anyone who wants to look deeper.*

- [ ] Decide the main job of the site: **CV first, projects as proof** (recommended)
  — Recruiters screen, engineers verify. The CV content gets you shortlisted; projects back it up in interviews.
- [ ] Reorder sections: About → Experience → Selected work → Skills → Education → Contact
  — This is the order a reader asks questions in: who are you, where have you worked, what have you built, what can you do, where did you study, how do I reach you.
- [ ] Add a **Skills** section (reuse PDF skill groups, trimmed to what you'd defend in an interview)
  — Recruiters look for keywords. A short, honest list is easier to scan and more believable than a long one.

## 2. Left panel (header)
*Why: It's the only part that's on screen the whole time on desktop. Use that fixed space for the things that should always be visible: who you are and how to act on it.*

- [ ] Replace "Welcome!" with **name + role** (e.g. "Automation & Embedded Engineer")
  — "Welcome" uses up the most important spot on the page without saying anything. Your role is what lets people place you.
- [ ] One-line hook: current role and what you're open to
  — It tells visitors right away whether to keep reading, and signals you're approachable.
- [ ] Real buttons near the top: **Download CV** and **LinkedIn**
  — These are the two actions most visitors want. Small icons at the bottom are easy to miss.
- [ ] Check mobile (<980px): contact links shouldn't end up far down in the footer
  — Many first visits come from a LinkedIn link on a phone. On small screens Strata moves the contact icons to the very bottom.

## 3. Experience
*Why: For a resume site, career history is the main content. Logos say "I was there", but not what you did or how you grew.*

- [ ] Replace logo-only grid with a **compact timeline**: role · company · years · one line
  — Readers can see how you've progressed and how long you stayed, without opening the PDF.
- [ ] Show the LINAK intern → engineer promotion
  — A promotion shows someone else valued your work. It's one of the strongest things you can show.
- [ ] Keep logos small inside the timeline, or drop them
  — Logos help people recognize names, but shouldn't be the content.

## 4. Projects
*Why: Projects are your evidence. Six equal cards make everything look equally important, so your strongest work doesn't stand out.*

- [ ] Lead with **2–3 flagship projects** (larger cards), then a smaller "more" row
  — The order shows what you're proudest of. Visitors usually read the first two and skim the rest.
- [ ] One measurable result per project (79% faster builds is the model)
  — Numbers stick in memory and show impact. "Improved quality" can be said about any project.
- [ ] Make thumbnails consistent (same aspect ratio and style)
  — Mismatched images make the grid look unfinished and pull attention away from the text.
- [ ] Consistent buttons: same wrapper, all external links in a new tab
  — Small inconsistencies add up to a feeling of carelessness, especially for a quality and testing profile.

## 5. Education
- [ ] Collapse to one line or a small list; less space than experience
  — With professional experience, education becomes background. It's important, but it shouldn't compete with your work history for space.

## 6. Contact
*Why: The goal is as little friction as possible for genuine contacts, and as little exposure as possible to spam.*

- [ ] **Remove Formspree** form and the `#six` email anchor
  — Forms feel impersonal to recruiters, add a third-party dependency, and can lose messages without anyone noticing.
- [ ] Primary: **LinkedIn** button
  — It's where recruiters already work, it shows no email, and messages come with the sender's profile.
- [ ] Secondary: dedicated domain address (rotatable), hidden from bots (put together with JS)
  — A real address you control is professional. If it gets spammed you rotate it, and your personal inbox is never exposed.
- [ ] Use the same rotatable address in the PDF CV
  — The PDF is public too. Otherwise the protection on the site doesn't help.

## 7. Visual identity
*Why: Strata is a popular free template. A few personal touches make it read as "your site" instead of "a template".*

- [ ] One personal accent color, stronger name treatment
  — A small investment that makes the site memorable and consistent with the PDF.
- [ ] Use less background photo / pattern so it feels less like the stock template
  — It puts focus on the content, and the page loads faster (the current backgrounds are around 2.5 MB each).

## 8. Code cleanup
*Why: Your site is also a code sample. Anyone technical who opens the repo or the page source will judge it.*

- [ ] Delete the ~300-line commented-out template sample block
  — Dead code suggests an unfinished job and makes the file harder to maintain.
- [ ] Logo hover overlays: add the HTML or remove the unused `.overlay` CSS
  — Either the feature is there or it isn't. Half-built is the worst option.
- [ ] Remove `user-scalable=no` (lets people zoom)
  — Blocking zoom is an accessibility failure and annoys mobile users.
- [ ] Alt text on the avatar; labels on any remaining inputs
  — Your own requirements doc asks for accessibility. It also helps search engines.
- [ ] Page `<title>` with your role + a `<meta name="description">`
  — This is what shows in Google results and link previews. Right now it's just your name.
- [ ] Fix "Electroincs" typo in README
  — Typos in a public repo are easy to spot and easy to avoid.

## 9. PDF CV (keep in sync with the site)
*Why: The PDF is what gets forwarded, printed and saved in applicant-tracking systems. It often travels further than the site itself.*

- [ ] Add contact line: email (domain address), LinkedIn, GitHub
  — A CV without contact details makes it harder for people to reach you once it's been forwarded.
- [ ] Add the 79% build-time result under LINAK
  — It's your strongest number and it's missing from the document that matters most.
- [ ] Tighten the summary to 2 concrete sentences; cut generic phrases
  — Phrases like "passionate about innovation" get skimmed past. Concrete claims get read.
- [ ] Add numbers to bullets (tests, coverage, pipeline time, defects)
  — Numbers turn duties into achievements, and give interviewers something to ask about.
- [ ] Name the TTRPG apps under the independent role
  — Vague freelance periods can look like gaps. Named, live projects prove the time was productive.
- [ ] Trim the skills list; drop the soft-skill lists
  — Every listed skill can come up in an interview. Your leadership is better shown by the army bullets than by a "leadership" heading.
- [ ] Fit on one page, or fill page 2 properly
  — A mostly empty second page looks like overflow, not like more content.
- [ ] Use the same dash style in all dates (–) and write "pytest" the same way everywhere
  — Attention to detail matters for a testing and quality role. Readers notice.
