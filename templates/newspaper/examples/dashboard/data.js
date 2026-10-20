/* data.js: illustrative, generated data for the example dashboard (Example Co.). Deterministic: the same figures on
   every load. Three stores, three payment methods, one sale bucket every 5 minutes from 06:00 to 21:00 (UTC day keys).
   window.DEMO = {START, TODAY, CUT, OPEN, CLOSE, STORES, METHODS, OUTAGE, sum(from, to, ids, methods), last(id)}
   sum() adds every bucket that starts in [from, to) and before CUT: {t, c, site: {id: {t, c}}}. */
(function () {
  'use strict';
  const H = 3600000, STEP = 300000, OPEN = 6, CLOSE = 21, N = (CLOSE - OPEN) * 12;
  const START = '2025-10-01', TODAY = '2026-03-18';
  const CUT = Date.parse(TODAY + 'T14:35:00Z');
  const STORES = [
    { id: 'north', name: 'North store', short: 'North', rate: 3.1, ticket: 14 },
    { id: 'south', name: 'South store', short: 'South', rate: 1.9, ticket: 23 },
    { id: 'harbour', name: 'Harbour kiosk', short: 'Harbour', rate: 2.4, ticket: 6 }
  ];
  const METHODS = [['card', 'Card', 0.5], ['mobile', 'Mobile', 0.35], ['cash', 'Cash', 0.15]];
  // the harbour terminal stopped sending today: its buckets after this time are missing
  const OUTAGE = { id: 'harbour', since: Date.parse(TODAY + 'T12:55:00Z') };

  // a small integer hash, so a bucket's figures depend only on its place
  const hash = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  // lunch and evening peaks over the opening hours
  const shape = (i) => { const hr = OPEN + i / 12; return 0.35 + Math.exp(-((hr - 12.5) ** 2) / 2.2) + 0.8 * Math.exp(-((hr - 18) ** 2) / 3); };
  const day0 = Date.parse(START + 'T00:00:00Z');
  const cache = {};
  // per store and day: prefix sums of count and amount per method, so a range is two lookups
  function dayOf(si, d) {
    const key = si + ':' + d;
    if (cache[key]) return cache[key];
    const s = STORES[si], wd = new Date(day0 + d * 86400000).getUTCDay(), week = wd === 0 || wd === 6 ? 1.3 : 1, trend = 1 + d / 900;
    const pre = METHODS.map(() => ({ c: new Float64Array(N + 1), t: new Float64Array(N + 1) }));
    for (let i = 0; i < N; i++) {
      const n = Math.round(s.rate * shape(i) * week * trend * (0.6 + 0.8 * hash(si + 1, d, i)));
      METHODS.forEach((m, k) => {
        const c = Math.round(n * m[2] * (0.7 + 0.6 * hash(k + 7, d, i)));
        pre[k].c[i + 1] = pre[k].c[i] + c;
        pre[k].t[i + 1] = pre[k].t[i] + c * s.ticket * (0.85 + 0.3 * hash(k + 11, si, i));
      });
    }
    return (cache[key] = pre);
  }
  function sum(from, to, ids, methods) {
    const out = { t: 0, c: 0, site: {} };
    ids.forEach((id) => { out.site[id] = { t: 0, c: 0 }; });
    const ks = METHODS.map((m, k) => k).filter((k) => !methods || methods.includes(METHODS[k][0]));
    for (let d = Math.max(0, Math.floor((from - day0) / 86400000)); day0 + d * 86400000 < to; d++) {
      const open = day0 + d * 86400000 + OPEN * H;
      ids.forEach((id) => {
        const si = STORES.findIndex((s) => s.id === id);
        let end = Math.min(to, CUT);
        if (id === OUTAGE.id) end = Math.min(end, OUTAGE.since);
        // bucket i starts at open + i * STEP; take those starting in [from, end)
        const lo = Math.max(0, Math.min(N, Math.ceil((from - open) / STEP))), hi = Math.max(0, Math.min(N, Math.ceil((end - open) / STEP)));
        if (hi <= lo) return;
        const pre = dayOf(si, d);
        ks.forEach((k) => {
          const c = pre[k].c[hi] - pre[k].c[lo], t = pre[k].t[hi] - pre[k].t[lo];
          out.site[id].c += c; out.site[id].t += t; out.c += c; out.t += t;
        });
      });
    }
    return out;
  }
  // the newest bucket a store sent today
  const last = (id) => Math.floor(((id === OUTAGE.id ? OUTAGE.since : CUT) - 1) / STEP) * STEP;
  window.DEMO = { START, TODAY, CUT, OPEN, CLOSE, STORES, METHODS, OUTAGE, sum, last };
})();
