const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {load,generate,baseline}=require('./helpers');
const {cases,ship,report,loading}=require('./revision-cases');
function assertLayout(result){
 const vessels=result.vessels;assert.ok(!result.warnings.some(w=>/ruang diagram penuh|terlalu panjang/.test(w)));
 for(const v of vessels) {
  assert.ok(v.nameTextW<=v.stripW-22);assert.ok(v.rows.length>=2&&v.rows.length<=3);
  assert.ok(v.y>=366&&v.y+Math.max(v.h,118)<=1407,'vertical bounds '+v.name);
  assert.ok(Math.min(v.x-v.stripW,v.x-210)>=0&&v.x+292<=2184,'horizontal bounds');
  for(const other of vessels) if(v!==other) {
   const left=Math.min(v.x-v.stripW,v.x-210),ol=Math.min(other.x-other.stripW,other.x-210);
   assert.ok(v.x+292+16<=ol || other.x+292+16<=left || v.y+Math.max(v.h,118)+18<=other.y || other.y+Math.max(other.h,118)+18<=v.y,'overlapping '+v.name+' / '+other.name);
  }
 }
 assert.equal((result.svg.match(/<use href="#ship"/g)||[]).length,vessels.length);
}
for(const scenario of [...baseline.cases,...cases])test('canvas, panels and exact ship count: '+scenario.name,()=>assertLayout(generate(load(),scenario.text,scenario.time||'')));
for(const name of ['same-jetty-queue','parser-variations'])test('unchanged diagram still matches original SVG: '+name,()=>{
 const c=baseline.cases.find(c=>c.name===name);assert.equal(crypto.createHash('sha256').update(generate(load(),c.text,c.time).svg).digest('hex'),c.svgHash);
});
test('earlier port status time takes precedence over status priority and input order',()=>{
 const text=report(ship('WAIT',loading)+'\n'+ship('LOAD','06:00 LT / 08th : TA Muara Berau\n08:00 LT / 08th : Commence Loading')+'\n'+ship('ANCHOR','07:00 LT / 08th : TA Muara Berau'),{clock:'10:00'});
 const r=generate(load(),text,'');assertLayout(r);assert.deepEqual(r.vessels.slice().sort((a,b)=>a.y-b.y).map(v=>v.name),['Anchor','Load','Wait']);
});
test('equal timestamps sort loading, anchor, clearance and retain input ties',()=>{
 const text=report(ship('WAIT',loading.replace('09:00 LT / 08th','08:00 LT / 08th'))+'\n'+ship('ANCHOR','08:00 LT / 08th : TA Muara Berau')+'\n'+ship('LOAD B','07:00 LT / 08th : TA Muara Berau\n08:00 LT / 08th : Commence Loading')+'\n'+ship('LOAD A','07:00 LT / 08th : TA Muara Berau\n08:00 LT / 08th : Commence Loading'),{clock:'10:00'});
 const r=generate(load(),text,'');assertLayout(r);assert.deepEqual(r.vessels.slice().sort((a,b)=>a.y-b.y).map(v=>v.name),['Load B','Load A','Anchor','Wait']);
});
test('unknown port times follow exact times and remain stable without a guessed timestamp',()=>{
 const text=report(ship('UNKNOWN B','',{summary:'Arrival Muara Berau'})+'\n'+ship('KNOWN','08:00 LT / 08th : TA Muara Berau')+'\n'+ship('UNKNOWN A','',{summary:'Arrival Muara Berau'}),{clock:'10:00'});
 const r=generate(load(),text,'');assertLayout(r);assert.deepEqual(r.vessels.slice().sort((a,b)=>a.y-b.y).map(v=>v.name),['Known','Unknown B','Unknown A']);
 assert.equal(r.vessels[0].orderTs,null);assert.equal(r.vessels[2].orderTs,null);
});
test('external ships form bottom-right group, preserve real locations and have no route arrows',()=>{
 const text=report(ship('EXTERNAL A','08:00 LT / 08th : TA Tanjung Pemancingan')+'\n'+ship('EXTERNAL B','08:00 LT / 08th : TD Bontang to Weda\n09:00 LT / 09th : ETA Weda')+'\n'+ship('EXTERNAL C','',{summary:'Arrival Beihai'}));
 const r=generate(load(),text,'');assertLayout(r);
 for(const v of r.vessels){assert.equal(v.band,'external');assert.equal(v.x,1878);assert.ok(v.y>850);assert.ok(v.location);}
 assert.equal(Math.max(...r.vessels.map(v=>v.y+Math.max(v.h,118))),1407);
 assert.doesNotMatch(r.svg,/stroke-dasharray/);assert.equal((r.svg.match(/Tanjung Pemancingan/g)||[]).length,1);
});
test('external group and ordered ports stay collision-free beside occupied jetty',()=>{
 const text=report(ship('EXTERNAL A','08:00 LT / 08th : TA Tanjung Pemancingan')+'\n'+ship('EXTERNAL B','08:00 LT / 08th : TA Weda')+'\n'+ship('LOAD','07:00 LT / 08th : TA Muara Pantai\n08:00 LT / 08th : Commence Loading')+'\n'+ship('ANCHOR','08:00 LT / 08th : TA Muara Pantai')+'\n'+ship('JETTY','07:00 LT / 08th : TA Tanjung Jati\n08:00 LT / 08th : All Fast at Jetty 3&4',{jetty:'3&4'}),{clock:'10:00'});
 const r=generate(load(),text,'');assertLayout(r);assert.ok(r.vessels.find(v=>v.name==='Load').y<r.vessels.find(v=>v.name==='Anchor').y);
});
test('larger external group wraps left within the sea instead of dropping ships',()=>{
 const text=report(Array.from({length:7},(_,i)=>ship('EXTERNAL '+i,'08:00 LT / 08th : TA Tanjung Pemancingan')).join('\n'));
 const r=generate(load(),text,'');assertLayout(r);assert.equal(r.vessels.length,7);assert.equal(new Set(r.vessels.map(v=>v.x)).size,2);
});
module.exports={assertLayout};

for(const c of require('./revision-cases').layoutCases)test('group regression: '+c.name,()=>{
 const r=generate(load(),c.text,'');assertLayout(r);
 if(c.order)assert.deepEqual(r.vessels.slice().sort((a,b)=>a.y-b.y).map(v=>v.name),c.order);
});
