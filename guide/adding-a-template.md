# Adding a template

A template is a visual world plus a working kit, in one self-contained folder.

## Folder shape

```
templates/<name>/
  DESIGN.md      filled contract, a worked example of starter/DESIGN.md
  USING.md       how to design with this world (from starter/USING.md)
  README.md      kit API: classes, functions, slide markup, export; optional ## Install notes
  kit/           tokens.css (the only place for hex), base.css, styleguide.html, mockup/, deck/
  examples/      deck/ and dashboard/ reference pages
  preview/       dashboard.png, deck.png, styleguide.png
```

Name: a short lowercase noun for the world (`newspaper`), not a client or project. All paths inside the
folder are relative, so it can be copied out on its own. Nothing inside may reference another
template or the repo root, except links to `guide/`.

## Steps

1. Copy `starter/` files into the new folder and fill them, following `guide/process.md`. Offer the
   owner two or three variants of one real screen first; the folder holds the chosen one.
2. Write `kit/tokens.css` first, then base styles, mockup components, deck engine and the styleguide.
3. Build the reference dashboard and deck in `examples/` from the kit alone.
4. Write `README.md` (API) and `USING.md` (recipes, do and don't, gaps).
5. Generate previews with `scripts/shots.mjs` into `preview/`.
6. The first line of `README.md` is a one-line description of the world; `AGENTS.md` shows it when a
   user has not named a template. If the template needs setup (fonts, CDN libraries and versions,
   serve over http), put it under a heading `## Install notes` in that README. Coding agents read
   and apply that section after copying the template.
7. Add one row for it to the "Templates" table in the root `README.md`: the folder name as a link, one
   line on the world and what it fits, and the dashboard and deck previews as linked thumbnails
   (`<img src="templates/<name>/preview/dashboard.png" width="320" alt="...">`). Keep the column order.

## Done checklist

- [ ] `scripts/click.mjs` passes on every example page with no failures.
- [ ] Every example screen viewed at 1366x768, 1920x1080 and 2560x1440.
- [ ] No hex value outside `kit/tokens.css`.
- [ ] Every text pair has a measured contrast ratio in `DESIGN.md` (WCAG formula, see `ux-theory.md`).
- [ ] No client data: names, logos, figures, colours or documents.
- [ ] Independent review done (not the builder), findings rated 0-4, none left at 3 or 4.
- [ ] Previews committed and shown in the root `README.md` Templates table.
