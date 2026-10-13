const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {root,load,generate,baseline}=require('./helpers');
function exporter(outcome, scenario=baseline.cases[0]) {
 const revoked=[],urls=[],timers=[],errors=[],clicks=[];let image,canvas,link;
 const c=load({Blob,URL:{createObjectURL(b){urls.push(b);return 'blob:'+urls.length},revokeObjectURL(u){revoked.push(u)}},setTimeout(fn){timers.push(fn)}});
 c.document={body:{appendChild(){}},createElement(tag){if(tag==='canvas')return canvas={getContext(){return {fillRect(){},drawImage(){}}},toBlob(fn,type){assert.equal(type,'image/png');fn(outcome==='null'?null:new Blob(['png']))}};return link={click(){clicks.push(this.download)},remove(){}}}};
 c.Image=function(){image=this;this.addEventListener=(type,fn)=>this.listener=fn};
 c.res=generate(load(),scenario.text,scenario.time||'');c.onError=m=>errors.push(m);
 vm.runInContext('exportPng(res,onError)',c);
 return {revoked,urls,timers,errors,clicks,get image(){return image},get canvas(){return canvas},get link(){return link}};
}
test('PNG export requests 4368 × 3400, embeds all assets and releases both URLs',async()=>{
 const e=exporter();const svg=await e.urls[0].text();
 assert.match(svg,/width="4368" height="3400"/);
 assert.ok((svg.match(/data:image\//g)||[]).length>=8);
 assert.doesNotMatch(svg,/href="(?:https?:|assets\/)/);
 e.image.onload();e.image.listener();e.timers.forEach(fn=>fn());
 assert.equal(e.canvas.width,4368);assert.equal(e.canvas.height,3400);
 assert.deepEqual(e.clicks,['Vessel_Position_2026-10-06.png']);
 assert.deepEqual(e.revoked,['blob:1','blob:2']);assert.deepEqual(e.errors,[]);
});
test('failed SVG decoding releases its URL and reports error',()=>{
 const e=exporter();e.image.onerror();assert.deepEqual(e.revoked,['blob:1']);assert.deepEqual(e.errors,['Gambar gagal diekspor.']);
});
test('null canvas Blob reports failure without creating a PNG URL',()=>{
 const e=exporter('null');e.image.onload();e.image.listener();assert.equal(e.urls.length,1);assert.deepEqual(e.errors,['PNG gagal dibuat.']);assert.deepEqual(e.revoked,['blob:1']);
});
test('offline rebuild is deterministic and source assets match generated data URIs',()=>{
 const {execFileSync}=require('node:child_process');
 const before=fs.readFileSync(path.join(root,'dist/vessel-position-offline.html'));
 const temporary=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'vessel-build-'));
 try {
  fs.cpSync(root,temporary,{recursive:true});
  execFileSync(process.execPath,[path.join(temporary,'scripts/build-offline.js')]);
  assert.deepEqual(fs.readFileSync(path.join(temporary,'dist/vessel-position-offline.html')),before);
 } finally {fs.rmSync(temporary,{recursive:true,force:true});}
 const c=load();const files=vm.runInContext('ASSET_FILES',c);
 for(const [name,file] of Object.entries(files))assert.deepEqual(Buffer.from(vm.runInContext(name,c).split(',')[1],'base64'),fs.readFileSync(path.join(root,file)));
});

test('UI, background scene and asset bytes keep the pre-revision design',()=>{
 const crypto=require('node:crypto');
 const design=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/design-baseline.json'),'utf8'));
 for(const [file,expected] of Object.entries(design.hashes)){
  const bytes=file==='sceneBase'?vm.runInContext("sceneBase('design-regression')",load()):fs.readFileSync(path.join(root,file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),expected,file);
 }
});
test('placeholder legends render and export without a snapshot date',async()=>{
 const scenario=require('./revision-cases').cases.find(c=>c.name==='empty report snapshot is not computer time');
 const e=exporter(null,scenario);const svg=await e.urls[0].text();
 assert.match(svg,/—/);assert.doesNotMatch(svg,/NaN|undefined/);
 e.image.onload();e.image.listener();e.timers.forEach(fn=>fn());
 assert.deepEqual(e.clicks,['Vessel_Position_snapshot-tidak-tersedia.png']);assert.equal(e.canvas.width,4368);assert.equal(e.canvas.height,3400);
 const context=load();context.result=generate(context,scenario.text,'');assert.match(vm.runInContext('logHtml(result)',context),/—/);
});
