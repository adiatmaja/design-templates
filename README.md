# design-template

A reusable, project-agnostic design guidance repo for dashboards, POS and app mockups, and client decks
built as static HTML/CSS/JS (CDN only, no build step). It holds shared guidance, blank starter files
and one or more ready-made design templates (a visual world plus a working kit). Copy what you need
into a new project.

## Templates

### Newspaper

A financial-newspaper data page run by a calm control room: paper, ink, rules instead of boxes, colour
only for abnormal states. Contains the filled contract, the kit API, `kit/` and the example deck and
dashboard. Folder: [`templates/newspaper/`](templates/newspaper/).

![Newspaper template: dashboard](templates/newspaper/preview/dashboard.png)
![Newspaper template: deck](templates/newspaper/preview/deck.png)

## Start a new project

1. Use this repo as a GitHub template, or copy the folders you need.
2. Copy `starter/PRODUCT.md` and fill it (users, scene, constraints). Then copy `starter/DESIGN.md`
   and fill the direction contract. Copy `starter/DECISIONS.md` and start the log.
3. Pick a template whose world fits, or follow `guide/process.md` to offer 2-3 variants and let the
   owner choose. Copy its `kit/` into the project and edit `kit/tokens.css` (the only place for hex).
4. Build pages from the template's `examples/`: one reference page first, then the rest.
5. Verify: viewport screenshots, a click on every control, an independent review.

## Add a template

Follow [guide/adding-a-template.md](guide/adding-a-template.md). Each template folder holds `DESIGN.md`,
`USING.md`, `README.md`, `kit/`, `examples/` and `preview/*.png`; the shared `guide/` and `scripts/`
stay world-independent.

## File map

| Path | Purpose |
|---|---|
| `guide/process.md` | Brief to verified design, ten steps |
| `guide/anti-ai-design.md` | Rules against AI-looking design, banned tells, verification |
| `guide/visualisation.md` | When to draw a chart, how many, how |
| `guide/ux-theory.md` | Principles with verified sources, UNVERIFIED list, research method |
| `guide/slides.md` | Deck content rules and deck token sizes |
| `guide/adding-a-template.md` | Folder shape, steps and done-checklist for a new template |
| `starter/PRODUCT.md`, `DESIGN.md`, `DECISIONS.md`, `USING.md` | Blank skeletons, independent of any world |
| `templates/newspaper/DESIGN.md` | The filled contract |
| `templates/newspaper/USING.md` | Page recipes, do and don't, what to do when the kit lacks a component |
| `templates/newspaper/README.md` | Kit API |
| `templates/newspaper/kit/tokens.css`, `base.css`, `styleguide.html` | Tokens, base styles, component sheet |
| `templates/newspaper/kit/deck/{chartbook.css,chartbook.js,deck.js}` | Deck engine |
| `templates/newspaper/kit/mockup/{kit.css,kit.js}` | Dashboard and mockup components |
| `templates/newspaper/examples/deck/`, `examples/dashboard/` | Reference deck and dashboard |
| `scripts/click.mjs` | Clicks every control on a page and reports failures |
| `scripts/shots.mjs` | Screenshots a page across a viewport matrix |

## Run

```
python -m http.server 8000
```

Open `http://localhost:8000/`. Serve over http: deck export and some scripts fail from `file://`.

## The rules that matter most

- Name the information a box, badge, icon or animation carries, or remove it
  ([anti-ai-design](guide/anti-ai-design.md)).
- No cards. Group with space, rules and type.
- Design the family of controls, not one component.
- One chart per question, a table for exact values, no gauges
  ([visualisation](guide/visualisation.md)).
- Slides: titles are conclusions, one message and one exhibit per slide, explanation in notes
  ([slides](guide/slides.md)).
- Every hex lives in the tokens file; measure contrast with the WCAG formula
  ([ux-theory](guide/ux-theory.md)).
- Do not call a screen done before you have viewed it at three sizes and clicked every control
  ([process](guide/process.md)).
- Mark unverified facts UNVERIFIED; never invent a name, figure or logo.
