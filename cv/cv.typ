// The CV. Content comes from cv/content.yaml; the summary arrives as markdown via
// --input summary=…  Build it with `npm run cv` rather than calling typst directly.
//
// Inputs: summary (markdown, required), variant (public | tailored), phone (tailored only),
// content (root-relative path to the content file; default /cv/content.yaml, used by tests).
#import "/cv/vendor/modern-cv/lib.typ": *
#import "@preview/cmarker:0.1.10"

#let c = yaml(sys.inputs.at("content", default: "/cv/content.yaml"))
#let variant = sys.inputs.at("variant", default: "public")
#if variant not in ("public", "tailored") { panic("variant must be public or tailored, not " + variant) }
// Markdown, with "<" escaped so text like <team> stays literal instead of vanishing as HTML.
#let md(s) = cmarker.render(s.replace("<", "\\<"), raw-typst: false, set-document-title: false)
#let summary = sys.inputs.at("summary", default: "")
#if summary.trim() == "" { panic("summary is required") }
#let phone = sys.inputs.at("phone", default: "").trim()
#if variant == "tailored" and phone == "" { panic("phone is required for tailored builds") }

#let handle(url) = url.trim("/", at: end).split("/").last()
#let bare(url) = url.replace(regex("^https?://"), "").trim("/", at: end)
#let names = c.name.split(" ")
// One contact row, in this order: location, phone (tailored only), email, site,
// LinkedIn, GitHub. Built as custom items so the order and wording are ours.
#let contact(text, icon, link: none) = if link == none { (text: text, icon: icon) } else { (text: text, icon: icon, link: link) }
#let author = (
  firstname: names.slice(0, -1).join(" "),
  lastname: names.last(),
  positions: (c.headline,),
  custom: (
    contact(c.location, "location-dot"),
    ..if variant == "tailored" { (contact(phone, "square-phone", link: "tel:" + phone.replace(" ", "")),) },
    contact(c.contact.email, "envelope", link: "mailto:" + c.contact.email),
    contact(bare(c.contact.site), "home", link: c.contact.site),
    contact("LinkedIn", "linkedin", link: c.contact.linkedin),
    contact(handle(c.contact.github), "github", link: c.contact.github),
  ),
)

#set document(date: none)
// modern-cv sets the first name thin and in the accent colour; match it to the last name
// (bold, the template's dark grey). Only the first name is thin, so nothing else changes.
#show text.where(weight: "thin"): set text(weight: "bold", fill: rgb("#333333"))
// The template's light (300) text is too thin on paper; use regular.
#show text.where(weight: "light"): set text(weight: "regular")
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
  // Room to breathe: the template's 10 mm top/bottom and 15 mm sides are cramped.
  page-margin: (x: 20mm, y: 15mm),
  // The headline and contacts are what a reader checks right after the name.
  position-size: 13pt,
  contact-size: 10pt,
  contact-items-separator: h(8pt),
)
// Tool names like OpenBao shouldn't be split across lines, and without hyphenation
// justified lines open wide gaps, so text is left-aligned.
#set text(hyphenate: false)
#set par(justify: false)
// More air between sections.
#let section-gap = 26pt
#show heading.where(level: 1): it => block(above: section-gap, sticky: true, it)

#metadata(author.values().map(v => if type(v) == array { v.map(x => if type(x) == dictionary { x.text } else { x }).join(", ") } else { v }).join("\n")) <contact>

= Summary
#block(md(summary)) <summary>

// A bullet is text, or { text, public } when the public CV should say less (e.g.
// internal numbers): the public build uses `public`, tailored builds use `text`.
#let wording(b) = if type(b) != dictionary { b } else if variant == "public" { b.at("public", default: b.text) } else { b.text }
// Bullet text: 11 pt regular, like the summary (the template's resume-item is 10 pt light).
#let item-text(body) = block(above: 0.5em, below: 1.1em, {
  set text(size: 11pt, weight: "regular", fill: rgb("#131A28"))
  // A little more space between bullets than between the lines of one bullet.
  set par(leading: 0.6em)
  set list(spacing: 0.75em)
  body
})
#let bullets(items) = if items.len() > 0 {
  item-text(for b in items [- #wording(b)
  ])
}

= Experience
// Every job leads with the employer and its dates; each job title follows in bold, with
// its own dates only when one employer had several. `heading` overrides the employer
// line (the career break), and a title already in the heading isn't repeated.
// The title sits between the employer (bold) and the bullets (regular): medium weight
// in the accent colour, tucked close under its employer.
#let role-line(title, years) = block(above: 0.55em, below: 0.45em, sticky: true, grid(
  columns: (1fr, auto),
  align: (left + bottom, right + bottom),
  text(size: 11pt, weight: "medium", fill: rgb("#A0600A"), title),
  text(size: 9pt, fill: rgb("#5d5d5d"), years),
))
#block(for job in c.experience {
  let heading = job.at("heading", default: job.org)
  resume-entry(title: heading, location: job.years)
  for p in job.positions {
    if not heading.contains(p.title) {
      role-line(p.title, if job.positions.len() > 1 { p.at("years", default: "") } else { "" })
    }
    bullets(p.at("bullets", default: ()))
  }
}) <experience>

#if c.at("projects", default: ()).len() > 0 [
  = Selected projects
  #item-text[
    #for p in c.projects {
      let url = p.at("link", default: none)
      let name = strong(p.name)
      [- #name#if url != none [ · #link(url, bare(url))] — #p.text
      ]
    }
  ]
]

// Education comes before skills and stays in one piece: it fills the end of page 1
// when the summary is short, and moves to page 2 as a whole when it isn't.
#block(breakable: false, above: section-gap)[
  = Education
  #for e in c.education [
    #resume-entry(title: e.title, location: "", date: e.years, description: e.school)
    #if e.at("details", default: ()).len() > 0 [
      #item-text[
        #for d in e.details [- #d
        ]
      ]
    ]
  ]
]

// The skills table stays in one piece: a row or two alone on the next page looks broken.
#block(breakable: false, above: section-gap)[
  = Skills
  #for g in c.skills [
    #resume-skill-item(g.group, g.items)
  ]
  #resume-skill-item("Languages", c.languages.map(l => l.level + " " + l.name))
]

#context {
  let n = counter(page).final().first()
  if n > 2 { panic("CV is longer than 2 pages (" + str(n) + "). Shorten the text; don't change the layout.") }
  [#metadata(n) <page-count>]
}
