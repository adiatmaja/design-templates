/* kit.js: behaviour for newspaper-world pages (classic script, also opens from file://). Load before the page script.
   Defines window.KIT (full reference: ../../README.md):
   helpers: DAY, tok(--css-var), num, p2, MON, MONTH, WEEKDAY, dstart, addDays, dmy, dmyy, rangeTxt, keyOf (day keys 'YYYY-MM-DD', UTC)
   chart: nice(max), plot(box, {readout, label}) SVG line/bar chart with a keyboard readout
   rows: alarms(items), rangeBar, rangeKey, prop(rest, part, sr)
   controls: tablist(el, pick), keepOne(form, name, guard, msg), period({today, cut, start}), periodUI(form, P, set)
   Also wires a tooltip for every [data-tip] and, below 1366 px, wraps wide tables in a scrolling .tscroll. */
(function () {
  'use strict';

  // ---- tooltip: one #kit-tip for every [data-tip], in the chart readout's look ----
  // opens at once on hover, keyboard focus and tap; Esc, leaving, a tap elsewhere or a scroll closes it.
  // The pointer may move onto it (WCAG 1.4.13); the native title tooltip is never used.
  let tip = null, cur = null;
  const hideTip = () => { if (!cur) return; cur.removeAttribute('aria-describedby'); cur = null; tip.hidden = true; };
  const showTip = (el) => {
    if (cur === el) return; hideTip();
    if (!tip) { tip = document.createElement('div'); tip.id = 'kit-tip'; tip.className = 'readout tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
    cur = el; tip.textContent = el.dataset.tip; tip.hidden = false; el.setAttribute('aria-describedby', 'kit-tip');
    const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, g = 6;
    // inside a popover the tip sits beside it, so it never covers the next option
    const pop = el.closest('.pop'), q = pop && pop.getBoundingClientRect();
    if (q) { tip.style.left = (q.right + g + w > innerWidth - 8 ? q.left - g - w : q.right + g) + 'px'; tip.style.top = r.top + 'px'; return; }
    tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left)) + 'px';
    tip.style.top = (r.bottom + g + h > innerHeight - 8 ? r.top - g - h : r.bottom + g) + 'px';
  };
  const tipOf = (e) => e.target.closest && e.target.closest('[data-tip]');
  const inTip = (n) => n && (cur && cur.contains(n) || tip && tip.contains(n));
  document.addEventListener('pointerover', (e) => { const t = tipOf(e); if (t && e.pointerType !== 'touch') showTip(t); });
  document.addEventListener('pointerout', (e) => { if (cur && e.pointerType !== 'touch' && inTip(e.target) && !inTip(e.relatedTarget)) hideTip(); });
  document.addEventListener('focusin', (e) => { const t = tipOf(e); if (t) showTip(t); });
  document.addEventListener('focusout', (e) => { if (cur && cur.contains(e.target)) hideTip(); });
  document.addEventListener('click', (e) => { const t = tipOf(e); if (t && !t.closest('a')) showTip(t); });   // tap on touch; a link just goes
  document.addEventListener('pointerdown', (e) => { if (cur && !inTip(e.target)) hideTip(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTip(); });
  addEventListener('scroll', hideTip, true);

  // ---- helpers: day keys are 'YYYY-MM-DD' in UTC, so a day is always 24 h and keys shift as plain dates ----
  const DAY = 86400000;
  const tok = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const $ = (id) => document.getElementById(id);
  const num = (n) => Math.round(n).toLocaleString('en-US');
  const p2 = (n) => String(n).padStart(2, '0');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const KEY = /^\d{4}-\d\d-\d\d$/;
  const dstart = (k) => Date.parse(k + 'T00:00:00Z');
  const addDays = (k, n) => new Date(Date.parse(k + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
  const keyOf = (d) => (isNaN(d) ? '' : d.toISOString().slice(0, 10));
  const yearAgo = (k) => (k.slice(5) === '02-29' ? (k.slice(0, 4) - 1) + '-02-28' : (k.slice(0, 4) - 1) + k.slice(4));
  const dmy = (k) => `${+k.slice(8)} ${MON[+k.slice(5, 7) - 1]}`;
  const dmyy = (k) => `${dmy(k)} ${k.slice(0, 4)}`;
  // 1–17 Oct 2026; the month and year are named once where they are shared
  const rangeTxt = (fk, tk) => fk === tk ? dmyy(fk) : fk.slice(0, 4) !== tk.slice(0, 4) ? `${dmyy(fk)}–${dmyy(tk)}`
    : fk.slice(5, 7) !== tk.slice(5, 7) ? `${dmy(fk)}–${dmyy(tk)}` : `${+fk.slice(8)}–${dmyy(tk)}`;

  // =================== SVG chart, alarm lines, range and proportion bars, text-tab helpers ===================

  // A step of 1, 2, 2,5 or 5 x 10^n, giving about five gridlines up to `max`.
  function nice(max) {
    if (!(max > 0)) return { top: 1, step: 1 };
    const raw = max / 5, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
    return { top: Math.ceil(max / step) * step, step };
  }

  /* plot(box, {readout(i, model) -> html, label(model) -> aria text}) draws model into box's <svg> and wires the readout
     (box's .readout) to pointer and keys. Returns {draw(model), hide()}. A model is
       {kind: 'line', pts: [{t, cur, cmp}], x0, x1, xTicks: [t], xTick(t), now: t|null, yTick(v), end,
        ends: {cur, cmp, fmt(v), diff(a, b)}, close: {v, text, rise} | null, bands: [{from, to, text}]}
     or {kind: 'bar', pts: [{t, cur, cmp, partial}], xLabel(p), xSub(p), yTick(v), end}. */
  function plot(box, opt) {
    const svg = box.querySelector('svg'), ro = box.querySelector('.readout');
    let C = null, SEL = -1;
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    function render() {
      if (!C || box.hidden) return;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize), line = C.kind === 'line';
      const W = box.clientWidth, H = box.clientHeight, ends = line && C.ends, last = C.pts[C.pts.length - 1];
      const rise = line && C.close && C.close.rise;
      // a phone-width plot gives the end labels no margin of their own: they sit beside the line's end, flipped to its left when they would run out
      const slim = NARROW.matches && W < 36 * rem;
      // there the end labels and the comparison's close leave the plot for a row under it (.plot-ends), so no word sits on a line
      const out = [];
      const L = 5.75 * rem, R = ends && !slim ? 13.5 * rem : 0.5 * rem, T = (rise ? (slim ? 1.25 : 2.25) : 0.75) * rem, B = (line ? 2 : 3.25) * rem;
      const pw = Math.max(10, W - L - R), ph = Math.max(10, H - T - B);
      const vals = C.pts.flatMap((p) => [p.cur, p.cmp]).filter((v) => v != null);
      if (line && C.close && !rise && C.close.v != null) vals.push(C.close.v);
      const sc = nice(Math.max(...vals) * 1.12), y = (v) => T + ph - v / sc.top * ph;
      let g = '';
      for (let v = 0; v <= sc.top + 1e-9; v += sc.step) {
        const yy = Math.round(y(v)) + 0.5;
        g += `<line x1="${L}" x2="${L + pw}" y1="${yy}" y2="${yy}" stroke="${v === 0 ? 'var(--ink)' : 'var(--rule)'}" stroke-width="1"/>`;
        g += `<text x="${L - 0.625 * rem}" y="${yy + 0.33 * rem}" text-anchor="end">${v === 0 ? '0' : esc(C.yTick(v))}</text>`;
      }
      let geo;
      if (line) {
        const x = (t) => L + (t - C.x0) / (C.x1 - C.x0) * pw, base = T + ph;
        // an alarm on the time axis: a quiet band over the plot, a red rule on the axis, its words above the axis
        (C.bands || []).forEach((b) => {
          const a = x(Math.max(b.from, C.x0)), e = x(Math.min(b.to, C.x1));
          if (e - a < 1) return;
          g += `<rect x="${a}" y="${T}" width="${e - a}" height="${ph}" fill="var(--paper-2)"/>`;
          g += `<rect x="${a}" y="${base - 2}" width="${e - a}" height="5" fill="var(--alarm)"/>`;
          g += `<line x1="${a}" x2="${a}" y1="${T}" y2="${base}" stroke="var(--alarm)" stroke-width="1"/>`;
          g += `<text class="ann alarm" x="${a + 0.5 * rem}" y="${base - 0.75 * rem}">${esc(b.text)}</text>`;
        });
        // hour ticks thinned to a minimum gap; a running period ends on a bold "now" tick
        // on a phone the gap is measured between two real ticks, since the axis may run past the last one
        const tgap = slim && C.xTicks.length > 1 ? x(C.xTicks[1]) - x(C.xTicks[0]) : pw / Math.max(1, C.xTicks.length - 1);
        const minGap = (slim ? 4.5 : 3.5) * rem, every = Math.max(1, Math.ceil(minGap / tgap));
        C.xTicks.forEach((t, i) => {
          if (i % every || (C.now != null && x(C.x1) - x(t) < minGap)) return;
          // a tick on the y axis starts there, so it clears the axis's "0"
          g += `<text x="${x(t)}" y="${base + 1.375 * rem}" text-anchor="${x(t) - L < 0.5 * rem ? 'start' : 'middle'}">${esc(C.xTick(t))}</text>`;
        });
        if (C.now != null) g += `<text class="now" x="${x(C.now)}" y="${base + 1.375 * rem}" text-anchor="middle">${esc(C.xTick(C.now))}</text>`;
        const path = (k) => { let d = '', pen = false;
          C.pts.forEach((p) => { if (p[k] == null) { pen = false; return; } d += (pen ? 'L' : 'M') + x(p.t).toFixed(1) + ' ' + y(p[k]).toFixed(1); pen = true; }); return d; };
        if (C.close && !rise && C.close.v != null) {
          const yc = Math.round(y(C.close.v)) + 0.5;
          g += `<line x1="${L}" x2="${L + pw}" y1="${yc}" y2="${yc}" stroke="var(--cmp)" stroke-width="1.5" stroke-dasharray="6 4"/>`;
          if (!slim) g += `<text class="ann" x="${L + 0.5 * rem}" y="${yc - 0.5 * rem}">${esc(C.close.text)}</text>`;
        }
        g += `<path d="${path('cmp')}" fill="none" stroke="var(--cmp)" stroke-width="2.25" stroke-linejoin="round"/>`;
        g += `<path d="${path('cur')}" fill="none" stroke="var(--ink)" stroke-width="3.25" stroke-linejoin="round"/>`;
        const xe = x(last.t);
        if (ends && last.cur != null && last.cmp != null && slim) {
          out.push(`<li><i class="key ln"></i><b>${esc(ends.cur)}</b> ${esc(ends.fmt(last.cur))}</li>`,
            `<li class="c"><i class="key ln k-cmp"></i><b>${esc(ends.cmp)}</b> ${esc(ends.fmt(last.cmp))}</li>`, `<li>${esc(ends.diff(last.cur, last.cmp))}</li>`);
        } else if (ends && last.cur != null && last.cmp != null) {
          const ya = y(last.cur), yb = y(last.cmp), bx = xe + 0.4 * rem;
          g += `<path d="M${xe + 0.15 * rem} ${ya}H${xe + 0.65 * rem}M${bx} ${ya}V${yb}M${xe + 0.15 * rem} ${yb}H${xe + 0.65 * rem}" stroke="var(--ink-3)" stroke-width="1.5" fill="none"/>`;
          // end labels pushed apart when they would touch; the difference sits between them, or under them when close
          const gapMin = 1.5 * rem; let la = ya, lb = yb;
          if (Math.abs(la - lb) < gapMin) { const mm = (la + lb) / 2, up = la <= lb; la = mm + (up ? -gapMin / 2 : gapMin / 2); lb = mm + (up ? gapMin / 2 : -gapMin / 2); }
          const lo = Math.max(la, lb), hiY = Math.min(la, lb);
          const gy = Math.abs(la - lb) >= 3.2 * rem ? (la + lb) / 2 : (lo + 1.5 * rem < base ? lo + 1.5 * rem : hiY - 1.5 * rem);
          const lx = xe + 1.125 * rem, sh = 0.36 * rem;
          g += `<text class="end" x="${lx}" y="${la + sh}"><tspan font-weight="700">${esc(ends.cur)}</tspan> ${esc(ends.fmt(last.cur))}</text>`;
          g += `<text class="end c" x="${lx}" y="${lb + sh}"><tspan font-weight="600">${esc(ends.cmp)}</tspan> ${esc(ends.fmt(last.cmp))}</text>`;
          g += `<text class="end" x="${lx}" y="${gy + sh}">${esc(ends.diff(last.cur, last.cmp))}</text>`;
        }
        // the comparison's full-day close, off the scale: a dashed riser from the line ends to its value above the plot
        if (rise && C.close.v != null) {
          const top = Math.min(...[last.cur, last.cmp].filter((v) => v != null).map(y)) - 0.625 * rem, ay = T - 0.125 * rem;
          if (top > ay + rem) g += `<line x1="${xe}" x2="${xe}" y1="${top}" y2="${ay + 0.375 * rem}" stroke="var(--cmp)" stroke-width="1.5" stroke-dasharray="4 3"/>` +
            `<path d="M${xe - 0.3125 * rem} ${ay + 0.625 * rem}L${xe} ${ay}L${xe + 0.3125 * rem} ${ay + 0.625 * rem}" fill="none" stroke="var(--cmp)" stroke-width="1.5"/>`;
          if (!slim) g += `<text class="ann" x="${xe - 0.625 * rem}" y="${T - 0.625 * rem}" text-anchor="end">${esc(C.close.text)}</text>`;
        }
        if (slim && C.close && C.close.v != null) out.push(`<li class="c close">${esc(C.close.text)}</li>`);
        if (last.cmp != null) g += `<circle cx="${xe}" cy="${y(last.cmp)}" r="4" fill="var(--cmp)"/>`;
        if (last.cur != null) g += `<circle cx="${xe}" cy="${y(last.cur)}" r="4.5" fill="var(--ink)"/>`;
        geo = { idxAt: (px) => { let bi = 0, bd = Infinity; C.pts.forEach((p, i) => { const d = Math.abs(x(p.t) - px); if (d < bd) { bd = d; bi = i; } }); return bi; },
          cursor: (i) => { const p = C.pts[i], xx = x(p.t); return `<line x1="${xx}" x2="${xx}" y1="${T}" y2="${T + ph}" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="3 3"/>` +
            (p.cmp != null ? `<circle cx="${xx}" cy="${y(p.cmp)}" r="5" fill="var(--paper)" stroke="var(--cmp)" stroke-width="2.25"/>` : '') +
            (p.cur != null ? `<circle cx="${xx}" cy="${y(p.cur)}" r="5.5" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/>` : ''); },
          xOf: (i) => x(C.pts[i].t) };
      } else {
        // paired bars: comparison grey behind-left, actual ink; a running bucket hatched, so "not complete" is a shape, not a hue
        const n = C.pts.length, band = pw / n, pair = Math.min(band * 0.78, 5 * rem), bw = pair / 2 - 1, every = Math.max(1, Math.ceil(4.5 * rem / band));
        g += `<defs><pattern id="kit-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--paper)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink)" stroke-width="3"/></pattern></defs>`;
        g += `<rect class="hl" x="0" y="${T}" width="${band}" height="${ph}" fill="var(--paper-2)" visibility="hidden"/>`;
        C.pts.forEach((p, i) => {
          const x0 = L + i * band + (band - pair) / 2;
          if (p.cmp != null) { const yy = y(p.cmp); g += `<rect x="${x0}" y="${yy}" width="${bw}" height="${T + ph - yy}" fill="var(--cmp-fill)"/>`; }
          if (p.cur != null) { const yy = y(p.cur); g += `<rect x="${x0 + pair / 2 + 1}" y="${yy}" width="${bw}" height="${T + ph - yy}" fill="${p.partial ? 'url(#kit-hatch)' : 'var(--ink)'}"${p.partial ? ' stroke="var(--ink)" stroke-width="1.5"' : ''}/>`; }
          if ((n - 1 - i) % every === 0) {
            const cx = L + i * band + band / 2, sub = C.xSub ? C.xSub(p) : '';
            g += `<text x="${cx}" y="${T + ph + 1.375 * rem}" text-anchor="middle"${p.partial ? ' class="now"' : ''}>${esc(C.xLabel(p))}</text>`;
            if (sub) g += `<text x="${cx}" y="${T + ph + 2.625 * rem}" text-anchor="middle" class="now">${esc(sub)}</text>`;
          }
        });
        g += `<line x1="${L}" x2="${L + pw}" y1="${Math.round(y(0)) + 0.5}" y2="${Math.round(y(0)) + 0.5}" stroke="var(--ink)"/>`;
        geo = { idxAt: (px) => Math.max(0, Math.min(n - 1, Math.floor((px - L) / band))), band, L, xOf: (i) => L + i * band + band / 2 };
      }
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.innerHTML = g + '<g class="cur"></g>';
      let list = box.nextElementSibling && box.nextElementSibling.classList.contains('plot-ends') ? box.nextElementSibling : null;
      if (out.length && !list) { list = document.createElement('ul'); list.className = 'plot-ends'; box.after(list); }
      if (list) { list.innerHTML = out.join(''); list.hidden = !out.length; }
      if (slim) svg.querySelectorAll('text.end, text.ann').forEach((t) => {
        const b = t.getBBox(), x0 = +t.getAttribute('x');
        if (b.x + b.width <= W && b.x >= 0) return;
        t.setAttribute('style', 'paint-order: stroke; stroke: var(--paper); stroke-width: 5px; stroke-linejoin: round');
        if (t.classList.contains('end') && line) { t.setAttribute('text-anchor', 'end'); t.setAttribute('x', geo.xOf(C.pts.length - 1) - 0.875 * rem); }
        else t.setAttribute('x', x0 + (b.x < 0 ? -b.x : W - b.x - b.width));
      });
      box.dataset.end = C.end == null ? '' : Math.round(C.end);
      C.geo = geo; C.T = T; C.W = W;
      if (opt.label) box.setAttribute('aria-label', opt.label(C));
      if (SEL >= 0) showAt(Math.min(SEL, C.pts.length - 1), null);
    }
    function showAt(i, px) {
      SEL = i;
      if (C.kind === 'bar') { const hl = svg.querySelector('.hl'); hl.setAttribute('x', C.geo.L + i * C.geo.band); hl.setAttribute('visibility', 'visible'); }
      else svg.querySelector('.cur').innerHTML = C.geo.cursor(i);
      ro.innerHTML = opt.readout(i, C); ro.hidden = false; ro.dataset.i = i;
      const ax = px == null ? C.geo.xOf(i) : px, w = ro.offsetWidth;
      ro.style.left = (ax + 16 + w > C.W ? Math.max(0, ax - w - 16) : ax + 16) + 'px';
      ro.style.top = C.T + 'px';
    }
    function hide() {
      SEL = -1; ro.hidden = true;
      const cur = svg.querySelector('.cur'), hl = svg.querySelector('.hl');
      if (cur) cur.innerHTML = ''; if (hl) hl.setAttribute('visibility', 'hidden');
    }
    box.addEventListener('pointermove', (e) => { if (!C) return; const px = e.clientX - box.getBoundingClientRect().left; showAt(C.geo.idxAt(px), px); });
    // a tap reads the point under the finger and keeps it until the next tap elsewhere (blur), since a touch has no hover
    box.addEventListener('pointerdown', (e) => { if (!C || e.pointerType !== 'touch') return; const px = e.clientX - box.getBoundingClientRect().left; showAt(C.geo.idxAt(px), px); });
    box.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch' && document.activeElement !== box) hide(); });
    box.addEventListener('focus', () => { if (C) showAt(SEL >= 0 ? SEL : C.pts.length - 1, null); });
    box.addEventListener('blur', hide);
    box.addEventListener('keydown', (e) => {
      if (!C) return;
      const n = C.pts.length, i = SEL < 0 ? n - 1 : SEL;
      const k = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: n - 1, PageUp: i - 6, PageDown: i + 6 }[e.key];
      if (k == null) { if (e.key === 'Escape') hide(); return; }
      e.preventDefault(); showAt(Math.max(0, Math.min(n - 1, k)), null);
    });
    new ResizeObserver(render).observe(box);
    return { draw(model) { C = model; render(); }, hide };
  }

  // Alarm lines in priority order: [{level: 'hi'|'mid', state: 'Disconnected', what, pre: 'since', at: '08:12'}]. Shape + word, never colour alone.
  const MARK = { hi: ['High priority', '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect class="al-hi" x="1" y="1" width="12" height="12"/></svg>'],
    mid: ['Medium priority', '<svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true"><path class="al-mid" d="M8 1 15 13H1Z" stroke-width="1.25" stroke-linejoin="round"/></svg>'] };
  const alarms = (items) => items.map((a) => `<li class="al ${a.level}">${MARK[a.level][1]}<p><span class="sr-only">${MARK[a.level][0]}. </span>` +
    `<span class="st">${a.state}:</span> ${a.what}, ${a.pre}&nbsp;<span class="at">${a.at}</span></p></li>`).join('');

  // Where x sits among the lowest and highest of a run of days; the mark is clamped to the track and a word says when it left it.
  function rangeBar({ lo, hi, x }, fmt, sr) {
    const pos = hi > lo ? Math.max(0, Math.min(1, (x - lo) / (hi - lo))) : 0.5, out = x > hi ? 'up' : x < lo ? 'dn' : '';
    const word = out === 'up' ? 'above range' : out === 'dn' ? 'below range' : '';
    return `<div class="rg" data-lo="${lo}" data-hi="${hi}" data-x="${x}"><span class="lo" aria-hidden="true">${fmt(lo)}</span><span class="track" role="img" aria-label="${sr(word || 'within range')}">` +
      `<i class="mk" style="left:${(pos * 100).toFixed(2)}%" data-pos="${pos}"></i></span><span class="hi" aria-hidden="true">${fmt(hi)}</span><span class="out ${out}">${word}</span></div>`;
  }
  // The key for a range-bar column head: the ends and the mark named once, in place of a sentence.
  const rangeKey = (lo, hi, mark) => `<span class="rgkey" aria-hidden="true"><span>${lo}</span><span class="track"><i class="mk"></i></span><span>${hi}</span><span class="now">${mark}</span></span>`;

  // A part of a whole as one bar: the rest grey, the part ink (at least 3 px, so a small share stays visible).
  // rest/part: {label, n, v}; v is the shown figure (default: n).
  const prop = (rest, part, sr) => {
    const all = rest.n + part.n, w = all ? part.n / all * 100 : 0, v = (o) => (o.v == null ? num(o.n) : o.v);
    return `<div class="prop"><span class="a">${rest.label} ${v(rest)}</span><span class="b">${part.label} ${v(part)}</span>` +
      `<span class="track" role="img" aria-label="${sr}"><i style="flex:${100 - w} 1 0"></i><i class="part" style="flex:${w} 1 0"></i></span></div>`;
  };

  // Arrow keys, Home and End over a role=tablist of buttons; pick(button) makes the choice, focus follows it.
  function tablist(el, pick) {
    el.addEventListener('keydown', (e) => {
      const tabs = [...el.querySelectorAll('[role=tab]')], i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      const k = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
      if (k == null) return;
      e.preventDefault(); pick(tabs[k]); el.querySelectorAll('[role=tab]')[k].focus();
    });
  }
  // The last ticked box of a group stays ticked (pointer and Space alike); `msg` says why in the guard element.
  function keepOne(form, name, guard, msg) {
    form.addEventListener('click', (e) => {
      const t = e.target;
      if (t.name !== name || t.checked || form.querySelectorAll(`input[name="${name}"]:checked`).length) return;
      e.preventDefault(); guard.textContent = msg;
    });
  }

  // =================== Period, Compare with, Per: one state for a dashboard page, its hash and its controls ===================

  /* period({today, cut, start}) -> P, over the days the data holds (start .. today; today ends at the timestamp cut).
     S = {p, per, vs, vc}: p is a preset, a day 'YYYY-MM-DD' or a range 'a..b'; per 'hour' | 'day'; vs 'week' | 'previous' |
     'year' | 'custom' (vc = its first day) | 'none'. P.read(URLSearchParams) -> raw S; P.fix(S) -> S, bad values to defaults;
     P.params(S) -> 'p=..[&per=..]&vs=..' (per only when not the period's default); P.win(p) -> {p, fk, tk, n, from, to, running};
     P.cmp(w, vs, vc) -> {vs, fk, tk, n, from, to, ok} (ok false = outside the data), null for 'none';
     P.pers(n) -> the steps n days allow; P.names(w, c) -> {cur, when, cmpName, cmpLbl}. */
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const PERIODS = { 'today': [1, 0, 'Today'], 'yesterday': [1, 1, 'Yesterday'], '7-days': [7, 0, 'Last 7 days'], '30-days': [30, 0, 'Last 30 days'] };
  const VS_KEYS = ['week', 'previous', 'year', 'custom', 'none'];
  const wdOf = (k) => WEEKDAY[new Date(k + 'T00:00:00Z').getUTCDay()];
  const capF = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function period({ today, cut, start }) {
    if (!KEY.test(today || '') || !KEY.test(start || '') || !(cut > 0)) throw new Error('KIT.period needs today and start as YYYY-MM-DD and cut as a timestamp');
    const real = (k) => KEY.test(k || '') && keyOf(new Date(k + 'T00:00:00Z')) === k;
    const keysOf = (p) => { const r = PERIODS[p]; if (r) return [addDays(today, -(r[1] + r[0] - 1)), addDays(today, -r[1])];
      const c = p.split('..'); return [c[0], c[1] || c[0]]; };
    function fixP(p) {
      if (PERIODS[p]) return p;
      const c = /^(\d{4}-\d\d-\d\d)(?:\.\.(\d{4}-\d\d-\d\d))?$/.exec(p || '');
      if (!c || !real(c[1]) || (c[2] && !real(c[2]))) return 'today';
      let a = c[1], b = c[2] || c[1];
      if (a > b) [a, b] = [b, a];
      if (b < start || a > today) return 'today';
      a = a < start ? start : a; b = b > today ? today : b;
      // a choice that equals a preset becomes it, so one period has one name
      return Object.keys(PERIODS).find((k) => keysOf(k)[0] === a && keysOf(k)[1] === b) || (a === b ? a : a + '..' + b);
    }
    function win(p) {
      const [fk, tk] = keysOf(p), running = tk === today;
      return { p, fk, tk, n: Math.round((dstart(tk) - dstart(fk)) / DAY) + 1, from: dstart(fk), to: running ? cut : dstart(tk) + DAY - 1, running };
    }
    const pers = (n) => (n === 1 ? ['hour'] : n <= 7 ? ['hour', 'day'] : ['day']);
    const defPer = (n) => (n === 1 ? 'hour' : 'day');
    // the comparison keeps the period's length; a period ending today is compared up to the same time of day
    function cmp(w, vs, vc) {
      const v = vs === 'week' && w.n > 1 ? 'previous' : vs;
      if (v === 'none') return null;
      const fk = v === 'week' ? addDays(w.fk, -7) : v === 'previous' ? addDays(w.fk, -w.n) : v === 'year' ? yearAgo(w.fk) : vc;
      const tk = addDays(fk, w.n - 1);
      return { vs: v, fk, tk, n: w.n, from: dstart(fk), to: Math.min(cut, dstart(tk) + (w.to - dstart(w.tk))), ok: fk >= start && tk <= today };
    }
    function fix(S) {
      const p = fixP(S.p), n = win(p).n;
      let vs = S.vs;
      if (!VS_KEYS.includes(vs) || (vs === 'custom' && !real(S.vc))) vs = 'week';
      return { ...S, p, per: pers(n).includes(S.per) ? S.per : defPer(n), vs, vc: vs === 'custom' ? S.vc : '' };
    }
    const read = (q) => { const v = (q.get('vs') || '').split(':'); return { p: q.get('p'), per: q.get('per'), vs: v[0], vc: v[1] }; };
    const params = (S) => `p=${S.p}` + (S.per !== defPer(win(S.p).n) ? `&per=${S.per}` : '') +
      `&vs=${S.vs === 'custom' ? 'custom:' + S.vc : S.vs}`;
    const dayName = (k) => `${wdOf(k)}, ${+k.slice(8)} ${MONTH[+k.slice(5, 7) - 1]}`, dayMid = (k) => `${wdOf(k)} ${dmy(k)}`;
    function names(w, c) {
      const pre = PERIODS[w.p], one = w.n === 1;
      const cur = pre ? pre[2] : one ? dayMid(w.fk) : rangeTxt(w.fk, w.tk);
      const when = pre ? (one ? pre[2].toLowerCase() : pre[2].toLowerCase()) : one ? dmyy(w.fk) : rangeTxt(w.fk, w.tk);
      if (!c) return { cur, when, cmpName: '', cmpLbl: '' };
      let cmpName, cmpLbl;
      if (c.vs === 'year') { cmpName = 'last year'; cmpLbl = 'Last year'; }
      else if (c.vs === 'custom') cmpName = cmpLbl = c.fk === c.tk ? dmyy(c.fk) : rangeTxt(c.fk, c.tk);
      else if (!one) { cmpName = `previous ${w.n} days`; cmpLbl = capF(cmpName); }
      else if (w.p === 'today') { cmpName = c.vs === 'week' ? `last ${wdOf(c.fk)}` : 'yesterday'; cmpLbl = capF(cmpName); }
      else { cmpName = dayName(c.fk); cmpLbl = dayMid(c.fk); }
      return { cur, when, cmpName, cmpLbl };
    }
    return { today, start, fix, read, params, win, cmp, pers, defPer, names };
  }

  /* periodUI(form, P, set) writes the Period, Compare with and Per groups at the start of form.controls and wires them:
     text tabs (radios p, vs, per; the page's change listener applies them), the date field #fP and the Custom range tab #fVs,
     both opening one calendar popover (#cal, cally web components); Apply calls set({p}) or set({vs: 'custom', vc}).
     Returns {sync(S), close}: the page calls sync on every render, so the controls show S. */
  const CALLY = 'https://cdn.jsdelivr.net/npm/cally@0.9.2/dist/cally.js';
  function periodUI(form, P, set) {
    if (!customElements.get('calendar-range') && !document.querySelector(`script[src="${CALLY}"]`)) {
      const s = document.createElement('script'); s.type = 'module'; s.src = CALLY; document.head.appendChild(s);
    }
    const pk = (name, v, t, extra = '') => `<label class="pick"><input type="radio" name="${name}" value="${v}"${extra}>${t}</label>`;
    const nav = '<svg aria-label="Previous month" slot="previous" viewBox="0 0 24 24"><path d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>' +
      '<svg aria-label="Next month" slot="next" viewBox="0 0 24 24"><path d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg><calendar-month></calendar-month><calendar-month offset="1"></calendar-month>';
    const ca = `months="2" page-by="single" locale="en-GB" first-day-of-week="1" format-weekday="short" min="${P.start}" today="${P.today}"`;
    const field = (id, lbl) => `<label><span${id === 'calA' ? ' id="calLa"' : ''}>${lbl}</span><input id="${id}" class="input" inputmode="numeric" autocomplete="off" placeholder="dd/mm/yyyy" aria-describedby="calMsg"></label>`;
    form.insertAdjacentHTML('afterbegin',
      `<fieldset><legend>Period</legend><div class="opts">${Object.entries(PERIODS).map(([k, r]) => pk('p', k, r[2])).join('')}` +
      `<button type="button" class="datef" id="fP" aria-haspopup="dialog" aria-expanded="false" aria-controls="cal"><span class="sr-only">Pick dates, now </span><span id="resP"></span>` +
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.5h11v10h-11zM2.5 6.5h11M5.5 1.5v3M10.5 1.5v3"/></svg></button></div></fieldset>' +
      '<fieldset><legend>Compare with<span class="res" id="resVs"></span></legend><div class="opts">' +
      pk('vs', 'week', 'Last week<span class="sr-only" id="whyWeek">For a one-day period only.</span>', ' aria-describedby="whyWeek"') +
      pk('vs', 'previous', 'Previous period') + pk('vs', 'year', 'Last year<span class="sr-only" id="whyYear"></span>', ' aria-describedby="whyYear"') +
      '<button type="button" class="pick" id="fVs" aria-haspopup="dialog" aria-expanded="false" aria-controls="cal" aria-pressed="false">Custom range</button>' +
      pk('vs', 'none', 'No comparison') + '</div></fieldset>' +
      `<fieldset><legend>Per</legend><div class="opts">${pk('per', 'hour', 'hour')}${pk('per', 'day', 'day')}</div></fieldset>` +
      '<div class="cal pop" id="cal" role="dialog" aria-labelledby="calT" hidden><h3 class="sr-only" id="calT"></h3>' +
      `<div class="cal-fields">${field('calA', 'From')}${field('calB', 'To')}</div>` +
      `<calendar-range id="calR" ${ca} max="${P.today}">${nav}</calendar-range><calendar-date id="calD" ${ca} hidden>${nav}</calendar-date>` +
      '<p class="cal-msg" id="calMsg" role="status"></p><div class="cal-foot"><span id="calSum"></span>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="calNo">Cancel</button><button type="button" class="btn btn-primary btn-sm" id="calOk">Apply</button></div></div>');
    const all = (sel) => form.querySelectorAll(sel);
    const cal = $('cal'), cr = $('calR'), cd = $('calD'), fa = $('calA'), fb = $('calB'), msg = $('calMsg'), ok = $('calOk'), fP = $('fP'), fVs = $('fVs');
    let S = null, W = null, mode = '', dr = { a: '', b: '' };
    const canK = () => addDays(P.start, W.n - 1) <= P.today;
    function sync(s) {
      S = s; W = P.win(S.p);
      const c = P.cmp(W, S.vs, S.vc), year = P.cmp(W, 'year');
      all('input[name=p]').forEach((i) => { i.checked = i.value === S.p; });
      fP.classList.toggle('on', !PERIODS[S.p]); $('resP').textContent = rangeTxt(W.fk, W.tk);
      all('input[name=vs]').forEach((i) => { i.checked = c ? i.value === c.vs : i.value === 'none';
        i.disabled = (i.value === 'week' && W.n > 1) || (i.value === 'year' && !year.ok); });
      $('whyYear').textContent = year.ok ? '' : `Data starts ${dmyy(P.start)}.`;
      fVs.setAttribute('aria-pressed', String(S.vs === 'custom')); fVs.disabled = !canK();
      // an unavailable comparison says so where its dates would stand; no figure stands in for it
      const r = $('resVs');
      r.textContent = !c ? '' : c.ok ? (c.fk === c.tk ? dmyy(c.fk) : rangeTxt(c.fk, c.tk)) : c.fk < P.start ? `not available, data starts ${dmyy(P.start)}` : `not available, past ${dmyy(P.today)}`;
      r.dataset.ok = !c ? '' : c.ok ? '1' : '0';
      all('input[name=per]').forEach((i) => { i.checked = i.value === S.per; i.closest('label').hidden = !P.pers(W.n).includes(i.value); });
      queueMicrotask(sumTxt);   // after the page has set its own filters in the same render
    }

    // ---- phone (below 600 px): the groups fold behind one disclosure trigger that names the current choice in one line;
    //      a tap or Enter opens and closes it, Esc inside closes it and focus returns. Made only on a phone, so 1366+ keeps its DOM.
    let sum = null;
    const own = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    function sumTxt() {
      if (!sum || !S) return;
      const on = (name) => form.querySelector(`input[name="${name}"]:checked`), parts = [], p = on('p'), v = on('vs');
      parts.push(p ? own(p.closest('label')) : $('resP').textContent);
      parts.push(S.vs === 'custom' ? $('resVs').textContent : v ? own(v.closest('label')) : '');
      // the page's own groups: a chosen radio, or the ticked boxes of a group that is not all ticked
      const groups = [...new Set([...form.querySelectorAll('input[type=radio], input[type=checkbox]')].map((i) => i.name))].filter((n) => !['p', 'vs', 'per'].includes(n));
      groups.forEach((n) => {
        const b = [...form.querySelectorAll(`input[name="${n}"]`)], bc = b.filter((i) => i.checked);
        if (b[0].type === 'radio') { if (bc[0]) parts.push(own(bc[0].closest('label'))); }
        else if (bc.length && bc.length < b.length) parts.push(bc.map((i) => own(i.closest('label'))).join(', '));
      });
      sum.lastChild.textContent = parts.filter(Boolean).join(' · ');
    }
    const fold = (shut) => { form.classList.toggle('shut', shut); sum.setAttribute('aria-expanded', String(!shut)); };
    function makeSum() {
      if (sum || !PHONE.matches) return;
      sum = document.createElement('button'); sum.type = 'button'; sum.className = 'drop ctl-sum'; sum.id = form.id + 'Sum';
      sum.setAttribute('aria-controls', form.id); sum.innerHTML = '<span class="sr-only">Filters: </span><span></span>';
      form.before(sum); fold(true); sumTxt();
      sum.onclick = () => fold(!form.classList.contains('shut'));
      form.addEventListener('keydown', (e) => { if (e.key === 'Escape' && PHONE.matches && !form.classList.contains('shut')) { fold(true); sum.focus(); } });
      form.addEventListener('change', () => queueMicrotask(sumTxt));
    }
    makeSum(); PHONE.addEventListener('change', makeSum);

    // ---- the calendar popover: typed fields and two months; one day picks a day, two days a range ----
    const calOn = () => !!customElements.get('calendar-range');
    const fmtIn = (k) => (k ? `${k.slice(8)}/${k.slice(5, 7)}/${k.slice(0, 4)}` : '');
    const readIn = (t) => { // dd/mm/yyyy or d/m/yyyy; null for anything that is not a real date
      const m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(t); if (!m) return null;
      const k = `${m[3]}-${p2(m[2])}-${p2(m[1])}`; return keyOf(new Date(k + 'T00:00:00Z')) === k ? k : null;
    };
    function setCal() {
      if (!calOn()) return;
      if (mode === 'cmp') { cd.value = dr.a; if (dr.a) cd.focusedDate = dr.a; return; }
      cr.value = dr.a && dr.b ? `${dr.a}/${dr.b}` : ''; if (dr.b || dr.a) cr.focusedDate = dr.b || dr.a;
    }
    function check(fromCal) {
      const cmp = mode === 'cmp', n = W.n, a = readIn(fa.value), b = cmp ? (a ? addDays(a, n - 1) : '') : readIn(fb.value);
      const data = `Data runs from ${dmyy(P.start)} to ${dmyy(P.today)}`;
      let err = '', badA = false, badB = false;   // only the field that is wrong is marked
      const xa = fa.value.trim() && !a, xb = !cmp && fb.value.trim() && !b;
      if (xa || xb) { err = 'Write the date as dd/mm/yyyy, for example 27/03/2026'; badA = !!xa; badB = !!xb; }
      else if (a && (a < P.start || (!cmp && a > P.today))) { err = data; badA = true; }
      else if (!cmp && b && (b > P.today || b < P.start)) { err = data; badB = true; }
      else if (cmp && b && b > P.today) { err = `The comparison must end by ${dmyy(P.today)}`; badA = true; }
      else if (!cmp && a && b && b < a) { err = 'The end date cannot be before the start date'; badB = true; }
      if (cmp) fb.value = a && !err ? fmtIn(b) : '';
      dr = { a: err ? '' : a || '', b: err ? '' : b || '' };
      const done = !err && dr.a && dr.b;
      msg.textContent = err || (cmp ? `Same length as the period: ${plural(n, 'day')}` : ''); msg.classList.toggle('problem', !!err);
      [[fa, badA], [fb, badB]].forEach(([el, bad]) => (bad ? el.setAttribute('aria-invalid', 'true') : el.removeAttribute('aria-invalid')));
      $('calSum').textContent = done && !cmp ? plural(Math.round((dstart(dr.b) - dstart(dr.a)) / DAY) + 1, 'day') : '';
      ok.disabled = !done;
      if (!fromCal && done) setCal();
    }
    const opener = () => (mode === 'cmp' ? fVs : fP);
    function open(m) {
      mode = m; const cmp = m === 'cmp', c = P.cmp(W, 'previous');
      cal.classList.toggle('cmp', cmp); cr.hidden = cmp; cd.hidden = !cmp; fb.readOnly = cmp;
      $('calT').textContent = cmp ? 'Pick the start of the comparison' : 'Pick a date or a range';
      $('calLa').textContent = cmp ? 'Start' : 'From';
      dr = cmp ? { a: S.vs === 'custom' ? S.vc : c.ok ? c.fk : P.start, b: '' } : { a: W.fk, b: W.tk };
      fa.value = fmtIn(dr.a); fb.value = fmtIn(dr.b);
      cd.setAttribute('max', addDays(P.today, -(W.n - 1)));
      cd.getDayParts = (d) => { const k = keyOf(d), e = dr.a && addDays(dr.a, W.n - 1);
        return dr.a && k >= dr.a && k <= e ? (k === dr.a ? 'range-start' : k === e ? 'range-end' : 'range-inner') : ''; };
      cal.hidden = false; fP.setAttribute('aria-expanded', String(!cmp)); fVs.setAttribute('aria-expanded', String(cmp));
      const o = opener().getBoundingClientRect(), f = form.getBoundingClientRect();
      cal.style.top = (o.bottom - f.top + 6) + 'px';
      cal.style.left = Math.max(0, Math.min(o.left - f.left, form.clientWidth - cal.offsetWidth)) + 'px';
      check(); setCal();
      // keyboard users land on the day in the grid, so the arrow keys work at once; without the calendar, on the first field
      const grid = cmp ? cd : cr;
      if (calOn()) requestAnimationFrame(() => { grid.focus(); if (!cal.contains(document.activeElement)) fa.focus(); }); else fa.focus();
    }
    function close(back) {
      if (cal.hidden) return;
      const o = opener(); cal.hidden = true; fP.setAttribute('aria-expanded', 'false'); fVs.setAttribute('aria-expanded', 'false');
      if (back) o.focus();
    }
    function apply() {
      if (ok.disabled) return;
      const m = mode, a = dr.a, b = dr.b; close(true);
      set(m === 'cmp' ? { vs: 'custom', vc: a } : { p: a === b ? a : a + '..' + b });
    }
    fP.onclick = () => (!cal.hidden && mode === 'main' ? close(true) : open('main'));
    fVs.onclick = () => (!cal.hidden && mode === 'cmp' ? close(true) : open('cmp'));
    $('calNo').onclick = () => close(true); ok.onclick = apply;
    fa.oninput = fb.oninput = () => check();
    // the popover's own change and input events stay inside it; only Apply changes the page
    ['change', 'input'].forEach((t) => cal.addEventListener(t, (e) => e.stopPropagation()));
    // modal in spirit: Tab and Shift+Tab wrap at its first and last control; Escape closes and returns to the field
    const tabs = () => [...cal.querySelectorAll('button, input, calendar-range, calendar-date')].filter((el) => !el.disabled && el.getClientRects().length);
    cal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(true); }
      else if (e.key === 'Tab') { const t = tabs(), at = e.target.closest('calendar-range, calendar-date') || e.target, edge = e.shiftKey ? t[0] : t[t.length - 1];
        if (at === edge) { e.preventDefault(); (e.shiftKey ? t[t.length - 1] : t[0]).focus(); } }
      else if (e.key === 'Enter' && (e.target === fa || e.target === fb)) { e.preventDefault(); apply(); }
    });
    document.addEventListener('pointerdown', (e) => { if (!cal.hidden && !cal.contains(e.target) && !fP.contains(e.target) && !fVs.contains(e.target)) close(false); });
    cr.addEventListener('rangestart', (e) => { dr = { a: keyOf(e.detail), b: '' }; fa.value = fmtIn(dr.a); fb.value = ''; check(true); });
    cr.addEventListener('change', () => { const [a, b] = cr.value.split('/'); fa.value = fmtIn(a); fb.value = fmtIn(b); check(true); });
    cd.addEventListener('change', () => { fa.value = fmtIn(cd.value); check(true); cd.value = dr.a; });
    return { sync, close };
  }

  // ---- below 1366 px (kit.css): a page's wide tables scroll inside their own .tscroll, and the section line keeps its current link in view.
  // Never at desktop widths, so the 1366+ DOM stays as it is.
  const NARROW = matchMedia('(max-width: 1365px)'), PHONE = matchMedia('(max-width: 599px)');
  function narrowPage() {
    if (!NARROW.matches) return;
    document.querySelectorAll('.page table.table').forEach((t) => {
      if (t.closest('.tscroll, .tblwrap')) return;
      const w = document.createElement('div'); w.className = 'tscroll'; t.before(w); w.appendChild(t);
      // the box names which edge still hides columns (data-more="l r"), so kit.css can fade that edge instead of cutting silently
      const more = () => { const m = w.scrollWidth - w.clientWidth > 1;
        w.dataset.more = [m && w.scrollLeft > 1 ? 'l' : '', m && w.scrollLeft < w.scrollWidth - w.clientWidth - 1 ? 'r' : ''].join(' ').trim(); };
      w.addEventListener('scroll', more, { passive: true }); new ResizeObserver(more).observe(t); new ResizeObserver(more).observe(w); more();
    });
    const s = document.querySelector('.sections'), a = s && s.querySelector('a[aria-current]');
    if (a && a.offsetLeft - s.offsetLeft + a.offsetWidth > s.clientWidth) s.scrollLeft = a.offsetLeft - s.offsetLeft + a.offsetWidth - s.clientWidth;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', narrowPage); else setTimeout(narrowPage);
  addEventListener('hashchange', () => setTimeout(narrowPage));
  NARROW.addEventListener('change', narrowPage);

  window.KIT = { DAY, tok, p2, num, MON, MONTH, WEEKDAY, dstart, addDays, keyOf, dmy, dmyy, rangeTxt,
    nice, plot, alarms, rangeBar, rangeKey, prop, tablist, keepOne, period, periodUI };
})();
