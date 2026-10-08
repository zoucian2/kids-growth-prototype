/* Pure v2.5 rules. Browser persistence and parent authentication live in the UI. */
(function(root){
function install(G){
const data=typeof module!=='undefined'?require('./emotion-data.js'):root.EmotionData;
const priorRecord=G.recordEmotion,priorReply=G.replyEmotion,priorCard=G.sendCard;
const short=m=>['開心','平靜','興奮'].includes(m);
const dayMs=86400000, nowIso=()=>new Date().toISOString();
const taipeiMonth=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit'}).format(new Date(t)).replace('/','-');
const monthIndex=m=>Number(m.slice(0,4))*12+Number(m.slice(5,7))-1;
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T00:00:00+08:00'));
function init(c){c.emotions??=[];c.records??=[];c.mailbox??=[];c.emotionTrends??=[];c.emotionDeleted??=[];c.emotionExpired??=[];c.emotionSuppressedMonths??=[];return c;}
function baseValid(d,today){return [today,G.plusDays(today,-1)].includes(d.date)&&G.moods.some(x=>x[1]===d.mood)&&[1,2,3].includes(d.intensity)&&Array.isArray(d.causes)&&d.causes.length>=1&&d.causes.length<=2&&new Set(d.causes).size===d.causes.length&&d.causes.every(v=>[...data.causes[d.mood].flatMap(g=>g.items),...data.common].includes(v));}
function validRound(r,mood){return r&&Array.isArray(r.choices)&&r.choices.length<=2&&new Set(r.choices.map(x=>x.label)).size===r.choices.length&&r.choices.every(x=>data.care[mood]?.some(o=>o.label===x.label)&&typeof x.tried==='boolean')&&!(r.choices.length>1&&r.choices.some(x=>x.label==='我還不知道'))&&(!r.after||['好多了','好一點','還是一樣','更強烈'].includes(r.after));}
function record(c,d,today=G.day(),timestamp=nowIso()){
 if(d.emotionVersion!==25)return priorRecord(c,d,today);
 init(c);
 if(!baseValid(d,today)||c.emotions.some(x=>x.date===d.date))return false;
 const back=d.date!==today,brief=short(d.mood),neutral=d.exit_type==='neutral',rounds=d.rounds||[];
 if(!back&&!G.listeners.includes(d.listener)||!Array.isArray(rounds)||rounds.length>3)return false;
 if(!brief&&!back&&(!rounds.every(r=>validRound(r,d.mood))||(!neutral&&(!rounds.length||!rounds.at(-1).after||!rounds.at(-1).choices.length))))return false;
 if(rounds.slice(0,-1).some(r=>!['還是一樣','更強烈'].includes(r.after)))return false;
 const selected=rounds.flatMap(r=>r.choices),important=!back&&!brief&&!neutral&&(rounds.length>1||selected.some(x=>x.tried)&&!c.emotions.some(x=>x.emotionVersion===25&&x.rounds?.some(r=>r.choices.some(y=>y.tried))));
 const x={id:G.uid(),emotionVersion:25,date:d.date,createdAt:timestamp,updatedAt:timestamp,mood:d.mood,intensity:d.intensity,causes:[...d.causes],cause:d.causes.join('、'),listener:back?'':d.listener,rounds:back||brief?[]:JSON.parse(JSON.stringify(rounds)),careChoice:selected.map(x=>x.label).join('、'),after:back||brief?'':rounds.at(-1)?.after||'',exit_type:back?'backfill':neutral?'neutral':'complete',learn:important?'我可以留意自己的需要，試試不同的照顧方法。':'',parentTip:'先接住情緒，再處理行為。紀錄用來陪伴，不用來追問或處罰。',deletionStatus:'none',hidden:false};
 c.emotions.push(x);return x;
}
function editBackfill(c,id,d,today=G.day(),timestamp=nowIso()){
 const x=c.emotions.find(x=>x.id===id);
 if(!x||x.exit_type!=='backfill'||x.date!==G.plusDays(today,-1)||d.date!==x.date||!baseValid(d,today))return false;
 Object.assign(x,{mood:d.mood,intensity:d.intensity,causes:[...d.causes],cause:d.causes.join('、'),updatedAt:timestamp});return x;
}
function canReply(c,id){const x=c.emotions.find(x=>x.id===id);return !!x&&x.exit_type!=='backfill'&&G.listeners.includes(x.listener)&&x.listener!==G.listeners[1]&&!c.mailbox.some(m=>['emotion-response','emotion-bear'].includes(m.sourceType)&&m.sourceId===id);}
function reply(c,id,d){return canReply(c,id)?priorReply(c,id,d):false;}
function card(c,d){const r=c.records.find(r=>r.id===d.sourceId),x=c.emotions.find(x=>x.id===d.sourceId||r?.kind==='emotion'&&x.id===r.sourceId);if(x&&!canReply(c,x.id))return false;return priorCard(c,d);}
function cleanup(c,ids,legacyDates=[]){
 const dead=new Set(ids),dates=new Set(legacyDates),stories=c.records.filter(r=>dead.has(r.sourceId)||r.kind==='emotion'&&!r.sourceId&&dates.has(r.date));stories.forEach(r=>dead.add(r.id));
 c.records=c.records.filter(r=>!dead.has(r.id)&&!dead.has(r.sourceId));
 c.mailbox=c.mailbox.filter(r=>!dead.has(r.sourceId)&&!dead.has(r.id));
 c.emotions=c.emotions.filter(r=>!dead.has(r.id));
}
function remove(c,id,month){init(c);const x=c.emotions.find(x=>x.id===id);if(!x&&!c.emotionExpired.some(e=>e.id===id)&&!c.emotionDeleted.includes(id))return false;
 const affected=month||c.emotionExpired.find(e=>e.id===id)?.month||x?.date?.slice(0,7);
 if(affected){c.emotionSuppressedMonths=[...new Set([...c.emotionSuppressedMonths,affected])];c.emotionTrends=c.emotionTrends.filter(t=>t.month!==affected);}
 if(!c.emotionDeleted.includes(id))c.emotionDeleted.push(id);
 cleanup(c,[id],x?[x.date]:[]);c.emotionExpired=c.emotionExpired.filter(e=>e.id!==id);return true;}
function requestDelete(c,id){const x=c.emotions.find(x=>x.id===id);if(!x)return false;x.deletionStatus='pending';return true;}
function decideDelete(c,id,approved){init(c);const x=c.emotions.find(x=>x.id===id);if(!x)return approved&&(c.emotionDeleted.includes(id)||c.emotionExpired.some(e=>e.id===id)&&remove(c,id));if(x.deletionStatus!=='pending')return false;if(approved)return remove(c,id);x.deletionStatus='declined';return true;}
function setHidden(c,id,hidden){const x=c.emotions.find(x=>x.id===id);if(!x||x.deletionStatus!=='declined')return false;x.hidden=!!hidden;return true;}
function maintain(c,time=Date.now()){
 init(c);const current=monthIndex(taipeiMonth(time));
 c.emotionTrends=c.emotionTrends.filter(t=>current-monthIndex(t.month)<12&&!c.emotionSuppressedMonths.includes(t.month));
 c.emotionExpired=c.emotionExpired.filter(e=>current-monthIndex(e.month)<12);
 for(const x of [...c.emotions]){
  if(c.emotionDeleted.includes(x.id)){cleanup(c,[x.id],[x.date]);continue;}
  // Legacy records have no creation timestamp: use event date as a documented conservative fallback.
  if(!x.createdAt){x.createdAt=validDate(x.date)?new Date(x.date+'T00:00:00+08:00').toISOString():new Date(0).toISOString();x.creationTimeEstimated=true;}
  if(!Number.isFinite(Date.parse(x.createdAt)))x.createdAt=new Date(0).toISOString();
  if(time-Date.parse(x.createdAt)<30*dayMs)continue;
  const month=validDate(x.date)?x.date.slice(0,7):taipeiMonth(time);
  if(!c.emotionExpired.some(e=>e.id===x.id)&&!c.emotionSuppressedMonths.includes(month)&&current-monthIndex(month)<12){
   let t=c.emotionTrends.find(t=>t.month===month);
   if(!t)c.emotionTrends.push(t={month,count:0,moods:{}});
   t.count++;if(G.moods.some(m=>m[1]===x.mood))t.moods[x.mood]=(t.moods[x.mood]||0)+1;
   c.emotionExpired.push({id:x.id,month}); // opaque linkage only, never cause, reply, or exact event date
  }
  cleanup(c,[x.id],[x.date]);
 }
 return c;
}
function mergePolicy(incoming,current,time=Date.now()){
 init(incoming);init(current);
 incoming.emotionDeleted=[...new Set([...incoming.emotionDeleted,...current.emotionDeleted])];
 incoming.emotionSuppressedMonths=[...new Set([...incoming.emotionSuppressedMonths,...current.emotionSuppressedMonths])];
 // A pre-governance archive may contain unverifiable summaries: discard those on import.
 incoming.emotionTrends=incoming.emotionTrends.filter(t=>!incoming.emotionSuppressedMonths.includes(t.month));
 for(const e of current.emotionExpired){if(!incoming.emotionExpired.some(x=>x.id===e.id))incoming.emotionExpired.push({...e});cleanup(incoming,[e.id]);}
 return maintain(incoming,time);
}
Object.assign(G,{emotionData:data,recordEmotion:record,editBackfill,canReplyEmotion:canReply,replyEmotion:reply,sendCard:card,requestEmotionDeletion:requestDelete,decideEmotionDeletion:decideDelete,hideEmotion:setHidden,removeEmotion:remove,maintainEmotions:maintain,mergeEmotionPolicy:mergePolicy,initEmotionPolicy:init});
}
if(typeof module!=='undefined')module.exports=install;else root.installEmotion25=install;
})(typeof window!=='undefined'?window:globalThis);
