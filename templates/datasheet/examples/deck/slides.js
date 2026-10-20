/* slides.js: the example deck. Every figure is computed from ../dashboard/data.js, the file the dashboard reads,
   so the deck and the page cannot disagree. Each title is the slide's conclusion in one sentence. */
(function () {
  'use strict';
  const S = window.SHEET, P = window.PROJECT, d = P.derive(), f = S.fmt, EX = window.EX;
  const d1 = (v) => f.num(v, 1), name = (t) => `${t.id} ${t.name}`;
  const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const word = (n) => WORD[n] || f.int(n), cap = (s) => s[0].toUpperCase() + s.slice(1);
  const late = d.late, top = [...d.shares].sort((a, b) => b.v - a.v)[0], topTask = d.by[top.id];
  const spine = [...d.streams].sort((a, b) => b.critical - a.critical)[0];
  const floaters = d.tasks.filter((t) => !t.critical);
  const peak = d.weeks.reduce((b, x, i) => (x.v > d.weeks[b].v ? i : b), 0);
  const buy = d.tasks.find((t) => t.buy);
  const costShare = (s) => (s.cost / d.cost) * 100, big = [...d.streams].sort((a, b) => b.cost - a.cost)[0];
  // the cover states the forecast against the commitment; the same sentence the dashboard's verdict carries
  const verdict = late > 0 ? `Project A finishes ${d1(late)} working days after its committed date` : `Project A finishes ${d1(-late)} working days before its committed date`;
  const lo = Math.floor(Math.min(P.committed, d.finish - 2 * d.sd) / P.grid) * P.grid, hi = Math.ceil(Math.max(P.committed, d.finish + 2 * d.sd) / P.grid) * P.grid;

  // caption numbers (no) match the page's, so "Fig. 3" names one figure on the page and in the deck
  window.DECK_CONFIG = { file: 'project-a-forecast', org: 'Example Co.', title: 'Project A, delivery forecast', rev: `Revision ${P.rev.no}`, stamp: 'Sample data' };

  window.DECK_SLIDES = [
    {
      type: 'cover', kicker: 'Delivery forecast, project A',
      title: verdict,
      sub: `The commitment lies ${late > d.sd ? 'outside' : 'inside'} one spread of the forecast; ${name(topTask)} sets most of that spread.`,
      spec: [
        ['Forecast duration', `${d1(d.finish)} ± ${d1(d.sd)}`, 'working days', 'one spread on the critical path, S2'],
        ['Committed duration', d1(P.committed), 'working days', `ends ${d.committedDate}, S1`],
        ['Cost', `${d1(d.cost)} ± ${d1(d.costSd)}`, 'USD thousand', 'rate card S4, vendor quote S5']
      ],
      notes: 'Open on the forecast against the commitment. The three rows are the whole case; every later sheet defends one of them.'
    },
    {
      type: 'exhibit', no: 'Fig. 1', kicker: 'Schedule',
      title: `${cap(word(d.critical))} of ${word(d.tasks.length)} tasks set the finish, most of them in the ${spine.label} workstream`,
      figure: EX.timeline(d.drawing, { sel: topTask.id, height: 600, aria: `Schedule of project A, ${topTask.id} selected` }),
      key: [['k-crit', 'Critical task'], ['k-bar', 'Task'], ['k-sel', name(topTask)], ['k-float', 'Float'], ['k-target', 'Committed'], ['k-band', 'Forecast ± spread']],
      sheetNotes: [`<b>${name(topTask)}</b> is the longest critical task at ${d1(topTask.te)} days.`, `<b>${f.int(floaters.length)} tasks</b> carry float; ${name(buy)} has ${d1(buy.float)} days.`, `The grid is one working week of ${f.int(P.grid)} days.`],
      source: 'plan baseline S1, three-point estimates S2.',
      notes: `Point at ${topTask.id} first: it is the bar the forecast rests on.`
    },
    {
      type: 'figure', no: 'Fig. 2', kicker: 'Forecast',
      title: late > 0 ? `The forecast misses the commitment by ${d1(late)} working days` : `The forecast meets the commitment with ${d1(-late)} working days in hand`,
      value: `${d1(d.finish)} ± ${d1(d.sd)}`, unit: 'working days',
      figure: EX.range({ min: lo, max: hi, value: d.finish, tol: d.sd, target: P.committed, targetLabel: 'Committed', unit: 'd', markLabel: false,
        aria: `Forecast ${d1(d.finish)} plus or minus ${d1(d.sd)} working days against a committed ${d1(P.committed)}` }, false),
      source: 'three-point estimates S2, commitment S1; the shaded band is one spread either side.',
      notes: 'One number for the room to keep, with its tolerance.'
    },
    {
      type: 'exhibit', no: 'Fig. 3', kicker: 'Spread',
      title: `${name(topTask)} carries ${f.pct(top.v, 0)} of the uncertainty in the finish`,
      figure: EX.ranked({ rows: d.shares, unit: '%', fmt: (v) => f.num(v, 0), fs: 28, aria: `Share of the finish variance: ${[...d.shares].sort((a, b) => b.v - a.v).map((s) => `${s.label} ${f.num(s.v, 0)} percent`).join(', ')}` }),
      sheetNotes: ['Spreads add as squares along the critical path, so the shares <b>add up to 100 %</b>.', `${topTask.id}'s pessimistic estimate is <b>${f.int(topTask.p - topTask.m)} days</b> above its most likely one.`, 'Tasks with float add nothing to the spread of the finish.'],
      source: 'three-point estimates S2.',
      notes: `Firming up ${topTask.id} narrows the band more than any other single estimate.`
    },
    {
      type: 'exhibit', no: 'Fig. 4', kicker: 'Team',
      title: `Staffing peaks at ${d1(d.weeks[peak].v)} people in week ${peak + 1}`,
      figure: EX.columns({ height: 520, rows: d.weeks, extreme: 'max', fmt: (v) => (Number.isInteger(v) ? f.int(v) : d1(v)),
        aria: `People booked per week: ${d.weeks.map((x) => `${x.label} ${d1(x.v)}`).join('; ')}.` }),
      key: [['k-col', 'People on average across the week']],
      sheetNotes: [`<b>${f.int(d.effort)} person-days</b> in all.`, `The last week books <b>${d1(d.weeks[d.weeks.length - 1].v)} people</b>: the hand-over.`, 'Each task holds its people for its whole duration.'],
      source: 'staffing plan S3, task dates from S2.',
      notes: 'The peak is where a slip costs most.'
    },
    {
      type: 'table', no: 'Table 4', kicker: 'Cost',
      title: `The ${big.label} workstream is ${f.pct(costShare(big), 0)} of the cost`,
      columns: [{ label: 'Workstream' }, { label: 'Tasks', r: true }, { label: 'Cost, USD thousand', r: true }, { label: 'Share', r: true }],
      rows: d.streams.map((s) => ({ sel: s === big, cells: [s.label, f.int(s.tasks), d1(s.cost), f.pct(costShare(s), 0)] }))
        .concat([{ total: true, cells: ['Project A', f.int(d.tasks.length), `${d1(d.cost)} ± ${d1(d.costSd)}`, f.pct(100, 0)] }]),
      sheetNotes: [`${name(buy)} includes a fixed price of <b>${d1(buy.buy)}</b> from a draft quote (S5).`, 'The tolerance follows the spread of each task\'s effort.'],
      source: 'rate card S4, staffing plan S3, vendor quote S5 (unverified).',
      notes: 'The cost spread is small next to the schedule spread.'
    },
    {
      type: 'close', kicker: 'Next',
      title: 'Three steps before the next review',
      asks: [[`Firm up the estimate for ${name(topTask)}`, `It carries ${f.pct(top.v, 0)} of the spread (S2).`], [`Get the quote for ${name(buy)} signed`, 'The price is a draft (S5).'], ['Agree the committed date or the scope', late > 0 ? `The forecast is ${d1(late)} working days past it.` : 'The forecast meets it today.']],
      notes: 'Close on the asks; each one retires a caveat from the earlier sheets.'
    }
  ];
})();
