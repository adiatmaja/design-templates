/* sheet.js: the datasheet deck's slide templates (window.DECK_TEMPLATES, read by deck.js) and its exhibit builders
   (window.EX). Load after ../mockup/kit.js and before deck.js. An exhibit is the page builder (SHEET.columns,
   SHEET.ranked, SHEET.range, SHEET.timelineSVG) called at slide size, so a chart on a slide and the same chart on the
   page come from one function. Slide fields: ../../README.md, "Decks". */
(function () {
  'use strict';
  const S = window.SHEET;
  const esc = S.esc;

  // the exhibit box on a 1920 x 1080 slide: full width, or beside a 440 px notes column
  const FULL = 1920 - 2 * 96, NOTES = 440, GAP = 64;
  const size = (notes, h) => ({ width: notes ? FULL - NOTES - GAP : FULL, height: h || 540, fs: 22 });

  window.EX = {
    size,
    columns: (o, notes = true) => S.columns(Object.assign({}, size(notes, o.height), o)).svg,
    ranked: (o, notes = true) => S.ranked(Object.assign({}, size(notes), o)).svg,
    range: (o, notes = true) => S.range(Object.assign({}, size(notes), o)).svg,
    timeline: (model, o = {}, notes = true) => S.timelineSVG(model, Object.assign({}, size(notes, o.height), { id: o.id || 'ex' }, o)).svg
  };

  // the kicker carries the exhibit's caption number (s.no), the same number the page gives that figure or table
  const kick = (s) => (s.kicker || s.no ? `<p class="ex-kicker">${s.no ? `<span class="no">${esc(s.no)}</span>` : ''}${s.kicker || ''}</p>` : '');
  const head = (s) => `${kick(s)}<h2 class="ex-title">${s.title}</h2>${s.sub ? `<p class="ex-sub">${s.sub}</p>` : ''}`;
  const block = (s, i, n, D) => `<div class="tblock"><span>${esc(D.org || '')}</span><span>${esc(D.title || '')}</span><span class="pg">Sheet ${i + 1} of ${n}</span><span>${esc(D.rev || '')}</span></div>`;
  const key = (list) => (list && list.length ? `<ul class="key">${list.map(([cls, label]) => `<li><i class="${cls}"></i>${label}</li>`).join('')}</ul>` : '');
  const src = (s) => (s.source ? `<p class="ex-src">Source: ${s.source}</p>` : '');
  const notes = (s) => (s.sheetNotes && s.sheetNotes.length ? `<div class="ex-notes"><h3>Notes</h3><ol>${s.sheetNotes.map((x) => `<li><span>${x}</span></li>`).join('')}</ol></div>` : '');

  window.DECK_TEMPLATES = {
    // {kicker, title, sub, spec: [[parameter, value, unit, basis]]}
    cover: (s, i, n, D) => `${s.kicker ? `<p class="ex-kicker">${s.kicker}</p>` : ''}<h1 class="ex-title">${s.title}</h1>${s.sub ? `<p class="ex-sub">${s.sub}</p>` : ''}
      ${s.spec && s.spec.length ? `<table class="ex-tbl cover-spec"><thead><tr><th>Characteristic</th><th class="r">Value</th><th>Unit</th><th>Basis</th></tr></thead>
      <tbody>${s.spec.map(([p, v, u, b]) => `<tr><td class="k">${p}</td><td class="r v">${v}</td><td class="u">${u}</td><td class="b">${b || ''}</td></tr>`).join('')}</tbody></table>` : ''}${block(s, i, n, D)}`,
    // {no, kicker, title, sub, figure: svg html, key: [[class, label]], sheetNotes: [html], source}
    exhibit: (s, i, n, D) => `${head(s)}<div class="ex-body${s.sheetNotes ? ' has-notes' : ''}"><div class="ex-fig">${s.figure}${key(s.key)}${src(s)}</div>${notes(s)}</div>${block(s, i, n, D)}`,
    // {no, kicker, title, columns: [{label, r}], rows: [{cells, total, sel}], sheetNotes, source}
    table: (s, i, n, D) => `${head(s)}<div class="ex-body${s.sheetNotes ? ' has-notes' : ''}"><div class="ex-fig"><table class="ex-tbl"><thead><tr>${s.columns.map((c) => `<th class="${c.r ? 'r' : ''}">${c.label}</th>`).join('')}</tr></thead>
      <tbody>${s.rows.map((r) => `<tr class="${r.total ? 'total' : ''}${r.sel ? ' is-sel' : ''}">${r.cells.map((c, k) => `<td class="${s.columns[k].r ? 'r' : ''}${k === 0 ? ' k' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>${src(s)}</div>${notes(s)}</div>${block(s, i, n, D)}`,
    // {no, kicker, title, value, unit, sub, figure: svg html under the number, source}
    figure: (s, i, n, D) => `${kick(s)}<h2 class="ex-title">${s.title}</h2><div class="big"><b>${s.value}</b><span>${s.unit}</span></div>${s.sub ? `<p class="ex-sub">${s.sub}</p>` : ''}${s.figure ? `<div class="fig-ex">${s.figure}</div>` : ''}${src(s)}${block(s, i, n, D)}`,
    // {kicker, title, asks: [[ask, detail]]}
    close: (s, i, n, D) => `${head(s)}<ol class="asks">${s.asks.map(([a, d], k) => `<li><span>${k + 1}</span><span>${a}${d ? `<small>${d}</small>` : ''}</span></li>`).join('')}</ol>${block(s, i, n, D)}`
  };
})();
