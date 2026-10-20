# Process

From a blank folder to a verified design. Each step produces a file or a decision you can point to.

| # | Step | Output | Done when |
|---|---|---|---|
| 1 | Brief | A paragraph from the owner | You can say who reads this, where, and what they decide |
| 2 | Product context | `PRODUCT.md` (from `starter/PRODUCT.md`) | Users, scene, constraints and brand commitments are written down; unknowns are marked, not invented |
| 3 | Research | Notes with date and URL per fact (see `ux-theory.md`, research method) | Every claim that shapes the design has a source or is marked UNVERIFIED |
| 4 | Pick a visual world | Two or three variants of one real screen, side by side | The user has chosen one; the choice and the rejected variants are logged |
| 5 | Design contract | `DESIGN.md` (from `starter/DESIGN.md`) | THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, NO PROSE, ANTI-AI and FORM are filled |
| 6 | Tokens | the template's `kit/tokens.css` | Every hex lives here and only here; contrast measured, not guessed |
| 7 | Kit | The template's `kit/` folder (base styles, mockup and deck components, styleguide) | The styleguide shows every component in every state |
| 8 | Pages or deck | One reference page first, then the rest | The reference page passes step 9 before others are built from it |
| 9 | Verify | Screenshots, click test, review | See below |
| 10 | Log decisions | `DECISIONS.md` | Each ruling has a number, a date, a reason |

## Notes per step

**Brief and context.** Ask for the scene of use: a boardroom TV, a cashier under queue pressure, a phone
forwarded as an image. The scene sets minimum type size, contrast and whether anything may rely on
animation.

**Pick a visual world.** Do not start from a style name. Build the same real screen three ways, each a
different world with a different form reference (a newspaper data page, a control-room HMI, a
timetable board). Show them together and let the user choose. A world is a set of decisions about
ground, ink, type, rules and where colour is allowed; it is not a theme switch. Record the rejected
ones so they do not come back.

**Design contract.** Write it before any CSS. If a line cannot be answered, the brief is still open.

**Tokens.** Colour, type scale, spacing, rules, motion durations, deck sizes. Components read tokens;
pages never contain a literal value. Measure every text pair with the WCAG formula.

**Kit.** Design the family, not the component: list the siblings of any control before adding one,
and give the family one height, border, radius, padding, focus ring and state set.

**Pages.** Build one reference page, verify it, then derive the others. A shared component changes in
the kit, never per page.

**Verify.** All of these before calling a screen done:

1. Render every touched screen at 1366x768, 1920x1080 and 2560x1440 (plus any width the project names)
   and look at each image yourself.
2. Click every control in a real browser (`scripts/click.mjs`). Screenshots miss broken clicks.
3. Independent review: the builder does not sign off its own UI. Use a second reviewer, ideally a
   different model, with the goal and rules plus the images. The reviewer reports; you write the fixes.
4. Rate each finding 0-4 (frequency, impact, persistence). Nothing rated 3 or 4 stays open.
5. Silhouette test: shrink to about 200 px wide, blocks only. If it could be any product, the structure
   is the problem, not the colour.
6. Scan for tells (`anti-ai-design.md`): grep for `card|panel|chip|badge|rounded-2xl|backdrop-blur|bg-clip-text|count`
   and justify each hit.

**Log decisions.** Rewrite a decision in place when it changes. Keep one row per decision, with what it
supersedes.
