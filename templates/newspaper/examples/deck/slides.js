/* Example deck: a short proposal from Example Co. Every figure is made up and labelled illustrative.
   Each exhibit states its finding in the title, shows one visual proof and gives one source line.
   Load order: slides.js, then ../../kit/deck/chartbook.js, then ../../kit/deck/deck.js. */
window.DECK_CONFIG = { file: 'example-deck', flag: 'Example Co.', dark: ['statement'] };

window.DECK_SLIDES = [
  {
    type: 'cover',
    lead: 'Proposal, March 2026',
    title: 'One revenue view for every store, in three months',
    meta: 'Illustrative example deck. All figures are made up.',
    notes: 'Open with the ask: three months, three stores, one dashboard.'
  },
  {
    type: 'exhibit',
    kicker: 'Where the time goes',
    title: 'Closing the books takes four days, and three of them are manual',
    sub: 'Days to close one month, by step',
    figure: (CB) => CB.bars({
      rows: [
        { label: 'Today', end: '4.0 days', parts: [{ v: 1, kind: 'base', label: 'System' }, { v: 3, kind: 'add', label: 'Manual' }] },
        { label: 'With one view', end: '1.5 days', parts: [{ v: 1, kind: 'base', label: 'System' }, { v: 0.5, kind: 'add' }] },
        { label: 'Target', end: '1-2 days', parts: [{ v: 1, kind: 'base' }, { v: 1, kind: 'range' }] }
      ],
      max: 5, ticks: [0, 1, 2, 3, 4, 5], unit: 'days',
      aria: 'Bar chart: closing a month takes 4 days today and 1.5 days with one view; the target is 1 to 2 days.'
    }),
    source: 'Source: illustrative figures for this example.',
    notes: 'The manual part is the reconciliation of till exports.'
  },
  {
    type: 'exhibit',
    kicker: 'What each store sends',
    title: 'Only one of three stores sends its sales as they happen',
    figure: (CB) => CB.table({
      columns: ['Store', { label: 'Sends', w: '24%' }, { label: 'Delay', r: true }, { label: 'Monthly revenue', r: true }],
      rows: [
        [CB.mark('', 'North store'), 'Every sale', '1 min', '$412,000'],
        [CB.mark('later', 'South store'), 'Daily file', '24 h', '$356,000'],
        [CB.mark('no', 'Harbour kiosk'), 'Paper log', '3 days', '$88,000'],
        { total: true, cells: ['All stores', '', '', '$856,000'] }
      ]
    }),
    source: 'Source: illustrative figures for this example.',
    notes: 'The harbour kiosk is the smallest store and the slowest to report.'
  },
  {
    type: 'exhibit',
    kicker: 'The plan',
    title: 'Three months from the first store to all stores',
    figure: (CB) => CB.gantt({
      months: ['April', 'May', 'June'],
      rows: [
        { what: 'Connect North store', from: 0, to: 1 },
        { what: 'Connect South and Harbour', from: 1, to: 2 },
        { what: 'Dashboard and alerts', from: 0.5, to: 3 }
      ],
      milestones: [{ at: 1, label: 'First live data' }, { at: 3, label: 'All stores live' }],
      aria: 'Plan: North store in April, South and Harbour in May, dashboard and alerts from mid-April to June.'
    }),
    source: 'Source: illustrative plan for this example.',
    notes: 'Each month ends with something the client can see.'
  },
  {
    type: 'statement',
    title: 'Every store, every sale, on one page by noon the same day.',
    notes: 'Pause here.'
  },
  {
    type: 'close',
    kicker: 'Next steps',
    title: 'Three decisions to start in April',
    asks: ['Name one owner for the project.', 'Give read access to the North store till system.', 'Agree the three headline figures.'],
    contact: 'Example Co. · hello@example.com',
    notes: 'End on the first decision.'
  }
];
