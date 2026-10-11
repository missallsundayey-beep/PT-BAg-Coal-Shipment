const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load,generate,baseline}=require('./helpers');
const fields=['name','status','port','destination','jetty','band','location','rows','etaTs','shiftFrom','shiftTo','anchorZone','reportedEvidence'];
const select=v=>Object.fromEntries(fields.filter(k=>k in v).map(k=>[k,v[k]]));
for(const scenario of baseline.cases) test('status baseline: '+scenario.name,()=>{
 const result=generate(load(),scenario.text,scenario.time);
 assert.deepEqual(result.vessels.map(select),scenario.result.vessels.map(select));
 assert.deepEqual(result.warnings,scenario.result.warnings);
 assert.equal(result.stamp,scenario.result.stamp);
});
test('actual operations and shifting only advance after snapshot',()=>{
 const result=name=>{const c=baseline.cases.find(c=>c.name===name);return generate(load(),c.text,c.time).vessels[0]};
 assert.equal(result('complete-loading-before-departure').status,'COMPLETE LOADING');
 assert.equal(result('drop-anchor-after-discharge').status,'DROP ANCHOR');
 assert.equal(result('shifting-before-allfast').status,'SHIFTING');
 assert.equal(result('shifting-before-allfast').jetty,'1-2');
 assert.equal(result('shifting-after-allfast').jetty,'3-4');
 assert.equal(result('shifting-after-allfast').status,'BERTHED');
});
