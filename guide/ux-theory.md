# UI/UX theory for dashboards, point-of-sale screens and chat messages

Verified sources behind the rules in this guide. Read this before adding or changing a component. All
sources were fetched with curl on 2026-10-19 (a web search was used only to find the URL). Anything not
verified is listed at the end as UNVERIFIED.

## Principles

| Principle | Source | How to apply |
|---|---|---|
| Data-ink ratio, "within reason": remove ink that carries no information or repeats a number, but keep axes, labels and context | Wilke ch. 23 [W23]; Kosara [K13]; Inbar et al. 2007 [I07]; Bateman et al. 2010 [B10] | Delete a column that repeats the main chart; keep axes and units; draw future or missing values as an outline, not a solid mark |
| Grid lines only perpendicular to the value direction | [W23] | Bar charts get no grid lines along the bars |
| Proportional ink: bars always start at zero | Wilke ch. 17 [W17] | Zero-based axes on every bar chart; do not truncate to dramatise |
| One screen, enough context, urgent data prominent, top left is most important; "if everything stands out, nothing does" | Few, *Common Pitfalls* [F06] #1, #2, #9, #10; Few, *Why Most Dashboards Fail* [F07] | Fit the primary view without scrolling at the target sizes; put the alarm or exception first in reading order |
| F-pattern reading: the first glance lands top and left | NN/g F-pattern [N-F] | Place the most urgent item at the top of the first column, not mid-page |
| Perceptual accuracy: position on a common scale > length > angle > area | Cleveland & McGill via NN/g [N-PA] and Heer slides [H-CSE] | Use bars, lines and tables; no gauges, donuts or pies |
| Actual is solid, comparison is grey, plan or forecast is outlined | IBCS UN 3.2 [IBCS] | One consistent encoding for actual, comparison and forecast across all charts |
| Visual hierarchy: at most 3 type sizes, at most 2 large elements, red only for warnings | NN/g visual hierarchy [N-VH] | One large figure per band; reserve alarm colour for abnormal states |
| Proximity: things close together are read as related | NN/g proximity [N-PX] | Group with spacing and rules, not boxes |
| Progressive disclosure: what shows first is judged important | NN/g progressive disclosure [N-PD] | Detail behind a drill-down or popover; the first view carries the answer |
| Mobile tightens secondary content further; scanning is layered (headline first) | NN/g mobile [N-MB], scanning patterns [N-SP] | Message order: headline, then the number, then detail |
| Line length 50-75 characters, 80 at most | Baymard [BY]; WCAG 1.4.8 [W148] | Cap the width of explanatory text; dashboards stay fluid |
| Severity 0-4 = frequency x impact x persistence | NN/g severity [N-SV] | Rate every review finding; fix 3 and 4 before done |
| POS targets: 24 px minimum (WCAG), 44 pt (Apple), 48 dp (Android); near and large targets are faster; few choices under time pressure; good constraints and defaults prevent slips | [W258], [HIG], [AND], NN/g Fitts [N-FT], Hick [HICK], NN/g slips [N-SL], heuristics H5 and H8 [N-H] | Every control at least 44 px; the primary action never moves; quick amounts derived from the total; a sensible default selected |
| Cashiers work under queue pressure and form strong habits | UXmatters [UXM] | Keep the layout identical across states; lead a receipt with what the cashier must act on |
| Diagrams: label every element and line; the legend explains shapes and line types | C4 notation [C4] | Legend shows a sample of each line style used |
| Chat templates have hard limits (header text, body length, footer, buttons) | Meta [META] | Write only what the template can carry; no interactive charts |

## Sources

- [W23] https://clauswilke.com/dataviz/balance-data-context.html and [W17] https://clauswilke.com/dataviz/proportional-ink.html
- [K13] https://eagereyes.org/blog/2013/definition-chart-junk
- [I07] https://cris.bgu.ac.il/en/publications/minimalism-in-information-visualization-attitudes-towards-maximiz/ (abstract only)
- [B10] https://vis.csail.mit.edu/classes/6.859/readings/pdfs/Bateman-UsefulJunk.pdf; Few's 2011 response: https://webspace.science.uu.nl/~telea001/uploads/VACourse/Few11.pdf
- [F06] https://www.perceptualedge.com/articles/Whitepapers/Common_Pitfalls.pdf and [F07] https://blogs.ischool.berkeley.edu/i247s13/files/2013/02/WhyMostDashboardsFail.pdf
- [IBCS] https://www.ibcs.com/wp-content/uploads/2018/01/UN-3.2_More-scenarios_2018-01-23_rh.pdf; standards: https://ibcs.com/standards/
- [H-CSE] https://courses.cs.washington.edu/courses/cse442/26wi/lectures/CSE442-Perception.pdf; banking to 45 degrees: https://homes.cs.washington.edu/~jheer/files/2006-Banking-InfoVis.pdf
- NN/g: [N-PA] https://www.nngroup.com/articles/dashboards-preattentive/ , [N-F] https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/ , [N-VH] https://www.nngroup.com/articles/visual-hierarchy-ux-definition/ , [N-PX] https://www.nngroup.com/articles/gestalt-proximity/ , [N-PD] https://www.nngroup.com/articles/progressive-disclosure/ , [N-MB] https://www.nngroup.com/articles/mobile-sharpens-usability-guidelines/ , [N-SP] https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/ , [N-SV] https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/ , [N-FT] https://www.nngroup.com/articles/fitts-law/ , [N-SL] https://www.nngroup.com/articles/slips/ , [N-H] https://www.nngroup.com/articles/ten-usability-heuristics/
- [BY] https://baymard.com/blog/line-length-readability , [W148] https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html , [W258] https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- [HIG] https://developer.apple.com/design/human-interface-guidelines/accessibility , [AND] https://support.google.com/accessibility/android/answer/7101858 , [HICK] https://lawsofux.com/hicks-law/
- [UXM] https://www.uxmatters.com/mt/archives/2018/04/designing-point-of-sale-systems.php , [C4] https://c4model.com/diagrams/notation
- [META] https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/components.md

## UNVERIFIED

- The IBCS 2.0 text "grey = last year" and the green/red variance colouring (the standard PDF is members only).
- The original Cleveland & McGill 1984 paper (read through secondary sources).
- Few's "data-pixel ratio".
- An NN/g article on "glanceability" (not found).
- Primary research on the peripheral vision of cashiers.

## Research method

Training data goes stale and reads as confident. Prices, API fields, terms and library versions change.

- Use a web search only to find the right URL. Read the page with `curl` (raw bytes, real HTTP status,
  and binary files such as PDF). Do not quote a URL recalled from memory; a guess that resolves to a
  stale page is a silent failure.
- Most vendor docs are JavaScript-heavy: fetch the page, then strip the tags. Prefer structured
  endpoints where they exist (`api.github.com`, `registry.npmjs.org`, `data.jsdelivr.com`,
  `pypi.org/pypi/<pkg>/json`).
- Record the date and URL beside every fact, as in the table above.
- If a fact cannot be verified, write UNVERIFIED. Do not fill the gap from memory.
- Check a CDN library by fetching the exact versioned URL and confirming HTTP 200 before pinning it.
- Verify contrast with the WCAG formula, not by eye. Relative luminance of sRGB
  `L = 0.2126 R + 0.7152 G + 0.0722 B`, where each channel `c` (0 to 1) is `c / 12.92` if
  `c <= 0.03928`, else `((c + 0.055) / 1.055) ^ 2.4`. Ratio = `(L1 + 0.05) / (L2 + 0.05)` with L1 the
  lighter. Text needs 4.5:1 or more; chart marks and large text need 3:1.
