"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const categories=[
  ['international','နိုင်ငံတကာ ဘောလုံးသတင်း'],
  ['team-player','အသင်းနှင့် ကစားသမားသတင်း'],
  ['transfer','အပြောင်းအရွှေ့ သတင်း'],
  ['match','ဘောလုံးပွဲ သတင်းနှင့် ရလဒ်'],
  ['other','အခြား ဘောလုံးသတင်း']
 ];
 let stories=[],expectedSha='',busy=false,dirty=false,revision='',poll=null,previewUrls=[];
 const today=()=>{
  const parts=new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Yangon'}).formatToParts(new Date());
  const v=t=>parts.find(p=>p.type===t).value;
  return v('year')+'-'+v('month')+'-'+v('day');
 };
 const make=(tag,text,cls)=>{
  const e=document.createElement(tag);
  if(text!==undefined)e.textContent=text;
  if(cls)e.className=cls;
  return e;
 };
 const say=(text,error=false)=>{
  $('message').textContent=text;
  $('message').classList.toggle('error',error);
 };
 function mark(){dirty=true;}
 function setBusy(v){
  busy=v;
  for(const id of ['publish','add','reload','check','retry'])$(id).disabled=v;
  for(const button of document.querySelectorAll('#stories button'))button.disabled=v;
 }
 async function api(path,payload){
  const res=await fetch('/api/editor/news'+path,{
   method:payload===undefined?'GET':'POST',cache:'no-store',credentials:'same-origin',
   headers:payload===undefined?{}:{'Content-Type':'application/json','X-Football-Editor':'1'},
   body:payload===undefined?undefined:JSON.stringify(payload)
  });
  if(res.status===401){location.href='/login?next=/editor/news.html';throw Error('Owner Login လိုအပ်သည်');}
  const result=await res.json();
  if(!res.ok)throw Error((result.errors||[]).join('\n')||result.error||'ဝန်ဆောင်မှု မရနိုင်ပါ');
  return result;
 }
 function field(host,label,value,onChange,options={}){
  const wrap=make('label',undefined,'field'+(options.wide?' wide':''));
  wrap.append(make('span',label));
  let input;
  if(options.values){
   input=make('select');
   for(const [v,t] of options.values){
    const option=make('option',t);option.value=v;input.append(option);
   }
  }else{
   input=make(options.multiline?'textarea':'input');
   if(input.tagName==='INPUT')input.type=options.type||'text';
  }
  if(options.placeholder)input.placeholder=options.placeholder;
  input.required=Boolean(options.required);
  input.maxLength=options.multiline?30000:options.maxLength||300;
  input.value=value??'';
  input.addEventListener('input',()=>{onChange(input.value);mark();});
  wrap.append(input);host.append(wrap);
  return input;
 }
 function freshStory(){
  return {id:'news-'+crypto.randomUUID(),category:'match',
   title:'',paragraphs:[],image:'',imageAlt:'',sourceName:'Future Code',
   sourceUrl:'',sourceDateISO:today()};
 }
 function clearPreviews(){
  previewUrls.forEach(u=>URL.revokeObjectURL(u));previewUrls=[];
 }
 function render(){
  clearPreviews();
  $('stories').replaceChildren();
  $('count').textContent='သတင်း '+stories.length+' ပုဒ် · အစဉ်အတိုင်း ဖော်ပြမည်';
  if(!stories.length)$('stories').append(make('p','သတင်းမရှိသေးပါ။ “＋ သတင်းခေါင်းစဉ်အသစ်” ကို နှိပ်ပါ။','message'));
  stories.forEach((s,i)=>{
   const card=make('article',undefined,'news-card');
   const heading=make('div',undefined,'news-head');
   heading.append(make('h3',(i+1)+' · '+(s.title||'သတင်းခေါင်းစဉ်အသစ်')));
   const controls=make('div',undefined,'news-controls');
   for(const [symbol,delta] of [['↑',-1],['↓',1]]){
    const btn=make('button',symbol+' ရွှေ့ရန်','secondary');btn.type='button';
    btn.disabled=i+delta<0||i+delta>=stories.length;
    btn.addEventListener('click',()=>{const other=stories[i+delta];stories[i+delta]=stories[i];stories[i]=other;mark();render();});
    controls.append(btn);
   }
   const remove=make('button','ဖယ်ရှားရန်','danger');remove.type='button';
   remove.addEventListener('click',()=>{
    if(!confirm('“'+(s.title||'သတင်းအသစ်')+'” ကို ထုတ်ဝေမည့်စာရင်းမှ ဖယ်မည်လား။')){
      return;
    }
    stories.splice(i,1);mark();render();
   });
   controls.append(remove);heading.append(controls);card.append(heading);
   const grid=make('div',undefined,'news-grid');card.append(grid);
   field(grid,'သတင်းခေါင်းစဉ် *',s.title,v=>s.title=v,{wide:true,required:true,maxLength:220,placeholder:'ဥပမာ — မန်စီးတီးအသင်း၏ နောက်ဆုံးပွဲသတင်း'});
   field(grid,'သတင်းအမျိုးအစား',s.category,v=>s.category=v,{values:categories});
   field(grid,'သတင်းရက်စွဲ (မြန်မာစံတော်ချိန်)',s.sourceDateISO,v=>s.sourceDateISO=v,{type:'date',required:true});
   field(grid,'သတင်းအပြည့်အစုံ * (စာပိုဒ်အသစ်အတွက် တစ်ကြောင်းလွတ်ရေးပါ)',(s.paragraphs||[]).join('\n\n'),v=>s.paragraphs=v.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean),{multiline:true,wide:true,required:true});
   const picture=make('div',undefined,'picture');
   const image=make('img');image.alt='သတင်းပုံ နမူနာ';
   if(s._file){
    const preview=URL.createObjectURL(s._file);previewUrls.push(preview);image.src=preview;
   }else if(s.image){image.src=s.image;}else image.hidden=true;
   image.onerror=()=>{image.hidden=true;};
   picture.append(image);
   const pictureInfo=make('div',undefined,'picture-info');
   const upload=make('label',undefined,'field');
   upload.append(make('span','ပုံထည့်ရန် / ပုံအဟောင်းအစားထိုးရန် (JPG, PNG, WebP)'));
   const file=make('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';file.addEventListener('change',()=>{
    const picked=file.files[0];if(!picked)return;
    if(!/^image\/(jpeg|png|webp)$/.test(picked.type)||picked.size>8*1024*1024){
      say('JPG / PNG / WebP ပုံ 8MB အောက်သာ ရွေးပါ။',true);file.value='';return;
    }
    s._file=picked;mark();render();
   });upload.append(file);pictureInfo.append(upload);
   field(pictureInfo,'ပုံ URL (Upload မသုံးလိုလျှင် HTTPS URL)',s.image,v=>{s.image=v;s._file=null;},{placeholder:'https://... / မရှိလျှင် ကွက်လပ်'});
   pictureInfo.append(make('p','ပုံအသစ်ကို ထုတ်ဝေချိန်တွင် သေးငယ်အောင်ညှိပြီး GitHub သို့ Upload လုပ်မည်။ မိမိပိုင်/အသုံးပြုခွင့်ရှိသည့် ပုံကိုသာ သုံးပါ။','hint'));
   picture.append(pictureInfo);grid.append(picture);
   field(grid,'ပုံအတွက် အကြောင်းဖော်ပြချက်',s.imageAlt,v=>s.imageAlt=v,{wide:true,placeholder:'ပုံအကြောင်းဖော်ပြချက်'});
   field(grid,'သတင်းရင်းမြစ် အမည်',s.sourceName,v=>s.sourceName=v,{placeholder:'Future Code / Reuters / ...'});
   field(grid,'သတင်းရင်းမြစ် URL (မိမိသတင်းဆို မဖြည့်လည်းရ)',s.sourceUrl,v=>s.sourceUrl=v,{type:'url',placeholder:'https://...'});
   $('stories').append(card);
  });
 }
 async function load(){
  if(dirty&&!confirm('လက်ရှိ မထုတ်ဝေရသေးသည့် ပြင်ဆင်ချက်များ ပျောက်နိုင်ပါသည်။ Server Data အသစ်ပြန်ဖွင့်မလား။'))return;
  setBusy(true);
  try{
   const data=await api('');
   stories=(data.feed.items||[]).map(s=>({...s,paragraphs:[...(s.paragraphs||[])]}));
   expectedSha=data.sha;dirty=false;revision='';
   $('delivery').hidden=true;$('setup').hidden=data.configured;
   render();say('လက်ရှိ သတင်း '+stories.length+' ပုဒ်ကို ဖွင့်ပြီးပါပြီ။ ပြင်ဆင်နိုင်ပါပြီ။');
  }catch(e){say(e.message,true);}
  finally{setBusy(false);}
 }
 async function imageData(file){
  let img;
  try{img=await createImageBitmap(file);}catch{throw Error('ဤပုံကို ဖွင့်မရပါ။ အခြား JPG/PNG ပုံရွေးပါ။');}
  const scale=Math.min(1,1200/img.width,900/img.height);
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  if(img.close)img.close();
  let output=canvas.toDataURL('image/webp',0.76);
  if(!output.startsWith('data:image/webp;base64,'))output=canvas.toDataURL('image/jpeg',0.76);
  if(output.length>1150000)throw Error('ပုံအရွယ်အစား ကြီးနေသေးပါသည်။ ပုံအရည်အသွေး/အရွယ်လျှော့ပြီး ပြန်ရွေးပါ။');
  return output;
 }
 async function publish(event){
  event.preventDefault();
  if(busy)return;
  if(stories.length>60){say('သတင်း ၆၀ ပုဒ်အထိသာ တင်နိုင်သည်',true);return;}
  for(let i=0;i<stories.length;i++){
   const s=stories[i];
   if(!s.title.trim()||!s.paragraphs.length){say('သတင်း '+(i+1)+' ၏ ခေါင်းစဉ်နှင့် သတင်းစာသား ဖြည့်ရန်လိုသည်။',true);return;}
  }
  setBusy(true);
  try{
   const files=stories.filter(s=>s._file).length;
   let done=0;
   for(const s of stories){
    if(!s._file)continue;
    say('သတင်းပုံ Upload · '+(++done)+' / '+files);
    const dataUrl=await imageData(s._file);
    const saved=await api('/image',{dataUrl});
    s.image=saved.image;delete s._file;
   }
   say('သတင်းများ GitHub သို့ သိမ်းပြီး Production Sync ခေါ်နေသည်…');
   const payload={
    expectedSha,items:stories.map(s=>({
     id:s.id,category:s.category,title:s.title,
     paragraphs:s.paragraphs,image:s.image||'',imageAlt:s.imageAlt||'',
     sourceName:s.sourceName||'Future Code',sourceUrl:s.sourceUrl||'',
     sourceDateISO:s.sourceDateISO,publishedAt:s.publishedAt
    }))
   };
   const saved=await api('/publish',payload);
   expectedSha=saved.sha;revision=saved.revision;dirty=false;
   $('delivery').hidden=false;$('deliveryStatus').textContent=saved.message;
   say(saved.message,!saved.dispatched);
   render();clearInterval(poll);
   if(saved.dispatched){await checkStatus();poll=setInterval(checkStatus,20000);}
  }catch(e){
   say(e.message+' — ဖောင်ကို မပိတ်ဘဲ ပြင်ပြီး ပြန်တင်နိုင်ပါသည်။',true);
  }finally{setBusy(false);}
 }
 async function checkStatus(){
  if(!revision)return;
  try{
   const status=await api('/status?revision='+encodeURIComponent(revision));
   $('deliveryStatus').textContent=status.message;
   if(status.phase==='live'||status.phase==='superseded'){clearInterval(poll);poll=null;}
  }catch(e){$('deliveryStatus').textContent=e.message;}
 }
 async function retry(){
  if(!revision)return;
  setBusy(true);
  try{
   const data=await api('/deliver',{revision});
   say(data.message);await checkStatus();clearInterval(poll);poll=setInterval(checkStatus,20000);
  }catch(e){say(e.message,true);}
  finally{setBusy(false);}
 }
 $('add').addEventListener('click',()=>{
  if(stories.length>=60){say('သတင်း ၆၀ ပုဒ်အထိသာ ထည့်နိုင်ပါသည်',true);return;}
  stories.unshift(freshStory());mark();render();
  $('stories').firstElementChild?.scrollIntoView({behavior:'smooth',block:'start'});
 });
 $('reload').addEventListener('click',load);
 $('newsForm').addEventListener('submit',publish);
 $('check').addEventListener('click',checkStatus);
 $('retry').addEventListener('click',retry);
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
 load();
})();