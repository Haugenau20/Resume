// The CV. Content comes from cv/content.yaml; the summary arrives as markdown via
// --input summary=…  Build it with `npm run cv` rather than calling typst directly.
//
// Inputs: summary (markdown, required), variant (public | tailored), phone (tailored only).
#import "@preview/modern-cv:0.10.0": *
#import "@preview/cmarker:0.1.10"

#let c = yaml("/cv/content.yaml")
#let variant = sys.inputs.at("variant", default: "public")
#if variant not in ("public", "tailored") { panic("variant must be public or tailored, not " + variant) }
// Markdown, with "<" escaped so text like <team> stays literal instead of vanishing as HTML.
#let md(s) = cmarker.render(s.replace("<", "\\<"), raw-typst: false, set-document-title: false)
#let summary = sys.inputs.at("summary", default: "")
#if summary.trim() == "" { panic("summary is required") }
#let phone = sys.inputs.at("phone", default: "").trim()
#if variant == "tailored" and phone == "" { panic("phone is required for tailored builds") }

#let handle(url) = url.trim("/", at: end).split("/").last()
#let names = c.name.split(" ")
#let author = (
  firstname: names.slice(0, -1).join(" "),
  lastname: names.last(),
  email: c.contact.email,
  homepage: c.contact.site,
  github: handle(c.contact.github),
  linkedin: handle(c.contact.linkedin),
  address: c.location,
  positions: (c.headline,),
)
#if variant == "tailored" { author.insert("phone", phone) }

#set document(date: none)
// modern-cv colours the first name with the accent; keep the whole name in ink.
#show author.firstname: set text(fill: rgb("#1F1815"))
#show: resume.with(
  author: author,
  profile-picture: none,
  date: none,
  accent-color: "#A0600A",
  colored-headers: true,
  show-footer: false,
  paper-size: "a4",
  language: "en",
  font: ("Source Sans 3",),
)

#metadata(author.values().map(v => if type(v) == array { v.join(", ") } else { v }).join("\n")) <contact>

= Summary
#block(md(summary)) <summary>

= Experience
#for r in c.roles [
  #resume-entry(title: r.title, location: "", date: r.years, description: r.org)
  #if r.at("bullets", default: ()).len() > 0 [
    #resume-item[
      #for b in r.bullets [- #b
      ]
    ]
  ]
]

= Skills
#for g in c.skills [
  #resume-skill-item(g.group, g.items)
]
#resume-skill-item("Languages", c.languages.map(l => l.name + " (" + l.level + ")"))

= Education
#for e in c.education [
  #resume-entry(title: e.title, location: "", date: e.years, description: e.school)
  #if e.at("details", default: ()).len() > 0 [
    #resume-item[
      #for d in e.details [- #d
      ]
    ]
  ]
]

#context {
  let n = counter(page).final().first()
  if n > 2 { panic("CV is longer than 2 pages (" + str(n) + "). Shorten the text; don't change the layout.") }
  [#metadata(n) <page-count>]
}
