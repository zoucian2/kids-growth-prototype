const test=require('node:test'),a=require('node:assert/strict'),G=require('../spec-model');
const make=()=>G.fresh().children.brother;
const event=(c,i,source='practice',date='2026-01-01',relatedTag='')=>G.characterEvent(c,{id:'e'+i,source,date,tag:'善良',relatedTag,text:'具體故事'});
test('six abilities and age guidance, autonomy retained on approval without changing rewards',()=>{
 a.equal(G.educationMap.length,6);a.deepEqual(G.educationMap.map(x=>x.subs.length),[6,7,7,7,9,7]);
 const c=make();c.tasks[0].approval=true;const x=G.complete(c,'brush',G.day(),'一起做');a.equal(x.autonomy,'一起做');a.ok(x.abilities.includes('life'));a.equal(c.records.length,0);G.approveTask(c,x.id);a.equal(c.records[0].autonomy,'一起做');a.equal(G.complete(c,'bag',G.day(),'bad'),null);
});
test('score and seen gates; related credit never counts as primary seen',()=>{
 const c=make();for(let i=0;i<12;i++)event(c,i);a.equal(c.characterBadges.length,0);
 event(c,20,'seen','2026-01-01','同理');a.equal(c.characterBadges.length,0);event(c,21,'seen','2026-01-01','同理');a.equal(c.characterBadges.length,1);
 a.equal(G.characterProgress(c,'同理').score,2);a.equal(G.characterProgress(c,'同理').seen,0);
 const before=c.characterEvents.length;event(c,21,'seen');a.equal(c.characterEvents.length,before);
 a.equal(event(c,22,'seen','2026-01-01','善良'),false);a.equal(G.seen(c,'故事','善良','爸',['同理','責任']),false);
 a.equal(G.setCharacterThresholds(c,[1,2,3]),false);
});
test('all exact stage boundaries, eight weeks gate, monotonic and passport idempotency',()=>{
 const c=make();const start=G.plusDays(G.day(),-55);
 for(let i=0;i<10;i++)event(c,i,'seen',start);
 for(let i=10;i<40;i++)event(c,i,'practice',start);
 a.equal(G.characterProgress(c,'善良').score,60);a.equal(c.characterBadges.length,2);
 G.refreshCharacter(c,G.plusDays(start,56));a.equal(c.characterBadges.length,3);a.equal(c.records.filter(x=>x.kind==='character-stage').length,3);
 G.refreshCharacter(c,G.plusDays(start,56));a.equal(c.records.length,3);
 for(const e of c.characterEvents)e.cancelled=true;G.refreshCharacter(c);a.equal(c.characterBadges.length,3);a.equal(c.stars,0);a.equal(c.growth,0);
 for(const [score,seen,tier] of [[11,2,0],[12,1,0],[12,2,1],[29,5,1],[30,4,1],[30,5,2],[59,10,2],[60,9,2],[60,10,3]]){
  const d=make();for(let i=0;i<seen;i++)event(d,i,'seen','2026-01-01');for(let i=0;i<score-seen*3;i++)event(d,100+i);
  a.equal(d.characterBadges.length,tier,`${score}/${seen}`);
 }
});
test('v0.3 upgrade preserves old badges, balances, cards and is repeatable',()=>{
 const s=G.fresh(),c=s.children.brother;delete s.educationVersion;c.stars=777;c.coins=9;c.growth=88;c.characterBadges.push({id:'old',tag:'善良',tier:1,title:'善良小種子'});G.sendCard(c,{content:'原文卡片',author:'阿嬤'});
 G.upgrade(s);const once=JSON.stringify(s);a.equal(c.characterBadges[0].legacy,true);a.equal(c.stars,777);a.equal(c.coins,9);a.equal(c.growth,88);a.equal(c.mailbox[0].content,'原文卡片');G.upgrade(s);a.equal(JSON.stringify(s),once);
});
test('wish revision preserves money and card count, releases hold, requires approval, guards redeemed',()=>{
 const c=make();c.stars=900;const w=G.makeWish(c,'週末活動','想出去','🎡');G.approveWish(c,w.id,800);G.saveForGoal(c,400);const cards=c.wishCards;
 a.ok(G.reviseWish(c,w.id,'桌遊','想一起玩'));a.equal(c.stars,900);a.equal(c.savings,0);a.equal(c.wishCards,cards);a.equal(w.status,'pending');a.equal(w.revisions[0].name,'週末活動');a.equal(G.redeemWish(c),false);
 G.approveWish(c,w.id,500);G.redeemWish(c);a.equal(G.reviseWish(c,w.id,'新','想要'),false);
});
test('v1 seen migration never reclassifies newly calculated stages as legacy duplicates',()=>{
 const s=G.fresh(),c=s.children.brother;s.specVersion=1;delete s.educationVersion;
 for(let i=0;i<4;i++)c.records.push({id:'legacy'+i,kind:'seen',skill:'善良',text:'真實故事',date:'2026-01-01'});
 G.upgrade(s);a.equal(c.characterBadges.length,1);a.equal(c.characterBadges[0].legacy,undefined);a.equal(c.records.filter(x=>x.kind==='character-stage').length,1);
});
