(function(root){
'use strict';
const KEY='kids-growth-v02';
const profiles=[{id:'brother',name:'哥哥',icon:'🐯',side:'跆拳道',sideIcon:'🥋'},{id:'sister',name:'妹妹',icon:'🐰',side:'街舞',sideIcon:'💃'},{id:'little',name:'弟弟',icon:'🐻',side:'滑步車',sideIcon:'🚲'}];
const rewards=[{id:'ice',name:'冰淇淋',icon:'🍦',cost:300},{id:'game',name:'遊戲多 30 分鐘',icon:'🎮',cost:500},{id:'weekend',name:'選週末活動',icon:'🎡',cost:1000}];
function day(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function uid(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}
function defaults(p){return [
{id:'brush',title:'好好刷牙',icon:'🪥',type:'每日',stars:5,growth:5,skill:'生活自理',learn:'照顧身體，可以從小小的習慣開始。',important:false,approval:false},
{id:'bag',title:'整理我的書包',icon:'🎒',type:'每日',stars:10,growth:10,skill:'獨立自主',learn:'自己的事情，我可以自己準備。',important:true,approval:false},
{id:'read',title:'閱讀 10 分鐘',icon:'📚',type:'每日',stars:10,growth:10,skill:'探索學習',learn:'每翻一頁，都可能發現新事情。',important:false,approval:false},
{id:'side',title:p.side+'練習',icon:p.sideIcon,type:'支線',stars:15,growth:15,skill:'練習與耐心',learn:'慢慢練習，我會找到自己的節奏。',important:true,approval:true},
{id:'adventure',title:'探索一條新的散步路線',icon:'🧭',type:'冒險',stars:20,growth:20,skill:'探索與勇氣',learn:'和家人一起嘗試新事物，也是一種勇氣。',important:true,approval:true}];}
function fresh(){return {version:2,children:Object.fromEntries(profiles.map(p=>[p.id,{stars:0,growth:0,tasks:defaults(p),completions:[],records:[],emotions:[],redemptions:[]}]))}}
function valid(s){return s&&s.version===2&&profiles.every(p=>{let c=s.children?.[p.id];return c&&Number.isSafeInteger(c.stars)&&c.stars>=0&&Number.isSafeInteger(c.growth)&&c.growth>=0&&['tasks','completions','records','emotions','redemptions'].every(k=>Array.isArray(c[k]))})}
function status(c,t,date=day()){return c.completions.find(x=>x.taskId===t.id&&(t.type==='冒險'||x.date===date))}
function grant(c,x){x.status='approved';c.stars+=x.stars;c.growth+=x.growth;c.records.push({id:uid(),date:x.date,kind:'task',title:x.title,skill:x.skill,text:x.learn});}
function complete(c,id,date=day()){let t=c.tasks.find(t=>t.id===id);if(!t||status(c,t,date))return null;let x={...t,id:uid(),taskId:t.id,date,status:t.approval?'pending':'approved'};c.completions.push(x);if(!t.approval)grant(c,x);return x;}
function approveTask(c,id){let x=c.completions.find(x=>x.id===id);if(!x||x.status!=='pending')return false;grant(c,x);return true;}
function reserved(c){return c.redemptions.filter(x=>x.status==='pending').reduce((n,x)=>n+x.cost,0)}
function requestReward(c,id){let r=rewards.find(x=>x.id===id);if(!r||c.stars-reserved(c)<r.cost)return null;let x={...r,id:uid(),rewardId:r.id,date:day(),status:'pending'};c.redemptions.push(x);return x;}
function resolveReward(c,id,approve){let r=c.redemptions.find(x=>x.id===id);if(!r||r.status!=='pending')return false;if(approve){if(c.stars<r.cost)return false;c.stars-=r.cost;r.status='approved'}else r.status='cancelled';return true;}
const api={KEY,profiles,rewards,day,uid,defaults,fresh,valid,status,complete,approveTask,reserved,requestReward,resolveReward};
if(typeof module!=='undefined')module.exports=api;else root.Growth=api;
})(globalThis);
