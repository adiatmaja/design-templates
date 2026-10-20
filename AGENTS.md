# AGENTS.md

Entry point for coding agents (Claude Code, Codex, Gemini, others). This repo holds design templates
(a visual world plus a working kit) and shared guidance. Two jobs: install a template into another
project (below), or edit this repo (last section).

## Install a template into a project

Trigger: the user says something like "set up the newspaper design template from
github.com/adiatmaja/design-templates". `<project>` is the user's current project root. Run the steps
in order. Stop and ask the user whenever a step says so.

### 1. Fetch

Clone into a temp dir, never into the project:

```
gh repo clone adiatmaja/design-templates "$TMP/design-templates" -- --depth 1
```

Fallback: `git clone --depth 1 https://github.com/adiatmaja/design-templates "$TMP/design-templates"`.
Record the commit: `git -C "$TMP/design-templates" rev-parse --short HEAD` (this is `<sha>`).

### 2. Pick

List `templates/*/`. For each, read the first line of its `README.md`. If the user named no template,
or one that does not exist, show the list with those one-line descriptions and ask which one.

### 3. Copy

Copy without overwriting. If any target below already exists, stop and ask the user.

| From (`$TMP/design-templates/`) | To (`<project>/`) |
|---|---|
| `templates/<name>/DESIGN.md` | `DESIGN.md` |
| `templates/<name>/` (everything else: `kit/`, `examples/`, `preview/`, `README.md`, `USING.md`) | `design/` |
| `guide/` | `design/guide/` |
| `scripts/` | `design/scripts/` |
| `starter/PRODUCT.md`, `starter/DECISIONS.md` | `PRODUCT.md`, `DECISIONS.md`, only if absent |

Templates use only folder-relative paths, so the copy needs no rewriting. Proof: serve the project and
open `design/examples/dashboard/index.html` and the deck under `design/examples/deck/`; both must
render with styles and fonts. If not, fix the copy, not the template.

Then read the `## Install notes` section of `design/README.md`, if present, and apply it.

### 4. Wire

Add this pointer to the project's agent instructions file (`CLAUDE.md`, `AGENTS.md` or `GEMINI.md`,
whichever exists; if none, create `AGENTS.md`). Append it, do not rewrite the file:

```
## Design
Before any visual work (pages, mockups, decks, charts) read DESIGN.md, design/USING.md and
design/guide/anti-ai-design.md. Kit and components: design/README.md. Process: design/guide/process.md.
```

### 5. Adapt

- Fill `PRODUCT.md` from the project (README, code, docs) and from the user. Ask only what cannot be
  read. Never invent names, figures or logos; write `[placeholder]` instead.
- Change brand values (colour, fonts) only in `design/kit/tokens.css`. Never add a hex elsewhere.
  Re-measure the contrast of every changed pair with the WCAG formula (`design/guide/ux-theory.md`)
  and update the colour table in `DESIGN.md`.
- Add to `DECISIONS.md`: `D1 | <date> | Adopted template <name> from design-templates@<sha>`.

### 6. Verify

1. Serve the project root: `python -m http.server 8000`.
2. Run `design/scripts/click.mjs` and `design/scripts/shots.mjs` on the examples (usage is at the top
   of each script).
3. Read the PNGs yourself. A failed click or a broken layout is not done.

### 7. Report

Tell the user: the files copied, the template and `<sha>`, what you changed in `tokens.css`, and what
they still need to fill (open placeholders in `PRODUCT.md`, brand colours and fonts if left at the
template's values).

## Editing this repo

- Add a template only by following `guide/adding-a-template.md`.
- No client data: no real company, product or people names, logos, brand colours, figures or documents.
  Use generic words ("the client", "location A").
- Inside a template folder use relative paths only. Do not reference another template or the repo root
  (links to `guide/` are fine).
- Keep it lean: no extra docs, badges or emoji. Write plain English; no em dashes as clause glue.
- Commit by explicit path in small Conventional Commits (`docs:`, `feat:`, `fix:`), subject 72
  characters or fewer. Do not push unless asked.
