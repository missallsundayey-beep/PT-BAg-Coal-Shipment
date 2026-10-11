/* ============ UTIL ============ */
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const pad = n => String(n).padStart(2,'0');
const ord = n => { const t = n % 100; if (t >= 11 && t <= 13) return 'th'; return ({1:'st',2:'nd',3:'rd'})[n % 10] || 'th'; };
const titleCase = s => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
let _ctx = null;
const metricCache = new Map();
function measure(t, px, w) {
  const key = (w || 700) + ':' + px + ':' + t;
  if (metricCache.has(key)) return metricCache.get(key);
  if (!_ctx && typeof document !== 'undefined') { _ctx = document.createElement('canvas').getContext('2d'); }
  if (_ctx) _ctx.font = (w || 700) + ' ' + px + 'px ' + FONT;
  const width = _ctx ? _ctx.measureText(t).width : t.length * px * 0.56;
  if (metricCache.size > 4000) metricCache.clear();
  metricCache.set(key, width);
  return width;
}
function abbr(port) {
  const w = String(port || '').trim().split(/\s+/);
  if (w.length < 2) return w[0] || '';
  return w[0][0].toUpperCase() + '.' + w.slice(1).join(' ');
}
function colOf(port, warn) {
  if (port) for (let i = 0; i < COLN.length; i++) if (COLN[i].test(port)) return i;
  if (warn) warn('Pelabuhan "' + (port || '?') + '" tidak dikenal, kapal diletakkan di kolom Bontang. Tambahkan nama pelabuhan di COLN pada skrip bila perlu.');
  return 1;
}

function tfmt(e) {
  const d = pad(e.day);
  const t = e.ampm ? '/' + e.ampm + ' LT' : '/' + pad(e.hh) + '.' + pad(e.mm) + 'lt';
  return d + '<tspan dy="-9" font-size="15">' + e.suf + '</tspan><tspan dy="9">' + t + '</tspan>';
}
function tplain(e) {
  return pad(e.day) + e.suf + (e.ampm ? '/' + e.ampm + ' LT' : '/' + pad(e.hh) + '.' + pad(e.mm) + 'lt');
}
