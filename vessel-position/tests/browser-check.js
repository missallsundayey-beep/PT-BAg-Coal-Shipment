'use strict';
// Optional developer-only tools; no browser dependencies are shipped to users.
const {chromium}=require('playwright-core');
const {PNG}=require('pngjs');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const os=require('node:os');
const {root,baseline}=require('./helpers');
const {cases,layoutCases}=require('./revision-cases');
const browserBaseline=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/browser-baseline.json')));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
async function main(){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'vessel-browser-'));
 const errors=[],failed=[];
 try {
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}});
  const base=(process.env.VESSEL_BASE_URL||'http://127.0.0.1:8765').replace(/\/$/,'');
  const pages=[];
  for(const file of ['index.html','dist/vessel-position-offline.html']){
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
   await page.goto(base+'/'+file);await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>document.querySelector('#shipCount').textContent==='5');pages.push(page);
  }
  for(const scenario of [...baseline.cases,...cases,...layoutCases]){
   const results=[];
   for(const page of pages){
    const checked=await page.evaluate(({text,time})=>{
     const res=generate(text,time||'');
     const issues=[];
     for(const v of res.vessels){
      if(v.rows.length<2||v.rows.length>3)issues.push('legend count '+v.name);
      if(v.y<366||v.y+Math.max(v.h,118)>1407||v.x-v.stripW<0||v.x+BW>W)issues.push('bounds '+v.name);
      for(const other of res.vessels)if(v!==other){
       const left=Math.min(v.x-v.stripW,v.x-210),ol=Math.min(other.x-other.stripW,other.x-210);
       if(!(v.x+BW+16<=ol||other.x+BW+16<=left||v.y+Math.max(v.h,118)+18<=other.y||other.y+Math.max(other.h,118)+18<=v.y))issues.push('collision '+v.name);
      }
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('font-family',FONT);svg.innerHTML=vesselSvg(v);svg.style.position='absolute';svg.style.visibility='hidden';document.body.appendChild(svg);
      Array.from(svg.querySelectorAll('text')).forEach((el,i)=>{
       const box=el.getBBox(),left=i===0?v.x-v.stripW:v.x,right=i===0?v.x:v.x+BW;
       const top=i===0?v.y+82:v.y,bottom=i===0?v.y+118:v.y+v.h;
       if(box.x<left-1||box.x+box.width>right+1||box.y<top-1||box.y+box.height>bottom+1)issues.push('text outside panel '+v.name+': '+el.textContent);
      });
      svg.remove();
     }
     return {result:JSON.parse(JSON.stringify(res)),issues};
    },scenario);
    assert.deepEqual(checked.issues,[],scenario.name);results.push(checked.result);
   }
   assert.deepEqual(results[1],results[0],'modular/offline data and SVG: '+scenario.name);
   if(scenario.status)assert.equal(results[0].vessels[0].status,scenario.status,scenario.name);
   if(scenario.order)assert.deepEqual(results[0].vessels.slice().sort((a,b)=>a.y-b.y).map(v=>v.name),scenario.order,scenario.name);
   const old=browserBaseline.cases.find(c=>c.name===scenario.name);
   if(old){
    const fields=['name','ctype','contract','events','port','destination','jetty','band','location'];
    const select=v=>Object.fromEntries(fields.filter(k=>k in v).map(k=>[k,v[k]]));
    assert.deepEqual(results[0].vessels.map(select),old.result.vessels.map(select),'retained facts: '+scenario.name);
    if(['same-jetty-queue','parser-variations'].includes(scenario.name))assert.equal(hash(results[0].svg),old.svgHash,'unchanged SVG: '+scenario.name);
   }
  }
  console.log('PASS: '+(baseline.cases.length+cases.length+layoutCases.length)+' input/snapshot scenarios; modular/offline equality, original facts, revised statuses, bounds, collisions and browser text boxes');
  for(const width of [390,480,800,801,1050,1051,1440,1800]){
   const states=[];
   for(const page of pages){await page.setViewportSize({width,height:900});states.push(await page.evaluate(()=>Array.from(document.querySelectorAll('body,header,main,.editor,.preview-heading,.metric,textarea,input,button,.preview-wrap,#preview,.brand-mark,.page-footer')).map(el=>Array.from(getComputedStyle(el)).map(k=>[k,getComputedStyle(el).getPropertyValue(k)]))));}
   assert.deepEqual(states[1],states[0],'CSS at '+width);
  }
  console.log('PASS: computed CSS parity at 8 viewport widths');
  let pixels;
  for(const [i,page] of pages.entries()){
   await page.setViewportSize({width:1440,height:1000});
   await page.locator('#tm').fill('08:00');await page.waitForFunction(()=>document.querySelector('#snapshotLabel').textContent.endsWith('08:00'));
   await page.locator('#txt').fill(baseline.cases.find(c=>c.name==='external-port').text);await page.waitForFunction(()=>document.querySelector('#shipCount').textContent==='1');
   await page.locator('#btnSample').click();await page.waitForFunction(()=>document.querySelector('#shipCount').textContent==='5');
   await page.locator('#tm').fill('');await page.locator('#btnGen').click();
   const promise=page.waitForEvent('download');await page.locator('#btnPng').click();const download=await promise;
   assert.equal(download.suggestedFilename(),'Vessel_Position_2026-10-06.png');const file=path.join(temporary,i+'.png');await download.saveAs(file);
   const png=PNG.sync.read(fs.readFileSync(file));assert.equal(png.width,4368);assert.equal(png.height,3400);
   if(process.env.VESSEL_ARTIFACT_DIR){fs.mkdirSync(process.env.VESSEL_ARTIFACT_DIR,{recursive:true});fs.copyFileSync(file,path.join(process.env.VESSEL_ARTIFACT_DIR,i===0?'modular.png':'offline.png'));}
   if(pixels)assert.ok(pixels.equals(png.data));else pixels=png.data;
   await page.setViewportSize({width:390,height:844});
   const scroll=await page.evaluate(()=>{const el=document.querySelector('#mapCanvas');el.scrollLeft=500;el.scrollTop=200;window.scrollTo(0,500);return [el.scrollLeft,el.scrollTop,window.scrollY,getComputedStyle(document.body).overflow]});
   assert.ok(scroll.slice(0,3).every(v=>v>0));assert.notEqual(scroll[3],'hidden');
  }
  console.log('PASS: input, sample, snapshot, generation, scroll and actual identical modular/offline 4368 × 3400 PNG pixels');
  if(process.env.VESSEL_BEFORE_URL){
   const before=await context.newPage();await before.goto(process.env.VESSEL_BEFORE_URL.replace(/\/$/,'')+'/index.html');await before.evaluate(()=>document.fonts.ready);
   const promise=before.waitForEvent('download');await before.locator('#btnPng').click();const file=path.join(temporary,'before.png');await(await promise).saveAs(file);
   const png=PNG.sync.read(fs.readFileSync(file));assert.equal(hash(png.data),browserBaseline.pngPixelSha256,'pre-revision baseline PNG');
   const rowBytes=4368*4;
   for(let y=0;y<3400;y++)if(y<700||y>=2830)assert.ok(png.data.subarray(y*rowBytes,(y+1)*rowBytes).equals(pixels.subarray(y*rowBytes,(y+1)*rowBytes)),'header/footer changed at '+y);
   if(process.env.VESSEL_ARTIFACT_DIR)fs.copyFileSync(file,path.join(process.env.VESSEL_ARTIFACT_DIR,'before.png'));
   const savedLogs=[];
   for(const page of [before,pages[0]]){savedLogs.push(await page.locator('#log').innerHTML());await page.mouse.move(0,0);await page.evaluate(()=>{document.activeElement.blur();document.querySelector('#log').innerHTML='<p>Design comparison</p>';});}
   for(const width of [390,480,800,801,1050,1051,1440,1800]){
    const styles=[];
    for(const page of [before,pages[0]]){await page.setViewportSize({width,height:900});styles.push(await page.evaluate(()=>Array.from(document.querySelectorAll('body,header,main,.editor,.preview-heading,.metric,textarea,input,button,.preview-wrap,#preview,.brand-mark,.page-footer')).map(el=>Array.from(getComputedStyle(el)).map(k=>[k,getComputedStyle(el).getPropertyValue(k)]))));}
    assert.deepEqual(styles[1],styles[0],'original CSS at '+width);
   }
   for(const [i,page] of [before,pages[0]].entries())await page.locator('#log').evaluate((el,html)=>{el.innerHTML=html},savedLogs[i]);
   console.log('PASS: original/revised header/footer PNG pixels and UI styles at 8 widths (equal log content) remain identical');
  }
  if(process.env.VESSEL_ARTIFACT_DIR){
   await pages[0].setViewportSize({width:1440,height:1000});await pages[0].screenshot({path:path.join(process.env.VESSEL_ARTIFACT_DIR,'desktop.png'),fullPage:true});
   await pages[0].setViewportSize({width:390,height:844});await pages[0].screenshot({path:path.join(process.env.VESSEL_ARTIFACT_DIR,'mobile.png'),fullPage:true});
  }
  const mobile=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  const touchPage=await mobile.newPage();await touchPage.goto(base+'/index.html');
  await touchPage.locator('#mapCanvas').scrollIntoViewIfNeeded();
  const box=await touchPage.locator('#mapCanvas').boundingBox();const y=Math.max(10,box.y)+100;
  const session=await mobile.newCDPSession(touchPage);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:320,y}]});
  for(let i=1;i<=12;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:320-i*20,y}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await touchPage.waitForFunction(()=>document.querySelector('#mapCanvas').scrollLeft>0);
  const desktop=await browser.newContext({viewport:{width:1440,height:700}});
  const wheelPage=await desktop.newPage();await wheelPage.goto(base+'/index.html');
  await wheelPage.locator('#mapCanvas').scrollIntoViewIfNeeded();
  const rectangle=await wheelPage.locator('#mapCanvas').boundingBox();
  await wheelPage.mouse.move(rectangle.x+100,Math.max(10,rectangle.y)+100);await wheelPage.mouse.wheel(100,150);
  await wheelPage.waitForFunction(()=>document.querySelector('#mapCanvas').scrollTop>0);
  console.log('PASS: emulated touch swipe and desktop mouse wheel scroll the map');
  const offline=await browser.newContext({offline:true,acceptDownloads:true});const page=await offline.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
  await page.setContent(fs.readFileSync(path.join(root,'dist/vessel-position-offline.html'),'utf8'));await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('#shipCount').textContent(),'5');
  const promise=page.waitForEvent('download');await page.locator('#btnPng').click();const file=path.join(temporary,'offline.png');await(await promise).saveAs(file);
  assert.ok(PNG.sync.read(fs.readFileSync(file)).data.equals(pixels));
  await page.locator('#txt').fill(cases.find(c=>c.name==='empty report snapshot is not computer time').text);
  await page.locator('#btnGen').click();assert.equal(await page.locator('#snapshotLabel').textContent(),'Belum tersedia');
  const missing=page.waitForEvent('download');await page.locator('#btnPng').click();const missingDownload=await missing;
  assert.equal(missingDownload.suggestedFilename(),'Vessel_Position_snapshot-tidak-tersedia.png');await missingDownload.saveAs(path.join(temporary,'missing-snapshot.png'));
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  console.log('PASS: standalone executes and downloads without network; no JS errors or failed assets');
 } finally {await browser.close();fs.rmSync(temporary,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1});
