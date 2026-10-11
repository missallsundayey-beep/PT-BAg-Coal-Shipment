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
