"use strict";
/* Manage the main site's original preview and result frames in this browser. */
(function(){
 const KEY="future-code-built-in-frames-v1";
 const validColor=v=>/^#[0-9a-f]{6}$/i.test(v||"");
 const copy=v=>JSON.parse(JSON.stringify(v));
 let state={version:1,sections:{}};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||"null");if(saved?.version===1&&saved.sections&&typeof saved.sections==="object")state=saved;}catch(e){console.warn("Built-in frame settings could not be loaded",e);}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch(e){return false;}}
 function register(section,frames,adapter,refreshOptions){
  if(!Array.isArray(frames)||!adapter||typeof refreshOptions!=="function")return;
  const originals=frames.map(copy);
  const data=state.sections[section]||{hidden:[],edited:{}};
  data.hidden=Array.isArray(data.hidden)?data.hidden:[];
  data.edited=data.edited&&typeof data.edited==="object"?data.edited:{};
  state.sections[section]=data;
  const allIds=originals.map(adapter.id);
  function restoreFrames(){
   const extras=frames.filter(f=>!allIds.includes(adapter.id(f))).map(copy);
   frames.splice(0,frames.length,...originals.filter(f=>!data.hidden.includes(adapter.id(f))).map(base=>{
    const f=copy(base),e=data.edited[adapter.id(base)];
    if(e)adapter.apply(f,e);
    return f;
   }),...extras);
   refreshOptions(frames);
  }
  function write(){persist();restoreFrames();refreshList();selectFrame(currentId||allIds.find(id=>!data.hidden.includes(id))||allIds[0]);}
  let currentId=allIds.find(id=>!data.hidden.includes(id))||allIds[0];
  let panel=document.createElement("section");panel.className="fc-built-in-frame-editor";
  panel.innerHTML='<h3>ရှိပြီးသား Frame ပြင် / ဖြုတ်</h3><div class="fc-bif-controls"><label>Frame ရွေးပါ<select class="fc-bif-select"></select></label><label>Frame နာမည်<input class="fc-bif-name" maxlength="70" type="text"></label><label>Frame အရောင်<input class="fc-bif-color" type="color"></label></div><div class="fc-bif-actions"><button type="button" class="fc-bif-save">ပြင်ဆင်သိမ်းမယ်</button><button type="button" class="fc-bif-hide">ဒီ Frame ကို ဖြုတ်မယ်</button><button type="button" class="fc-bif-restore">ဖြုတ်ထားတာ ပြန်ဖော်မယ်</button><button type="button" class="fc-bif-reset">ရွေးထားတာ မူရင်းပြန်ထားမယ်</button></div><p class="fc-bif-status" role="status" aria-live="polite">ပြင်ဆင်မှုတွေ ဒီ Browser မှာ အလိုအလျောက် သိမ်းပါမယ်။</p>';
  const style=document.createElement("style");style.textContent='.fc-built-in-frame-editor{margin:16px 0;padding:17px;border:1px solid #9eb3c3;border-radius:12px;background:#f4f8fb;color:#172f43}.fc-built-in-frame-editor h3{margin:0 0 12px;color:#172f43;font:700 17px "Noto Sans Myanmar",sans-serif}.fc-built-in-frame-editor .fc-bif-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}.fc-built-in-frame-editor label{display:flex;flex-direction:column;gap:6px;font:600 12px "Noto Sans Myanmar",sans-serif;color:#20394d}.fc-built-in-frame-editor input,.fc-built-in-frame-editor select{min-height:38px;box-sizing:border-box;border:1px solid #a8bac7;border-radius:7px;background:white;color:#20394d;padding:7px}.fc-built-in-frame-editor input[type=color]{padding:2px}.fc-built-in-frame-editor .fc-bif-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.fc-built-in-frame-editor button{border:0;border-radius:7px;background:#17457e;color:white;padding:10px 13px;font:700 12px "Noto Sans Myanmar",sans-serif;cursor:pointer}.fc-built-in-frame-editor .fc-bif-hide{background:#a12632}.fc-built-in-frame-editor .fc-bif-status{font:12px "Noto Sans Myanmar",sans-serif;color:#15593e}.fc-built-in-frame-editor .fc-bif-status[data-error="true"]{color:#a12632}';
  if(!document.getElementById("fcBuiltInFrameEditorStyle")){style.id="fcBuiltInFrameEditorStyle";document.head.append(style);}
  let anchor=document.getElementById(section==="previews"?"brandPreviewStudio":"mainResultsFrameStudio");
  if(section==="results"&&anchor?.parentElement?.id==="resultsDownloadBar")anchor=anchor.parentElement;
  // Keep the original preview/results controls inside the one Frame Editor.
  panel.dataset.frameSection=section;
  const headline=panel.querySelector("h3");
  if(headline)headline.textContent=(section==="previews"?"ပွဲကြိုသုံးသပ်ချက်":section==="results"?"ဂိုးရလဒ်":section)+" — မူရင်း Frame ပြင် / ဖြုတ် / ပြန်ဖော်";
  function place(){const master=document.getElementById("fcProfessionalFrameStudio");if(master){(document.getElementById("fcpOriginalFrames")||master).append(panel);return true;}return false;}
  if(!place()){
    if(anchor)anchor.insertAdjacentElement("afterend",panel);
    const watcher=new MutationObserver(()=>{if(place())watcher.disconnect();});
    watcher.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>watcher.disconnect(),15000);
  }
  const q=s=>panel.querySelector(s),selector=q(".fc-bif-select"),status=q(".fc-bif-status");
  function current(){return currentId;}
  function statusText(message,bad=false){status.textContent=message;status.dataset.error=bad?"true":"false";}
  function selectFrame(id){if(!id)return;currentId=id;selector.value=id;const base=originals.find(f=>adapter.id(f)===id),edit=data.edited[id]||{};q(".fc-bif-name").value=edit.name??adapter.name(base);q(".fc-bif-color").value=validColor(edit.color)?edit.color:adapter.color(base);q(".fc-bif-hide").hidden=data.hidden.includes(id);q(".fc-bif-restore").hidden=!data.hidden.includes(id);}
  function refreshList(){const old=currentId;selector.replaceChildren();for(const f of originals){const id=adapter.id(f),label=data.edited[id]?.name||adapter.name(f),opt=new Option(label+(data.hidden.includes(id)?" · ဖြုတ်ထားသည်":""),id);selector.add(opt);}if(old)selector.value=old;}
  selector.onchange=()=>selectFrame(selector.value);
  q(".fc-bif-save").onclick=()=>{const id=current(),name=q(".fc-bif-name").value.trim().slice(0,70),color=q(".fc-bif-color").value;if(!name){statusText("Frame နာမည် ထည့်ပါ။",true);return;}if(!validColor(color)){statusText("အရောင်ကုဒ် မမှန်ပါ။",true);return;}data.edited[id]={name,color};write();statusText("Frame ကို ပြင်ဆင်ပြီး သိမ်းလိုက်ပါပြီ။");};
  q(".fc-bif-hide").onclick=()=>{const id=current();if(!data.hidden.includes(id))data.hidden.push(id);write();statusText("Frame ကို ရွေးစရာများမှ ဖြုတ်လိုက်ပါပြီ။ ပြန်ဖော်နိုင်ပါတယ်။");};
  q(".fc-bif-restore").onclick=()=>{const id=current();data.hidden=data.hidden.filter(x=>x!==id);write();statusText("Frame ကို ပြန်ဖော်လိုက်ပါပြီ။");};
  q(".fc-bif-reset").onclick=()=>{delete data.edited[current()];write();statusText("ရွေးထားတဲ့ Frame ကို မူရင်းအတိုင်း ပြန်ထားလိုက်ပါပြီ။");};
  q(".fc-bif-restore").textContent="ဖြုတ်ထားတဲ့ Frame ပြန်ဖော်မယ်";
  q(".fc-bif-reset").textContent="ရွေးထားတာ မူရင်းပြန်ထားမယ်";
  refreshList();restoreFrames();selectFrame(currentId);
 }
 window.FutureCodeBuiltInFrames=Object.freeze({register});
})();
