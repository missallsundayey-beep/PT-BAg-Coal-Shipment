/* ============ PARSER TEKS ============ */
// Canonical event types keep estimates separate from actual operations.
const EST_TYPES = new Set(['ETA', 'ETD', 'ETB', 'EST_CML', 'EST_CL', 'EST_CMD', 'EST_CD', 'EST_CONTINUE_CD', 'EST_STOP', 'EST_STOP_LOADING', 'EST_POB', 'EST_SHIFT']);
const isEstimate = e => EST_TYPES.has(e.type);
const portKey = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const isJati = s => /tanjung\s*jati|t\.?\s*jati|\btjb\b/i.test(s || '');
function knownColumn(port) {
  return COLN.findIndex(re => re.test(port || ''));
}
function cleanPort(s) {
  return String(s || '').replace(/\(.*?\)/g, '').split(/\s*\/\s*(?:POB|ETB|ETD)\b/i)[0]
    .replace(/[.,;]+$/, '').replace(/\s+/g, ' ').trim();
}
function reportStatus(s) {
  const t = String(s || '');
  if (/drop\s*anchor/i.test(t)) return 'DROP ANCHOR';
  if (/waiting\s+.*clearance/i.test(t)) return 'WAITING P.CLEARANCE';
  if (/sailing/i.test(t)) return 'SAILING';
  if (/complete(?:d)?\s+load/i.test(t)) return 'COMPLETE LOADING';
  if (/complete(?:d)?\s+disch/i.test(t)) return 'COMPLETE DISCHARGE';
  if (/loading\s*process/i.test(t)) return 'LOADING';
  if (/disch(?:arge)?\s*process/i.test(t)) return 'DISCHARGING';
  if (/berthing/i.test(t)) return 'BERTHING PROCESS';
  if (/arrival|arrived/i.test(t)) return 'ARRIVED';
  return null;
}
function mentionedPort(text) {
  const m = String(text || '').match(/(?:PLTU\s+)?(?:Tanjung\s*(?:Jati|Bara|Santan|Pemancingan|Kampeh)|Muara\s*(?:Berau|Jawa|Pantai)|Bontang|Suralaya|Weda|Beihai)(?:\s*B)?/i);
  return m ? cleanPort(m[0]) : '';
}
function statusPort(s) {
  const m = String(s || '').match(/(?:\bat\s*|\barriv(?:al|ed)\s+)(.+)$/i);
  return m ? cleanPort(m[1].replace(/^(?:at|in)\s+/i, '').replace(/jetty\s*\d\s*[&-]\s*\d\s*/i, '')) : '';
}
function jettyIn(s) {
  const m = String(s || '').match(/jetty\s*([13])\s*(?:&|and|dan|-)\s*([24])/i);
  return m && JX[m[1] + '-' + m[2]] !== undefined ? m[1] + '-' + m[2] : null;
}
function classify(txt) {
  const t = String(txt).trim();
  const estimated = /^(?:est(?:imated)?\.?|estimasi)\s+/i.test(t);
  const op = t.replace(/^(?:est(?:imated)?\.?|estimasi)\s+/i, '');
  if (estimated && /^POB/i.test(op)) return {type:/shifting/i.test(op) ? 'EST_SHIFT' : 'EST_POB'};
  if (/^POB\s+shifting/i.test(t)) return {type:'SHIFT'};
  if (/^POB\s+(?:ETD|TD|ET\s*Sail)/i.test(t)) return {type:'POB_ETD'};
  if (/^(?:ETA|ETD|ETB|ET\s*Sail)\b/i.test(t)) {
    const m = t.match(/^(ETA|ETD|ETB|ET\s*Sail)\s*(.*)/i);
    return {type: /^ET\s*Sail$/i.test(m[1]) ? 'ETD' : m[1].toUpperCase(), port: cleanPort(m[2])};
  }
  let type = null;
  if (/^(?:comm(?:ence)?\.?\s+loading|CmL\b)/i.test(op)) type = 'CML';
  else if (/^(?:completed?\s+loading|CL\b)/i.test(op)) type = 'CL';
  else if (/^(?:comm(?:ence)?\.?\s+(?:disch(?:arge)?|dish)|CmD\b|continue\s+disch)/i.test(op)) type = 'CMD';
  else if (/^(?:completed?\s+(?:disch(?:arge)?|dish)|CD\b)/i.test(op)) type = 'CD';
  else if (/^stop\s+(?:disch|loading)/i.test(op)) type = /loading/i.test(op) ? 'STOP_LOADING' : 'STOP_DISCH';
  if (type) return {type: estimated ? (type === 'STOP_DISCH' ? 'EST_STOP' : type === 'STOP_LOADING' ? 'EST_STOP_LOADING' : 'EST_' + type) : type};
  if (/^POB/i.test(t)) return {type:'POB'};
  if (/^(?:cast\s*off|unberthing)/i.test(t)) return {type:'CASTOFF'};
  if (/^(?:all\s*fast|berthed|TB\b)/i.test(t)) return {type:'ALLFAST'};
  if (/^berthing/i.test(t)) return {type:'BERTHING'};
  if (/^(?:drop\s*anchor\w*|DA\b)/i.test(t)) return {type:'DA'};
  if (/^(?:waiting\s+.*clearance|port\s+clearance)/i.test(t)) return {type:'CLEARANCE'};
  if (/^(?:TA|TD)\b/i.test(t)) {
    const m = t.match(/^(TA|TD)\s*(.*)$/i);
    const route = cleanPort(m[2]).split(/\s+to\s+/i);
    return {type:m[1].toUpperCase(), port:route[0], destination:route[1] || null};
  }
  return {type:'OTHER'};
}

function parseReport(raw, warnings) {
  const lines = String(raw || '').replace(/\r/g, '').replace(/&#x20;|&nbsp;/gi, ' ')
    .split('\n').map(s => s.replace(/\\([*])/g, '$1').replace(/[\\*]+$/g, '').replace(/\*/g, '').trim()).filter(Boolean);
  let report = null, jetty = null, cur = null;
  const vessels = [];
  const evRe = /^(?:(?:(\d{1,2})\s*[:.]\s*(\d{2})\s*(?:LT)?|(AM|PM)\.?|[—-])\s*\/\s*)?(\d{1,2})(st|nd|rd|th)?\s*(?:[:;]\s*)?(.+)$/i;
  for (const line of lines) {
    let m;
    if (!report && !cur && !/^MV\.?\s/i.test(line) && (m = line.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s*@?\s*(\d{1,2})[:.](\d{2}))?/))) {
      const month = MONTHS[m[2].toLowerCase()];
      const d = +m[1], hh = m[4] === undefined ? null : +m[4], mm = m[5] === undefined ? null : +m[5];
      if (month !== undefined && d >= 1 && d <= new Date(Date.UTC(+m[3], month + 1, 0)).getUTCDate() && (hh === null || hh < 24 && mm < 60)) {
        report = {y:+m[3], m:month, d, hh, mm}; continue;
      }
      warnings.push('Tanggal atau jam laporan tidak valid: ' + line);
    }
    if ((m = line.match(/^JETTY\s*([13])\s*(?:&|and|dan|-)\s*([24])/i))) {
      jetty = JX[m[1] + '-' + m[2]] !== undefined ? m[1] + '-' + m[2] : null;
      cur = null; continue;
    }
    if (/^MV\.?\s+/i.test(line)) {
      m = line.match(/^MV\.?\s+(.+?)\s*\(\s*([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)\s+([A-Za-z0-9]+-\d+)\s+La[yu]can\s*([^)]*?)\)?\s*$/i);
      cur = {name:titleCase(m ? m[1] : line.replace(/^MV\.?\s+/i, '').split('(')[0].trim()),
        ctype:m ? m[2].toUpperCase() : '', contract:m ? m[3].toUpperCase().replace(/-(\d)$/, '-0$1') : '',
        laycan:m ? m[4] : '', jetty, reportTs:report ? Date.UTC(report.y,report.m,report.d,report.hh,report.mm) : null, statusText:'', events:[], cargo:[]};
      vessels.push(cur);
      if (!m) warnings.push(cur.name + ': identitas/shipment tidak lengkap; kapal tetap ditampilkan dan datanya dipisahkan dari kapal sebelumnya.');
      else if (!line.endsWith(')')) warnings.push(cur.name + ': kurung penutup identitas tidak ada; identitas tetap terbaca.');
      continue;
    }
    if (!cur) continue;
    if ((m = line.match(evRe)) && (m[1] !== undefined || m[3] || /^(?:[—-]\s*\/\s*)?\d{1,2}(?:st|nd|rd|th)?\s*[:;]/i.test(line))) {
      const hh = m[1] === undefined ? null : +m[1], mm = m[2] === undefined ? null : +m[2], day = +m[4];
      if (day < 1 || day > 31 || hh !== null && (hh > 23 || mm > 59)) {
        warnings.push(cur.name + ': waktu event tidak valid, diabaikan: ' + line); continue;
      }
      const event = Object.assign({hh, mm, ampm:m[3] ? m[3].toUpperCase() : null, day, suf:ord(day), raw:m[6].trim(), index:cur.events.length}, classify(m[6]));
      if (hh === null && !m[3]) event.unknownTime = true;
      cur.events.push(event);
      if (event.type === 'OTHER') warnings.push(cur.name + ': event belum dikenali: ' + event.raw);
      continue;
    }
    if (!cur.statusText && !cur.events.length && /^(?:\(|sailing|arriv|drop\s*anchor|waiting|loading|disch|complete|berthing)/i.test(line)) {
      cur.statusText = line.replace(/^\(/, '').replace(/\)$/, '').trim(); continue;
    }
    const undated = classify(line);
    if (['CML','CL','CMD','CD','EST_CL','EST_CML','EST_CMD','EST_CD'].includes(undated.type)) {
      cur.events.push(Object.assign({hh:null,mm:null,ampm:null,day:null,suf:'',raw:line,index:cur.events.length,undated:true},undated));
      warnings.push(cur.name + ': tanggal/jam event tidak tersedia: ' + line);
      continue;
    }
    if (/cargo|yang diangkut/i.test(line) && line.includes(':')) { cur.cargo.push(line); continue; }
    if (/\bLT\b|\d(?:st|nd|rd|th)\s*:/i.test(line)) warnings.push(cur.name + ': baris waktu belum terbaca: ' + line);
  }
  if (!report) {
    report = {y:null, m:null, d:null, hh:null, mm:null};
    warnings.push('Tanggal/jam laporan tidak ditemukan; snapshot belum tersedia. Waktu komputer tidak digunakan.');
    for (const v of vessels) {
      v.reportTs = NaN;
      v.events.forEach(e => { e.ts = NaN; });
    }
    return {report, vessels};
  }
  if (report.hh === null) warnings.push('Jam laporan tidak tersedia; isi jam snapshot sebelum menentukan status berdasarkan waktu.');
  for (const v of vessels) {
    // Anchor the latest dated actual event to the report month, then count
    // month boundaries backwards. Small inversions retain their real day.
    const actual = v.events.filter(e => !isEstimate(e) && e.type !== 'OTHER' && e.day !== null && e.day <= report.d);
    v.reportTs = report.hh === null ? NaN : Date.UTC(report.y,report.m,report.d,report.hh,report.mm);
    const last = actual[actual.length - 1];
    let month = report.m;
    if (last && last.day <= report.d) {
      let rolls = 0, prev = null;
      for (const e of v.events) {
        if (e.undated) continue;
        if (prev !== null && prev >= 25 && e.day <= 10) rolls++;
        prev = e.day;
        if (e === last) break;
      }
      month -= rolls;
    } else if (v.events.length && v.events[0].day > report.d + 15) month--;
    let prev = null;
    for (const e of v.events) {
      if (e.undated) { e.ts = NaN; continue; }
      if (prev !== null && e.day < prev) {
        if (prev >= 25 && e.day <= 10) month++;
        else warnings.push(v.name + ': tanggal event tidak berurutan; tanggal asli dipertahankan dan kronologi diurutkan berdasarkan waktu.');
      }
      prev = e.day;
      const days = new Date(Date.UTC(report.y, month + 1, 0)).getUTCDate();
      if (e.day > days) { e.ts = NaN; warnings.push(v.name + ': tanggal ' + e.day + ' tidak valid pada bulan event.'); continue; }
      // AM/PM without a precise clock is displayed as a time range. An actual
      // event becomes certain only at the end of that range.
      e.ts = Date.UTC(report.y, month, e.day, e.hh === null ? (e.ampm === 'AM' ? 11 : 23) : e.hh, e.mm === null ? 59 : e.mm);
      if (e.hh === null && !isEstimate(e)) warnings.push(v.name + ': waktu aktual ' + (e.ampm ? 'hanya ' + e.ampm : 'tidak tersedia') + '; status memakai akhir rentang ' + (e.ampm ? 'waktu tersebut' : 'hari tersebut') + ', bukan jam aktual yang diketahui.');
    }
    const sourceEvents = v.events.slice();
    for (const ev of sourceEvents) {
      if (!['CML','CMD'].includes(ev.type)) continue;
      const priorTA = sourceEvents.slice(0,ev.index).filter(x => x.type === 'TA').slice(-1)[0];
      if (priorTA && ev.ts < priorTA.ts) {
        ev.dateConflict = true;
        warnings.push(v.name + ': ' + ev.raw + ' tercatat sebelum TA pada kunjungan yang sama; periksa tanggal/jam asli.');
      }
    }
    v.events.sort((a,b) => (Number.isFinite(a.ts) ? a.ts : Infinity) - (Number.isFinite(b.ts) ? b.ts : Infinity) || a.index - b.index);
  }
  for (const v of vessels) {
    const amount = label => {
      const line = v.cargo.find(x => label.test(x));
      const m = line && line.match(/:\s*([\d.,]+)\s*MT/i);
      return m ? Number(m[1].replace(/[.,]/g,'')) : null;
    };
    const onboard=amount(/onboard/i), balance=amount(/balance/i), planned=amount(/rencana/i);
    if (onboard !== null && balance !== null && planned !== null && onboard+balance !== planned)
      warnings.push(v.name + ': Cargo Onboard + Balance Cargo berbeda dari rencana cargo; angka asli dipertahankan.');
  }
  return {report, vessels};
}
