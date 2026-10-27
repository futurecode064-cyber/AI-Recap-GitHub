'use strict';
(()=>{
const courses=window.FC_COURSE;
const storeKey='futurecode-chinese-learning-v1';
const fresh=()=>({completed:{},saved:{},streak:0,last:'',goal:10});
let s;try{s=Object.assign(fresh(),JSON.parse(localStorage.getItem(storeKey)||'{}'))}catch(e){s=fresh()}
if(!s.completed)s.completed={};if(!s.saved)s.saved={};
let page='home',lvl=0,unit=0,card=0,reveal=false,quiz=null,writing=0,spoken='';
const $=id=>document.getElementById(id);
const app=$('app');
const id=(a,b)=>a+'-'+b;
const persist=()=>{try{localStorage.setItem(storeKey,JSON.stringify(s))}catch(e){}};
function daily(){const day=offset=>{const d=new Date();d.setDate(d.getDate()+offset);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
 const date=day(0);if(s.last===date)return;
 const previous=day(-1);
 s.streak=s.last===previous?(s.streak||0)+1:1;s.last=date;persist();
}
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lessons=()=>courses.reduce((sum,l)=>sum+l.units.length,0);
const finished=()=>Object.keys(s.completed).filter(k=>s.completed[k]).length;
const select=(a,b)=>{lvl=a;unit=b;card=0;reveal=false;writing=0;spoken=''};
const active=()=>courses[lvl].units[unit];
const bar=(f,n)=>'<div class="bar"><i style="width:'+Math.round(100*f/Math.max(1,n))+'%"></i></div>';
const nav=()=>document.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===page));
function go(p){page=p;render();window.scrollTo(0,0)}
window.goHome=()=>go('home');
function levelsMarkup(){return '<div class="levelgrid">'+courses.map((l,i)=>{const n=l.units.filter((_,j)=>s.completed[id(i,j)]).length;return '<button class="tile" data-action="level" data-i="'+i+'"><span class="num">'+(i+1)+'</span><h3>'+esc(l.title)+'</h3><p>'+esc(l.sub)+'</p>'+bar(n,l.units.length)+'<small>'+n+' / '+l.units.length+' သင်ခန်းစာ</small></button>'}).join('')+'</div>'}
function home(){
 return '<div class="hero"><div class="eyebrow">MANDARIN FOR MYANMAR LEARNERS</div><h1>တရုတ်စကားကို<br>နေ့တိုင်း လေ့ကျင့်ပြီး ပြောတတ်ကြစို့ 🇨🇳</h1><p>တရုတ်စာလုံး + Pinyin + မြန်မာဘာသာပြန် · အသံထွက် · စကားပြော · ဖတ်/ရေး · Quiz</p><button class="btn gold" data-action="continue">သင်ခန်းစာ စတင်မည် →</button></div>'+
 '<div class="stats"><div class="stat"><b>'+finished()+'/'+lessons()+'</b><span>ပြီးစီးသော သင်ခန်းစာ</span></div><div class="stat"><b>'+s.streak+'</b><span>လေ့လာခဲ့သော ဆက်တိုက်ရက်</span></div><div class="stat"><b>၆</b><span>သင်ယူမှုအဆင့်</span></div></div>'+
 '<h2>သင်ယူမည့် Level ကို ရွေးပါ</h2>'+levelsMarkup()+
 '<div class="sectionbox"><h3>📚 သင်ကြားပုံ</h3><div class="smallhelp">၁။ တရုတ်စာ/အသံထွက်ကြည့်ပါ။ ၂။ အသံနားထောင်ပြီး လိုက်ပြောပါ။ ၃။ မြန်မာအဓိပ္ပာယ်ကို နားလည်ပါ။ ၄။ စာရေးလေ့ကျင့်ပါ။ ၅။ Quiz ဖြေပြီး ပြီးဆုံးအမှတ်တံဆိပ် ရယူပါ။</div></div>';
}
function levelpage(){
const l=courses[lvl];
return '<div class="crumb">အဆင့် '+(lvl+1)+' / ၆</div><h2>'+esc(l.title)+'</h2><p class="muted">'+esc(l.sub)+'</p>'+
 l.units.map((u,i)=>'<button class="tile" style="width:100%;margin:10px 0" data-action="unit" data-i="'+i+'"><span class="pill">'+(s.completed[id(lvl,i)]?'✓ ပြီးစီးပြီး':'သင်ခန်းစာ '+(i+1))+'</span><h3>'+esc(u.title)+'</h3><p>'+esc(u.note)+'</p></button>').join('')+
 '<div class="actions"><button class="btn secondary" data-go="levels">← Level များ</button></div>';
}
function lessonpage(){
const u=active();
return '<div class="crumb">'+esc(courses[lvl].title)+' / သင်ခန်းစာ '+(unit+1)+'</div><h2>'+esc(u.title)+'</h2><section class="sectionbox"><span class="pill">GRAMMAR · အသုံးအနှုန်း</span><p class="explain">'+esc(u.note)+'</p></section>'+
 '<section class="sectionbox">'+u.words.map((w,i)=>'<div class="word"><div class="hanzi">'+esc(w[0])+'</div><div class="pinyin">'+esc(w[1])+'</div><div class="translation">'+esc(w[2])+'</div><div class="wordtools"><button data-action="speak" data-i="'+i+'">🔊 နားထောင်</button><button data-action="listen" data-i="'+i+'">🎤 လိုက်ပြော</button></div></div>').join('')+'</section>'+
 '<div id="speech-result"></div><div class="actions"><button class="btn" data-action="quiz">✓ Quiz ဖြေမည်</button><button class="btn secondary" data-action="flash">▤ ကတ်လေ့ကျင့်</button><button class="btn secondary" data-action="write">✎ လက်ရေး</button><button class="btn secondary" data-action="mark">ပြီးစီးပြီ</button></div>';
}
function flashpage(){
const w=active().words[card];
return '<div class="crumb">'+esc(courses[lvl].title)+' · '+esc(active().title)+'</div><h2>Flashcard · မှတ်ဉာဏ်လေ့ကျင့်</h2><p class="muted">ကတ်ကို နှိပ်ပြီး Pinyin နှင့် မြန်မာဘာသာပြန် ဖော်ပြပါ။</p>'+
 '<button class="flash" style="width:100%" data-action="flip"><div class="hanzi">'+esc(w[0])+'</div><p>'+(reveal?'<span class="pinyin">'+esc(w[1])+'</span><br>'+esc(w[2]):'ဘာသာပြန်ကြည့်ရန် ကတ်ကိုနှိပ်ပါ')+'</p></button>'+
 '<p class="muted" style="text-align:center">'+(card+1)+' / '+active().words.length+'</p><div class="actions"><button class="btn secondary" data-action="prev">← ရှေ့ကတ်</button><button class="btn" data-action="next">နောက်ကတ် →</button><button class="btn green" data-action="known">✓ မှတ်မိပြီ</button></div>';
}
function writepage(){
const w=active().words[writing%active().words.length],model=[...w[0]].filter(c=>/[\u3400-\u9fff]/.test(c))[0]||'中';
return '<div class="crumb">'+esc(active().title)+'</div><h2>✎ လက်ရေးလေ့ကျင့်</h2><div class="write-model">'+esc(model)+'</div><p class="smallhelp">အပေါ်က စာလုံးကိုကြည့်ပြီး အောက်ကကွက်မှာ လက်ချောင်း သို့မဟုတ် Stylus ဖြင့် လေ့ကျင့်ရေးပါ။ AI မှ စာလုံးမှန်ကန်မှု စစ်ဆေးပေးခြင်း မဟုတ်သေးပါ။</p><div class="canvaswrap"><canvas id="ink" aria-label="တရုတ်စာ လက်ရေးလေ့ကျင့်ရေးကွက်"></canvas></div>'+
 '<div class="actions" style="margin-top:12px"><button class="btn secondary" data-action="clear">ရေးထားတာရှင်းမည်</button><button class="btn" data-action="otherwrite">နောက်စာလုံး →</button></div>';
}
function newQuiz(){let ws=active().words;let q=Math.floor(Math.random()*ws.length);let indices=ws.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,4);if(!indices.includes(q))indices[0]=q;quiz={q,options:indices.sort(()=>Math.random()-.5),answered:-1,correct:0};}
function quizpage(){
if(!quiz)newQuiz();
const w=active().words[quiz.q];
return '<div class="crumb">'+esc(active().title)+'</div><h2>📋 စကားလုံး Quiz</h2><section class="sectionbox"><p class="muted">အောက်ပါ တရုတ်ဝါကျရဲ့ မြန်မာအဓိပ္ပာယ်ကို ရွေးပါ။</p><div class="hanzi">'+esc(w[0])+'</div><div class="pinyin">'+esc(w[1])+'</div></section>'+
quiz.options.map(i=>'<button class="quiz-option '+(quiz.answered>=0?(i===quiz.q?'correct':i===quiz.answered?'wrong':''):'')+'" data-action="answer" data-i="'+i+'" '+(quiz.answered>=0?'disabled':'')+'>'+esc(active().words[i][2])+'</button>').join('')+
(quiz.answered<0?'':('<div class="notification">'+(quiz.answered===quiz.q?'✓ မှန်ကန်ပါတယ်။':'မှန်ကန်သော အဖြေ: '+esc(w[2]))+'</div><div class="actions"><button class="btn" data-action="nextquiz">နောက်မေးခွန်း →</button><button class="btn secondary" data-action="mark">သင်ခန်းစာပြီးစီး ✓</button></div>'));
}
function settingspage(){
return '<h2>⚙ သင်ယူမှု ဆက်တင်</h2><div class="sectionbox"><h3>သင်ယူမှုအခြေအနေ</h3><p class="muted">'+finished()+' / '+lessons()+' သင်ခန်းစာ ပြီးစီးသည်။ တိုးတက်မှုကို ဖုန်းထဲတွင် သိမ်းဆည်းထားသည်။ App ဖျက်ပါက ဒေတာပျက်နိုင်ပါသည်။</p></div>'+
'<div class="sectionbox"><h3>Notification နဲ့ Update</h3><p class="smallhelp">သင်ခန်းစာအသစ် အသိပေးချက်များကို App မှ အင်တာနက်ချိတ်ချိန်နှင့် Android နောက်ခံစစ်ဆေးချိန်တွင် ရရှိနိုင်သည်။ Real-time Push မဟုတ်ပါ။ Android တွင် Update APK ကို Install လုပ်ရန် အသုံးပြုသူ ခွင့်ပြုရသည်။</p><div class="actions"><button class="btn" data-action="remind">🔔 Notification ခွင့်ပြုမည်</button><button class="btn secondary" data-action="update">Update စစ်မည်</button></div></div>'+
'<div class="sectionbox"><h3>ဖတ်/ပြော အသံစနစ်</h3><p class="smallhelp">အသံဖတ်ခြင်းသည် ဖုန်းတွင် Chinese TTS Voice ထည့်သွင်းထားမှုအပေါ် မူတည်သည်။ <button data-action="installvoice">⚙️ Chinese အသံထည့်သွင်းရန်</button> မိုက်ခရိုဖုန်းမှ တရုတ်စာပြန်သိမှုသည် Speech Recognizer ရရှိမှ အလုပ်လုပ်မည်။ အသံထွက်ရမှတ်သည် ဖမ်းယူမိသော စာသားနှင့် တိုက်စစ်ခြင်းသာ ဖြစ်ပြီး အသံနေအသံထား တိကျမှုကို မတိုင်းတာနိုင်ပါ။</p></div>'+
'<div class="sectionbox"><h3>📦 Backup / Restore</h3><p class="smallhelp">ဖုန်းမပြောင်းမီ အောက်က Backup JSON ကို ကူးယူသိမ်းပါ။ ပြန်သွင်းရန် JSON ကို ကူးထည့်ပြီး Restore နှိပ်ပါ။ အဟောင်းကို အစားထိုးမည်ဖြစ်၍ သေချာစစ်ပါ။</p><textarea id="backup-json" rows="5" style="width:100%;box-sizing:border-box;direction:ltr;font-size:12px;padding:10px;border:1px solid #8195ad;border-radius:8px" placeholder="Backup JSON ကို ဒီနေရာမှာ ကူးထည့်ပါ"></textarea><div class="actions"><button class="btn secondary" data-action="backup">Backup JSON ထုတ်မည်</button><button class="btn" data-action="restore">Restore ပြန်သွင်းမည်</button></div></div>'+'<div class="sectionbox"><h3>အကြောင်း</h3><p class="muted">Future Code Chinese v1.0.2 · Android 8.0+ · မြန်မာလူမျိုးများအတွက် မန်ဒရင်အခြေခံမှ အဆင့်မြင့် နမူနာအကြောင်းအရာများ ပါဝင်သော စတင်ထုတ်ဝေမှု။ တရားဝင် HSK စာမေးပွဲအသိအမှတ်ပြု သင်တန်းမဟုတ်ပါ။</p></div>';
}
function render(){
 nav();if(page==='home')app.innerHTML=home();
 else if(page==='levels')app.innerHTML='<h2>Level အားလုံး</h2>'+levelsMarkup();
 else if(page==='level')app.innerHTML=levelpage();
 else if(page==='lesson')app.innerHTML=lessonpage();
 else if(page==='flash')app.innerHTML=flashpage();
 else if(page==='write'){app.innerHTML=writepage();initCanvas();}
 else if(page==='quiz')app.innerHTML=quizpage();
 else app.innerHTML=settingspage();
}
let toastTimer;
window.nativeStatus=msg=>{const el=$('toast');el.textContent=msg;el.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.style.display='none',3500)};
window.onUpdateCheck=(ver,url)=>{
 let existing=$('update-alert');if(existing)existing.remove();
 let d=document.createElement('div');d.id='update-alert';d.className='notification';
 d.innerHTML='<strong>Version '+esc(ver)+' အသစ်ရပါပြီ</strong><p>Install ခွင့်ပြုချက်ဖြင့် Update လုပ်နိုင်ပါပြီ။</p><button class="btn" id="get-update">Update ဒေါင်းလုပ်</button>';
 app.prepend(d);$('get-update').onclick=()=>{if(window.FutureCode)FutureCode.openUpdate(url);else location.href=url};
};
window.onSpeechResult=result=>{
 const expected=active().words[spoken]&&active().words[spoken][0]||'';
 const norm=x=>x.replace(/[\s，。！？,.!?]/g,'').trim();
 const match=norm(result)===norm(expected);
 let el=$('speech-result');if(!el)return;
 el.className='notification';
 el.innerHTML='<strong>ကြားမိတဲ့ စကား:</strong> '+esc(result)+'<p>'+(match?'✓ စာသားကိုက်ညီပါတယ်။ (အသံနေအသံထား စစ်ဆေးချက် မဟုတ်ပါ)':'စကားလုံးမကိုက်သေးပါ။ နားထောင်ပြီး နောက်တစ်ခေါက် ပြန်ပြောကြည့်ပါ။')+'</p>';
};
function mark(){s.completed[id(lvl,unit)]=true;daily();persist();window.nativeStatus('သင်ခန်းစာပြီးစီးမှုကို သိမ်းဆည်းပြီးပါပြီ။');go('level')}
document.addEventListener('click',e=>{
 const navbtn=e.target.closest('[data-go]');if(navbtn){go(navbtn.dataset.go);return}
 const btn=e.target.closest('[data-action]');if(!btn)return;
 const i=Number(btn.dataset.i||0),a=btn.dataset.action;
 if(a==='continue'){let found=false;for(let x=0;x<courses.length&&!found;x++)for(let y=0;y<courses[x].units.length&&!found;y++)if(!s.completed[id(x,y)]){select(x,y);found=true}if(!found)select(0,0);go('lesson')}
 else if(a==='level'){lvl=i;go('level')}
 else if(a==='unit'){select(lvl,i);go('lesson')}
 else if(a==='speak'){if(window.FutureCode)FutureCode.speak(active().words[i][0]);else if('speechSynthesis' in window){let u=new SpeechSynthesisUtterance(active().words[i][0]);u.lang='zh-CN';u.onerror=()=>window.nativeStatus('Chinese အသံမရှိသေးပါ။ Phone Text-to-speech Settings မှ Chinese အသံထည့်သွင်းပါ။');speechSynthesis.cancel();speechSynthesis.speak(u)}else window.nativeStatus('Chinese TTS မရရှိပါ။')}
 else if(a==='installvoice'){if(window.FutureCode?.installVoice)FutureCode.installVoice();else window.nativeStatus('Android Settings → Text-to-speech output မှ Chinese Voice ထည့်သွင်းပါ။')}
  else if(a==='listen'){spoken=i;if(window.FutureCode)FutureCode.listen();else window.nativeStatus('စကားပြောစစ်ရန် Android App အသုံးပြုပါ။')}
 else if(a==='quiz'){quiz=null;go('quiz')}
 else if(a==='flash'){card=0;reveal=false;go('flash')}
 else if(a==='write'){writing=0;go('write')}
 else if(a==='mark'){mark()}
 else if(a==='flip'){reveal=!reveal;render()}
 else if(a==='prev'){card=(card+active().words.length-1)%active().words.length;reveal=false;render()}
 else if(a==='next'){card=(card+1)%active().words.length;reveal=false;render()}
 else if(a==='known'){s.saved[id(lvl,unit)+'-'+card]=true;daily();persist();card=(card+1)%active().words.length;reveal=false;render();window.nativeStatus('မှတ်သားထားပြီးပါပြီ။')}
 else if(a==='otherwrite'){writing++;render()}
 else if(a==='clear'){initCanvas()}
 else if(a==='answer' && quiz && quiz.answered<0){quiz.answered=i;if(i===quiz.q)daily();render()}
 else if(a==='nextquiz'){newQuiz();render()}
 else if(a==='backup'){const field=$('backup-json');if(field){field.value=JSON.stringify(s,null,2);field.focus();field.select();window.nativeStatus('Backup ကို ရွေးပြီးပါပြီ။ Copy ကူးပြီး သိမ်းထားပါ။')}}
 else if(a==='restore'){const field=$('backup-json');try{const raw=field?.value||'';if(raw.length>120000)throw Error('Backup ဖိုင်ကြီးလွန်းသည်');const data=JSON.parse(raw);if(!data||Array.isArray(data)||typeof data!=='object'||!data.completed||typeof data.completed!=='object'||Array.isArray(data.completed)||!data.saved||typeof data.saved!=='object'||Array.isArray(data.saved))throw Error('Format မကိုက်ညီပါ');const allow=new Set(courses.flatMap((l,li)=>l.units.map((u,ui)=>id(li,ui))));const completed={};for(const [k,v] of Object.entries(data.completed)){if(!allow.has(k)||typeof v!=='boolean')throw Error('Lesson ID မှားနေသည်');completed[k]=v}const saved={};for(const [k,v] of Object.entries(data.saved)){const parts=k.split('-').map(Number);if(parts.length!==3||parts.some(x=>!Number.isInteger(x))||!courses[parts[0]]?.units[parts[1]]?.words[parts[2]]||typeof v!=='boolean')throw Error('Flashcard ID မှားနေသည်');saved[k]=v}if(!confirm('လက်ရှိ Progress ကို Backup မှတ်တမ်းဖြင့် အစားထိုးမလား?'))return;s={...fresh(),completed,saved,streak:Math.min(366,Math.max(0,Number(data.streak)||0)),last:typeof data.last==='string'?data.last:'',goal:10};persist();go('home');window.nativeStatus('Progress Restore ပြီးပါပြီ။')}catch(e){window.nativeStatus('Backup Restore မအောင်မြင်ပါ: '+e.message)}}
 else if(a==='remind'){if(window.FutureCode)FutureCode.reminder();else window.nativeStatus('Android APK မှ Notification ဖွင့်နိုင်ပါသည်။')}
 else if(a==='update'){if(window.FutureCode)FutureCode.checkUpdates();else window.nativeStatus('Android APK တွင် Update စစ်နိုင်ပါသည်။')}
});
function initCanvas(){
const c=$('ink');if(!c)return;
let box=c.getBoundingClientRect(),ratio=Math.max(1,window.devicePixelRatio||1);
c.width=Math.round(box.width*ratio);c.height=Math.round(300*ratio);
const ctx=c.getContext('2d');ctx.scale(ratio,ratio);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#154e9d';ctx.lineWidth=6;
let drawing=false;const pt=e=>{let r=c.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]};
c.onpointerdown=e=>{drawing=true;c.setPointerCapture(e.pointerId);let p=pt(e);ctx.beginPath();ctx.moveTo(...p)};
c.onpointermove=e=>{if(!drawing)return;ctx.lineTo(...pt(e));ctx.stroke()};
c.onpointerup=c.onpointercancel=()=>drawing=false;
}
render();
})();

