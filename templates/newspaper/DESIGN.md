# DESIGN.md: newspaper world

Visual world for all material of a project (mockups, deck, infographics): **"newspaper market-data
page"**, the markets-data page of a financial newspaper run by a calm control room (FT Markets Data +
ISA-101). Tokens live in `kit/tokens.css` (the only place for hex values), mockup components in
`kit/mockup/kit.css` and `kit/mockup/kit.js`, a live example in `examples/dashboard/`. Research
sources are in `guide/ux-theory.md`. Product and audience belong in `PRODUCT.md`.

This file is a worked example of a filled `starter/DESIGN.md`.

## Overview

- **THESIS.** How much money came in, against what, from where, and whether the data is complete: read
  at a glance, like the exchange-rate page of a morning paper. The screen is grey and calm while
  things are normal; only abnormal states get colour, always with a word.
- **OWN-WORLD.** Grey newsprint, ink, 1 px hairlines, and 3-6 px ink rules **instead of boxes**. Source
  Serif 4 for big figures and titles, Hanken Grotesk for data, labels and controls. Red and amber
  only for alarms.
- **STORY.** Today's revenue against the same day last week, which location contributes, and which
  source has dropped out.
- **FIRST VIEWPORT.** A serif masthead above a 3 px rule and a section row; a serif title; one filter
  row whose legend holds the date; three figures as tabs above one cumulative chart with end labels,
  outages drawn on its time axis; data completeness on the right, alarms first; a per-location table
  at the foot.
- **NO PROSE.** On-screen text is only label, number and a short one-line annotation. Explanatory
  sentences are replaced by control state, chart key, in-chart annotation or a small bar. Definitions
  move into column headers.
- **ANTI-AI** (`guide/anti-ai-design.md`). Banned: card grids, KPI tiles, pill chips, icons in coloured
  squares, gradients, block shadows, radius everywhere, donuts or gauges, count-up, fade-in, capital
  eyebrows, red for every decrease.
- **FORM.** FT Markets Data + ISA-101 HMI + metric tabs, chosen by the owner from three variants of the
  overview page.

## Colors

Strategy: **Restrained**. Paper and ink carry nearly the whole surface; the comparison is grey (IBCS:
actual dark, comparison grey); colour is for alarms only, always with a word and a shape.

| Role | Token | Value | Contrast on `--paper` |
|---|---|---|---|
| Paper (ground) | `--paper` | `#EEEBE4` | |
| Hover band, selected bar slot | `--paper-2` | `#E3DFD5` | |
| Input well, device screen | `--field` | `#F7F5F0` | a lighter sheet, not a card |
| Ink, actual series | `--ink` | `#161513` | 15.3:1 |
| Secondary text | `--ink-2` | `#45423C` | 8.4:1 |
| Label, tick text | `--ink-3` | `#5F5B53` | 5.7:1 |
| Hairline | `--rule` | `#C6C0B4` | |
| Comparison (line, control border) | `--cmp` | `#8C867B` | 3.0:1 as a chart mark |
| Comparison (bar, remainder of a proportion) | `--cmp-fill` | `#B8B2A6` | |
| Alarm, high priority | `--alarm` | `#A3231A` | 6.3:1 |
| Alarm, medium priority (text / mark) | `--warn` / `--warn-mark` | `#7A5300` / `#C58A00` | 5.8:1 as text |
| Client (logo and chrome only) | `--client-*` | per client | never part of the page palette |

Rules: no hex outside `tokens.css`. Up and down changes are **not coloured** (`--up` and `--down` are
both ink); the sign `+` or `-` carries the direction. Categories are told apart by name, not by hue.

## Typography

| Role | Face | Token | Use |
|---|---|---|---|
| Masthead, titles, big figures | Source Serif 4 (opsz) | `--serif` | masthead 30 px, h1 38, h2 23, tab figure 48, second figure 40 |
| Data, labels, controls | Hanken Grotesk | `--sans` | 16 px for everything; alarm time 18 |

- Screen scale: `--fs-body` 1 rem, `--fs-lead` 1.125, `--fs-h2` 1.4375, `--fs-flag` 1.875, `--fs-h1`
  2.375, `--fs-fig-sm` 2.5, `--fs-fig` 3. **No text below 16 px**; `html.news` raises the root to
  17 px from 1800 px wide.
- Tabular figures in tables and axes; the big figures in tabs use proportional figures.
- No tracked capital labels, no eyebrows, no single coloured word in a title.

## Layout

- Space base 4 px (`--s-1` to `--s-24`); rhythm tokens `--gap-sub`, `--gap-head`, `--gap-block`,
  `--gap-page`; table row `--row-h` 2.6875 rem (43 px).
- **Rules, not boxes.** `--hair` 1 px between rows; `--rule-head` 3 px under the masthead and above a
  block title (`h2.ruled`); `--rule-sel` 6 px only for the selected metric tab.
- Dashboards are fluid; only text pages get a maximum width.

## Elevation & Depth

None. No shadows, no layers: the ink rule replaces the box. A lighter sheet (`--field`) marks an input
well or a device screen, never a card.

## Shapes

Radius `--r-ctl` 2 px only on buttons and inputs. Everything else has square corners.

## Components

In `kit/mockup/kit.css` and `kit/mockup/kit.js`.

| Component | Class | Function |
|---|---|---|
| Page | `html.news`, `.page` | |
| Masthead | `.mast` > `a.brand` (`b` + `span`), `.meta` with `.sim` | the brand links home on the site; `.sim` is the sample-data stamp |
| Section row | `nav.sections` > `a` (`aria-current`), `a.later` | |
| Title | `.title h1` | |
| Filters | `form.controls` > `fieldset` > `legend` + `span.res` (resolved value, such as a date), `.opts`, `.guard` | `KIT.keepOne(form, name, guard, msg)` |
| Text tab | `label.pick` (radio); checkbox `label.tick` | 1 px underline at rest, 3 px grey on hover, 3 px ink when selected, strikethrough when disabled |
| Metric tab | `.metrics[role=tablist]` > `button.metric[role=tab]` > `.lbl` `.val` `.chg` | `KIT.tablist(el, pick)` |
| Block head | `.head` (title + `.switch` Chart/Table), `p.sub`, `h2.ruled`, `.legend` + `i.key` (`.k-cur` `.k-cmp` `.k-run` `.ln`) | |
| Chart | `div.plot` > `svg` + `.readout` (rows `div.tot`); SVG text `.end` `.end.c` `.now` `.ann` `.ann.alarm` | `KIT.plot(box, {readout, label})` returns `{draw(model), hide()}` |
| Table | `table.table` (`td.r`, `tr.total`, `.fig-t`), `.tblwrap` | |
| Alarms | `ol.alarms` > `li.al.hi` / `li.al.mid` | `KIT.alarms(items)` |
| Range | `.rg` (`.lo` `.track` `.mk` `.hi` `.out`), key `.rgkey` in the column header | `KIT.rangeBar(r, fmt, sr)`, `KIT.rangeKey(lo, hi, mark)` |
| Proportion | `.prop` (`.a` `.b` `.track` `i.part`) | `KIT.prop(rest, part, sr)` |
| Status | `.state`, `.state.bad` (red box + word) | |

## Do's and Don'ts

Full list with replacements in `USING.md`.

- Do separate with rules, colour only abnormal states (with a word), show the comparison in grey, and
  set figures in serif and data in sans.
- Don't use cards, shadows, gradients, pill chips, donuts or gauges, count-up, tracked capitals, or
  explanatory prose on screen.

## Charts

- The form is chosen per task (`guide/visualisation.md`): cumulative by hour for a single day (actual
  line ink 3 px, comparison grey 2 px); paired bars per day for a long period (comparison grey on the
  left, actual ink on the right, the running day hatched).
- End labels replace an in-plot legend: actual value, comparison, and the difference.
- A full-day comparison that closes off the scale is drawn as an annotation with an upward arrow; one
  inside the scale is a dashed reference line. Dashed lines are for references only.
- A source outage is drawn as a band on the time axis with a red word, for example "Exit terminal
  offline" since 08:12.
- Every chart has a table view and a readout that works with the keyboard (arrows, Home, End).

## Deck (principles and tokens)

- Fixed 1920 x 1080 canvas, `--paper` ground, `--ink` ink; rules, not boxes.
- Tokens: `--deck-title` 64 px (serif, a conclusion in a few words), `--deck-sub` 30, `--deck-body` 28,
  `--deck-label` 22 (the floor on a slide), `--deck-fig` 132 (one serif figure), `--deck-pad` 96.
- One visual exhibit per slide, with the same chart rules as the mockups; explanation in the speaker
  notes; a one-line source. See `guide/slides.md`.

## Motion

Values **snap**; only hover and focus cues move (`--d-fast` 120 ms, `--ease`). No fade-in, stagger or
count-up. `prefers-reduced-motion` sets every duration to 0.

## Surfaces per mode

| Surface | Mode | Notes |
|---|---|---|
| Overview dashboard | Operate | reference for the kit; 1366 x 768, 1440 x 900 and 1920 x 1080 with no horizontal scroll |
| Drill-down dashboards | Operate | built from the same kit |
| Point-of-sale screens | Operate | touch targets 44 px or more; device screen on `--field` |
| Chat message | Operate | borrowed platform chrome; the bubble content uses this world |
| Architecture diagram | Read | ink line diagram; dashed for sources not yet connected |
| Client deck, internal deck | Persuade / Read | see Deck |

## Accessibility

Text contrast 4.5:1 or more (the values in the colour table were measured), status never by colour
alone (shape plus word), visible focus (2 px ink outline), tabs and readouts usable by keyboard, a
table for every chart, reduced motion honoured.
