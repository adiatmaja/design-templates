# Using the [name] template

How to design with this world. Class names and functions are in `README.md`; the contract is in
`DESIGN.md`; live components are in `kit/styleguide.html`.

## Page recipes

Each recipe lists the blocks in order, what the first viewport holds, and which component answers which
question. Good: someone can build the page from the table without guessing.

### Dashboard page

| Order | Block | Components | Answers |
|---|---|---|---|
| 1 | [Block] | [Classes or functions] | [The reader's question] |

First viewport: [what must be visible without scrolling].

### App or POS screen

[Frame and ground, one job per screen, control sizes, which components for actions, choices, entry,
errors.]

### Phone message

[Chrome borrowed, order of content, length limits, what is sent instead of a chart.]

### Deck

[One message per slide, which components make exhibits, link to `guide/slides.md`.]

## Do and don't

Specific to this world, not generic advice. Good: each row is checkable on a screenshot.

| Do | Don't |
|---|---|
| [Rule about separation] | [The tell it replaces] |
| [Rule about colour] | |
| [Rule about type] | |
| [Rule about comparisons and charts] | |
| [Rule about text and motion] | |

## When the component you need is not in the kit

1. Look again: `README.md`, then the styleguide.
2. Compose it from primitives: [list this world's primitives].
3. Add a new piece only if truly needed: derive it from tokens only; design it with its whole family
   (same height, border, focus, hover, disabled and error states); give data pieces a table view and
   keyboard access; add it to the kit, the styleguide and `README.md`; log it in `DECISIONS.md`.

### Common gaps in this world

| You reach for | Use instead |
|---|---|
| [KPI tile, donut or gauge, status pill, card grid, modal flow, icon set, map, toast] | [What this world uses] |
