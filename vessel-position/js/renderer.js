const DEFS = `
<defs>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#087eb9"/><stop offset=".52" stop-color="#0875ac"/><stop offset="1" stop-color="#056b9f"/></linearGradient>
  <pattern id="waves" width="${W}" height="1065" patternUnits="userSpaceOnUse">
    <image href="${ASSET_OCEAN}" width="${W}" height="1065" preserveAspectRatio="none"/>
  </pattern>
  <g id="ship"><image href="${ASSET_SHIP}" x="0" y="0" width="210" height="88" preserveAspectRatio="xMidYMid meet"/></g>
  <g id="mine">
    <path d="M0 118 L40 62 L62 76 L96 36 L150 118 Z" fill="#1f1f22"/>
    <rect x="0" y="112" width="150" height="6" fill="#3a3a3f"/>
    <rect x="18" y="8" width="28" height="64" fill="none" stroke="#c7ccd3" stroke-width="3"/>
    <path d="M18 8 L46 40 M46 8 L18 40 M18 40 L46 72 M46 40 L18 72" stroke="#c7ccd3" stroke-width="2" fill="none"/>
    <circle cx="40" cy="26" r="16" fill="none" stroke="#e8383d" stroke-width="5"/><circle cx="40" cy="26" r="3" fill="#e8383d"/>
    <path d="M46 34 L96 38" stroke="#9aa3ad" stroke-width="2"/>
  </g>
  <g id="crane">
    <rect x="0" y="84" width="85" height="6" fill="#8fd0ea"/>
    <rect x="14" y="62" width="34" height="24" fill="#aeb4ba"/>
    <rect x="25" y="18" width="11" height="48" fill="#f08a1c"/>
    <path d="M2 22 L72 6 L72 17 L36 31 Z" fill="#f08a1c"/>
    <line x1="68" y1="14" x2="68" y2="44" stroke="#555" stroke-width="2"/>
    <path d="M63 44 q5 9 10 0" stroke="#555" fill="none" stroke-width="2"/>
  </g>
  <g id="plant">
    <path d="M0 145 L36 104 L78 124 L124 92 L240 145 Z" fill="#1f1f22"/>
    <rect x="66" y="64" width="92" height="56" fill="#c5c9ce"/>
    <rect x="78" y="78" width="68" height="8" fill="#9aa1a9"/><rect x="78" y="94" width="68" height="8" fill="#9aa1a9"/>
    <rect x="94" y="22" width="13" height="44" fill="#fff" stroke="#bbb"/><rect x="94" y="32" width="13" height="9" fill="#d33"/>
    <path d="M160 42 Q152 86 148 118 H200 Q194 86 186 42 Z" fill="#b9bec4"/>
    <circle cx="172" cy="30" r="14" fill="#8e949b" opacity=".85"/><circle cx="192" cy="18" r="10" fill="#8e949b" opacity=".7"/>
    <circle cx="104" cy="12" r="9" fill="#8e949b" opacity=".7"/>
  </g>
</defs>`;

function sceneBase(stamp) {
  let s = '';
  s += `<rect width="${W}" height="${H}" fill="#fff"/>`;
  s += `<text x="40" y="52" font-size="44" font-weight="700">PT BAg COAL SHIPMENT – VESSEL POSITION</text>`;
  s += `<text x="40" y="104" font-size="34" font-weight="700" font-style="italic">${esc(stamp)}</text>`;
  s += `<text x="2144" y="52" font-size="35" font-weight="800" font-style="italic" text-anchor="end">LOADING PORT</text>`;
  s += `<text x="2144" y="104" font-size="35" font-weight="800" font-style="italic" text-anchor="end">EAST BORNEO</text>`;
  const heads = ['Muara Berau / Muara Jawa', 'Bontang & Tanjung Santan', 'Tanjung Bara / Lubuk Tutung', 'Muara Pantai'];
  heads.forEach((h, i) => {
    s += `<text x="${COLX[i]}" y="196" font-size="27" font-weight="700" fill="#000" text-anchor="middle">${esc(h)}</text>`;
    s += `<image href="${ASSET_MINE}" x="${COLX[i] - 127}" y="220" width="150" height="124" preserveAspectRatio="xMidYMid meet"/><use href="#crane" x="${COLX[i] + 49}" y="254"/>`;
  });
  s += `<rect y="350" width="${W}" height="1065" fill="url(#sea)"/><rect y="350" width="${W}" height="1065" fill="url(#waves)"/><line x1="0" y1="350" x2="${W}" y2="350" stroke="#d7e8f1" stroke-width="2"/>`;
  // Batas laut dan area jetty tetap lurus.
  s += `<line x1="0" y1="1415" x2="${W}" y2="1415" stroke="#d7e8f1" stroke-width="2"/>`;
  // bawah
  s += `<use href="#crane" x="601" y="1432"/><text x="640" y="1565" font-size="28" font-weight="700" text-anchor="middle">Jetty 1-2</text>`;
  s += `<image href="${ASSET_PLANT}" x="965" y="1400" width="250" height="145" preserveAspectRatio="xMidYMid meet"/>`;
  s += `<text x="1090" y="1587" font-size="29" font-weight="700" text-anchor="middle">PLTU TANJUNG JATI B</text>`;
  s += `<text x="1100" y="1646" font-size="34" font-weight="800" font-style="italic" text-anchor="middle">UNLOADING PORT</text>`;
  s += `<text x="1097" y="1690" font-size="34" font-weight="800" font-style="italic" text-anchor="middle">JEPARA, CENTRAL JAVA</text>`;
  s += `<use href="#crane" x="1365" y="1432"/><text x="1410" y="1565" font-size="28" font-weight="700" text-anchor="middle">Jetty 3-4</text>`;
  s += `<image href="${ASSET_BAG}" x="12" y="1460" width="330" height="230" preserveAspectRatio="xMidYMid meet"/>`;
  // legenda
  const leg = [['TA','Time of Arrival'],['TB','Time of Berthing'],['TD','Time of Departure'],['ET','Estimated Time'],['CmL','Commence Loading'],['CL','Complete Loading'],['CmD','Commence Discharge'],['CD','Complete Discharge'],['DA','Drop Anchor']];
  s += `<text x="1735" y="1454" font-size="16" font-weight="700" font-style="italic">LEGEND</text>`;
  leg.forEach((r, i) => {
    const y = 1476 + i * 18.6;
    s += `<text x="1735" y="${y}" font-size="16" font-weight="700">${r[0]}</text><text x="1835" y="${y}" font-size="16" font-weight="700">${r[1]}</text>`;
  });
  return s;
}

function arrowSvg(x, y1, y2, color) {
  const dir = Math.sign(y2 - y1);
  if (!dir || Math.abs(y2 - y1) < 40) return '';
  const lineEnd = y2 - dir * 24;
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${lineEnd}" stroke="${color}" stroke-width="13" stroke-dasharray="52 26"/>` +
         `<path d="M${x - 15} ${lineEnd} L${x + 15} ${lineEnd} L${x} ${y2} Z" fill="${color}"/>`;
}

function routeArrow(x1, y1, x2, y2, color, vessels, ignore = []) {
  const dir = Math.sign(y2 - y1), x = x1;
  if (!dir || Math.abs(y2 - y1) < 40) return '';
  const blockers = vessels.filter(v => !ignore.includes(v) &&
    x >= Math.min(v.x - v.stripW, v.x - 210) - 12 && x <= v.x + BW + 12)
    .map(v => ({top:v.y - 12, bottom:v.y + Math.max(v.h,118) + 12}));
  let tip = y2;
  for (const b of blockers) if (tip > b.top && tip < b.bottom)
    tip = dir > 0 ? b.top - 8 : b.bottom + 8;
  if ((tip-y1)*dir < 40) return '';
  const base = tip - dir*24;
  let segments = [[Math.min(y1,base),Math.max(y1,base)]];
  for (const b of blockers) segments = segments.flatMap(([lo,hi]) => {
    if (b.bottom <= lo || b.top >= hi) return [[lo,hi]];
    const out=[];
    if (b.top > lo) out.push([lo,b.top]);
    if (b.bottom < hi) out.push([b.bottom,hi]);
    return out;
  });
  const lines = segments.filter(([lo,hi]) => hi-lo > 4).map(([lo,hi]) =>
    `<line x1="${x}" y1="${lo}" x2="${x}" y2="${hi}" stroke="${color}" stroke-width="11" stroke-dasharray="36 22"/>`).join('');
  return lines + `<path d="M${x-15} ${base} L${x+15} ${base} L${x} ${tip} Z" fill="${color}"/>`;
}

function vesselSvg(v) {
  const x = v.x, y = v.y;
  let s = '';
  s += `<use href="#ship" x="${x - 210}" y="${y + 4}"/>`;
  s += `<rect x="${x - v.stripW}" y="${y + 82}" width="${v.stripW + 2}" height="36" fill="${v.color}"/>`;
  s += `<rect x="${x}" y="${y}" width="${BW}" height="${v.h}" fill="${v.color}"/>`;
  s += `<text x="${x - v.stripW + 11}" y="${y + 109}" font-size="${v.nameFont}" textLength="${v.nameTextW}" lengthAdjust="spacingAndGlyphs" font-weight="700">${esc(v.name2)}</text>`;
  const base = i => y + PAD + LINE * i + 18;
  s += `<text x="${x + 11}" y="${base(0)}" font-size="24" font-weight="700">${esc(v.ctype + ' ' + v.contract)}</text>`;
  const sw = measure(v.status, 24, 700), sfs = sw > BW - 24 ? Math.floor(24 * (BW - 24) / sw * 10) / 10 : 24;
  s += `<text x="${x + 11}" y="${base(1)}" font-size="${sfs}" textLength="${Math.min(BW - 24, measure(v.status, sfs, 700))}" lengthAdjust="spacingAndGlyphs" font-weight="700">${esc(v.status)}</text>`;
  let infoLine = 2;
  if (v.band === 'external') {
    const loc = v.location || v.port || 'Lokasi belum diketahui';
    const fs = Math.min(20, 20 * (BW - 22) / Math.max(measure(loc, 20, 400), 1));
    s += `<text x="${x + 11}" y="${base(infoLine++)}" font-size="${fs}">${esc(loc)}</text>`;
  }
  v.infoRows.forEach(({row: r, lines, stacked}) => {
    lines.forEach((line, i) => {
      s += `<text x="${x + 11}" y="${base(infoLine + i)}" font-size="22">${esc(line)}</text>`;
    });
    const timeLine = infoLine + (stacked ? lines.length : 0);
    s += `<text x="${x + BW - 10}" y="${base(timeLine)}" font-size="22" text-anchor="end">${tfmt(r.ev)}</text>`;
    infoLine += lines.length + (stacked ? 1 : 0);
  });
  return s;
}

function generate(text, overrideTime) {
  const warnings = [], warn = m => { if (!warnings.includes(m)) warnings.push(m); };
  const {report, vessels} = parseReport(text, warnings);
  if (!vessels.length) warnings.push('Tidak ada kapal terbaca. Pastikan baris kapal berbentuk: MV NAMA KAPAL (EBP A7-21 Laycan ...).');
  let tm = pad(report.hh) + ':' + pad(report.mm);
  let o = (overrideTime || '').trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (o && (+o[1] > 23 || +o[2] > 59)) o = null;
  if ((overrideTime || '').trim() && !o) warn('Jam pilihan tidak valid; memakai jam laporan.');
  if (o) tm = pad(+o[1]) + ':' + o[2];
  const now = Date.UTC(report.y, report.m, report.d, o ? +o[1] : report.hh, o ? +o[2] : report.mm);
  vessels.forEach(v => evalVessel(v, now, warn));
  const lay = layout(vessels, warn);
  const stamp = pad(report.d) + ord(report.d) + ' ' + MONTH_EN[report.m] + ' ' + report.y + ' ' + tm + ' LT';
  // panah antrean mengikuti jetty tujuan masing-masing
  let arrows = '';
  lay.live.filter(v => v.band === 'transit').forEach(v => {
    const x = v.x + 100;
    const destCol = colOf(v.port, null);
    const key = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const ahead = lay.live.filter(t => t !== v && t.band === 'transit' &&
      key(t.port) === key(v.port) && t.y < v.y).sort((a, b) => b.y - a.y)[0];
    const loadingAtDest = lay.live.find(t => t !== v && t.status === 'LOADING' &&
      t.band === 'top' && colOf(t.port, null) === destCol);
    const targetY = ahead ? ahead.y + Math.max(ahead.h, 118) + 8 : loadingAtDest
      ? loadingAtDest.y + Math.max(loadingAtDest.h, 118) + 4
      : 350;
    arrows += routeArrow(x, v.y - 10, x, targetY, v.color, lay.live, [v]);
  });
  ['1-2', '3-4'].forEach(j => {
    const chain = lay.queue.filter(v => (v.jetty || '3-4') === j);
    const atJetty = lay.live.filter(v => v.band === 'jetty' && (v.jetty || '3-4') === j).sort((a, b) => a.y - b.y)[0];
    chain.forEach((v, i) => {
      const next = chain[i + 1] || atJetty;
      const col = v.color;
      const sx = v.x + 100;
      const sy = v.y + Math.max(v.h, 118) + 8;
      if (next) arrows += routeArrow(sx, sy, next.x + 100, next.y - 8, col, lay.live, [v, next]);
      else arrows += routeArrow(sx, sy, sx, 1395, col, lay.live, [v]);
    });
  });
    lay.live.filter(v => v.externalRoute).forEach(v => {
    const sx = v.x + 100, targetY = 680;
    arrows += routeArrow(sx, v.y - 10, sx, targetY, v.color, lay.live, [v]);
    const fs = Math.min(21, 21 * 280 / Math.max(measure(v.routeLabel,21,700),1));
    arrows += `<text x="${sx}" y="${targetY - 12}" font-size="${fs}" font-weight="700" text-anchor="middle" fill="#fff">${esc(v.routeLabel)}</text>`;
  });
  lay.live.filter(v => v.status === 'SHIFTING' && v.shiftTo && v.shiftFrom).forEach(v => {
    const fromX = v.x + 100, toX = JX[v.shiftTo] + 100, y = Math.min(1384,v.y + Math.max(v.h,118) + 25);
    const dir = Math.sign(toX-fromX);
    if (dir) arrows += `<line x1="${fromX}" y1="${y}" x2="${toX-dir*20}" y2="${y}" stroke="${v.color}" stroke-width="9" stroke-dasharray="30 18"/><path d="M${toX-dir*20} ${y-12} L${toX-dir*20} ${y+12} L${toX} ${y} Z" fill="${v.color}"/>`;
  });
  let body = sceneBase(stamp) + arrows;
  lay.live.forEach(v => { body += vesselSvg(v); });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}" fill="#000">${DEFS}${body}</svg>`;
  return {svg, report, vessels, warnings, stamp};
}
