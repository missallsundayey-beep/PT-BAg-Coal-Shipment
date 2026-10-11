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
  for(const scenario of baseline.cases){
   const expected=browserBaseline.cases.find(c=>c.name===scenario.name);
   for(const page of pages){
    const res=await page.evaluate(({text,time})=>JSON.parse(JSON.stringify(generate(text,time))),scenario);
    const {svg,...data}=res;assert.deepEqual(data,expected.result,scenario.name);assert.equal(hash(svg),expected.svgHash,scenario.name);
   }
  }
  console.log('PASS: 14 scenarios in split and standalone builds match saved original Chromium baseline');
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
   assert.equal(hash(png.data),browserBaseline.pngPixelSha256,'original PNG pixels (requires same Chromium/fonts)');
   if(pixels)assert.ok(pixels.equals(png.data));else pixels=png.data;
   await page.setViewportSize({width:390,height:844});
   const scroll=await page.evaluate(()=>{const el=document.querySelector('#mapCanvas');el.scrollLeft=500;el.scrollTop=200;window.scrollTo(0,500);return [el.scrollLeft,el.scrollTop,window.scrollY,getComputedStyle(document.body).overflow]});
   assert.ok(scroll.slice(0,3).every(v=>v>0));assert.notEqual(scroll[3],'hidden');
  }
  console.log('PASS: input, sample, snapshot, generation, scroll and actual 4368 × 3400 PNG pixels');
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
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  console.log('PASS: standalone executes and downloads without network; no JS errors or failed assets');
 } finally {await browser.close();fs.rmSync(temporary,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1});
