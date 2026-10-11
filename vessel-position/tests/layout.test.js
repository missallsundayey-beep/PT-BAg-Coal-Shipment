const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {load,generate,baseline}=require('./helpers');
for(const scenario of baseline.cases) test('full layout, text, arrows and SVG baseline: '+scenario.name,()=>{
 const result=generate(load(),scenario.text,scenario.time);
 assert.equal(crypto.createHash('sha256').update(result.svg).digest('hex'),scenario.svgHash);
 const {svg,...data}=result;
 assert.deepEqual(data,scenario.result);
 const vessels=result.vessels;
 for(const v of vessels) {
  assert.ok(v.nameTextW<=v.stripW-22);
  assert.ok(v.y>=366);
  for(const other of vessels) if(v!==other) {
   const left=Math.min(v.x-v.stripW,v.x-210),ol=Math.min(other.x-other.stripW,other.x-210);
   assert.ok(v.x+292+16<=ol || other.x+292+16<=left || v.y+Math.max(v.h,118)+18<=other.y || other.y+Math.max(other.h,118)+18<=v.y,'overlapping vessels');
  }
 }
});
