// The cover letter. The letter text arrives as markdown via --input letter=…, including
// the greeting and the sign-off. Build it with `npm run cv` rather than calling typst directly.
//
// Inputs: letter (markdown, required), company, role, date (e.g. "30 November 2026"),
// phone (required), photo (root-relative path, default: the site photo).
#import "@preview/neat-cv:1.2.0": letter
#import "@preview/cmarker:0.1.10"

#let c = yaml("/cv/content.yaml")
// Markdown, with "<" escaped so text like <team> stays literal instead of vanishing as HTML.
#let md(s) = cmarker.render(s.replace("<", "\\<"), raw-typst: false, set-document-title: false)
#let body = sys.inputs.at("letter", default: "")
#if body.trim() == "" { panic("letter is required") }
#let phone = sys.inputs.at("phone", default: "").trim()
#if phone == "" { panic("phone is required for cover letters") }
#let company = sys.inputs.at("company", default: "")
#let role = sys.inputs.at("role", default: "")
#let date = sys.inputs.at("date", default: none)
#let photo = sys.inputs.at("photo", default: "/images/Mig_LINAK_close.jpg")

#let names = c.name.split(" ")
#let ink = rgb("#1F1815")

#set document(
  title: ("Cover letter", role, company).filter(s => s != "").join(" – "),
  author: c.name,
  date: none,
)
#set text(lang: "en")

#show: letter.with(
  author: (
    firstname: names.slice(0, -1).join(" "),
    lastname: names.last(),
    email: c.contact.email,
    phone: phone,
    website: c.contact.site,
    address: c.location,
    position: (c.headline,),
  ),
  profile-picture: image(photo),
  recipient: [#block[Hiring team #if company != "" [\ #company]] <recipient>],
  date: if date == none { auto } else { date },
  accent-color: rgb("#A0600A"),
  header-text-color: ink,
  heading-font: "Source Sans 3",
  body-font: ("Source Sans 3",),
  paper-size: "a4",
)

// The template's light body weight is too thin on paper with Source Sans 3.
#set text(weight: "regular")

#if role != "" [*Application: #role* <subject>]

// A letter is written line by line: a single newline is a line break (the sign-off
// stays on two lines), and a blank line still starts a new paragraph.
#block(md(body.replace(regex("\r?\n"), "  \n"))) <letter-body>

#context {
  let n = counter(page).final().first()
  if n > 1 { panic("Cover letter is longer than 1 page (" + str(n) + "). Shorten the text; don't change the layout.") }
  [#metadata(n) <page-count>]
}
