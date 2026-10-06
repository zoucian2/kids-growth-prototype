(function(root){
'use strict';
const KEY='kids-growth-v02';
const profiles=[{id:'brother',name:'哥哥',icon:'🐯',side:'跆拳道',sideIcon:'🥋'},{id:'sister',name:'妹妹',icon:'🐰',side:'街舞',sideIcon:'💃'},{id:'little',name:'弟弟',icon:'🐻',side:'滑步車',sideIcon:'🚲'}];
// Starter examples only: parents own the actual household catalogue and pricing.
const rewards=[{id:'ice',name:'冰淇淋',icon:'🍦',cost:300},{id:'game',name:'遊戲多 30 分鐘',icon:'🎮',cost:500},{id:'weekend',name:'選週末活動',icon:'🎡',cost:1000}];
const worldItems=[{id:'rabbit',name:'兔兔朋友',icon:'🐇',cost:30},{id:'flowers',name:'花圃',icon:'🌷',cost:20},{id:'panda',name:'熊貓朋友',icon:'🐼',cost:60},{id:'house',name:'小木屋',icon:'🏡',cost:80}];
const moods=[['😄','開心'],['😌','平靜'],['😢','難過'],['😡','生氣'],['😨','害怕'],['😰','緊張'],['😴','累累'],['🤩','興奮'],['😕','不知道']];
const causes=[['👫','和朋友有摩擦'],['🏠','和家人有摩擦'],['🎮','想做的事不能做'],['📚','事情有點難'],['🎉','發生開心的事'],['💤','身體想休息'],['💭','其他事情'],['❔','我也不知道'],['🍃','暫時不想說']];
const emotionTools=[
{id:'breath',name:'深呼吸',icon:'🌬️',group:'照顧身體',steps:'像聞花一樣慢慢吸氣，再像吹蠟燭一樣慢慢吐氣。照自己的速度試 3 次。',learn:'我可以先照顧身體，再慢慢說出感受。'},
{id:'water',name:'喝點水',icon:'🥤',group:'照顧身體',steps:'拿自己的水杯，坐好，慢慢喝幾口水，感覺一下身體。',learn:'我可以停一下，照顧身體的需要。'},
{id:'stretch',name:'動一動',icon:'🙆',group:'照顧身體',steps:'找安全的空間，伸伸手、轉轉肩膀，或和家人走一小段路。',learn:'我可以用舒服的動作陪身體放鬆。'},
{id:'quiet',name:'安靜一下',icon:'🍃',group:'給自己空間',steps:'到舒服、安全的地方坐一下。可以先告訴家人：「我想安靜一下。」',learn:'需要休息時，我可以給自己一點空間。'},
{id:'hug',name:'抱一下',icon:'🧸',group:'給自己空間',steps:'抱抱玩偶或抱枕；也可以問信任的人願不願意抱一下。不想被碰觸也可以。',learn:'我可以選擇自己舒服的安慰方式。'},
{id:'draw',name:'畫出來',icon:'🖍️',group:'表達與陪伴',steps:'拿一張紙，用線條、顏色或圖案畫出感受。不用畫得漂亮，也不用給別人看。',learn:'還說不清楚時，我可以用畫畫表達。'},
{id:'talk',name:'找人說說',icon:'🫶',group:'表達與陪伴',steps:'找信任的大人說：「我現在覺得……，可以先聽我說、陪我一下嗎？」',learn:'我可以請信任的人陪我一起面對。'},
{id:'words',name:'說出我的需要',icon:'💬',group:'表達與陪伴',steps:'試著說：「我覺得……，因為……，我希望……。」暫時不知道原因也沒關係。',learn:'我可以描述自己的感受和需要。'},
{id:'company',name:'請人陪著我',icon:'🤝',group:'表達與陪伴',steps:'找信任的大人說：「我還不想說，但希望你陪我一下。」',learn:'我不必馬上解釋清楚，也可以尋求陪伴。'}];
function day(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function uid(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}
function defaults(p){return [
{id:'brush',title:'好好刷牙',icon:'🪥',type:'每日',stars:5,coins:3,growth:5,skill:'生活自理',learn:'照顧身體，可以從小小的習慣開始。',important:false,approval:false},
{id:'bag',title:'整理我的書包',icon:'🎒',type:'每日',stars:10,coins:5,growth:10,skill:'獨立自主',learn:'自己的事情，我可以自己準備。',important:true,approval:false},
{id:'read',title:'閱讀 10 分鐘',icon:'📚',type:'每日',stars:10,coins:5,growth:10,skill:'探索學習',learn:'每翻一頁，都可能發現新事情。',important:false,approval:false},
{id:'side',title:p.side+'練習',icon:p.sideIcon,type:'支線',stars:15,coins:8,growth:15,skill:'練習與耐心',learn:'慢慢練習，我會找到自己的節奏。',important:true,approval:true},
{id:'adventure',title:'探索一條新的散步路線',icon:'🧭',type:'冒險',stars:20,coins:10,growth:20,skill:'探索與勇氣',learn:'和家人一起嘗試新事物，也是一種勇氣。',important:true,approval:true}];}
function fresh(){return {version:2,rulesVersion:3,rewards:rewards.map(r=>({...r,active:true})),children:Object.fromEntries(profiles.map(p=>[p.id,{stars:0,coins:0,growth:0,savings:0,goal:null,worldItems:[],worldPurchases:[],tasks:defaults(p),completions:[],records:[],emotions:[],redemptions:[]}]))}}
function valid(s){return s&&s.version===2&&profiles.every(p=>{let c=s.children?.[p.id];return c&&Number.isSafeInteger(c.stars)&&c.stars>=0&&Number.isSafeInteger(c.growth)&&c.growth>=0&&['tasks','completions','records','emotions','redemptions'].every(k=>Array.isArray(c[k]))})}
function migrate(s){if(!valid(s))throw Error('Invalid state');if(s.rulesVersion===3)return s;const n=JSON.parse(JSON.stringify(s));n.rulesVersion=3;n.rewards=rewards.map(r=>({...r,active:true}));for(const p of profiles){let c=n.children[p.id];Object.assign(c,{coins:0,savings:0,goal:null,worldItems:[],worldPurchases:[]});c.tasks.forEach(t=>{t.coins=t.skill==='品格與關懷'?0:(defaults(p).find(x=>x.id===t.id)?.coins??0)});c.completions.forEach(x=>x.coins=0)}return n}
function status(c,t,date=day()){return c.completions.find(x=>x.taskId===t.id&&(t.type==='冒險'||x.date===date))}
function grant(c,x){x.status='approved';c.stars+=x.stars;c.coins=(c.coins||0)+(x.coins||0);c.growth+=x.growth;c.records.push({id:uid(),date:x.date,kind:'task',title:x.title,skill:x.skill,text:x.learn});}
function complete(c,id,date=day()){let t=c.tasks.find(t=>t.id===id);if(!t||status(c,t,date))return null;const first=!c.completions.some(x=>x.taskId===id);let x={...t,id:uid(),taskId:t.id,date,status:t.approval?'pending':'approved',showLearn:first||t.type==='冒險'||t.important};if(t.skill==='品格與關懷')x.stars=x.coins=x.growth=0;c.completions.push(x);if(!t.approval)grant(c,x);return x;}
function approveTask(c,id){let x=c.completions.find(x=>x.id===id);if(!x||x.status!=='pending')return false;grant(c,x);return true;}
function reserved(c){return c.redemptions.filter(x=>x.status==='pending').reduce((n,x)=>n+x.cost,0)}
function available(c){return c.stars-reserved(c)-(c.savings||0)}
function requestReward(c,id,catalog=rewards){let r=catalog.find(x=>x.id===id&&x.active!==false);if(!r||available(c)<r.cost)return null;let x={...r,id:uid(),rewardId:r.id,date:day(),status:'pending'};c.redemptions.push(x);return x;}
function resolveReward(c,id,approve){let r=c.redemptions.find(x=>x.id===id);if(!r||r.status!=='pending')return false;if(approve){if(c.stars-(c.savings||0)<r.cost)return false;c.stars-=r.cost;r.status='approved'}else r.status='cancelled';return true;}
function saveForGoal(c,amount){if(!c.goal||!Number.isSafeInteger(amount)||amount<=0||available(c)<amount)return false;c.savings+=amount;return true}
function releaseSavings(c){if(!c.savings)return false;c.savings=0;return true}
function buyWorld(c,id){const item=worldItems.find(x=>x.id===id);if(!item||c.worldItems.includes(id)||c.coins<item.cost)return false;c.coins-=item.cost;c.worldItems.push(id);c.worldPurchases.push({...item,date:day()});return true}
function recordEmotion(c,draft){if(!moods.some(x=>x[1]===draft.mood)||![1,2,3].includes(draft.intensity)||!causes.some(x=>x[1]===draft.cause))return false;const t=emotionTools.find(x=>x.id===draft.toolId);if(!t||!['有一點變化','差不多','更強烈了','還不知道'].includes(draft.after))return false;const x={...draft,id:uid(),date:day(),tool:t.name,learn:t.learn,practiced:!!draft.practiced};c.emotions.push(x);c.records.push({id:uid(),date:x.date,kind:'emotion',title:'我越來越懂自己',skill:'情緒覺察',text:`${x.mood} · ${x.cause} · ${x.practiced?'試過':'想試試'}${t.name}。${t.learn}`});return x}
function badges(c){const all=c.emotions,practiced=all.filter(x=>x.practiced),days=id=>new Set(practiced.filter(x=>x.toolId===id).map(x=>x.date)).size;return [
{icon:'🔍',name:'情緒偵探',text:'記下自己的感受',earned:all.length>0},
{icon:'🗣️',name:'表達小高手',text:'在 5 個不同日子試著說出需要',earned:days('words')>=5},
{icon:'🌬️',name:'呼吸練習家',text:'在 5 個不同日子試過深呼吸',earned:days('breath')>=5},
{icon:'🫶',name:'勇敢說出來',text:'試過找信任的人說說',earned:practiced.some(x=>x.toolId==='talk')},
{icon:'🧭',name:'照顧自己的小步',text:'完成感受、原因、方法與回顧',earned:practiced.some(x=>x.cause&&x.after)}]}
const api={KEY,profiles,rewards,worldItems,moods,causes,emotionTools,day,uid,defaults,fresh,valid,migrate,status,complete,approveTask,reserved,available,requestReward,resolveReward,saveForGoal,releaseSavings,buyWorld,recordEmotion,badges};if(typeof module!=='undefined')module.exports=api;else root.Growth=api;
})(globalThis);
