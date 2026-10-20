# Design that does not look AI-generated

Sources with a long catalogue of tells: the `avoid-ai-design` reference list (67 tells ranked by who
notices), Anthropic's `frontend-design` skill cluster list, 925studios "AI slop tells" (2026-06-14),
Krebs's left-border study.

## The one rule

**A pattern is a tell when it was reached for without a reason.** Before any box, badge, icon,
gradient or animation, name the information it carries. If it carries none, it is decoration a model
would have added for any product, and it does not ship.

## Design the family, never the single component

Real case: a custom date-range button was added next to native `<select>` elements, so one control row
held three controls of different height, border, chevron and type.

- Before adding or restyling any control, list its siblings on the same screen and across the product
  (buttons, selects, inputs, triggers, popovers, tooltips, table headers, chart readouts). Change the
  family together, or match the existing family exactly.
- One family has one height, border, radius, padding, type size, chevron or icon, focus ring, hover,
  disabled and error state. Define it once as a shared class or token set.
- Patterns too: every chart readout, popover and change figure behaves and looks alike.
- Briefs to implementers name the family and require a side-by-side screenshot of all its members.
  Reviews check consistency across the family, not only the new piece.

## Cards are banned as a default

- No card grids. No row of equal boxes with icon, title and line. No KPI tiles, feature cards or bento.
  No card inside a card. No 1 px grey border around every block, no uniform radius with soft shadow, no
  coloured top or left stripe on a box.
- Group with space, alignment, type and rules: a hairline between rows, a column grid, a larger first
  element, a table when the reader compares, prose when the reader reads. Containers are for things
  that genuinely float (a dialog, a popover, a dragged item) or are physically separate (a device
  frame, a receipt).
- One container holding a real surface (one chart, one phone frame) is fine. Three of the same thing
  in a row is not.

## Also banned by default

| Tell | Instead |
|---|---|
| Inter or the system stack as display; the "tasteful free font" set (Space Grotesk, Geist, Instrument Serif, Fraunces) | A face chosen from the subject, loaded for real, with a scale |
| Indigo-to-purple gradient, gradient headline text, neon glow shadows, glassmorphism by reflex | Flat colour with a job; one accent that means something |
| Second-order escapes: cream with terracotta, near-black with one acid accent, hairlines everywhere, all-caps tracked eyebrows, `A · B · C` meta strings, arrows glued to links, mono for labels, one word coloured in a headline, decorative 01/02/03 | Emphasis built into the type system; labels only when they carry information, in sentence case |
| Centred hero, pill badge and three cards; stat strip of round numbers; numbered "how it works"; 4-column footer | Order sections by what this reader must decide; open with the most characteristic real thing (a real screen, a true number, a table) |
| Icon in a tinted rounded square; the worn Lucide set; emoji as icons; status-chip soup | Fewer icons, or none; a chip only for a real changing state |
| Fade-up on every section, stagger everywhere, bounce easing, count-up numbers, hover on everything | One orchestrated moment per screen; ease out without overshoot; numbers are simply shown |
| Vague aspirational headlines, tricolon slogans, Title Case Everything, "Get started" | The sentence the reader needs, with the figure in it |

## Slides

- Action titles: the title states the conclusion in one sentence (15 words or fewer), not the topic.
  Test: reading only the titles tells the story.
- One message per slide. "And" in a title means two slides.
- The body proves the title: a table, a chart with the message in its title, a diagram, or three lines
  of prose. Never three icon boxes.
- Figures carry a source line. Figures from a meeting are quoted as said, with the timestamp.
- Two typefaces at most, one grid, titles that do not move between slides, margins left alone.

Details in `slides.md`.

## Verification before done

Run the checklist in `process.md` step 9: viewport matrix viewed yourself, click test, independent
review, severity 0-4, silhouette test, tell scan. Dashboards and charts also follow `visualisation.md`.

The brief wins over this file. When the owner asks for a card, a gradient or a centred hero, build
that well. Minimal and restrained is not timid; it is a decision.
