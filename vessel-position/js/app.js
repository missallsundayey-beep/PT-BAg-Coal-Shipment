function logHtml(res) {
  let h = '';
  res.warnings.forEach(w => { h += '<div class="warn"><span class="warn-label">Catatan:</span> ' + esc(w) + '</div>'; });
  h += '<table><tr><th>Kapal</th><th>Kontrak</th><th>Status</th><th>Isi kotak</th></tr>';
  res.vessels.forEach(v => {
    h += '<tr><td>MV ' + esc(v.name) + '</td><td>' + esc(v.ctype + ' ' + v.contract) + '</td><td>' + esc(v.status) + '</td><td>' +
         (v.rows || []).map(r => esc(r.label) + ' ' + esc(tplain(r.ev))).join('<br>') + '</td></tr>';
  });
  return h + '</table>';
}

/* ============ ANTARMUKA (hanya di browser) ============ */
if (typeof document !== 'undefined' && document.getElementById('txt')) {
  const $ = id => document.getElementById(id);
  let timer = null, last = null;
  const render = () => {
    const key = $('txt').value + '\u0000' + $('tm').value.trim();
    if (last && last.inputKey === key) return;
    last = generate($('txt').value, $('tm').value.trim());
    last.inputKey = key;
    $('preview').innerHTML = last.svg;
    $('log').innerHTML = logHtml(last);
    $('shipCount').textContent = last.vessels.length;
    $('noteCount').textContent = last.warnings.length;
    const snapshotClock = last.stamp.match(/(\d{2}:\d{2}) LT$/);
    $('snapshotLabel').textContent = last.report.y === null ? 'Belum tersedia'
      : pad(last.report.d) + ' ' + MONTH_EN[last.report.m] + ' ' + last.report.y + ' · ' + (snapshotClock ? snapshotClock[1] : '—');
  };
  const later = () => { clearTimeout(timer); timer = setTimeout(render, 250); };
  $('txt').value = SAMPLE;
  $('txt').addEventListener('input', later);
  $('tm').addEventListener('input', later);
  $('btnGen').addEventListener('click', render);
  $('btnSample').addEventListener('click', () => { $('txt').value = SAMPLE; render(); });
  $('btnPng').addEventListener('click', () => {
    render();
    exportPng(last, message => $('log').insertAdjacentHTML('afterbegin', '<div class="warn">' + esc(message) + '</div>'));
  });
  render();
  if (document.fonts) document.fonts.ready.then(() => { metricCache.clear(); last = null; render(); });
}
