# Adding a template

A template is a visual world plus a working kit, in one self-contained folder.

## Folder shape

```
templates/<name>/
  DESIGN.md      filled contract, a worked example of starter/DESIGN.md
  USING.md       how to design with this world (from starter/USING.md)
  README.md      kit API: classes, functions, slide markup, export
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
6. Add a section for it under "Templates" in the root `README.md`: name, one line on the world, the
   dashboard and deck previews, and a link to the folder.

## Done checklist

- [ ] `scripts/click.mjs` passes on every example page with no failures.
- [ ] Every example screen viewed at 1366x768, 1920x1080 and 2560x1440.
- [ ] No hex value outside `kit/tokens.css`.
- [ ] Every text pair has a measured contrast ratio in `DESIGN.md` (WCAG formula, see `ux-theory.md`).
- [ ] No client data: names, logos, figures, colours or documents.
- [ ] Independent review done (not the builder), findings rated 0-4, none left at 3 or 4.
- [ ] Previews committed and linked from the root `README.md`.
