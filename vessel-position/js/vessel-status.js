/* ============ STATUS KAPAL ============ */
function evalVessel(v, now, warn) {
  const E = v.events;
  const actual = E.filter(e => Number.isFinite(e.ts) && e.ts <= now && !isEstimate(e) && e.type !== 'OTHER' && !e.dateConflict);
  const reported = reportStatus(v.statusText);
  const useReport = now >= v.reportTs;
  const e = actual[actual.length - 1];
  v.rows = []; v.etaTs = Infinity; v.port = null; v.destination = null;
  const row = (label, ev) => { if (ev) v.rows.push({label, ev}); };
  const latest = (events, types) => events.filter(x => types.includes(x.type)).slice(-1)[0];
  const future = types => E.find(x => Number.isFinite(x.ts) && x.ts >= (e ? e.ts : now) && types.includes(x.type));
  if (!e) {
    v.status = 'STATUS UNKNOWN'; v.band = 'external';
    v.port = statusPort(v.statusText) || mentionedPort(v.statusText) || mentionedPort(E.map(x => x.raw).join(' '));
    v.status = useReport && reported ? reported : 'STATUS UNKNOWN';
    v.location = v.port || 'Lokasi tidak tercantum pada laporan';
    warn(v.name + ': belum ada kejadian aktual yang valid pada waktu snapshot; kapal tetap ditampilkan dengan status belum diketahui.');
    return;
  }
  // Start a new visit at each arrival/departure. Operations and pilot events
  // from previous visits must never be inherited by the current visit.
  const boundary = actual.map(x => x.type).reduce((n,t,i) => ['TA','TD'].includes(t) ? i : n, 0);
  const visit = actual.slice(boundary);
  const ta = latest(visit, ['TA']);
  const td = latest(actual, ['TD']);
  v.port = ta ? ta.port : e.type === 'TD' ? e.port : statusPort(v.statusText);
  const initialJetty = v.jetty;
  // Shifting names a destination, not an already occupied berth.
  for (const ev of visit) if (ev.type !== 'SHIFT' && jettyIn(ev.raw)) v.jetty = jettyIn(ev.raw);
  if (!visit.some(ev => ev.type !== 'SHIFT' && jettyIn(ev.raw))) v.jetty = jettyIn(v.statusText) || initialJetty;
  const statedPort = statusPort(v.statusText);
  if (!v.port && statedPort) v.port = statedPort;
  if (!v.port && /\bat\s*/i.test(e.raw)) v.port = statusPort(e.raw);
  if (!v.port) v.port = mentionedPort(e.raw) || mentionedPort(v.statusText);
  if (!v.port && v.jetty && ['POB','POB_ETD','ALLFAST','BERTHING','CMD','CD','STOP_DISCH','SHIFT'].includes(e.type)) v.port = 'Tanjung Jati';
  const op = latest(visit, ['CML','CL','CMD','CD','STOP_DISCH','STOP_LOADING']);
  const operation = op && ['CML','CL','STOP_LOADING'].includes(op.type) ? 'loading' : op ? 'discharging' : null;
  const place = () => {
    if (isJati(v.port)) v.band = 'jetty';
    else if (knownColumn(v.port) >= 0) v.band = 'top';
    else { v.band = 'external'; v.location = v.port || 'Lokasi tidak tercantum pada laporan'; }
  };
  switch (e.type) {
    case 'TD': {
      const arrival = future(['TA','ETA']);
      const hinted = v.statusText.match(/sailing\s+to\s+(.+)/i);
      v.destination = e.destination || (arrival && arrival.port) || (hinted ? cleanPort(hinted[1]) : null);
      v.status = 'SAILING'; row('TD ' + abbr(e.port), e);
      row('ETA ' + abbr(v.destination), arrival);
      v.port = v.destination; v.etaTs = arrival ? arrival.ts : Infinity;
      if (isJati(v.destination)) v.band = 'queue';
      else if (knownColumn(v.destination) >= 0) v.band = 'transit';
      else { v.band = 'external'; v.location = 'Tujuan ' + (v.destination || 'tidak tercantum'); v.externalRoute = Boolean(v.destination); v.routeLabel = v.destination; warn(v.name + ': tujuan berada di luar empat pelabuhan muat; panah diberi label tujuan sebenarnya.'); }
      break;
    }
    case 'TA':
      v.status = 'ARRIVED'; row('TD ' + abbr(td && td.port), td); row('TA ' + abbr(e.port), e); place();
      if (v.band === 'jetty') v.band = 'anchored';
      break;
    case 'DA':
      v.status = 'DROP ANCHOR'; row('TA ' + abbr(v.port), ta); row('DA', e); place();
      if (v.band !== 'external') v.band = 'anchored';
      break;
    case 'CML':
      v.status = 'LOADING'; row('CmL', e); row('ECL', future(['EST_CL','CL'])); place(); break;
    case 'CL':
      v.status = 'COMPLETE LOADING'; row('CmL', latest(visit,['CML'])); row('CL', e); row('ETD', future(['ETD'])); place(); break;
    case 'CMD':
      v.status = 'DISCHARGING'; row('CmD', e); row('ECD', future(['EST_CD','CD'])); place(); break;
    case 'CD':
      v.status = 'COMPLETE DISCHARGE'; row('CmD', latest(visit,['CMD'])); row('CD', e); row('ETD', future(['ETD'])); place(); break;
    case 'ALLFAST': {
      const stopped = latest(visit,['STOP_DISCH']);
      const resumed = latest(visit,['CMD']);
      v.status = stopped && (!resumed || stopped.ts > resumed.ts) ? 'DISCHARGE STOPPED' : 'BERTHED';
      row('TA ' + abbr(v.port), ta); row('TB', e);
      if (stopped) row('Est CmD', future(['EST_CMD','EST_CONTINUE_CD']));
      place(); break;
    }
    case 'BERTHING':
      v.status = 'BERTHING PROCESS'; row('TA ' + abbr(v.port), ta); row('Berthing', e); place(); break;
    case 'STOP_LOADING':
      v.status = 'LOADING STOPPED'; row('CmL', latest(visit,['CML'])); row('Stop Loading', e); row('Est CmL', future(['EST_CML'])); place(); break;
    case 'STOP_DISCH':
      v.status = 'DISCHARGE STOPPED'; row('CmD', latest(visit,['CMD'])); row('Stop Disch', e); row('Est CmD', future(['EST_CMD','EST_CONTINUE_CD'])); place(); break;
    case 'SHIFT':
      v.status = 'SHIFTING'; v.shiftFrom = v.jetty; v.shiftTo = jettyIn(e.raw);
      row('POB Shift ' + (v.shiftTo || ''), e); place(); break;
    case 'POB': case 'POB_ETD': {
      const departing = e.type === 'POB_ETD' || /unberth|\bETD\b/i.test(e.raw) || op && ['CL','CD'].includes(op.type);
      if (!departing && /\b(?:berthing|bething)\b/i.test(e.raw)) {
        // Preserve the established report convention requested for POB Berthing.
        v.status = 'BERTHED'; row('TA ' + abbr(v.port), ta); row('POB', e);
      } else if (departing) {
        v.status = /unberth/i.test(e.raw) ? 'UNBERTHING PROCESS' : op && op.type === 'CL' ? 'COMPLETE LOADING' : op && op.type === 'CD' ? 'COMPLETE DISCHARGE' : 'UNBERTHING PROCESS';
        row(op && op.type === 'CL' ? 'CL' : 'CD', op && ['CL','CD'].includes(op.type) ? op : null); row('POB ETD', e);
      } else {
        v.status = operation === 'loading' && op.type === 'CML' ? 'LOADING' : operation === 'discharging' && op.type === 'CMD' ? 'DISCHARGING' : 'BERTHING PROCESS';
        row('TA ' + abbr(v.port), ta); row('POB', e);
      }
      place(); break;
    }
    case 'CASTOFF':
      v.status = 'UNBERTHING PROCESS'; row('Cast Off', e); place(); break;
    case 'CLEARANCE':
      v.status = 'WAITING P.CLEARANCE'; row('Clearance', e); place(); break;
    default:
      v.status = 'STATUS UNKNOWN'; row(e.raw, e); place();
  }
  // Report summaries may confirm an arrival or ongoing operation when
  // the log only carries an estimate or contains a contradictory operation date.
  // This is reported evidence, not an invented TA/CmD timestamp.
  const reportedArrival = reported === 'ARRIVED' && v.status === 'SAILING' && useReport;
  const arrivedEstimate = E.find(x => x.type === 'ETA' && x.ts <= v.reportTs && (!td || x.ts >= td.ts));
  if (reportedArrival && arrivedEstimate) {
    v.status = 'ARRIVED'; v.port = arrivedEstimate.port; v.rows = [];
    row('TD ' + abbr(td && td.port), td); row('ETA ' + abbr(v.port), arrivedEstimate);
    v.reportedEvidence = true; place();
    if (isJati(v.port)) v.band = 'anchored';
    warn(v.name + ': kedatangan dikonfirmasi ringkasan laporan; jam yang tersedia masih ETA, bukan TA aktual.');
  }
  const invalidOp = E.find(x => x.dateConflict && x.ts <= now &&
    (reported === 'DISCHARGING' ? x.type === 'CMD' : reported === 'LOADING' ? x.type === 'CML' : false));
  const stopped = latest(visit,['STOP_DISCH']);
  const resumePlan = E.find(x => ['EST_CMD','EST_CONTINUE_CD'].includes(x.type) && stopped && x.ts > stopped.ts && x.ts <= v.reportTs);
  if (useReport && reported === 'DISCHARGING' && (invalidOp && !stopped || resumePlan)) {
    v.status = 'DISCHARGING'; v.reportedEvidence = true; place();
    warn(v.name + ': status membongkar mengikuti ringkasan laporan; waktu mulai/lanjut aktual perlu dikonfirmasi.');
  }
  const futureActualOp = E.find(x => !isEstimate(x) && ['CML','CMD'].includes(x.type) && x.ts > now);
  if (useReport && futureActualOp && ['LOADING','DISCHARGING'].includes(reported) && v.status !== reported)
    warn(v.name + ': ringkasan operasi bertentangan dengan jam mulai setelah snapshot; status mengikuti kejadian sebelum snapshot.');
  if (v.band === 'anchored') {
    v.anchorPort = v.port || ''; v.anchorZone = isJati(v.port) ? 'jetty' : 'port';
    v.anchorJetty = v.jetty;
  }
  if (['jetty','queue'].includes(v.band) || v.anchorZone === 'jetty') {
    if (!v.jetty || !JX[v.jetty]) {
      v.band = 'external'; v.location = 'Tanjung Jati — jetty belum diketahui';
      warn(v.name + ': jetty belum diketahui; tidak diarahkan otomatis ke Jetty 3&4.');
    }
  }
  if (v.band === 'external') warn(v.name + ': ' + v.location + '; lokasi ini ditampilkan terpisah dari jetty/pelabuhan pada diagram.');
}
