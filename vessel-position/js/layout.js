/* ============ TATA LETAK ============ */
function wrapInfoText(text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    const candidate = line ? line + ' ' + word : word;
    if (line && measure(candidate, 22, 400) > maxWidth) {
      lines.push(line); line = '';
    }
    if (line) line += ' ';
    for (const char of word) {
      if (measure(line + char, 22, 400) > maxWidth && line) {
        lines.push(line); line = '';
      }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function layout(vessels, warn) {
  const occ = {};
  const take = k => (occ[k] = (occ[k] === undefined ? 0 : occ[k] + 1));
  const cellW = W / 4;
  for (const v of vessels) {
    if (v.band === 'skip') continue;
    v.name2 = 'MV ' + v.name;
    const nameWidth = measure(v.name2, 24, 700);
    v.stripW = Math.max(210, Math.min(cellW - BW - 16, Math.ceil(nameWidth + 24)));
    v.nameFont = Math.min(24, 24 * (v.stripW - 22) / Math.max(nameWidth, 1));
    v.nameTextW = Math.min(v.stripW - 22, measure(v.name2, v.nameFont, 700));
    v.infoRows = v.rows.map(r => {
      const stacked = measure(r.label, 22, 400) + measure(tplain(r.ev), 22, 400) + 14 > BW - 21;
      return {row: r, lines: stacked ? wrapInfoText(r.label, BW - 21) : [r.label], stacked};
    });
    v.h = PAD + LINE * ((v.band === 'external' ? 3 : 2) + v.infoRows.reduce((n, r) => n + r.lines.length + (r.stacked ? 1 : 0), 0));
    v.color = COLORS[v.ctype] || DEFAULT_COLOR;
  }
  const portX = (v, c) => {
    const groupW = v.stripW + BW;
    const left = c * cellW + (cellW - groupW) / 2;
    return left + v.stripW;
  };
  const clampX = (v, x) => Math.min(W - 14 - BW, Math.max(x, v.stripW + 15));
  const live = vessels.filter(v => v.band !== 'skip');
  // External ships form a bottom-right stack. Overflow wraps into the next
  // column to the left; no independent port label or external arrow is drawn.
  let externalX = W - 14 - BW, externalBottom = 1407;
  const external = live.filter(v => v.band === 'external');
  external.slice().reverse().forEach(v => {
    const height = Math.max(v.h, 118);
    if (externalBottom - height < 366) { externalX -= cellW; externalBottom = 1407; }
    v.x = clampX(v, externalX); v.y = externalBottom - height;
    externalBottom = v.y - 24;
  });
  // Treat arrivals at loading ports and active loading as one ordered group.
  const portGroup = v => v.band === 'top' || v.band === 'anchored' && v.anchorZone === 'port';
  const portOrder = {LOADING:0, 'DROP ANCHOR':1, 'WAITING P.CLEARANCE':2};
  const comparePort = (a,b) => (Number.isFinite(a.orderTs) ? a.orderTs : Infinity) -
    (Number.isFinite(b.orderTs) ? b.orderTs : Infinity) ||
    (portOrder[a.status] === undefined ? 3 : portOrder[a.status]) -
    (portOrder[b.status] === undefined ? 3 : portOrder[b.status]);
  for (let c = 0; c < COLN.length; c++) {
    let y = 375;
    live.filter(v => portGroup(v) && knownColumn(v.port) === c).sort(comparePort).forEach(v => {
      v.x = portX(v, c); v.y = y;
      y += Math.max(v.h, 118) + 24;
    });
  }
  // perjalanan menuju pelabuhan muat
  const transit = live.filter(v => v.band === 'transit').sort((a, b) => a.etaTs - b.etaTs);
  const routeX = Object.create(null);
  const transitY = Object.create(null);
  transit.forEach(v => {
    const c = colOf(v.port, warn);
    const key = String(v.port || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (routeX[key] === undefined) routeX[key] = portX(v, c);
    v.x = routeX[key];
    const startY = live.some(t => t.band === 'top' && colOf(t.port, null) === c) ? 700 : 450;
    v.y = transitY[c] === undefined ? startY : transitY[c];
    transitY[c] = v.y + Math.max(v.h, 118) + 90;
  });
  // antrean per jetty: ETA terjauh di atas, kapal terdekat di bawah
  const q = live.filter(v => v.band === 'queue').sort((a, b) => b.etaTs - a.etaTs);
  ['1-2', '3-4'].forEach(j => {
    const group = q.filter(v => (v.jetty || '3-4') === j);
    const step = group.length > 1 ? Math.min(365, (1015 - 545) / (group.length - 1)) : 0;
    group.forEach((v, i) => {
      v.x = clampX(v, j === '1-2' ? JX['1-2'] : QX);
      v.y = 1015 - (group.length - 1 - i) * step;
    });
  });
  // di jetty
  live.filter(v => v.band === 'jetty').forEach(v => {
    const j = (v.jetty && JX[v.jetty] !== undefined) ? v.jetty : '3-4';
    v.x = clampX(v, JX[j]); v.y = 1258 - take('j' + j) * 165;
  });
  // Jetty anchoring retains its existing placement. Loading-port anchoring
  // already belongs to the chronological port group above.
  live.filter(v => v.band === 'anchored').forEach(v => {
    const maxY = Math.max(366, 1407 - Math.max(v.h, 118));
    if (v.anchorZone === 'jetty') {
      const active = live.filter(t => t !== v && t.band === 'jetty' && t.jetty === v.anchorJetty &&
        ['LOADING', 'DISCHARGING', 'BERTHED'].includes(t.status) &&
        t.y + Math.max(t.h, 118) + 8 <= maxY)
        .sort((a, b) => b.y - a.y)[0];
      if (active) { v.x = active.x; v.y = active.y - Math.max(v.h, 118) - 70; }
      else { v.x = clampX(v, JX[v.anchorJetty]); v.y = Math.min(maxY, 1258 - take('anchor-jetty' + v.anchorJetty) * 165); }
    }
  });
  // Prevent the full ship + name strip + status panel from overlapping other vessels.
  const placed = [];
  const bounds = v => ({
    left: Math.min(v.x - v.stripW, v.x - 210),
    right: v.x + BW,
    top: v.y,
    bottom: v.y + Math.max(v.h, 118)
  });
  const collides = (v, y) => {
    const b = bounds(Object.assign({}, v, {y}));
    return placed.some(p => {
      const q = bounds(p);
      return b.left < q.right + 16 && b.right + 16 > q.left &&
             b.top < q.bottom + 18 && b.bottom + 18 > q.top;
    });
  };
  const priority = v => v.band === 'external' ? 0 : v.band === 'jetty' ? 1 : portGroup(v) ? 2 : v.band === 'anchored' ? 3 : v.band === 'transit' ? 4 : 5;
  const portBottom = {};
  live.slice().sort((a,b) => priority(a) - priority(b) || (portGroup(a) && portGroup(b) ? knownColumn(a.port) - knownColumn(b.port) || comparePort(a,b) : a.y - b.y)).forEach(v => {
    const originalY = v.y;
    const c = knownColumn(v.port);
    const minY = portGroup(v) ? Math.max(366, portBottom[c] || 366) : 366;
    const maxY = Math.max(366, 1407 - Math.max(v.h, 118));
    const candidates = [];
    for (let d = 0; d <= 1100; d += 12) {
      if (originalY + d >= minY && originalY + d <= maxY) candidates.push(originalY + d);
      if (!portGroup(v) && d && originalY - d >= minY && originalY - d <= maxY) candidates.push(originalY - d);
    }
    v.y = candidates.find(y => !collides(v, y));
    if (v.y === undefined) {
      v.y = Math.min(maxY, Math.max(minY, originalY));
      warn(v.name + ': ruang diagram penuh; penempatan bebas tumpang tindih tidak tersedia. Kurangi jumlah kapal atau panjang informasi pada satu gambar.');
    }
    if (v.y + Math.max(v.h, 118) > 1407) warn(v.name + ': informasi terlalu panjang untuk tinggi diagram; periksa hasil gambar.');
    placed.push(v);
    if (portGroup(v)) portBottom[c] = v.y + Math.max(v.h,118) + 24;
  });
  q.sort((a,b) => a.y - b.y);
  return {queue: q, live};
}
