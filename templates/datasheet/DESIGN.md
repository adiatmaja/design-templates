# DESIGN.md: datasheet world

Visual world for a work tool and everything made from it (screens, decks, printed sheets): an
**engineering datasheet set beside the drawing it describes**. Every figure carries its unit, its
tolerance and the source it came from; the drawing is lettered like a technical sheet, with a grid, a
title block and dimension lines. Swiss International Style on the IBM Carbon 2x grid.
Tokens live in `kit/tokens.css` (the only place for hex values), page components in `kit/mockup/kit.css`
and `kit/mockup/kit.js`, a live example in `examples/dashboard/`, a deck in `examples/deck/`, and every
token and state in `kit/styleguide.html`. Product and audience belong in `PRODUCT.md`, decisions in
`DECISIONS.md`. Research sources are in `guide/ux-theory.md`.

This file is a worked example of a filled `starter/DESIGN.md`. Its example subject is a delivery
forecast for one project; the world fits any tool that answers a question with a drawing and the
figures behind it.

## Overview

- **THESIS.** One question per screen, answered in one line, then defended figure by figure. In the
  example: does the project finish by its committed date, and which task decides that? Colour appears
  only for what is selected and for a status, and a status always carries a shape and a word.
- **OWN-WORLD.** A white sheet, one near-black ink in three weights, hairlines between rows and a 2 px
  ink rule over a block **instead of boxes**. Plex Sans Condensed is the drawing's own lettering (page
  title, headline figures, title block); Plex Sans carries running text; Plex Mono only machine strings
  (caption numbers, source marks, axis values, dimensions). One mark colour means "active" and nothing
  else.
- **STORY.** The drawing shows the work as it stands: eleven tasks on a time axis in working days, the
  chain of tasks that sets the finish, and where the forecast lands against the commitment. The dock
  shows the same thing as figures: the forecast with its spread, the task that carries most of that
  spread, the people it takes and what it costs, and where each number came from.
- **FIRST VIEWPORT.** A thin bar (brand, pages, sample-data stamp) over a 2 px rule. Left: the page
  title with its figure caption and the layer switches, then the drawing in its frame (an axis on top,
  a grid every working week, the committed date as a dashed line, the forecast as a solid line in a
  hatched band, dimension lines underneath), then the title block (key, pointer position, grid,
  revision, date). Right: the dock, opening on the verdict with its condition ("Finishes 3.0 working
  days after the committed date"), the forecast duration with its tolerance and the basis of that
  tolerance named under it, the range against the commitment, and the checks. On a phone the verdict
  and the forecast lead, above the drawing.
- **THE DEVICES OF THE FORM**, each kept because it carries a fact:
  - the **title block** under the drawing and under every slide (who, what, sheet n of N, revision),
    one labelled value per cell;
  - **caption numbers** (`Fig. 2`, `Table 1`), the same on the page and in the deck, cited by the
    checks and read back into the source register's "Used in" column;
  - **units in a column of their own** in every spec table, the deck cover included (characteristic,
    value, unit, basis);
  - **tolerance notation** on the headline figure (`64.0 ± 3.5 working days`), with its basis named on
    screen: one spread of the three-point estimates, summed along the critical path;
  - **dimension lines** under the drawing for the selected task, the whole duration and the gap to the
    commitment, drawn as on a drawing (oblique ticks, dashed extension lines, the text breaking the
    line);
  - **source marks** (`S1` to `S6`) after every figure, with an unverified source flagged in words.
- **NO PROSE.** On-screen text is a label, a figure with its unit, or a one-line check. The reasoning
  sits in the source card, a slide's numbered notes, or the speaker notes.
- **ANTI-AI** (`guide/anti-ai-design.md`). Banned: card grids, KPI tiles, pill chips, icons in coloured
  squares, gradients, block shadows, radius beyond 2 px on a control, donuts or gauges, stacked bars,
  count-up, fade-in, capital eyebrows, a hue per category.
- **FORM.** An engineering datasheet beside a drawing. No variants round with an owner has been run
  for this template; run one (`guide/process.md`) before it carries a real project.

## Colors

Strategy: **Restrained**. Sheet and ink carry the surface; comparisons, tracks and tolerance bands are
grey (IBCS: actual dark, comparison grey); the mark is for whatever is active; status hues appear only
with a shape and a word.

### Palettes

Three palettes fill the same roles. A palette redefines the sheet, ink, mark and grey roles only;
status, type, space and shape are shared, so no component changes between them. Choose one with
`<html data-palette="whiteprint">` (README, "Palettes"); with no attribute the page is Drafting.

| Role | Token | Drafting (default) | Whiteprint | Vellum |
|---|---|---|---|---|
| Material | | plotter ink on white bond: the printed datasheet | a diazo print: blue-violet line work (no black anywhere) on a lilac-cast sheet | graphite on warm tracing vellum over a dotted underlay, Prussian blue as the mark |
| Sheet (ground, the drawing inside its frame) | `--sheet` | `#FFFFFF` | `#F1EFF8` | `#F5F1E4` |
| Recessed field (canvas, hovered row, tab strip) | `--sheet-2` | `#F2F4F6` | `#E3E0F0` | `#E9E2CD` |
| Ink: text, figures, the drawing frame | `--ink` | `#13171D` | `#1E1950` | `#2A2722` |
| Secondary text, outline of a bar with float | `--ink-2` | `#3A4350` | `#3A3479` | `#47433B` |
| Units, ticks, source lines, links | `--ink-3` | `#56606D` | `#4F4A8A` | `#5A554A` |
| Hairline between rows | `--rule` | `#D3D8DE` | `#C8C3E3` | `#D5CCB3` |
| Control edge | `--edge` | `#7D8794` | `#6E68A8` | `#7F7764` |
| Grid on the drawing | `--grid` | `#C9CFD6` | `#ADA6D6` | `#A89C7C` |
| Grid line (`stroke-dasharray`) | `--grid-dash` | `none`: solid | `5 3`: broken, as a diazo copy reproduces it | `1 4`: dotted, the underlay seen through |
| Mark: selection, focus, primary action, measured series | `--mark` | `#1C4597` | `#6A1FA8` | `#1A5570` |
| Mark, lighter step: critical bars, second rank | `--mark-2` | `#6181BE` | `#9064C9` | `#4E8299` |
| Ground of a selected row, in a table or on the drawing | `--tint` | `#E9EEF8` | `#E5D9F4` | `#DCE5E3` |
| Comparison line / bars and hatch | `--cmp` / `--cmp-fill` | `#878F9A` / `#C2C8CF` | `#847EAE` / `#C1BCDD` | `#877F6D` / `#C8BEA4` |
| Range track / tolerance band | `--track` / `--band` | `#E8EBEE` / `#BCC3CB` | `#E0DDEE` / `#B3ADD5` | `#E4DCC6` / `#BDB08E` |

Status, shared by all three: pass `#2F8A5B` / `#1C6641` / `#E6F2EB` (fill / ink / tint), caution
`#DCA312` / `#755000` / `#FBF1D6`, fault `#B42A20` / `#A3251C` / `#FAE8E6`. The caution fill is
2.2:1 on the sheet, so it is never alone: it is ringed in caution ink and worded.

### Contrast, measured

Every pair the kit paints, measured with the WCAG 2 formula from `kit/tokens.css` in each palette. The
floor is 4.5:1 for text and 3:1 for a mark or a control edge. **All 44 pairs pass in all three
palettes; the lowest text pair is 5.40:1 (Drafting), 5.57:1 (Whiteprint), 5.59:1 (Vellum).** The
styleguide measures the same list live in the browser, per palette.

| Pair | Use | Floor | Drafting | Whiteprint | Vellum |
|---|---|---|---|---|---|
| `--ink` on `--sheet` | body text, figures, row labels on the drawing | 4.5:1 | 17.98:1 | 14.08:1 | 13.16:1 |
| `--ink` on `--sheet-2` | text on the canvas and a hovered row | 4.5:1 | 16.31:1 | 12.36:1 | 11.49:1 |
| `--ink` on `--tint` | text in a selected row | 4.5:1 | 15.45:1 | 11.88:1 | 11.59:1 |
| `--ink-2` on `--sheet` | secondary text | 4.5:1 | 10.01:1 | 9.47:1 | 8.71:1 |
| `--ink-2` on `--sheet-2` | secondary text and dimension text on the canvas | 4.5:1 | 9.08:1 | 8.31:1 | 7.60:1 |
| `--ink-3` on `--sheet` | units, ticks, source lines | 4.5:1 | 6.38:1 | 6.88:1 | 6.56:1 |
| `--ink-3` on `--sheet-2` | axis labels on the canvas, tab strip | 4.5:1 | 5.79:1 | 6.04:1 | 5.73:1 |
| `--ink-3` on `--tint` | units in a selected row | 4.5:1 | 5.49:1 | 5.81:1 | 5.77:1 |
| `--ink-3` on `--caution-tint` | units in a caution row | 4.5:1 | 5.67:1 | 6.96:1 | 6.58:1 |
| `--ink-3` on `--fault-tint` | units in a fault row | 4.5:1 | 5.40:1 | 6.63:1 | 6.27:1 |
| `--mark` on `--sheet` | selected tab label, link, source mark on hover | 4.5:1 | 8.95:1 | 7.77:1 | 7.21:1 |
| `--mark` on `--sheet-2` | selected label on the tab strip | 4.5:1 | 8.11:1 | 6.82:1 | 6.30:1 |
| `--mark` on `--tint` | selected row label, in a table or on the drawing | 4.5:1 | 7.69:1 | 6.55:1 | 6.35:1 |
| `--sheet` on `--mark` | primary button label | 4.5:1 | 8.95:1 | 7.77:1 | 7.21:1 |
| `--sheet` on `--fault` | danger button label | 4.5:1 | 6.38:1 | 5.60:1 | 5.64:1 |
| `--pass-ink` on `--sheet` | status word pass | 4.5:1 | 6.94:1 | 6.09:1 | 6.14:1 |
| `--pass-ink` on `--pass-tint` | pass word on its tint | 4.5:1 | 6.04:1 | 6.04:1 | 6.04:1 |
| `--caution-ink` on `--sheet` | status word caution | 4.5:1 | 7.23:1 | 6.35:1 | 6.40:1 |
| `--caution-ink` on `--caution-tint` | caution word on its tint | 4.5:1 | 6.42:1 | 6.42:1 | 6.42:1 |
| `--caution-ink` on `--sheet-2` | caution word on the canvas | 4.5:1 | 6.56:1 | 5.57:1 | 5.59:1 |
| `--fault-ink` on `--sheet` | status word fault, error text | 4.5:1 | 7.40:1 | 6.50:1 | 6.55:1 |
| `--fault-ink` on `--fault-tint` | fault word on its tint | 4.5:1 | 6.25:1 | 6.25:1 | 6.25:1 |
| `--fault-ink` on `--sheet-2` | fault word on the canvas | 4.5:1 | 6.71:1 | 5.70:1 | 5.72:1 |
| `--ink` on `--caution-tint` | text in a caution row | 4.5:1 | 15.97:1 | 14.24:1 | 13.21:1 |
| `--ink` on `--fault-tint` | text in a fault row | 4.5:1 | 15.20:1 | 13.55:1 | 12.57:1 |
| `--edge` on `--sheet` | control boundary | 3:1 | 3.64:1 | 4.38:1 | 3.93:1 |
| `--edge` on `--sheet-2` | control boundary on the canvas | 3:1 | 3.30:1 | 3.85:1 | 3.43:1 |
| `--mark` on `--sheet` | focus ring, measured series | 3:1 | 8.95:1 | 7.77:1 | 7.21:1 |
| `--mark` on `--tint` | selected bar on its selected row | 3:1 | 7.69:1 | 6.55:1 | 6.35:1 |
| `--mark-2` on `--sheet` | critical bar | 3:1 | 3.89:1 | 3.80:1 | 3.73:1 |
| `--ink-2` on `--sheet` | outline of a bar with float | 3:1 | 10.01:1 | 9.47:1 | 8.71:1 |
| `--ink-3` on `--sheet` | links, float lines, dimension lines | 3:1 | 6.38:1 | 6.88:1 | 6.56:1 |
| `--ink` on `--sheet-2` | drawing frame against the canvas | 3:1 | 16.31:1 | 12.36:1 | 11.49:1 |
| `--cmp` on `--sheet` | comparison line, target line | 3:1 | 3.27:1 | 3.31:1 | 3.52:1 |
| `--pass` on `--sheet` | pass mark | 3:1 | 4.28:1 | 3.76:1 | 3.79:1 |
| `--fault` on `--sheet` | fault mark | 3:1 | 6.38:1 | 5.60:1 | 5.64:1 |
| `--ink` on `--band` | value mark over the tolerance band | 3:1 | 10.11:1 | 7.52:1 | 6.92:1 |
| `--ink` on `--track` | value mark on the range track | 3:1 | 15.03:1 | 12.02:1 | 10.87:1 |
| `--mark` on `--mark-2` | selected bar against a critical one (told apart by position and label, not contrast) | none | 2.30:1 | 2.04:1 | 1.93:1 |
| `--cmp` on `--band` | target tick over the tolerance band (told apart by its dash and label) | none | 1.84:1 | 1.77:1 | 1.85:1 |
| `--grid` on `--sheet` | grid on the drawing (a visibility floor, not a WCAG pair) | 1.3:1 | 1.57:1 | 2.00:1 | 2.41:1 |
| `--rule` on `--ink` | deck control bar label | 4.5:1 | 12.54:1 | 9.44:1 | 9.29:1 |
| `--sheet` on `--ink` | deck counter, notes and contents text | 4.5:1 | 17.98:1 | 14.08:1 | 13.16:1 |
| `--edge` on `--ink` | disabled deck control, notes rule | 3:1 | 4.94:1 | 3.21:1 | 3.35:1 |

- **The grid is not a WCAG pair.** It sits behind the bars as a drawing aid, so its floor is visibility
  (1.3:1 on the sheet), not 3:1; at 3:1 it would compete with the bars it measures.
- **Two pairs have no floor on purpose.** The selected bar and a critical bar differ by position and by
  the bold label of the selected row, and the target tick over the band by its dash and its label; the
  ratio is recorded, not judged.
- **Disabled controls are exempt** from the text minimum (WCAG 1.4.3 excludes inactive components).
  The kit still keeps them legible: a disabled control reads `--ink-3` on `--sheet-2` (5.73:1 at the
  lowest), and the deck's disabled Previous and Next buttons are `--edge` on `--ink` (3.21:1 at the
  lowest).
- The styleguide draws a mark or control-edge pair as a bar, not as text, so no 3:1 pair is ever shown
  as a text sample.

Rules: no hex outside `tokens.css`. The mark is never decoration. Categories are told apart by name and
position, not by hue. Never mute text with opacity; use `--ink-2` or `--ink-3`.

## Typography

| Role | Face | Token | Use |
|---|---|---|---|
| The drawing's lettering | IBM Plex Sans Condensed (400, 500, 600) | `--cond` | headline figure 40 px, block figure 32, page title 25, title-block captions 14; on a slide the title, the cover's spec values and the title block |
| Running text | IBM Plex Sans | `--sans` | block heading 20, body, controls and table figures 16, units and meta 14 |
| Machine strings | IBM Plex Mono | `--mono` | caption numbers, source marks, title-block values, axis values on the drawing, dimension text; 14 px |

All three load from Google Fonts in one pinned `@import` in `kit/base.css`. Condensed is kept to the
few large strings a technical sheet letters in its title block; running text in it would read cramped.

- Screen scale on a 1.25 ladder above the body: `--fs-meta` 0.875 rem, `--fs-body` 1, `--fs-h2` 1.25,
  `--fs-h1` 1.5625, `--fs-fig` 2, `--fs-fig-lg` 2.5. **No text below 14 px on a screen**;
  `html.sheet` raises the root to 17 px from 2200 px wide.
- Tabular figures in tables, axes and the title block. A unit is set smaller, in `--ink-3`, after a
  space; it never shares the figure's size.
- No tracked capitals, no eyebrows, no coloured word in a title.
- No em dash as clause glue. A detector that counts em dashes also matches the double hyphen that
  starts every CSS custom property name (`--sheet`, `--fs-meta`); the styleguide prints those names by
  design, so its count there is a false positive.

## Layout

- Space on the Carbon 2x grid, an 8 px unit with a 4 px half step: `--s-1` 4 px to `--s-16` 64 px, and
  no 20 px rung. Rhythm: `--gap-in` 12 px inside a group, `--gap-group` 24 between groups, `--gap-block`
  40 between blocks. Row and control height `--row` / `--ctl-h` 40 px (48 px on a touch screen), tab
  `--tab-h` 48.
- **The page is a sheet in two parts**: a canvas holding the drawing that takes the width, and a dock
  of about a third of it (`--dock-w`, 360 to 576 px) with one scrolling pane. Nothing else scrolls.
  Under 900 px the verdict and the headline figure move into `.canvas-sum` above the drawing (moved,
  not copied), the drawing is capped at `min(52vh, 110vw)` with a 20 rem floor, and the rest of the
  dock goes under the canvas.
- **Rules, not boxes.** `--hair` 1 px between rows; `--rule-strong` 2 px under a table head, over a
  block and over the title block; `--rule-sel` 3 px only for the active mark (the selected tab's
  underline). The drawing's frame is the one closed outline on the page, because a drawing has one.
- Every chart and the drawing are built at their host's size and rebuilt when it changes; nothing
  scales a fixed `viewBox` with text in it.

## Elevation & Depth

Only what floats has depth: the source card and the chart readout carry `--lift`. Everything on the
sheet is flat; the recessed `--sheet-2` field marks the canvas around the drawing and the tab strip,
never a card.

## Shapes

Radius `--r-ctl` 2 px on controls only. Everything else is square. On the drawing a task is a bar on
its own row: hollow with an ink outline when it has float, filled `--mark-2` when it is critical,
filled `--mark` when selected. Float is a thin line from the bar's end to a closing tick. A link is
an elbow line with an arrowhead, in ink along the critical chain and in `--ink-3` elsewhere. The target
is a dashed grey line, the forecast a solid ink line, its spread a hatched band.

## Components

In `kit/base.css` (the control family) and `kit/mockup/kit.css` / `kit/mockup/kit.js` (page parts).
Every one is shown in every state in `kit/styleguide.html`.

| Component | Class | Function |
|---|---|---|
| Page shell | `html.sheet`, `.app` > `header.bar` + `main.work` | `.bar` holds `a.brand`, `nav.modes` (`aria-current`), `.bar-meta` with `.sim` |
| Sample-data stamp | `.sim` | on every simulated screen and slide |
| Canvas | `section.canvas` > `.canvas-head` (h1, `.meta`, `fieldset.layers`), `.canvas-sum` (narrow screens only), `.drawing`, `.canvas-foot` | `SHEET.timeline(host, model, opt)`; the links, float and dimension layers default to on |
| Title block | `.canvas-foot` > `.tb-cell` (`.tb-cap` caption, `.tb-val` value), `.tb-key` | the drawing's key, pointer position, grid, revision, date; one value per cell |
| Caption number | `span.no` inside an `h2` / `h3` | `Fig. n`, `Table n`; the same number in the deck (`no` on a slide) |
| Dock | `aside.dock` > `.tabs[role=tablist]` > `button.tab[role=tab]` (`.flag` status), `.pane[role=tabpanel]` | `SHEET.tabs(list, {onChange})`; panes are built once and toggled |
| Block | `section` > `.block-head` (h2, `p.meta`, a control), content, `p.src` | |
| Headline figure | `.headline` > `.label`, `.figline` (`.fig-lg`, `.tol`, `.unit`, source mark) | |
| Status | `span.status.is-pass / is-caution / is-fault / is-none` > `i` + word | `SHEET.status(kind, word)` |
| Checks | `ul.checks` > `li` (status + `.what`) | |
| Source mark and card | `button.srcmark` (`.is-unverified` + `span.unverified`), `.pop` dialog | `SHEET.srcmark(id, reg)`, `SHEET.sources(reg)` |
| Spec table | `table.tbl` (`td.r` value, `td.u` unit, `td.s` source, `tr.total`), `.tblwrap` | units always in their own column |
| Pick table | `table.tbl.pick` > `button.rowbtn` (`aria-pressed`), `tr.is-sel`, `tr.is-off` | picks the same row as the drawing |
| Facts list | `dl.facts` (`dt`, `dd` with `.unit` and a mark), `.actions` row of buttons under it | |
| Key | `ul.key` > `li` > `i.k-*` | a drawn sample of every mark the drawing or a chart uses |
| Controls | `.btn` (`.primary`, `.ghost`, `.danger`), `.input`, `.input-unit`, `.select-wrap` > `.select`, `.seg`, `label.check`, `.field` (`.hint`, `.error`) | one height, edge, radius and focus ring; `SHEET.seg(group, fn)` |
| Charts | `.chart` > `svg.sheet-svg` + `.readout` | `SHEET.columns`, `SHEET.range`, `SHEET.ranked`, mounted by `SHEET.mount(host, build, {readout})` |

## Do's and Don'ts

Full list with replacements in `USING.md`.

- Do put the unit beside every figure and the source mark on the same line, name the basis of every
  tolerance, number every figure and table, separate with rules and space, say a status with a shape
  and a word, and draw the comparison in grey and the measured series in the mark.
- Don't wrap a block in a card, stack shares, average two sources into one, mute text with opacity,
  use the mark for decoration, or set text below 14 px on a screen or 22 px on a slide.

## Charts

- One primary chart per view, never stacked. The form follows the question (`guide/visualisation.md`):
  a **range** for one estimate with its tolerance against a target; **ranked bars** on one zero-based
  scale for parts compared by size; **columns** for a quantity over time, with a dashed grey reference
  when there is one to read against.
- The measured series is in the mark, the comparison grey and dashed. Only the extreme value is
  labelled on the plot; every other value is in the readout and the table view.
- Every chart has a table twin (the Chart/Table segment), a readout on hover, focus or tap, and keys:
  arrows step, Home and End jump, Escape closes.
- **The drawing is a timeline, not a chart.** Rows of bars on a time axis, grouped by a rule between
  groups; a grid line every grid unit and the axis on top; marks labelled at the top of the frame; the
  selected row on the tint with its label in the mark. Each row is a focusable button whose name gives
  the task, its duration and its float. Dimension lines sit under the frame, never over the bars.

## Deck (principles and tokens)

- Fixed 1920 x 1080 canvas on `--sheet`; every slide ends on the title block (organisation, deck title,
  `Sheet n of N` in mono, revision) and carries the sample-data stamp.
- Tokens: `--deck-cover` 96 px (the cover's conclusion), `--deck-title` 60 (one sentence that is the
  conclusion), `--deck-sub` 30, `--deck-body` 28, `--deck-label` 22 (the floor on a slide),
  `--deck-fig` 132 (the one big figure), `--deck-pad` 96.
- One exhibit per slide, drawn by the same builder as the page at slide size (`window.EX`), with the
  page's caption number in the kicker, numbered notes beside it and a one-line source. See
  `guide/slides.md`.
- The cover states the finding with its condition and carries the case as a spec table
  (characteristic, value, unit, basis), never figure tiles. A slide's body is centred in the room
  between its title and the title block, so a short exhibit does not hang under the title.

## Motion

Values **snap**; only hover and focus cues move (`--d-fast` 110 ms on the Carbon productive curve
`--ease`). No fade-in, stagger or count-up. `prefers-reduced-motion` sets every duration to 0.

## Surfaces per mode

| Surface | Mode | Notes |
|---|---|---|
| Drawing and datasheet dashboard | Operate | the kit's reference; 1366 x 768 to 2560 x 1440 with no horizontal scroll, and 390 x 844 with the verdict above a capped drawing and the dock under the canvas |
| Spec sheets, comparison tables | Read | the dock's blocks at page width, `--measure` for text only |
| Review deck | Persuade / Read | see Deck; exports to PPTX |
| Printed sheet | Read | the readout and source card are hidden in print |

## Accessibility

Text contrast 4.5:1 or more in every palette (measured above), status never by colour alone (shape
plus word), a 2 px mark focus ring on every control and on every row of the drawing, rows of the
drawing reachable as buttons with their duration and float in the name, tabs and chart readouts usable
by keyboard, a table for every chart, 24 px targets around source marks and 48 px on touch, reduced
motion honoured.
