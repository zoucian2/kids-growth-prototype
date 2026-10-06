const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{let name=req.url.split('?')[0];if(name==='/')name='/index.html';if(!['/index.html','/app.js','/model.js','/style.css'].includes(name)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');res.end(fs.readFileSync(path.join(root,name)))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{const context=await browser.newContext({viewport:{width:1180,height:820}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||`http://127.0.0.1:${server.address().port}`);
 const click=async s=>page.locator(s).click(); const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kids-growth-v02')));
 await click('[data-task="bag"]');await click('[data-complete="bag"]');assert.match(await page.locator('dialog').innerText(),/我學會了/);await click('[data-action="close"]');assert.equal((await stored()).children.brother.stars,10);
 await page.reload();assert.equal(await page.locator('[data-task="bag"]').isDisabled(),true);assert.equal((await stored()).children.brother.stars,10);
 await click('[data-child="sister"]');assert.match(await page.locator('#view').innerText(),/街舞/);await click('[data-task="brush"]');await click('[data-complete="brush"]');await click('[data-action="close"]');assert.equal((await stored()).children.sister.stars,5);assert.equal((await stored()).children.brother.stars,10);
 await click('[data-child="little"]');assert.match(await page.locator('#view').innerText(),/滑步車/);assert.equal((await stored()).children.little.stars,0);
 await click('[data-page="emotion"]');await click('[data-mood="生氣"]');await click('[data-intensity="3"]');for(const t of ['深呼吸','安靜一下','找人說說'])await click(`[data-tool="${t}"]`);await click('[data-action="emotion"]');assert.equal((await stored()).children.little.emotions[0].intensity,3);assert.equal((await stored()).children.little.stars,0);
 await click('[data-page="today"]');await click('[data-task="side"]');await click('[data-complete="side"]');await click('[data-action="close"]');assert.equal((await stored()).children.little.stars,0);
 await click('[data-action="parent"]');await page.locator('#pin').fill('0000');await page.locator('#pin-form button.primary').click();assert.match(await page.locator('#pin-error').innerText(),/不正確/);await page.locator('#pin').fill('1234');await page.locator('#pin-form button.primary').click();await click('[data-approve-task]');assert.equal((await stored()).children.little.stars,15);
 await page.locator('#seen').fill('你今天願意再試一次。');await page.locator('#seen-form button').click();assert.equal((await stored()).children.little.stars,15);
 await click('[data-action="add"]');await page.locator('#preset').selectOption('clothes');await page.locator('#task-form button.primary').click();assert.equal((await stored()).children.little.tasks.length,6);
 await click('[data-action="add"]');await page.locator('#title').fill('聽家人說話');await page.locator('#skill').selectOption('品格與關懷');await page.locator('#task-form button.primary').click();let task=(await stored()).children.little.tasks.at(-1);assert.equal(task.stars,0);assert.equal(task.growth,0);
 await click('[data-action="parent"]');await click('[data-page="growth"]');assert.match(await page.locator('#view').innerText(),/你今天願意再試一次/);await click('[data-page="world"]');assert.match(await page.locator('#view').innerText(),/一顆新芽/);
 // Synthetic balance lives only in this isolated browser context; production user data is untouched.
 await page.evaluate(()=>{let s=JSON.parse(localStorage.getItem('kids-growth-v02'));s.children.brother.stars=1300;s.children.brother.growth=220;localStorage.setItem('kids-growth-v02',JSON.stringify(s))});await page.reload();await click('[data-page="reward"]');await click('[data-reward="ice"]');await click('[data-request="ice"]');assert.equal((await stored()).children.brother.stars,1300);await click('[data-reward="game"]');await click('[data-request="game"]');assert.equal(await page.locator('[data-reward="weekend"]').isDisabled(),true);
 await click('[data-action="parent"]');await page.locator('#pin').fill('1234');await page.locator('#pin-form button.primary').click();await page.locator('[data-approve-reward]').first().click();await click('[data-final-reward]');assert.equal((await stored()).children.brother.stars,1000);await click('[data-cancel-reward]');assert.equal((await stored()).children.brother.stars,1000);assert.equal((await stored()).children.brother.growth,220);
 await click('[data-action="parent"]');await click('[data-page="world"]');assert.match(await page.locator('#view').innerText(),/溫暖的小島/);
 await page.reload();assert.equal((await stored()).children.brother.stars,1000);await page.screenshot({path:path.join(root,'tests/tablet.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});for(const p of ['today','growth','emotion','reward','world']){await click(`[data-page="${p}"]`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),p+' has horizontal overflow')}await page.screenshot({path:path.join(root,'tests/mobile.png'),fullPage:true});
 // A second tab receives a single update without a storage-event feedback loop.
 const tab=await context.newPage();await tab.goto(page.url());await tab.locator('[data-task="brush"]').click();await tab.locator('[data-complete="brush"]').click();await page.waitForFunction(()=>document.querySelector('.balance').textContent.includes('1005'));await tab.close();
 // Malformed storage is never replaced by a fresh state.
 await page.evaluate(()=>localStorage.setItem('kids-growth-v02','broken'));await page.reload();assert.match(await page.locator('#notice').innerText(),/暫停/);assert.equal(await page.evaluate(()=>localStorage.getItem('kids-growth-v02')),'broken');
 assert.deepEqual(errors,[]);console.log('PASS: browser journeys, persistence, isolation, approval, rewards, emotions, presets, character guardrails, tablet/mobile, multi-tab, invalid-storage protection');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
