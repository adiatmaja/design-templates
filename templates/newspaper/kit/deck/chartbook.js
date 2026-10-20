/* chartbook.js: slide templates and exhibit builders (window.CB) for the newspaper-world deck (chartbook.css).
   Load after the deck's slides.js and before deck.js, which picks up window.DECK_TEMPLATES.
   An exhibit's `kicker` names its scope ("Proposal: phase 1", "Appendix A1") in the running head. */
(function () {
  'use strict';

  const slides = window.DECK_SLIDES || [];
  const CONF = window.DECK_CONFIG || {};

  // DECK_CONFIG.footer (e.g. a handling marking) sits left; the page number stays right
  const foot = (i) => `<div class="ex-foot">${CONF.footer ? `<span style="margin-right:auto">${CONF.footer}</span>` : ''}<span class="pg">${i + 1} / ${slides.length}</span></div>`;

  // ---------- Building blocks used inside exhibits ----------
  const CB = {};
  /* A printed screenshot of a mockup page (1440x900, or page: [w, h], e.g. [390, 844] for the phone). crop: [x, y, w, h]
     in page px shows only that region, scaled to the frame; region: the selector of the page block the crop shows
     (a hook for a test that checks it still fills the crop). scroll: as CB.phone.
     data-shot is the still the PPTX export draws instead of the iframe. */
  CB.desktop = (m) => {
    const [pw, ph] = m.page || [1440, 900];
    const [cx, cy, cw, ch] = m.crop || [0, 0, pw, ph];
    const size = m.page ? ` style="width:${pw}px;height:${ph}px"` : '';
    return `<div class="frame-desktop" data-cw="${cw}" data-ch="${ch}"${m.region ? ` data-region="${m.region}"` : ''} style="aspect-ratio:${cw} / ${ch};${m.w ? `width:${m.w}px;` : ''}--crop-x:${cx};--crop-y:${cy}"><div class="screen"><iframe data-src="${m.src}" data-shot="${m.shot}"${m.scroll ? ` data-scroll="${m.scroll}"` : ''} title="${m.label}" loading="lazy"${size}></iframe></div></div>`;
  };
  /* A 390x844 phone. scale: a fixed size (the callout layout needs one); scroll: a selector inside the page to scroll
     to on load (served over http only; from file:// the page keeps its own scroll) */
  CB.phone = (m) => m.scale
    ? `<div class="frame-wrap" style="width:${Math.round(418 * m.scale)}px;height:${Math.round(872 * m.scale)}px"><div class="frame-phone scaled"><div class="screen"><iframe data-src="${m.src}" data-shot="${m.shot}" ${m.scroll ? `data-scroll="${m.scroll}"` : ''} title="${m.label}" loading="lazy"></iframe></div></div></div>`
    : `<div class="frame-wrap" style="height:${m.h || 720}px"><div class="frame-phone scaled"><div class="screen"><iframe data-src="${m.src}" data-shot="${m.shot}" ${m.scroll ? `data-scroll="${m.scroll}"` : ''} title="${m.label}" loading="lazy"></iframe></div></div></div>`;
  /* Callouts: a screen with the screen's own terms set beside it, each joined by a leader line to the point it names.
     pins: [{x, y (percent of the shot), label, note?, side: 'l' | 'r'}]; w: the shot's width in px; gut: the label
     column in px, one number for both sides or [left, right] */
  CB.callouts = ({ shot, w, pins, gut = 320 }) => {
    const [gl, gr] = Array.isArray(gut) ? gut : [gut, gut];
    return `<div class="callouts" style="--gut-l:${gl}px;--gut-r:${gr}px"><div class="shot" style="width:${w}px">${shot}${pins.map((p) => {
    const lead = p.side === 'l' ? `left:${20 - gl}px;right:${100 - p.x}%` : `left:${p.x}%;right:${20 - gr}px`;
    return `<i class="co-lead" style="top:${p.y}%;${lead}"></i><i class="co-dot" style="left:${p.x}%;top:${p.y}%"></i>`
      + `<b class="co-lab ${p.side === 'l' ? 'l' : 'r'}" style="top:${p.y}%">${p.label}${p.note ? `<small>${p.note}</small>` : ''}</b>`;
  }).join('')}</div></div>`;
  };
  /* A key drawn, not written: [[kind, label]], kind 'cur' (ink line), 'later' (grey dashed), 'cmp' (grey line),
     'dot' (filled mark), 'ring' (open mark), 'x' (alarm cross) */
  CB.key = (items) => `<p class="key">${items.map(([k, t]) => `<span><i class="${k === 'cur' ? '' : k}"></i>${t}</span>`).join('')}</p>`;
  CB.table = (t) => `
    <table class="cb-table ${t.dense ? 'dense' : ''}">
      <thead><tr>${t.columns.map((c) => `<th class="${c.r ? 'r' : ''}" ${c.w ? `style="width:${c.w}"` : ''}>${c.label || c}</th>`).join('')}</tr></thead>
      <tbody>${t.rows.map((r) => `<tr class="${r.total ? 'total' : ''}">${(r.cells || r).map((c, k) => `<td class="${t.columns[k].r ? 'r' : ''} ${k === 0 ? 'k' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  // kind: '' filled (in this phase), 'later' ring, 'none' no mark (keeps alignment), 'no' alarm ring
  CB.mark = (kind, text) => `<span class="mk ${kind || ''}"></span>${text}`;
  // A few statements the reader compares row by row: [mark kind, label, text]
  CB.ledger = (rows) => `<ol class="ledger">${rows.map(([kind, label, text]) => `<li><b>${CB.mark(kind, label)}</b><span>${text}</span></li>`).join('')}</ol>`;

  /* Stacked horizontal bars on one zero-based axis. parts kind: 'base' (comparison grey), 'add' (ink), 'range'
     (dashed outline, a target range). rows: [{label, end, parts:[{v, kind, label?}]}] */
  CB.bars = ({ rows, max, ticks, unit, aria }) => {
    const W = 1664, X0 = 300, X1 = 1300, rowH = 150, top = 30, barH = 76;
    const x = (v) => X0 + (X1 - X0) * v / max;
    const yAxis = top + rows.length * rowH;
    const H = yAxis + 44;
    const fill = { base: 'var(--cmp-fill)', add: 'var(--ink)', range: 'var(--paper-2)' };
    const grid = ticks.map((t) => `<line class="grid" x1="${x(t)}" y1="${top}" x2="${x(t)}" y2="${yAxis}"/><text class="lbl-s" x="${x(t)}" y="${yAxis + 32}" text-anchor="middle">${t}</text>`).join('')
      + `<text class="lbl-s" x="${X1 + 24}" y="${yAxis + 32}">${unit}</text>`;
    const bars = rows.map((r, k) => {
      const y = top + k * rowH + (rowH - barH) / 2;
      let acc = 0;
      const segs = r.parts.map((p) => {
        const x0 = x(acc); acc += p.v; const w = x(acc) - x0 - 2;
        const seg = `<rect class="grow" x="${x0}" y="${y}" width="${w}" height="${barH}" fill="${fill[p.kind]}" ${p.kind === 'range' ? 'stroke="var(--cmp)" stroke-width="2" stroke-dasharray="8 6"' : ''}/>`;
        return seg + (p.label ? `<text x="${x0 + w / 2}" y="${y + barH / 2 + 9}" text-anchor="middle" style="font-size:24px;font-weight:600;fill:${p.kind === 'add' ? 'var(--paper)' : 'var(--ink)'}">${p.label}</text>` : '');
      }).join('');
      return `<text class="lbl-b" x="0" y="${y + barH / 2 + 9}">${r.label}</text>${segs}
        <text class="lbl-serif" x="${x(acc) + 20}" y="${y + barH / 2 + 12}" style="font-size:34px">${r.end}</text>`;
    }).join('');
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">${grid}${bars}</svg>`;
  };

  /* "Whichever is greater": a flat minimum and a percentage line cross at the breakpoint; the larger one is what the
     landlord receives (ink, bold). Axis values in the caller's unit; shape is illustrative */
  CB.breakpoint = ({ min, rate, maxSales, maxY, labels, aria }) => {
    const W = 1664, H = 560, X0 = 120, X1 = 1300, Y0 = 470, Y1 = 30;
    const x = (s) => X0 + (X1 - X0) * s / maxSales;
    const y = (v) => Y0 - (Y0 - Y1) * v / maxY;
    const bp = min / rate;
    const share = `M${x(0)} ${y(0)} L${x(maxSales)} ${y(rate * maxSales)}`;
    const got = `M${x(0)} ${y(min)} L${x(bp)} ${y(min)} L${x(maxSales)} ${y(rate * maxSales)}`;
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">
      <path d="M${x(bp)} ${y(min)} L${x(maxSales)} ${y(rate * maxSales)} L${x(maxSales)} ${y(min)} Z" fill="var(--paper-2)"/>
      <line x1="${x(0)}" y1="${y(min)}" x2="${x(maxSales)}" y2="${y(min)}" stroke="var(--cmp)" stroke-width="3" stroke-dasharray="9 8"/>
      <path d="${share}" fill="none" stroke="var(--cmp)" stroke-width="3" stroke-dasharray="9 8"/>
      <path class="draw" pathLength="1" d="${got}" fill="none" stroke="var(--ink)" stroke-width="6" stroke-linejoin="round"/>
      <line x1="${x(bp)}" y1="${y(min) + 14}" x2="${x(bp)}" y2="${Y0}" stroke="var(--ink)" stroke-width="1.5"/>
      <line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="var(--ink)" stroke-width="2"/>
      <text class="lbl-s" x="${x(bp)}" y="${Y0 + 34}" text-anchor="middle">${labels.bp}</text>
      <text class="lbl-s" x="${X1}" y="${Y0 + 34}" text-anchor="end">${labels.x}</text>
      <text class="lbl" x="${x(0) + 8}" y="${y(min) - 18}">${labels.min}</text>
      <text class="lbl" x="${x(bp * 0.62)}" y="${y(rate * bp * 0.62) + 40}">${labels.rate}</text>
      <text class="lbl-b" x="${X1 + 24}" y="${y(rate * maxSales) + 8}">${labels.got}</text>
      <text class="lbl" x="${X1 + 24}" y="${y((rate * maxSales + min) / 2) + 30}">${labels.gain}</text></svg>`;
  };

  /* Today's state: each source reaches the target only by hand (dashed grey line, alarm word) or not at all (alarm
     cross and word). The lines stay grey: the systems are kept; only the manual step is the problem */
  CB.silos = ({ sources, target, manual, aria }) => {
    const W = 1664, SX = 420, TX = 1340, rowH = 128;
    const H = 60 + sources.length * rowH;
    const sy = (k) => 50 + k * rowH;
    const ty = sy((sources.length - 1) / 2);
    const cross = (x, y) => `<path d="M${x} ${y - 11} l22 22 m0 -22 l-22 22" stroke="var(--alarm)" stroke-width="4"/>`;
    const rows = sources.map((s, k) => `
      <line class="grid" x1="0" y1="${sy(k) + 52}" x2="${SX + 140}" y2="${sy(k) + 52}"/>
      <text class="lbl-b" x="0" y="${sy(k) + 9}">${s.label}</text>
      <text class="lbl" x="${SX - 150}" y="${sy(k) + 9}">${s.system}</text>
      ${s.gap ? `${cross(SX + 170, sy(k))}<text class="lbl lbl-red" x="${SX + 210}" y="${sy(k) + 9}">${s.gap}</text>`
        : `<path d="M${SX + 160} ${sy(k)} C${(SX + TX) / 2} ${sy(k)} ${(SX + TX) / 2} ${ty} ${TX - 8} ${ty}" fill="none" stroke="var(--cmp)" stroke-width="3" stroke-dasharray="9 8"/>`}`).join('');
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">${rows}
      <text class="lbl lbl-red" x="${TX - 44}" y="${ty + 44}" text-anchor="end">${manual}</text>
      <line x1="${TX}" y1="${ty - 64}" x2="${TX}" y2="${ty + 64}" stroke="var(--ink)" stroke-width="6"/>
      <text class="lbl-serif" x="${TX + 32}" y="${ty + 16}" style="font-size:48px">${target}</text></svg>`;
  };

  /* Before/after on one log time axis: how long until management sees the money */
  CB.latency = ({ before, after, axis, aria }) => {
    const W = 1664, X0 = 360, X1 = 1600, H = 470, Y1 = 120, Y2 = 280;
    const x = (hours) => X0 + (X1 - X0) * Math.log(hours) / Math.log(720);
    const ticks = [[1, '1 hour'], [24, '1 day'], [168, '1 week'], [720, '1 month']];
    const grid = ticks.map(([h, t]) => `<line class="grid" x1="${x(h)}" y1="40" x2="${x(h)}" y2="370"/><text class="lbl-s" x="${x(h)}" y="404" text-anchor="${h === 1 ? 'start' : h === 720 ? 'end' : 'middle'}">${t}</text>`).join('');
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">${grid}
      <line x1="${X0}" y1="370" x2="${X1}" y2="370" stroke="var(--ink)" stroke-width="2"/>
      <text class="lbl-b" x="0" y="${Y1 + 8}">${before.label}</text>
      <rect class="grow" x="${X0}" y="${Y1 - 22}" width="${x(before.hours) - X0}" height="44" fill="var(--alarm)"/>
      <text class="lbl lbl-red" x="${x(before.hours)}" y="${Y1 - 40}" text-anchor="end">${before.at}</text>
      <text class="lbl-b" x="0" y="${Y2 + 8}">${after.label}</text>
      <rect x="${X0}" y="${Y2 - 22}" width="10" height="44" fill="var(--ink)"/>
      <text class="lbl lbl-blue" x="${X0 + 30}" y="${Y2 + 8}">${after.at}</text>
      <text class="lbl-s" x="${X0}" y="452">${axis}</text></svg>`;
  };

  /* Sources -> one hub -> outputs. Paths in the first phase are solid ink, later paths dashed grey. The hub is a heavy ink
     line with its steps ticked under it; `via` names the entry step */
  CB.flow = ({ sources, outputs, centre, via, steps, aria }) => {
    const W = 1664, H = 600, SX = 360, CX0 = 680, CX1 = 1000, OX = 1340, HY = 300;
    const sy = (k) => 40 + k * (520 / (sources.length - 1));
    const oy = (k) => 120 + k * 180;
    const curve = (x0, y0, x1, y1, now) => `<path d="M${x0} ${y0} C${(x0 + x1) / 2} ${y0} ${(x0 + x1) / 2} ${y1} ${x1} ${y1}" fill="none" stroke="${now ? 'var(--ink)' : 'var(--cmp)'}" stroke-width="${now ? 5 : 3}" ${now ? '' : 'stroke-dasharray="9 8"'}/>`;
    const left = sources.map((s, k) => `
      <text class="${s.now ? 'lbl-b' : 'lbl'}" x="${SX - 24}" y="${sy(k) + 9}" text-anchor="end">${s.label}</text>
      ${curve(SX, sy(k), CX0, HY, s.now)}`).join('');
    const right = outputs.map((o, k) => `
      ${curve(CX1, HY, OX, oy(k), o.now)}
      <text class="${o.now ? 'lbl-b' : 'lbl'}" x="${OX + 24}" y="${oy(k) + 9}">${o.label}</text>`).join('');
    const viaLbl = via ? `<text class="lbl" x="${SX + 16}" y="${sy(0) - 16}">${via}</text>` : '';
    const ticks = (steps || []).map((t, k, a) => {
      const tx = CX0 + (CX1 - CX0) * (k + 0.5) / a.length;
      return `<line x1="${tx}" y1="${HY}" x2="${tx}" y2="${HY + 22}" stroke="var(--ink)" stroke-width="2"/><text class="lbl-s" x="${tx}" y="${HY + 52}" text-anchor="middle">${t}</text>`;
    }).join('');
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">${left}${right}${viaLbl}
      <line x1="${CX0}" y1="${HY}" x2="${CX1}" y2="${HY}" stroke="var(--ink)" stroke-width="10"/>${ticks}
      <text class="lbl-serif" x="${(CX0 + CX1) / 2}" y="${HY - 30}" text-anchor="middle" style="font-size:36px">${centre}</text></svg>`;
  };

  /* Two-way exchange between two named systems */
  CB.exchange = ({ a, b, there, back, aria }) => {
    const W = 1664, H = 440, L = 420, R = 1244, Y1 = 120, Y2 = 320;
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">
      <text class="lbl-serif" x="0" y="270" style="font-size:136px">${a}</text>
      <text class="lbl-serif" x="${W}" y="270" text-anchor="end" style="font-size:136px">${b}</text>
      <path d="M${L} ${Y1} L${R - 16} ${Y1}" stroke="var(--ink)" stroke-width="6"/>
      <path d="M${R - 34} ${Y1 - 20} L${R} ${Y1} L${R - 34} ${Y1 + 20} Z" fill="var(--ink)"/>
      <text class="lbl-b" x="${(L + R) / 2}" y="${Y1 - 28}" text-anchor="middle">${there}</text>
      <path d="M${R} ${Y2} L${L + 16} ${Y2}" stroke="var(--cmp)" stroke-width="6"/>
      <path d="M${L + 34} ${Y2 - 20} L${L} ${Y2} L${L + 34} ${Y2 + 20} Z" fill="var(--cmp)"/>
      <text class="lbl-b" x="${(L + R) / 2}" y="${Y2 - 28}" text-anchor="middle">${back}</text></svg>`;
  };

  /* Fan chart: history in comparison grey, forecast median in ink inside 60% and 90% bands. Shape only, not data */
  CB.fan = ({ aria, years }) => {
    const W = 1664, H = 500, XS = 560, PX = W - 230, LX = PX + 20;
    const hist = Array.from({ length: 27 }, (_, k) => `${k * (XS / 26)},${Math.round(400 - k * 3.4 + (k % 2 ? 14 : -6) + (k % 5 === 0 ? 8 : 0))}`).join(' ');
    const yEnd = 312;
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">
      ${[80, 190, 300].map((y) => `<line class="grid" x1="0" y1="${y}" x2="${PX}" y2="${y}"/>`).join('')}
      <path d="M${XS} ${yEnd} C800 280 1150 150 ${PX} 50 L${PX} 410 C1150 380 800 340 ${XS} ${yEnd}Z" fill="var(--paper-2)"/>
      <path d="M${XS} ${yEnd} C800 292 1150 200 ${PX} 130 L${PX} 330 C1150 320 800 320 ${XS} ${yEnd}Z" fill="var(--cmp-fill)"/>
      <polyline fill="none" stroke="var(--cmp)" stroke-width="3" stroke-linejoin="round" points="${hist}"/>
      <path class="draw" pathLength="1" d="M${XS} ${yEnd} C800 300 1150 250 ${PX} 222" fill="none" stroke="var(--ink)" stroke-width="5"/>
      <line x1="${XS}" y1="40" x2="${XS}" y2="440" stroke="var(--ink)" stroke-width="1.5"/>
      <text class="lbl" x="${XS - 16}" y="30" text-anchor="end">Collected data</text>
      <text class="lbl lbl-blue" x="${XS + 16}" y="30">Weekly forecast</text>
      <text class="lbl-s" x="${LX}" y="60">90% range</text>
      <text class="lbl-s" x="${LX}" y="150">60% range</text>
      <text class="lbl lbl-blue" x="${LX}" y="230">Median</text>
      <line x1="0" y1="440" x2="${PX}" y2="440" stroke="var(--ink)" stroke-width="2"/>
      ${years.map(([t, xx]) => `<text class="lbl-s" x="${xx}" y="478" text-anchor="middle">${t}</text>`).join('')}</svg>`;
  };

  /* Plan on a month grid: one ink bar per phase, milestones as diamonds with their words */
  CB.gantt = ({ months, rows, milestones, aria }) => {
    const W = 1664, X0 = 520, X1 = W - 24, top = 70, rowH = 120;
    const H = top + rows.length * rowH + 80;
    const x = (m) => X0 + (X1 - X0) * m / months.length;
    const head = months.map((t, k) => `<text class="lbl-b" x="${x(k) + 16}" y="32">${t}</text><line class="grid" x1="${x(k)}" y1="0" x2="${x(k)}" y2="${top + rows.length * rowH}"/>`).join('')
      + `<line x1="0" y1="${top - 22}" x2="${W}" y2="${top - 22}" stroke="var(--ink)" stroke-width="3"/>`;
    const bars = rows.map((r, k) => {
      const y = top + k * rowH;
      return `<text class="lbl-b" x="0" y="${y + 54}">${r.what}</text>
        <rect class="grow" x="${x(r.from) + 4}" y="${y + 20}" width="${x(r.to) - x(r.from) - 8}" height="50" fill="var(--ink)"/>
        <line class="grid" x1="0" y1="${y + rowH - 10}" x2="${W}" y2="${y + rowH - 10}"/>`;
    }).join('');
    const ms = milestones.map((m) => {
      const cx = x(m.at), cy = top + rows.length * rowH + 34;
      return `<path d="M${cx} ${cy - 18} L${cx + 18} ${cy} L${cx} ${cy + 18} L${cx - 18} ${cy} Z" fill="var(--ink)"/>
        <text class="lbl-b" x="${cx - 32}" y="${cy + 9}" text-anchor="end">${m.label}</text>`;
    }).join('');
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">${head}${bars}${ms}</svg>`;
  };

  window.CB = CB;

  // The running head over every content slide: the flag (DECK_CONFIG.flag), then the slide's scope
  const mast = (s) => `<header class="ex-mast"><b class="flag">${CONF.flag || ''}</b><p class="ex-kicker">${s.kicker || ''}</p></header>`;

  // ---------- Slide templates ----------
  window.DECK_TEMPLATES = {
    cover: (s) => `
      <div class="cover-mast">
        <p class="cover-lead"><b>${CONF.flag || ''}</b>${s.lead || ''}</p>
        ${s.logo ? `<img class="client" src="${s.logo}" alt="${s.logoAlt || ''}">` : ''}
      </div>
      <h1 class="cover-title">${s.title}</h1>
      <p class="cover-meta">${s.meta}</p>
      <div class="cover-foot">${s.sender ? `<img class="from" src="${s.sender}" alt="${s.senderAlt || ''}">` : ''}</div>`,
    divider: (s) => `<p class="part">${s.part}</p><h1>${s.title}</h1>`,
    exhibit: (s, i) => `
      ${mast(s)}
      <h2 class="ex-title">${s.title}</h2>
      ${s.sub ? `<p class="ex-sub">${s.sub}</p>` : ''}
      <div class="ex-figure">${typeof s.figure === 'function' ? s.figure(CB) : s.figure}</div>
      ${s.source ? `<p class="ex-source">${s.source}</p>` : ''}
      ${foot(i)}`,
    statement: (s) => `<h1>${s.title}</h1>`,
    close: (s, i) => `
      ${mast(s)}
      <h2 class="ex-title">${s.title}</h2>
      ${s.sub ? `<p class="ex-sub">${s.sub}</p>` : ''}
      <ol class="asks">${s.asks.map((a, k) => `<li><b>${k + 1}</b><span>${a}</span></li>`).join('')}</ol>
      <div class="sender${s.senderLogo ? '' : ' solo'}">${s.senderLogo ? `<img src="${s.senderLogo}" alt="${s.senderAlt || ''}">` : ''}<p>${s.contact || ''}</p></div>`
  };
})();
