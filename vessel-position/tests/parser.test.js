const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load,baseline}=require('./helpers');
const vm=require('node:vm');
for(const scenario of baseline.cases) test('parser baseline: '+scenario.name,()=>{
 const context=load();context.text=scenario.text;
 const parsed=JSON.parse(vm.runInContext('JSON.stringify(parseReport(text,[]))',context));
 assert.deepEqual(parsed.report,scenario.result.report);
 assert.deepEqual(parsed.vessels.map(v=>({name:v.name,ctype:v.ctype,contract:v.contract,events:v.events,cargo:v.cargo})),scenario.result.vessels.map(v=>({name:v.name,ctype:v.ctype,contract:v.contract,events:v.events,cargo:v.cargo})));
});
test('September–October and December–January timestamps retain source chronology',()=>{
 const sample=baseline.cases.find(c=>c.name==='sample').result;
 const events=sample.vessels[0].events;
 assert.equal(new Date(events[0].ts).toISOString(),'2026-09-30T01:00:00.000Z');
 assert.equal(new Date(events[1].ts).toISOString(),'2026-10-02T01:18:00.000Z');
 const year=baseline.cases.find(c=>c.name==='year-boundary').result.vessels[0].events;
 assert.equal(new Date(year[0].ts).toISOString(),'2026-12-30T05:00:00.000Z');
 assert.equal(new Date(year[1].ts).toISOString(),'2027-01-02T08:00:00.000Z');
});

test('ETB is classified as an estimate and original raw text stays intact',()=>{
 const {ship,report}=require('./revision-cases');const context=load();
 context.text=report(ship('ALPHA','07:00 LT / 08th : TA Bontang\n08:00 LT / 08th : ETB at Bontang'));
 const result=JSON.parse(vm.runInContext('JSON.stringify(parseReport(text,[]))',context));
 assert.equal(result.vessels[0].events[1].type,'ETB');assert.equal(result.vessels[0].events[1].raw,'ETB at Bontang');
 assert.equal(vm.runInContext("isEstimate({type:'ETB'})",context),true);
});
test('blank clocks, bare operation and incomplete identity preserve missing data',()=>{
 const {ship,report}=require('./revision-cases');const context=load();
 context.text=report(ship('ALPHA','— / 08th : Complete Loading\nComplete Loading').replace('2026)','2026'));
 const result=JSON.parse(vm.runInContext('JSON.stringify(parseReport(text,[]))',context));
 assert.equal(result.vessels.length,1);assert.equal(result.vessels[0].name,'Alpha');
 assert.deepEqual(result.vessels[0].events.map(e=>e.hh),[null,null]);
 assert.equal(result.vessels[0].events[0].unknownTime,true);assert.equal(result.vessels[0].events[1].day,null);
});
test('invalid report dates do not fall back to the computer clock or contract laycan',()=>{
 const {ship}=require('./revision-cases');const context=load();
 context.text='31 September 2026 @ 09:00 LT\n'+ship('ALPHA','08:00 LT / 08th : TA Bontang');
 const result=JSON.parse(vm.runInContext('JSON.stringify(parseReport(text,[]))',context));
 assert.deepEqual(result.report,{y:null,m:null,d:null,hh:null,mm:null});assert.equal(result.vessels[0].events[0].ts,null);
});
