const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {load,generate,baseline}=require('./helpers');
const {cases,ship,report,loading}=require('./revision-cases');
const fields=['name','port','destination','jetty','band','location','etaTs','shiftFrom','shiftTo','anchorZone','reportedEvidence'];
const select=v=>Object.fromEntries(fields.filter(k=>k in v).map(k=>[k,v[k]]));
for(const scenario of baseline.cases) test('retained baseline facts with explicit status revisions: '+scenario.name,()=>{
 const result=generate(load(),scenario.text,scenario.time);
 assert.deepEqual(result.vessels.map(select),scenario.result.vessels.map(select));
 for(const [i,v] of result.vessels.entries()){
  const old=scenario.result.vessels[i];
  let expected=old.status==='ARRIVED'?'DROP ANCHOR':old.status==='COMPLETE LOADING'?'WAITING P.CLEARANCE':old.status;
  if(['sample-after-pilot','sample-evening'].includes(scenario.name)&&old.status==='COMPLETE DISCHARGE')expected='UNBERTHING PROCESS';
  assert.equal(v.status,expected);
  // No new actual/estimated event or fabricated time is added to the legends.
  assert.deepEqual(v.rows.filter(r=>r.ev).map(r=>r.ev),old.rows.map(r=>r.ev));
  assert.ok(v.rows.length>=2&&v.rows.length<=3);
 }
 assert.equal(result.stamp,scenario.result.stamp);
});
for(const scenario of cases)test('revision rule: '+scenario.name,()=>{
 const result=generate(load(),scenario.text,scenario.time||'');assert.equal(result.vessels.length,1);
 const v=result.vessels[0];assert.equal(v.status,scenario.status);
 for(const field of ['port','band','jetty'])if(field in scenario)assert.equal(v[field],scenario[field]);
 assert.ok(v.rows.length>=2&&v.rows.length<=3);
 assert.doesNotMatch(result.svg,/NaN|undefined|\/null/);
});
test('arrival keeps TA, summary ETA remains estimate, and no DA is invented',()=>{
 for(const name of ['actual arrival display','summary arrival retains ETA','external summary without time']){
  const c=cases.find(x=>x.name===name),v=generate(load(),c.text,'').vessels[0];
  assert.ok(!v.events.some(e=>e.type==='DA'));
  if(name==='summary arrival retains ETA') {assert.ok(!v.events.some(e=>e.type==='TA'));assert.ok(v.rows.some(r=>r.label.startsWith('ETA')&&r.ev.type==='ETA'));}
 }
});
test('no date uses no clock and a fake system date cannot change results',()=>{
 const c=cases.find(x=>x.name==='empty report snapshot is not computer time');
 const a=load(),b=load();vm.runInContext("Date = class extends Date { constructor(...args) { super(...(args.length?args:['2099-12-31T23:59:59Z'])); } }",b);
 assert.deepEqual(generate(a,c.text,'09:00'),generate(b,c.text,'09:00'));
 assert.deepEqual(generate(a,c.text,'').report,{y:null,m:null,d:null,hh:null,mm:null});
});
test('unknown time stays empty or AM/PM and is not used as an exact ordering timestamp',()=>{
 for(const name of ['AM CL after range end','CL without clock next day','CL without date does not invent timestamp']){
  const c=cases.find(x=>x.name===name),v=generate(load(),c.text,'').vessels[0];
  assert.equal(v.orderTs,null);
  const cl=v.rows.find(r=>r.label==='CL');assert.ok(cl);assert.equal(cl.ev.hh,null);
  assert.ok(cl.ev.ampm||cl.ev.unknownTime||cl.ev.undated);
 }
 const context=load();assert.equal(vm.runInContext('tfmt(null)',context),'—');assert.equal(vm.runInContext('tplain(null)',context),'—');
 const unknown=cases.find(x=>x.name==='CL without clock next day');const result=generate(context,unknown.text,'');context.result=result;
 assert.match(vm.runInContext('logHtml(result)',context),/—/);assert.doesNotMatch(result.svg,/23\.59lt/);
});
test('old visit CL and TA are not inherited after new arrival',()=>{
 const text=report(ship('ALPHA','07:00 LT / 01st : TA Muara Berau\n08:00 LT / 01st : Commence Loading\n09:00 LT / 02nd : Complete Loading\n10:00 LT / 02nd : TD Muara Berau\n08:00 LT / 08th : TA Bontang'));
 const v=generate(load(),text,'').vessels[0];assert.equal(v.status,'DROP ANCHOR');
 assert.equal(v.orderTs,Date.UTC(2026,9,8,8));assert.equal(v.port,'Bontang');assert.ok(!v.rows.some(r=>r.label==='CL'));
});
test('same names with different contracts and visits remain separate records',()=>{
 const text=report(ship('ALPHA',loading,{contract:'A7-21'})+'\n'+ship('ALPHA','08:00 LT / 08th : TA Bontang',{contract:'A7-22'}));
 const r=generate(load(),text,'');assert.equal(r.vessels.length,2);assert.deepEqual(r.vessels.map(v=>v.contract),['A7-21','A7-22']);
 assert.deepEqual(r.vessels.map(v=>v.status),['COMPLETE LOADING','DROP ANCHOR']);
 assert.equal((r.svg.match(/>MV Alpha<\/text>/g)||[]).length,2);
});
