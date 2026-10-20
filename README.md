# design-templates

Reusable design templates and guidance for any project.

Each template is a visual world (a direction contract in `DESIGN.md`) plus a working kit: tokens, base
styles, components and reference pages. Shared guidance covers the design process, charts, slides and
how to avoid generic, AI-looking design. Pick a template, copy it into your project, and adapt the
tokens to your brand.

## Templates

The name is what you tell your agent; click a preview for full size.

| Template | World | Dashboard | Deck |
|---|---|---|---|
| [`newspaper`](templates/newspaper/) | Financial-newspaper data page run by a calm control room: paper, ink, rules instead of boxes, colour only for abnormal states. Fits revenue and operations dashboards, POS screens, consulting-style decks. | [<img src="templates/newspaper/preview/dashboard.png" width="320" alt="Newspaper template: dashboard">](templates/newspaper/preview/dashboard.png) | [<img src="templates/newspaper/preview/deck.png" width="320" alt="Newspaper template: deck">](templates/newspaper/preview/deck.png) |

## How it works

```
  design-templates                      your project
  ┌──────────────────────┐             ┌──────────────────────────────────┐
  │ templates/<name>/    │──── copy ──▶│ DESIGN.md, design/kit, examples  │
  │ guide/, scripts/     │──── copy ──▶│ design/guide, design/scripts     │
  │ starter/             │──── copy ──▶│ PRODUCT.md, DECISIONS.md         │
  └──────────────────────┘             └────────────────┬─────────────────┘
                                                        │
                      adapt tokens ──▶ build pages ──▶ verify (shots, clicks, review)
```

## Install

With a coding agent, give it this sentence in the project you want styled:

> Set up the newspaper design template from github.com/adiatmaja/design-templates.

The agent follows [AGENTS.md](AGENTS.md): it copies the template into `design/`, wires your agent
instructions, adapts the tokens and verifies the result.

By hand: use this repo as a GitHub template, or copy `templates/<name>/` plus `guide/` and `scripts/`
into your project.

## Usage

1. Fill `starter/PRODUCT.md` (users, scene, constraints), then `starter/DESIGN.md` (the direction
   contract), and start a log in `starter/DECISIONS.md`.
2. Pick a template whose world fits, or follow [guide/process.md](guide/process.md) to offer two or
   three variants and let the owner choose.
3. Change brand values only in `kit/tokens.css`, the single place for colours and fonts.
4. Build one reference page from the template's `examples/` first, then the rest.
5. Verify: screenshots at several sizes, a click on every control, an independent review.

To view the examples locally, serve the repo over http (`python -m http.server 8000`) and open
`http://localhost:8000/`.

## Principles

- Name the information a box, badge, icon or animation carries, or remove it
  ([anti-ai-design](guide/anti-ai-design.md)).
- Group with space, rules and type, not cards.
- Design the family of controls, not one component.
- One chart per question, a table for exact values ([visualisation](guide/visualisation.md)).
- Slide titles are conclusions; one message per slide ([slides](guide/slides.md)).
- Every colour lives in the tokens file; measure contrast with the WCAG formula
  ([ux-theory](guide/ux-theory.md)).
- Never invent a name, figure or logo; mark unverified facts UNVERIFIED.

## Repository contents

| Path | Purpose |
|---|---|
| `templates/<name>/` | One template: `DESIGN.md`, `USING.md`, `README.md`, `kit/`, `examples/`, `preview/` |
| `guide/` | Shared guidance: process, anti-AI design, visualisation, UX theory, slides, adding a template |
| `starter/` | Blank `PRODUCT.md`, `DESIGN.md`, `DECISIONS.md` and `USING.md` skeletons |
| `scripts/` | `click.mjs` clicks every control on a page; `shots.mjs` screenshots it across viewports |
| `CLAUDE.md` | Install procedure for coding agents and rules for editing this repo (`AGENTS.md` links to it) |

## Contributing

Open an issue to report a problem or propose a template. To add one, follow
[guide/adding-a-template.md](guide/adding-a-template.md).

## License

[MIT](LICENSE) © Johannes Baptista Adiatmaja Pambudi
