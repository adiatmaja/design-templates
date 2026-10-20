# Slides

Content rules for a deck shown on a screen or projected. The engine API (slide markup, notes, export)
is in `templates/newspaper/README.md`, the first template, as an example of an engine.

## Rules

| Rule | Detail |
|---|---|
| Action titles | The title states the conclusion in one sentence, 15 words or fewer. Reading only the titles tells the story |
| One message per slide | "And" in a title means two slides |
| One visual exhibit per slide | A chart, a table, a diagram or a real screen. The exhibit proves the title. Never three icon boxes |
| No on-screen prose | Text on the slide is a label, a number or a one-line annotation. Explanation goes in the speaker notes |
| A source line | One line under the exhibit. Figures from a meeting are quoted as said, with the timestamp, never re-rounded |
| Two typefaces at most | One grid, titles that do not move between slides, margins left alone |
| Survives as a still | A slide may be forwarded as a single image. It must make sense with no animation, no hover and no notes |
| No em dashes in titles | Some exporters mangle them |

## Canvas and sizes

The canvas is fixed at 1920 x 1080 and scaled to fit the screen. Ground and ink come from the
tokens. Deck tokens in the template's `kit/tokens.css` (adjust the values to your world, keep the names):

| Token | Role | Starting value |
|---|---|---|
| `--deck-title` | Title, a conclusion of a few words | 64 px |
| `--deck-sub` | Subtitle | 30 px |
| `--deck-body` | Body | 28 px |
| `--deck-label` | Smallest text on a slide | 22 px |
| `--deck-fig` | One big number | 132 px |
| `--deck-pad` | Outer margin | 96 px |

These are sized for a large TV viewed from a few metres: nothing below `--deck-label`.

## Process for a deck

1. Write the titles first, as a list. Read it aloud. If it does not tell the story, rewrite.
2. Pick the one exhibit each title needs. Chart choice follows `visualisation.md`.
3. Write the speaker notes: the explanation you would otherwise put on the slide.
4. Build, then view every slide as an image at 1920 x 1080 and check it against `anti-ai-design.md`.
5. Keep internal and client decks as separate decks, not hidden slides.
