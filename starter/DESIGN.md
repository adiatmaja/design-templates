# DESIGN.md: [project name]

<!-- impeccable:design-schema 1 -->

[Two or three lines: the name of the visual world, its form reference, where tokens live, where the
components live, where the reference page lives, and where the decision log is.]

## Direction contract

- **THESIS.** [What the reader learns at a glance, and when colour appears. Good: one sentence naming
  the question the screen answers and the rule for abnormal states.]
- **OWN-WORLD.** [The ground, ink, rules, type and where colour is allowed. Good: concrete materials
  and sizes (paper, 1 px hairline, 3-6 px rule instead of a box), two named typefaces, one sentence
  on colour.]
- **STORY.** [The comparison the main screen tells. Good: now versus a baseline, which part
  contributes, and what is broken.]
- **FIRST VIEWPORT.** [Top to bottom inventory of what the first screen holds, in reading order. Good:
  you could sketch it from this paragraph.]
- **NO PROSE.** [On-screen text is label, number or one short annotation. Explanation becomes control
  state, chart key, annotation or column header. Record the date of the ruling.]
- **ANTI-AI.** [List what is banned for this project: card grids, KPI tiles, pill chips, tinted icon
  squares, gradients, block shadows, blanket radius, donuts and gauges, count-up, fade-in, all-caps
  eyebrows, red for every decrease. Link `guide/anti-ai-design.md`.]
- **FORM.** [The form reference(s) chosen, and the variant the owner picked.]

## Colour

Strategy: [Restrained | Committed | Full palette | Drenched, and why in one line.]

| Role | Token | Value | Contrast on ground |
|---|---|---|---|
| Ground | `--...` | `#......` | |
| Hover band / selected slot | `--...` | `#......` | |
| Input well | `--...` | `#......` | |
| Ink (actual series) | `--...` | `#......` | |
| Secondary text | `--...` | `#......` | [ratio, measured] |
| Label, tick text | `--...` | `#......` | [ratio, measured] |
| Hairline | `--...` | `#......` | |
| Comparison (line, control border) | `--...` | `#......` | [3:1 minimum as a chart mark] |
| Comparison (bar fill) | `--...` | `#......` | |
| Alarm, high | `--...` | `#......` | [4.5:1 minimum as text] |
| Alarm, medium (text / mark) | `--...` | `#......` | [ratio, measured] |
| Client (logo and chrome only) | `--client-...` | | never part of the page palette |

Good: every hex appears once, in the tokens file; every contrast number was computed with the WCAG
formula; the rule for up/down changes is stated (sign and word, not hue).

## Typography

| Role | Face | Token | Use |
|---|---|---|---|
| Display, big figures | [face] | `--serif` or similar | [sizes] |
| Data, labels, controls | [face] | `--sans` or similar | [size] |

Good: two faces at most, chosen from the subject and not from the AI default list; a numeric scale in
rem; a floor (no text below 16 px, say); tabular figures in tables and axes; what the root size does
on wide screens; what is not allowed (tracked caps, eyebrows, one coloured word in a headline).

## Shape, space, rules

Good: the rule weights and what each means (1 px between rows, 3 px under the masthead, 6 px for the
selected tab), the only places a radius is allowed, "no shadows", the spacing base unit with its rhythm
tokens, and the table row height.

## Components

| Component | Class | Function |
|---|---|---|
| [Page, masthead, section bar, title, filters, tabs, metric tabs, block head, chart, table, alarm list, range, proportion, status] | | |

Good: one row per component with its class names and its JS entry point if any. Name the reference page
that shows them all live. Mention any legacy classes still present and when they are removed.

## Charts

Good: the form chosen per task with the reason (see `guide/visualisation.md`); line weights for actual
and comparison; end labels instead of an in-plot legend; how a truncated or off-scale value is drawn;
how a source outage is drawn on the time axis; the table view and keyboard-readable readout every chart
has.

## Deck

Good: fixed 1920 x 1080 canvas, ground and ink, the deck tokens with sizes (`--deck-title`,
`--deck-sub`, `--deck-body`, `--deck-label`, `--deck-fig`, `--deck-pad`), one exhibit per slide,
explanation in speaker notes, one-line source. Link `guide/slides.md`.

## Motion

Good: what moves (hover and focus cues only, with duration and easing tokens), what does not (no
fade-in, stagger or count-up), and that `prefers-reduced-motion` sets every duration to 0.

## Surfaces per mode

| Surface | Mode (Operate / Read / Persuade) | Notes |
|---|---|---|
| [Dashboard, POS, chat message, diagram, deck] | | [Sizes it must hold without horizontal scroll, touch size, what chrome is borrowed] |

## Accessibility

Good: the contrast floor with measured values in the colour table, status never by colour alone,
visible focus (state the weight and colour), keyboard operation of tabs and chart readouts, a table for
every chart, reduced motion honoured.
