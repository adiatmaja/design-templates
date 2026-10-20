# Using the datasheet template

How to design with this world. Class names and functions are in `README.md` (kit API); the full
contract is in `DESIGN.md`; every component in every state, and the three palettes side by side, are
in `kit/styleguide.html`.

## Component catalog

Paths are under `examples/`. Where the examples do not use a component, the cell says so.

| Component | Class / function | Used in |
|---|---|---|
| Page shell, bar, brand, pages | `html.sheet`, `.app`, `.bar`, `a.brand`, `nav.modes` | `dashboard/index.html` |
| Sample-data stamp | `.sim` | `dashboard/index.html`, every slide |
| Canvas and drawing | `section.canvas`, `.canvas-head`, `.drawing`; `SHEET.timeline` | `dashboard/index.html` |
| Layer toggles | `fieldset.layers` > `label.check` | `dashboard/index.html` (links, float, dimensions) |
| Title block | `.canvas-foot` > `.tb-cell` (`.tb-cap`, `.tb-val`) | `dashboard/index.html`; `.tblock` on every slide |
| Caption number | `span.no` | `dashboard/index.html`; `no` on a slide in `deck/slides.js` |
| Dock tabs and panes | `.tabs`, `button.tab`, `.flag`, `.pane`; `SHEET.tabs` | `dashboard/index.html` |
| Verdict and headline figure | `.verdict`, `.headline`, `.figline`, `.fig-lg`, `.tol`, `.unit` | `dashboard/index.html` |
| Status | `.status.is-*`; `SHEET.status` | `dashboard/index.html` |
| Checks | `ul.checks` | `dashboard/index.html` |
| Source mark and card | `.srcmark`, `.pop`; `SHEET.srcmark`, `SHEET.sources` | `dashboard/index.html` |
| Spec table | `table.tbl` (`td.r`, `td.u`, `td.s`, `tr.total`) | `dashboard/index.html` |
| Pick table | `table.tbl.pick`, `button.rowbtn` | `dashboard/index.html` (Tasks) |
| Facts list and actions | `dl.facts`, `.actions` with `.btn` | `dashboard/index.html` (the selected task, its ±1 d stepper) |
| Segment | `.seg`; `SHEET.seg` | `dashboard/index.html` (Chart / Table) |
| Charts | `.chart`; `SHEET.columns`, `SHEET.range`, `SHEET.ranked`, `SHEET.mount` | `dashboard/index.html`, and through `window.EX` in `deck/slides.js` |
| Key | `ul.key`, `i.k-*` | `dashboard/index.html`, `deck/slides.js` |
| Deck slides | `DECK_SLIDES` types `cover`, `exhibit`, `table`, `figure`, `close` | `deck/slides.js` |
| Primary, ghost and danger buttons, input with unit, select, field with hint or error | `.btn.primary`, `.ghost`, `.danger`, `.input-unit`, `.select-wrap`, `.field` | not used in the examples; see `kit/styleguide.html` |

## Page recipes

Every page answers one question in its first viewport. Compose from the kit in this order and add
nothing that does not carry a fact.

### Drawing and datasheet page

| Order | Block | Components | Answers |
|---|---|---|---|
| 1 | Bar | `.bar`, `nav.modes`, `.sim` stamp for sample data | Where am I |
| 2 | Drawing head | `.canvas-head` h1, `.meta` with `Fig. 1`, `fieldset.layers` | What is drawn, which layers |
| 3 | The drawing | `.drawing` with `SHEET.timeline`: rows on a time axis, the target and the forecast | How the work is laid out |
| 4 | Title block | `.canvas-foot`: key, position, grid, revision, date | How to read the drawing |
| 5 | Verdict and headline | `.verdict` status, `.figline` with tolerance, unit and source mark, the tolerance's basis under it | What the answer is, and how sure |
| 6 | One comparison | `SHEET.range` against the target, with its source line | How far from the target |
| 7 | Checks | `ul.checks`, each citing a caption number and a source | What could change the answer |
| 8 | Spec table | `table.tbl`, units in their own column | Exact values |

The dock's other tabs follow the same order: a pick table that selects the same row as the drawing,
the selected item's facts, one chart with its table twin, the source register.

The drawing need not be a schedule. Any rows-on-an-axis subject fits the same model: a release train
by sprint, maintenance windows by hour, a review queue by day. Keep one unit on the axis and say it in
the figure caption.

### Spec sheet without a drawing

- Drop the canvas; the dock's blocks run at page width with `--measure` on any text.
- Keep the caption numbers and the title block at the foot of the sheet: they are what makes a page of
  tables read as a datasheet.
- Tolerances and ranges go in the value cell (`60.5 to 67.5`, `64.0 ± 3.5`), the unit in its own
  column, and the basis of the tolerance once, in a note or the source card.

### Deck

- One slide, one message: the title is the conclusion in one sentence, one exhibit, a one-line source,
  numbered notes beside the exhibit, the explanation in the speaker notes.
- Exhibits come from the page's builders at slide size (`EX.columns`, `EX.ranked`, `EX.range`,
  `EX.timeline`), and the deck reads the page's own data file, so a slide cannot disagree with the
  page. Give the slide the page's caption number.
- Rules in `guide/slides.md`; engine and slide fields in `README.md`.

## Do and don't

| Do | Don't |
|---|---|
| Put the unit after every figure and the source mark on the same line | Leave a figure without a unit, or a sourced figure without its mark |
| Number every figure and table, and cite the number in notes and checks | Write "the chart above" or "see below" |
| Separate with a 1 px hairline between rows and a 2 px ink rule over a block | Wrap a block in a bordered, tinted or shadowed card |
| Say a status with a shape and a word | Colour a figure green or red, or use colour alone |
| Draw the measured series in the mark and the comparison grey and dashed | Give each category its own hue, or stack shares |
| State a tolerance where the inputs give one, and name what it is | Round a spread away, or show `±` without its basis |
| Keep text at 14 px or more on a screen and 22 px on a slide | Shrink text to fit, or mute it with opacity |
| Snap values; move only hover and focus | Fade, stagger or count numbers up |

## When the component you need is not in the kit

Work down this path and stop at the first step that works.

1. **Look again.** Re-read `README.md` and open `kit/styleguide.html`. Search the kit for the job, not
   the name.
2. **Compose it from primitives.** A rule, the type scale, a spec table, a facts list, a status, a key,
   one of the three chart builders, or the timeline. Most gaps close here.
3. **Add a new piece only if it is truly needed**, and then:
   - derive it only from tokens: no hex, no ad hoc size, and check it in all three palettes;
   - design it with its whole family: the same height, edge, radius, focus ring, hover, disabled and
     error states as its siblings (see `guide/anti-ai-design.md`);
   - if it shows data, give it a table twin, keyboard access and a source mark;
   - add it to the kit CSS/JS, the styleguide's state matrix and `README.md`;
   - log it in `DECISIONS.md` with the reason the primitives were not enough.

### Common gaps in this world

| You reach for | Use instead |
|---|---|
| KPI tile | The headline figure with its unit, tolerance and source mark |
| Donut or gauge | A range against a target (`SHEET.range`) or ranked bars (`SHEET.ranked`) |
| Stacked bar | Ranked bars on one scale |
| Progress bar | A range: the value, its tolerance and the target on one stated axis |
| Status pill or chip | `.status`: a shape and a word |
| Card grid | A pick table, or a facts list under a 2 px rule |
| Legend box inside a chart | A key under the chart, and a label on the extreme value only |
| Gantt library | The timeline drawn from data (`SHEET.timeline`), with its rows as buttons |
| Tooltip with the explanation | A numbered note, or the source card |
| Toast | A line in the block that changed, next to the control that changed it |
