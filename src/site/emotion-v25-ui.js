'use strict';
const emotionIntensityFaces={
 '開心':['🙂','😄','😁'],'平靜':['🙂','😌','☺️'],'難過':['🙁','😢','😭'],
 '生氣':['😒','😠','😡'],'害怕':['😟','😨','😱'],'緊張':['😟','😰','😖'],
 '累累':['😪','😴','🥱'],'興奮':['😊','🤩','🥳'],'不知道':['🤔','😕','😵‍💫']
};
const v25button=(text,action,id='')=>'<button data-v25="'+action+'" data-id="'+esc(id)+'">'+text+'</button>';
function draft25(){if(!moodDraft)moodDraft={date:G.day(),step:1,intensity:1};moodDraft.causes??=[];moodDraft.rounds??=[];moodDraft.choices??=[];return moodDraft;}
function handleV25Pick(v){
 const d=draft25(),k=v.emKey;
 if(k==='cause'){const i=d.causes.indexOf(v.value);if(i>=0)d.causes.splice(i,1);else if(d.causes.length<2)d.causes.push(v.value);else toast('最多選兩個，可以先取消一個。');}
 else if(k==='careChoice'){const i=d.choices.findIndex(x=>x.label===v.value);if(i>=0)d.choices.splice(i,1);else if(v.value==='我還不知道')d.choices=[{label:v.value,tried:false}];else{d.choices=d.choices.filter(x=>x.label!=='我還不知道');if(d.choices.length<2)d.choices.push({label:v.value,tried:false});else toast('每輪最多兩項。');}}
 else if(['mood','intensity','listener','after'].includes(k)){d[k]=k==='intensity'?Number(v.value):v.value;if(k==='mood'){d.causes=[];d.choices=[];d.rounds=[];d.after='';d.category='';}}
 render();
}
function advanceV25(){const d=draft25();if(d.step===1){if(!d.mood)return;d.step=2;}
 else if(d.step===2){if(!d.causes.length)return;if(d.date!==G.day()){saveMood();return;}if(!d.listener)return;d.step=['開心','平靜','興奮'].includes(d.mood)?4:3;}
 else if(d.step===3){if(!d.choices.length)return;d.step=4;}
 render();
}
emotionScreen=function(){
 const d=draft25(),back=d.date!==G.day(),brief=['開心','平靜','興奮'].includes(d.mood);
 const picks=(items,k)=>'<div class="choices">'+items.map(x=>'<button data-em-key="'+k+'" data-value="'+esc(x)+'" aria-pressed="'+(String(d[k])===String(x))+'">'+esc(x)+'</button>').join('')+'</div>';
 let html='';
 if(d.step===1)html='<h2>我的感覺</h2><div class="choices mood-grid">'+G.moods.map(([i,m])=>'<button data-em-key="mood" data-value="'+m+'" aria-pressed="'+(d.mood===m)+'">'+i+' '+m+'</button>').join('')+'</div><h3>感覺有多強烈？</h3><div class="choices">'+[1,2,3].map(n=>'<button data-em-key="intensity" data-value="'+n+'" aria-pressed="'+(Number(d.intensity)===n)+'"><span aria-hidden="true">'+(emotionIntensityFaces[d.mood]||['🙂','😐','😮'])[n-1]+'</span> '+['一點點','有一些','很強烈'][n-1]+' · '+n+'</button>').join('')+'</div>'+sb('接著看看','em-next',!d.mood?'disabled':'');
 if(d.step===2){const groups=G.emotionData.causes[d.mood]||[];if(!groups.some(g=>g.category===d.category))d.category=groups[0]?.category||'';const cause=x=>'<button data-em-key="cause" data-value="'+esc(x)+'" class="'+(d.causes.includes(x)?'active':'')+'" aria-pressed="'+d.causes.includes(x)+'">'+esc(x)+'</button>';
 html='<h2>我想表達</h2><p>可以跨類選兩個，也可以不說原因。已選 '+d.causes.length+' 個。</p><div class="choices">'+groups.map(g=>'<button data-v25="category" data-id="'+esc(g.category)+'" aria-expanded="'+(d.category===g.category)+'">'+esc(g.category)+'</button>').join('')+'</div><div class="choices">'+(groups.find(g=>g.category===d.category)?.items||[]).map(cause).join('')+'</div><div class="choices">'+G.emotionData.common.map(cause).join('')+'</div><p>'+d.causes.map(x=>'<span class="pill">'+esc(x)+'</span>').join(' ')+'</p>';
 if(d.causes.includes('有人傷害或威脅我')||d.causes.includes('有人讓我害怕')||d.causes.includes('有人做了讓我不舒服的事'))html+='<div class="hero" role="note">如果現在不安全，先離開危險，找能保護你的可信任大人幫忙；可以是老師或其他可信任的人。這個畫面沒有通知或通報任何人，不用等流程完成。</div>';
 html+=back?'<p>昨天補記只留下感覺與原因，不提供家人或小白熊回覆。</p>':'<h3>我想跟誰說？</h3>'+picks(G.listeners,'listener')+'<p class="muted">家長可看紀錄；選擇不跟大人說時只能靜默陪伴。小白熊的話由家人選擇，這裡沒有 AI 對話。</p>';
 html+=sb(back?'記下昨天的我':'接著看看','em-next',!d.causes.length||!back&&!d.listener?'disabled':'');
 }
 if(d.step===3)html='<h2>我需要</h2><p>這輪最多選兩項，沒有變好也沒關係。</p><div class="care-choices">'+(G.emotionData.care[d.mood]||[]).map(x=>{const picked=d.choices.find(y=>y.label===x.label);return '<div class="care-option"><button data-em-key="careChoice" data-value="'+esc(x.label)+'" aria-pressed="'+!!picked+'" class="care-choice '+(picked?'active':'')+'"><strong>'+esc(x.label)+'</strong><span class="care-hint">'+esc(x.hint)+'</span></button>'+'</div>';}).join('')+'</div>'+sb('看看現在的感覺','em-next',!d.choices.length?'disabled':'')+sb('先這樣就好','em-neutral');
 if(d.step===4){html='<h2>我的發現</h2>';
 if(brief)html+='<p>謝謝你留意今天的感受，先記下這個片刻。</p>';
 else{html+='<h3>現在感覺如何？</h3>'+picks(['好多了','好一點','還是一樣','更強烈'],'after')+'<p>感受可以維持原樣，不需要急著變開心。</p>';
 if(['還是一樣','更強烈'].includes(d.after))html+=(d.rounds.length<2?v25button('再試一輪','retry'):'<p>已試了三輪，可以找信任的大人陪你。</p>')+v25button('先休息','rest')+v25button('找信任的大人','adult');
 }html+=sb('記下這一小步','em-save',!brief&&!d.after?'disabled':'');}
 return '<div class="row"><p>'+esc(d.date)+(back?' · 補記昨天':' · '+d.step+' / 4')+'</p>'+'</div><section class="card emotion-v25">'+(d.step>1?sb('← 上一步','em-back'):'')+html+'</section>';
};
saveMood=function(neutral=false){
 const d=draft25(),brief=['開心','平靜','興奮'].includes(d.mood),back=d.date!==G.day();
 const payload={...d,emotionVersion:25,intensity:Number(d.intensity),exit_type:neutral?'neutral':'complete',rounds:back||brief?[]:[...d.rounds,{choices:d.choices.map(x=>({...x})),after:d.after||''}]};
 const x=change(c=>d.editId?G.editBackfill(c,d.editId,payload):G.recordEmotion(c,payload));
 if(!x){toast('尚未儲存：請確認選項；昨天更正不能跨日或修改日期。');return;}
 moodDraft=null;page='today';render();if(x.learn)learningPopup('照顧自己的需要',x.learn);else toast(back?'已記下昨天的感受。':'已記下你的感受。');
};
const oldEmotionEntry25=emotionEntry;
emotionEntry=function(m,allowReply=false){
 if(m.hidden&&!parent)return '';
 let body=oldEmotionEntry25(m,false);
 body=body.replace('</article>',(m.rounds?.length?'<p>'+m.rounds.map((r,i)=>'第 '+(i+1)+' 輪：'+r.choices.map(x=>esc(x.label)+(x.tried?'（試過）':'（未記錄是否嘗試）')).join('、')+' · '+esc(r.after)).join('<br>')+'</p>':'')+
 (parent?(m.deletionStatus==='pending'?'<p>孩子希望刪除這筆紀錄。</p>'+v25button('核准刪除','approve',m.id)+v25button('暫不同意','decline',m.id):'')+(allowReply&&G.canReplyEmotion(c(),m.id)?'<button data-em-reply="'+esc(m.id)+'">'+(m.listener===G.listeners[2]?'替小白熊挑一句話':'回應孩子')+'</button>':''):
 (m.exit_type==='backfill'&&m.date===G.plusDays(G.day(),-1)?v25button('更正昨天補記','edit',m.id):'')+
 (m.deletionStatus==='pending'?'<p>已提出刪除申請，等待家長確認。</p>':v25button(m.deletionStatus==='declined'?'再次申請刪除':'申請刪除','request',m.id))+
 (m.deletionStatus==='declined'?v25button('先隱藏','hide',m.id):''))+'</article>');
 return body;
};
function trends25(){const xs=(c().emotionTrends||[]).filter(t=>t.count>=3);return '<h3>月度情緒趨勢</h3><p>至少 3 筆到期紀錄才顯示，不是分數或診斷；不保留原因或回覆。</p>'+xs.map(t=>'<article class="entry"><strong>'+esc(t.month)+'</strong><p>'+t.count+' 筆 · '+Object.entries(t.moods).map(([m,n])=>esc(m)+' '+n+' 次').join('、')+'</p></article>').join('');}
moodHistory=function(date){
 const xs=c().emotions.filter(x=>(parent||!x.hidden)&&(!date||x.date===date));
 modal('<h2>😊 '+esc(date||'我的心情紀錄')+'</h2><p>明細從建立起保留 30 天，月趨勢保留 12 個月。</p><div class="history three-record-list">'+xs.slice().reverse().map(x=>emotionEntry(x,parent)).join('')+'</div>'+(!date?v25button('已隱藏的紀錄','hidden')+trends25():'')+actions(''));
};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-v25]');if(!b)return;e.stopImmediatePropagation();const a=b.dataset.v25,id=b.dataset.id;
 if(a==='category'){draft25().category=id;render();return;}
 if(a==='tried'){const x=draft25().choices.find(x=>x.label===id);if(x)x.tried=!x.tried;render();return;}
 if(a==='retry'){const d=draft25();if(d.rounds.length>=2||!['還是一樣','更強烈'].includes(d.after))return;d.rounds.push({choices:d.choices.map(x=>({...x})),after:d.after});d.choices=[];d.after='';d.step=3;render();return;}
 if(a==='rest'||a==='adult'){saveMood(true);if(a==='adult')toast('可以找讓你安心、能保護你的大人陪你。這裡不會自動通知。');return;}
 if(a==='hidden'){modal('<h2>已隱藏的紀錄</h2><p>家長仍能查看；隱藏不會延長 30 天保存期限。</p>'+c().emotions.filter(x=>x.hidden).map(x=>'<article class="entry"><p>'+esc(x.date)+'</p>'+v25button('恢復顯示','restore',x.id)+v25button('再次申請刪除','request',x.id)+'</article>').join('')+actions(''));return;}
 if(a==='edit'){const x=c().emotions.find(x=>x.id===id);if(parent||!x||x.exit_type!=='backfill'||x.date!==G.plusDays(G.day(),-1))return;moodDraft={...x,editId:id,causes:[...x.causes],rounds:[],choices:[],step:1};close();page='emotion';render();return;}
 if(a==='approve'){if(!parent)return;modal('<h2>確認刪除這筆情緒紀錄？</h2><p>明細、回覆與成長引用會一起移除；無法安全重算的相關月趨勢也會移除。其他裝置與已下載備份需另外清理。</p>'+actions(v25button('確認核准刪除','approve-confirm',id)));return;}
 let ok=false;
 if(a==='approve-confirm'&&parent)ok=change(c=>G.decideEmotionDeletion(c,id,true));
 if(a==='decline'&&parent)ok=change(c=>G.decideEmotionDeletion(c,id,false));
 if(a==='request'&&!parent)ok=change(c=>G.requestEmotionDeletion(c,id));
 if(a==='hide'&&!parent)ok=change(c=>G.hideEmotion(c,id,true));
 if(a==='restore'&&!parent)ok=change(c=>G.hideEmotion(c,id,false));
 if(ok){close();render();toast('已更新紀錄。');}
},true);
const rawRead25=readState;
readState=function(){
 const s=rawRead25();for(const c of Object.values(s.children))G.maintainEmotions(c);
 localStorage.setItem(G.KEY,JSON.stringify(s));
 // Sanitize same-browser automatic archives; external files cannot be remotely erased.
 for(const key of Object.keys(localStorage).filter(k=>k.startsWith(G.KEY+'-before-'))){
  try{const b=JSON.parse(localStorage.getItem(key));if(!b?.children)continue;
   for(const [id,c] of Object.entries(b.children)){if(!s.children[id])continue;G.mergeEmotionPolicy(c,s.children[id]);}
   localStorage.setItem(key,JSON.stringify(b));
  }catch{throw Error('舊備份清理失敗，請先匯出並檢查瀏覽器儲存空間。');}
 }
 return s;
};
// Finish a mutation by synchronizing same-browser backup cleanup immediately.
const rawChange25=change;
change=function(fn){
 const result=rawChange25(fn);
 if(result!==false&&result!==null){
  try{state=readState();}
  catch(e){blocked=true;$('#notice').textContent='資料已更新，但舊備份清理未完成，請檢查瀏覽器儲存空間。';return false;}
 }
 return result;
};
function applyImport25(incoming){if(!validPolicyImport25(incoming))throw Error('情緒備份格式不正確');const current=readState();for(const [id,c] of Object.entries(incoming.children))G.mergeEmotionPolicy(c,current.children[id]);return incoming;}
const oldManage25=manageScreen;
manageScreen=function(){return oldManage25()+'<section class="card"><h2>情緒資料保存</h2><p>建立後 30 天清除明細，月趨勢最多 12 個月。這是單機版：關閉網站時無法在背景清理，重新開啟時立即處理。已下載檔案與其他装置需自行清理。舊紀錄沒有建立時間時，以事件日期台灣時間零時起算。</p><p>舊备份匯入套用本機刪除清單與期限；清除瀏覽器資料會失去本機刪除清單。PIN 只防誤觸，不是安全帳號。</p></section>';};
const oldParent25=parentScreen;
parentScreen=function(){return oldParent25()+(parentTab==='growth'?trends25():'');};
// Privacy processing also runs while the tab remains open.
setInterval(()=>{if(!blocked){const before=JSON.stringify(state);load();if(JSON.stringify(state)!==before){close();render();}}},60000);
load();render();

function validPolicyImport25(s){
 const id=x=>typeof x==='string'&&/^[\w:.-]{1,150}$/.test(x),month=x=>typeof x==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(x);
 return Object.values(s.children).every(c=>
  (!c.emotionDeleted||Array.isArray(c.emotionDeleted)&&c.emotionDeleted.every(id))&&
  (!c.emotionExpired||Array.isArray(c.emotionExpired)&&c.emotionExpired.every(x=>id(x.id)&&month(x.month)))&&
  (!c.emotionSuppressedMonths||Array.isArray(c.emotionSuppressedMonths)&&c.emotionSuppressedMonths.every(month))&&
  (!c.emotionTrends||Array.isArray(c.emotionTrends)&&c.emotionTrends.every(t=>month(t.month)&&Number.isSafeInteger(t.count)&&t.count>=0&&t.moods&&Object.entries(t.moods).every(([m,n])=>G.moods.some(x=>x[1]===m)&&Number.isSafeInteger(n)&&n>=0)))&&
  c.emotions.every(e=>(!e.createdAt||typeof e.createdAt==='string'&&Number.isFinite(Date.parse(e.createdAt))&&Date.parse(e.createdAt)<=Date.now())&&
  (!e.rounds||Array.isArray(e.rounds)&&e.rounds.length<=3&&e.rounds.every(r=>Array.isArray(r.choices)&&r.choices.length<=2&&r.choices.every(x=>typeof x.label==='string'&&typeof x.tried==='boolean')))));
}
