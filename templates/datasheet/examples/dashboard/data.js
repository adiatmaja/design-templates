/* data.js: the sample project, one source for the dashboard and the deck (../deck/slides.js loads this file too).
   Every figure on either page is derived here from the task estimates and these inputs, so a table, a chart and the
   drawing cannot disagree. Durations are working days counted from the project start. All values are invented
   sample data. */
(function () {
  'use strict';

  const project = {
    name: 'Project A',
    start: '2027-01-04',          // the first working day (S1)
    committed: 61,                // the duration promised to the sponsor, working days (S1)
    rate: 0.64,                   // blended cost of one person-day, USD thousand (S4)
    grid: 5,                      // one working week on the drawing
    rev: { no: 4, date: '2026-12-14' },
    workstreams: [
      { id: 'A', label: 'Define' },
      { id: 'B', label: 'Build' },
      { id: 'C', label: 'Deploy' }
    ],
    // o, m, p: optimistic, most likely and pessimistic duration in working days (S2); people for the whole task (S3);
    // after: the tasks that must finish first (S1); buy: a fixed external cost in USD thousand (S5)
    tasks: [
      { id: 'A1', ws: 'A', name: 'Scope', o: 4, m: 5, p: 8, people: 2, after: [] },
      { id: 'A2', ws: 'A', name: 'Design', o: 8, m: 10, p: 15, people: 3, after: ['A1'] },
      { id: 'A3', ws: 'A', name: 'Review', o: 2, m: 3, p: 6, people: 2, after: ['A2'] },
      { id: 'B1', ws: 'B', name: 'Build, part 1', o: 10, m: 12, p: 18, people: 4, after: ['A2'] },
      { id: 'B2', ws: 'B', name: 'Build, part 2', o: 12, m: 15, p: 26, people: 4, after: ['B1'] },
      { id: 'B3', ws: 'B', name: 'Integrate', o: 5, m: 7, p: 12, people: 3, after: ['B2', 'C2'] },
      { id: 'B4', ws: 'B', name: 'Test', o: 6, m: 8, p: 13, people: 3, after: ['B3'] },
      { id: 'C1', ws: 'C', name: 'Procure', o: 15, m: 20, p: 30, people: 1, after: ['A1'], buy: 42 },
      { id: 'C2', ws: 'C', name: 'Set up', o: 4, m: 5, p: 8, people: 2, after: ['C1'] },
      { id: 'C3', ws: 'C', name: 'Train', o: 3, m: 4, p: 6, people: 2, after: ['A3', 'C2'] },
      { id: 'C4', ws: 'C', name: 'Hand over', o: 2, m: 3, p: 5, people: 2, after: ['B4', 'C3'] }
    ],
    sources: {
      S1: { title: 'Plan baseline', source: 'Sample project plan, revision 4', method: 'The task list, the order tasks must follow and the committed duration', date: '2026-12-14' },
      S2: { title: 'Three-point estimates', source: 'Sample estimating session with the workstream leads', method: 'An optimistic, a most likely and a pessimistic duration per task; spreads add as squares along the critical path', formula: 'expected = (o + 4m + p) / 6; spread = (p - o) / 6', date: '2026-12-10' },
      S3: { title: 'Staffing plan', source: 'Sample staffing plan', method: 'People assigned to each task for its whole duration', date: '2026-12-11' },
      S4: { title: 'Rate card', source: 'Sample internal rate card', method: 'One blended cost per person-day', date: '2026-11-30' },
      S5: { title: 'Vendor quote', source: 'Sample quote for the item C1 buys', method: 'A fixed price for the item, delivered', date: '2026-12-02', verified: false, gap: 'a draft quote, not yet signed' },
      S6: { title: 'Working calendar', source: 'Sample company calendar', method: 'Five working days a week; no holiday falls inside the period', date: '2026-11-20' }
    }
  };

  const EPS = 1e-9;

  // the calendar date on which working day n ends (day 1 is the start date), weekends skipped (S6)
  project.dateOf = function (n) {
    const d = new Date(project.start + 'T00:00:00Z');
    let left = Math.max(1, Math.ceil(n - EPS)) - 1;
    while (left > 0) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) left--; }
    return d.toISOString().slice(0, 10);
  };

  // Derive every figure from the inputs above. Call again after an estimate changes.
  project.derive = function () {
    const n1 = (v) => window.SHEET.fmt.num(v, 1);
    const T = project.tasks.map((t) => Object.assign({}, t, { te: (t.o + 4 * t.m + t.p) / 6, sd: (t.p - t.o) / 6 }));
    const by = Object.fromEntries(T.map((t) => [t.id, t]));
    // forward pass: a task starts when the last task before it finishes
    const fwd = (t) => { if (t.es == null) { t.es = Math.max(0, ...t.after.map((id) => fwd(by[id]).ef)); t.ef = t.es + t.te; } return t; };
    T.forEach(fwd);
    const finish = Math.max(...T.map((t) => t.ef));
    // backward pass: the latest a task may finish without moving the finish; float is the room between
    const next = (t) => T.filter((s) => s.after.includes(t.id));
    const back = (t) => { if (t.lf == null) { const n = next(t); t.lf = n.length ? Math.min(...n.map((s) => back(s).lf - s.te)) : finish; } return t; };
    T.forEach(back);
    T.forEach((t) => { t.float = Math.max(0, t.lf - t.ef); t.critical = t.float < 1e-6; });
    // the critical path as one chain, walked back from the last task through the predecessor that sets each start;
    // the finish's spread is summed along this chain only, so a second branch is never counted twice
    const path = [];
    for (let t = T.find((x) => Math.abs(x.ef - finish) < EPS); t; t = t.after.map((id) => by[id]).find((p) => Math.abs(p.ef - t.es) < EPS)) path.unshift(t);
    const variance = path.reduce((a, t) => a + t.sd * t.sd, 0), sd = Math.sqrt(variance);
    const shares = path.map((t) => ({ id: t.id, label: `${t.id} ${t.name}`, v: variance ? (t.sd * t.sd) / variance * 100 : 0 }));
    // effort and cost: people times expected duration at the blended rate, plus fixed external items
    T.forEach((t) => { t.effort = t.te * t.people; t.cost = t.effort * project.rate + (t.buy || 0); });
    const effort = T.reduce((a, t) => a + t.effort, 0), cost = T.reduce((a, t) => a + t.cost, 0);
    const costSd = project.rate * Math.sqrt(T.reduce((a, t) => a + (t.sd * t.people) ** 2, 0));
    const streams = project.workstreams.map((w) => {
      const ts = T.filter((t) => t.ws === w.id);
      return { id: w.id, label: w.label, tasks: ts.length, effort: ts.reduce((a, t) => a + t.effort, 0), cost: ts.reduce((a, t) => a + t.cost, 0), critical: ts.filter((t) => t.critical).length };
    });
    // people booked in each working week: a task's people, pro rata for the days of the week it covers
    const weeks = Array.from({ length: Math.ceil(finish / project.grid - EPS) }, (_, w) => {
      const a = w * project.grid, b = a + project.grid;
      return { label: `W${w + 1}`, v: T.reduce((s, t) => s + t.people * Math.max(0, Math.min(b, t.ef) - Math.max(a, t.es)), 0) / project.grid };
    });
    const late = finish - project.committed;
    // the verdict: on time, late inside one spread, or late beyond it
    const verdict = late <= EPS ? 'pass' : late <= sd ? 'caution' : 'fault';
    // the checks the forecast rests on, worst first: the estimate that drives the spread, then any task on an unverified source
    const top = [...shares].sort((a, b) => b.v - a.v)[0];
    const checks = [];
    if (top && top.v > 100 / 3) checks.push({ kind: 'caution', task: top.id, share: top.v });
    T.filter((t) => t.buy && project.sources.S5.verified === false).forEach((t) => checks.push({ kind: t.float >= t.p - t.te ? 'pass' : 'caution', task: t.id, src: 'S5', slip: t.p - t.te }));
    // the drawing: one row per task, the links between them, the committed and forecast lines and the forecast's spread
    const drawing = {
      grid: project.grid, unit: 'd',
      rows: T.map((t) => ({ id: t.id, label: t.name, group: t.ws, start: t.es, end: t.ef, float: t.float, critical: t.critical })),
      links: T.flatMap((t) => t.after.map((id) => [id, t.id, by[id].critical && t.critical && Math.abs(by[id].ef - t.es) < EPS])),
      marks: [{ at: project.committed, label: 'Committed', kind: 'target' }, { at: finish, label: 'Forecast', kind: 'forecast' }],
      band: [finish - sd, finish + sd],
      dims: [[0, finish, `${n1(finish)} d`], late > EPS ? [project.committed, finish, `${n1(late)} d late`] : [finish, project.committed, `${n1(-late)} d in hand`]]
    };
    return { tasks: T, by, finish, sd, late, verdict, path, shares, effort, cost, costSd, streams, weeks, checks, drawing,
      critical: T.filter((t) => t.critical).length, finishDate: project.dateOf(finish), committedDate: project.dateOf(project.committed) };
  };

  window.PROJECT = project;
})();
