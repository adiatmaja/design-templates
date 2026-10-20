# Using the newspaper template

How to design with this world. Class names and functions are in `README.md` (kit API); the full
contract is in `DESIGN.md`; live components are in `kit/styleguide.html`.

## Page recipes

Every page answers one question in its first viewport. Compose from the kit in this order and add
nothing that does not carry information.

### Dashboard page

| Order | Block | Components | Answers |
|---|---|---|---|
| 1 | Masthead and section row | `.mast`, `nav.sections`, `.sim` stamp for sample data | Where am I |
| 2 | Title | `.title h1` | What is this page |
| 3 | Filters, one row | `form.controls` > `fieldset` > `legend` + `.res` (resolved value) | Which slice |
| 4 | Headline figures | `.metrics` tabs (`.lbl` `.val` `.chg`) | How much, against what |
| 5 | One main chart | `.head` + `.legend`, `div.plot` with `.readout`, end labels | What pattern |
| 6 | Exceptions beside the chart | `ol.alarms`, `.state`, `.prop`, `.rg` | What is broken or incomplete |
| 7 | Table at the foot | `table.table`, `h2.ruled` | Exact values by item |

First viewport: masthead, title, filters, the figure tabs, the chart, and the exceptions. The table
may sit below the fold. One primary chart per view; extra charts go behind the Chart/Table switch or a
drill-down page.

### App or POS screen

- The device screen sits on `--field`; the page around it stays on `--paper`.
- One job per screen. The primary action keeps its position across states.
- Controls are 44 px or taller. Use `.btn` and `.btn-primary` for actions, `.pick` and `.tick` for
  choices, `.input` for entry. Prefer a few large choices over a menu.
- Amounts are big serif figures on a rule; line items are a ruled list, not stacked boxes.
- Errors and warnings use `.state.bad` (word plus mark), never colour alone.

### Phone message (chat)

- Borrow the platform chrome as is; fill the bubble with this world's type and figures.
- Order: headline (one line), the number, one comparison, then the detail. Respect the platform's
  length limits.
- No chart: send the figure and its sign (`+` or `-`). Link to the dashboard for the chart.

### Deck

- One slide, one message: action title, one exhibit, one source line; explanation in speaker notes.
- Exhibits come from the same parts: a `div.plot` chart, a `table.table`, a big serif figure on a rule
  (`--deck-fig`), a diagram in ink lines, or a real screen of the dashboard.
- Rules in `guide/slides.md`; engine and slide markup in `README.md`.

## Do and don't

| Do | Don't |
|---|---|
| Separate with rules (1 px between rows, 3 px under a heading, 6 px for the selected tab) | Wrap blocks in boxes, borders, shadows or tinted panels |
| Use colour only for abnormal states, always with a word and a shape | Colour a number green or red because it rose or fell; use the sign `+` / `-` |
| Serif for headings and big figures, sans for data, labels and controls | Mix in a third face, or use tracked capitals, eyebrows or a coloured word in a title |
| Show the comparison in grey and the actual in ink | Colour the comparison, or hide it |
| Label marks directly (end labels) and give every chart a table view | Add a legend box inside the plot, a donut, a gauge or count-up |
| Put a definition in a column header or chart key | Write an explanatory paragraph on screen |
| Keep text at 16 px or more | Shrink text to fit a dense layout |
| Snap values; move only hover and focus | Fade, stagger or animate numbers in |

## When the component you need is not in the kit

Work down this path and stop at the first step that works.

1. **Look again.** Re-read `README.md` and open `kit/styleguide.html`. Search the kit for the job, not
   the name.
2. **Compose it from primitives.** A hairline or ink rule, the type scale, a table, a chart key, a
   range bar (`.rg`), a proportion bar (`.prop`), or a plain list. Most gaps close here.
3. **Add a new piece only if it is truly needed**, and then:
   - derive it only from tokens: no hex, no ad hoc size;
   - design it with its whole family: the same height, border, radius, focus ring, hover, disabled and
     error states as its siblings (see `guide/anti-ai-design.md`);
   - if it shows data, give it a table view and keyboard access;
   - add it to the kit CSS/JS, the styleguide and `README.md`;
   - log it in `DECISIONS.md` with the reason the primitives were not enough.

### Common gaps in this world

| You reach for | Use instead |
|---|---|
| KPI tile | A metric tab, or a big serif figure on a rule with its change beneath |
| Donut or gauge | A proportion bar (`.prop`) or a range bar (`.rg`) |
| Status pill or chip | A mark plus a word (`.state`); nothing at all for the normal state |
| Card grid | A ruled list or a table |
| Modal-heavy flow | An inline section, or a popover (`.pop`) for a short choice |
| Icon set | A word label |
| Map | A table by location until a map earns its place |
| Sparkline column | Delete it if it repeats the main chart; otherwise a range bar |
| Toast | An inline `.state` line next to the control that caused it |
