"use strict";
/* One download plan per section, with independent frame/league/fixture multi-select.
   The persistent state is only per-browser UI preferences; published reports are not changed. */
(function(){
 const studio=window.FCStudio,root=document.getElementById("multiSelectionCenter");
 if(!studio||!root)return;
 const KEYS=studio.TYPES,KEY="fc-frame-download-multi-v1";
 let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch(e){console.warn("Multi selections reset to safe defaults",e);}
 const prefs={};
 const valid=x=>Array.isArray(x)?[...new Set(x.filter(v=>typeof v==="string"&&v.length<250))].slice(0,500):null;
 for(const k of KEYS){
  const v=saved[k]||{};
  prefs[k]={enabled:typeof v.enabled==="boolean"?v.enabled:k==="oddsCards",frames:valid(v.frames),leagues:valid(v.leagues),matches:valid(v.matches),oddsMode:v.oddsMode==="current"?"current":"original"};
 }
 let openSections=new Set(["oddsCards"]),rendered=false;
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(e){studio.status("Multi-Selection သိမ်းမရပါ — Browser Storage ပြန်စစ်ပါ",true);}};
 const category=m=>String(m.league||m.category||"အခြား");
 const identity=m=>String(m.fixtureId||m.id||(m.home||"")+"-"+(m.away||""));
 const matchLabel=m=>String(m.title||((m.homeDisplay||m.home||"")+" VS "+(m.awayDisplay||m.away||"")));
 const members=(selection,ids)=>selection===null?ids:ids.filter(id=>selection.includes(id));
 const contains=(selection,id)=>selection===null||selection.includes(id);
 function records(section){return studio.getRows(section);}
 function frames(section){
  const s=studio.getState();if(!s)return[];
  return (s.placements[section]||[]).map(id=>s.frames.find(f=>f.id===id)).filter(Boolean);
 }
 function labels(section,rows){
  const dict=new Map();
  for(const m of rows){
   const key=category(m);if(dict.has(key))continue;
   let title=m.leagueDisplay||m.leagueMyanmar||key;
   if((section==="odds"||section==="oddsCards")&&/^[\x00-\x7f]+$/.test(String(title)))
    title=studio.getOdds()?.FutureCodeBurmeseRedOddsFrame?.leagueName?.({league:key})||title;
   dict.set(key,String(title));
  }
  return [...dict].map(([id,name])=>({id,name}));
 }
 function selectedRows(k){
  const p=prefs[k];return records(k).filter(m=>contains(p.leagues,category(m))&&contains(p.matches,identity(m)));
 }
 function plans(){
  const list=[];if(!studio.getState())return list;
  for(const k of KEYS){
   const p=prefs[k];if(!p.enabled)continue;
   const rows=selectedRows(k);if(!rows.length)continue;
   for(const f of frames(k))if(contains(p.frames,f.id))list.push({section:k,frame:f,rows});
  }
  return list;
 }
 const text=(tag,value,cls)=>{
  const x=document.createElement(tag);if(value!==undefined)x.textContent=value;if(cls)x.className=cls;return x;
 };
 function switchAll(field,k,ids,on){
  prefs[k][field]=on?null:[];
  persist();studio.clearExportPreview();render();
 }
 function option(label,id,checked,onChange){
  const el=text("label",undefined,"multi-option"),input=document.createElement("input");
  input.type="checkbox";input.checked=checked;input.value=id;
  input.onchange=()=>onChange(input.checked);
  const title=text("span",label);title.title=label;
  el.append(input,title);return el;
 }
 function group(k,field,title,options,allOptions){
  const g=text("section",undefined,"multi-group"),head=text("div",undefined,"multi-group-head");
  const total=options.length,num=options.filter(x=>contains(prefs[k][field],x.id)).length;
  head.append(text("strong",title+" ("+num+"/"+total+")"));
  for(const [label,on] of [["အားလုံးရွေး",true],["အားလုံးဖြုတ်",false]]){
   const btn=text("button",label,"multi-action");btn.type="button";
   btn.dataset.field=field;btn.dataset.section=k;btn.dataset.action=on?"all":"none";
   btn.onclick=()=>switchAll(field,k,allOptions.map(x=>x.id),on);head.append(btn);
  }
  g.append(head);
  const list=text("div",undefined,"multi-options");
  if(!options.length)list.append(text("p","ဒီ Section အတွက် ရွေးချယ်စရာ Data မရှိသေးပါ","hint"));
  for(const item of options)list.append(option(item.name,item.id,contains(prefs[k][field],item.id),checked=>{
   const current=prefs[k][field]===null?new Set(allOptions.map(x=>x.id)):new Set(prefs[k][field]);
   if(checked)current.add(item.id);else current.delete(item.id);
   prefs[k][field]=current.size===allOptions.length?null:[...current];
   persist();studio.clearExportPreview();render();
  }));
  g.append(list);return g;
 }
 function layoutEditor(k){
  const row=text("label","PNG ပုံခွဲပုံစံ","multi-layout");
  const upstream=document.querySelector('#sectionLayoutSettings select[data-frame-section="'+k+'"]');
  const select=document.createElement("select");select.dataset.layout=k;
  if(upstream)for(const opt of upstream.options)select.add(new Option(opt.textContent,opt.value));
  select.value=upstream?.value||"one";
  select.onchange=()=>{if(upstream){upstream.value=select.value;upstream.dispatchEvent(new Event("change",{bubbles:true}));}
   studio.clearExportPreview();};
  row.append(select);return row;
 }
 function render(){
  if(rendered&&root.querySelectorAll('details[data-section]').length)openSections=new Set([...root.querySelectorAll('details[data-section][open]')].map(x=>x.dataset.section));
  rendered=true;root.replaceChildren();
  if(!studio.getState()){root.append(text("p","Frame Library နဲ့ Data စစ်ဆေးနေသည်…","hint"));return;}
  const top=text("div",undefined,"multi-top");
  const line=text("div","Section ရွေးချယ်မှု · Frame / လိဂ် / ပွဲများကို Section တစ်ခုချင်းစီ သီးခြား Multi-Select လုပ်နိုင်သည်။","hint");
  top.append(line);
  for(const [label,enabled] of [["Section အားလုံးရွေး",true],["Section အားလုံးဖြုတ်",false]]){
   const b=text("button",label,"secondary");b.type="button";b.dataset.sections=enabled?"all":"none";
   b.onclick=()=>{for(const k of KEYS)prefs[k].enabled=enabled;persist();studio.clearExportPreview();render();};
   top.append(b);
  }
  root.append(top);
  for(const k of KEYS){
   const p=prefs[k],allRows=records(k),allFrames=frames(k),selected=selectedRows(k);
   const available=allFrames.filter(f=>contains(p.frames,f.id));
   const details=text("details",undefined,"multi-card");
   details.dataset.section=k;details.open=openSections.has(k);
   const summary=text("summary",undefined,"multi-summary"),toggle=document.createElement("input");
   toggle.type="checkbox";toggle.checked=p.enabled;toggle.dataset.enableSection=k;
   toggle.onclick=e=>e.stopPropagation();
   toggle.onchange=()=>{p.enabled=toggle.checked;persist();studio.clearExportPreview();render();};
   summary.append(toggle,text("strong",studio.SECTION[k]),text("small",available.length+" Frame · "+selected.length+" ပွဲ/သတင်း"));
   details.append(summary);
   const columns=text("div",undefined,"multi-columns");
   const frameOpts=allFrames.map(f=>({id:f.id,name:f.name}));
   const leagueOpts=labels(k,allRows);
   const fixtureOpts=allRows.filter(m=>contains(p.leagues,category(m))).map(m=>({id:identity(m),name:matchLabel(m)}));
   const allFixtureOpts=allRows.map(m=>({id:identity(m),name:matchLabel(m)}));
   columns.append(group(k,"frames","Frame များ",frameOpts,frameOpts),
                  group(k,"leagues",k==="news"?"သတင်းအမျိုးအစား":"လိဂ်များ",leagueOpts,leagueOpts),
                  group(k,"matches",k==="news"?"သတင်းများ":"ပွဲစဉ်များ",fixtureOpts,allFixtureOpts));
   details.append(columns);
   const bottom=text("div",undefined,"multi-bottom");
   bottom.append(layoutEditor(k));
   if(k==="odds"||k==="oddsCards"){
    const line=text("label","ကြေးအမျိုးအစား","multi-layout");
    const sel=document.createElement("select");sel.dataset.oddsSection=k;
    sel.add(new Option("မူလကြေး","original"));sel.add(new Option("ယခုကြေး","current"));sel.value=p.oddsMode;
    sel.onchange=()=>{p.oddsMode=sel.value;persist();studio.clearExportPreview();};
    line.append(sel);bottom.append(line);
   }
   details.append(bottom);root.append(details);
  }
  const total=plans(),info=document.getElementById("multiSelectionSummary");
  if(info)info.textContent="ရွေးထားသော Section "+KEYS.filter(k=>prefs[k].enabled).length+" ခု · Frame × Section "+total.length+" ခု · ZIP တစ်ခုတည်းတွင် PNG များစုစည်းမည်";
 }
 window.FCStudioMulti=Object.freeze({plans,refresh:render,oddsMode:k=>prefs[k]?.oddsMode||"original",getPreferences:()=>JSON.parse(JSON.stringify(prefs))});
 render();
})();