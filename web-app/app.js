"use strict";

(function () {
  const $ = (id) => document.getElementById(id);
  const state = {
    mode: "link", youtubeUrl: "", youtubeId: "", videoFile: null, videoObjectUrl: "",
    durationMs: 0, scenes: [], selected: 0, busy: false, abort: null,
    audioParts: [], audioBlob: null, audioUrl: "", audioDurations: [],
    exportedUrl: "", rendering: false, stopRender: false, recorder: null
  };
  const GEMINI = "https://generativelanguage.googleapis.com/v1beta";
  let toastTimer;

  function notify(message, isError) {
    const box = $("toast");
    box.textContent = message;
    box.className = "toast show" + (isError ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { box.className = "toast"; }, 5500);
  }
  function setStatus(id, value, error) {
    const node = $(id);
    node.textContent = value;
    node.style.color = error ? "#ff847b" : "#a7ddc4";
  }
  function formatTime(ms) {
    ms = Math.max(0, Math.round(Number(ms) || 0));
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return (h ? String(h).padStart(2,"0") + ":" : "") +
      String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");
  }
  function msFromText(s) {
    const value = String(s || "").trim();
    if (!value) return NaN;
    if (/^\d+$/.test(value)) return Number(value) * 1000;
    const pieces = value.split(":");
    if (pieces.length < 2 || pieces.length > 3) return NaN;
    const seconds = Number(pieces.pop());
    const minutes = Number(pieces.pop());
    const hours = pieces.length ? Number(pieces.pop()) : 0;
    return [seconds, minutes, hours].every(Number.isFinite) ?
      Math.round((hours * 3600 + minutes * 60 + seconds) * 1000) : NaN;
  }
  function srtTime(ms) {
    ms = Math.max(0, Math.round(ms));
    return String(Math.floor(ms / 3600000)).padStart(2, "0") + ":" +
      String(Math.floor(ms % 3600000 / 60000)).padStart(2,"0") + ":" +
      String(Math.floor(ms % 60000 / 1000)).padStart(2,"0") + "," +
      String(ms % 1000).padStart(3,"0");
  }
  function selectedScenes() { return state.scenes.filter((s) => s.enabled && s.text.trim()); }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename;
    document.body.appendChild(link);
    link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function fileTextDownload(text, name, mime) {
    downloadBlob(new Blob([text], {type: mime || "text/plain;charset=utf-8"}), name);
  }
  function invalidateVoice() {
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    state.audioUrl = "";
    state.audioParts = []; state.audioDurations = []; state.audioBlob = null;
    $("audioResult").classList.add("hidden");
    $("voicePlayer").removeAttribute("src");
    setStatus("ttsStatus", "Script ပြောင်းထားလို့ အသံပြန်ထုတ်ရပါမယ်။");
  }
  function switchMode(mode) {
    state.mode = mode;
    $("modeLink").classList.toggle("selected", mode === "link");
    $("modeFile").classList.toggle("selected", mode === "file");
    $("modeLink").setAttribute("aria-selected", mode === "link");
    $("modeFile").setAttribute("aria-selected", mode === "file");
    $("linkInput").classList.toggle("hidden", mode !== "link");
    $("fileInput").classList.toggle("hidden", mode !== "file");
  }
  $("modeLink").addEventListener("click", () => switchMode("link"));
  $("modeFile").addEventListener("click", () => switchMode("file"));
  $("showKey").addEventListener("click", () => {
    $("apiKey").type = $("apiKey").type === "password" ? "text" : "password";
    $("showKey").textContent = $("apiKey").type === "password" ? "Show" : "Hide";
  });

  function parseYouTube(link) {
    let url;
    try { url = new URL(link.trim()); } catch { throw Error("Valid YouTube URL တစ်ခု ထည့်ပါ။"); }
    if (url.protocol !== "https:") throw Error("HTTPS YouTube Link ကိုသာ သုံးပါ။");
    const host = url.hostname.toLowerCase();
    if (!["youtube.com","www.youtube.com","m.youtube.com","music.youtube.com","youtu.be"].includes(host)) {
      throw Error("Public YouTube Link ကိုသာ ထည့်ပါ။");
    }
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/")[1] || "";
    else if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/live/") || url.pathname.startsWith("/embed/")) {
      id = url.pathname.split("/")[2] || "";
    } else id = url.searchParams.get("v") || "";
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) throw Error("YouTube Video ID မမှန်ပါ။");
    return id;
  }
  function loadYouTube() {
    try {
      const id = parseYouTube($("youtube").value);
      state.youtubeId = id;
      state.youtubeUrl = "https://www.youtube.com/watch?v=" + id;
      $("youtubeEmbed").replaceChildren();
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?rel=0";
      iframe.title = "YouTube Movie Preview";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      $("youtubeEmbed").appendChild(iframe);
      $("youtubeEmbed").classList.remove("hidden");
      $("localPlayer").classList.add("hidden");
      $("emptyPreview").classList.add("hidden");
      $("assetInfo").classList.remove("hidden");
      $("assetName").textContent = "YouTube • " + id;
      $("assetDuration").textContent = "AI link analysis";
      notify("YouTube Link Ready. AI Generate ကို နှိပ်နိုင်ပါတယ်။");
    } catch (error) { notify(error.message, true); }
  }
  $("loadYoutube").addEventListener("click", loadYouTube);
  $("youtube").addEventListener("change", () => { if ($("youtube").value.trim()) loadYouTube(); });
  function pickVideo(file) {
    if (!file) return;
    if (!file.type.startsWith("video/") && !/\.(mp4|webm|mov|m4v|mkv)$/i.test(file.name)) {
      notify("Video File ကိုသာ ရွေးပါ။", true); return;
    }
    if (state.videoObjectUrl) URL.revokeObjectURL(state.videoObjectUrl);
    state.videoFile = file;
    state.videoObjectUrl = URL.createObjectURL(file);
    const player = $("localPlayer");
    player.src = state.videoObjectUrl;
    player.controls = true;
    player.muted = false;
    player.classList.remove("hidden");
    $("youtubeEmbed").classList.add("hidden");
    $("emptyPreview").classList.add("hidden");
    $("assetInfo").classList.remove("hidden");
    $("assetName").textContent = file.name;
    $("assetDuration").textContent = (file.size / 1048576).toFixed(1) + " MB";
    player.addEventListener("loadedmetadata", () => {
      state.durationMs = Number.isFinite(player.duration) ? player.duration * 1000 : 0;
      $("timeInfo").textContent = "00:00 / " + formatTime(state.durationMs);
      $("assetDuration").textContent = formatTime(state.durationMs) + " • " + (file.size / 1048576).toFixed(1) + " MB";
    }, { once: true });
    notify("Video File ကို Browser ထဲမှာ ဖွင့်ပြီးပါပြီ။");
  }
  $("videoFile").addEventListener("change", (e) => pickVideo(e.target.files[0]));
  const zone = $("dropzone");
  ["dragenter","dragover"].forEach((name) => zone.addEventListener(name, (e) => {
    e.preventDefault(); zone.classList.add("dragging");
  }));
  ["dragleave","drop"].forEach((name) => zone.addEventListener(name, (e) => {
    e.preventDefault(); zone.classList.remove("dragging");
  }));
  zone.addEventListener("drop", (e) => pickVideo(e.dataTransfer.files[0]));
  $("localPlayer").addEventListener("timeupdate", () => {
    const video = $("localPlayer");
    $("timeInfo").textContent = formatTime(video.currentTime * 1000) + " / " + formatTime(video.duration * 1000);
  });
  $("subtitleSize").addEventListener("input", () => {
    $("fontValue").textContent = $("subtitleSize").value + " px";
  });

  async function geminiRequest(path, payload, signal) {
    const key = $("apiKey").value.trim();
    if (!key) throw Error("Gemini API Key ထည့်ရန် လိုအပ်ပါတယ်။");
    let response;
    try {
      response = await fetch(GEMINI + path, {
        method: "POST",
        headers: {"Content-Type":"application/json", "x-goog-api-key":key},
        body: JSON.stringify(payload),
        signal
      });
    } catch (err) {
      if (err.name === "AbortError") throw err;
      throw Error("Gemini API ချိတ်ဆက်မရပါ။ Browser CORS, Internet, VPN သို့မဟုတ် API Access ကို စစ်ပါ။ " + err.message);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw Error((data.error && data.error.message) || "Gemini API HTTP " + response.status);
    }
    return data;
  }
  async function geminiGet(path, signal) {
    const key = $("apiKey").value.trim();
    let response;
    try {
      response = await fetch(GEMINI + path, {headers: {"x-goog-api-key":key}, signal});
    } catch (err) {
      if (err.name === "AbortError") throw err;
      throw Error("AI result ကို ရယူမရပါ။ " + err.message);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Error((data.error && data.error.message) || "HTTP " + response.status);
    return data;
  }
  function extractText(response) {
    if (typeof response.output_text === "string" && response.output_text.trim()) return response.output_text;
    let result = [];
    for (const step of response.steps || []) {
      if (step.type !== "model_output") continue;
      for (const part of step.content || []) {
        if (part.type === "text" && typeof part.text === "string") result.push(part.text);
      }
    }
    if (!result.length && Array.isArray(response.output)) {
      for (const part of response.output) if (part.text) result.push(part.text);
    }
    return result.join("\n");
  }
  function buildPrompt() {
    const style = $("style").selectedOptions[0].textContent;
    const length = Number($("duration").value);
    const title = $("movieTitle").value.trim().slice(0, 120);
    const lang = $("sourceLanguage").value;
    return [
      "You are a veteran Myanmar movie recap writer and video editor. Carefully understand the supplied ACTUAL video visuals and audio. Do not rely on the title alone.",
      "Write an original vivid BURMESE (Myanmar Unicode) recap voiceover, cinematic hook, setup, major events, ending if actually shown; natural engaging spoken language with correctly spelled names.",
      "Requested duration: " + length + " seconds of spoken Burmese. Style: " + style + ". Original video language: " + lang + ". User-provided title (may be inaccurate): " + (title || "not specified") + ".",
      "Don't invent unseen scenes, dialogue, character motivations or endings. If video is short or incomplete, recap only what it actually depicts. Avoid copying original dialogue verbatim.",
      "Scene narration must directly relate to the part of ORIGINAL input video with source timestamps in integer milliseconds. These are scene selections, NOT the output video timestamp.",
      "Return only valid JSON, no Markdown, strictly this shape:",
      '{"scenes":[{"start_ms":0,"end_ms":9000,"narration":"အမှန်တကယ်မြင်ရသည့်အကြောင်းအရာကို မြန်မာဘာသာဖြင့် ပြန်ပြောခြင်း"}]}',
      "Choose chronological story scenes, ideally 6-30 (up to 40) with short, compelling Myanmar sentences per scene. Every end_ms must be > start_ms. No invented transcript or fake quotes.",
      "If the video provides insufficient information, still respond with only the clearly observable events and concise narration."
    ].join("\n");
  }
  function fromBase64(base64) {
    const decoded = atob(base64);
    const bytes = new Uint8Array(decoded.length);
    for (let i=0;i<decoded.length;i++) bytes[i] = decoded.charCodeAt(i);
    return bytes;
  }
  async function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(Error("Video File ကို ဖတ်မရပါ။"));
      reader.readAsDataURL(file);
    });
  }
  async function uploadFile(file, signal) {
    if (file.size > 2 * 1024 * 1024 * 1024) throw Error("2 GB ထက်ကြီးတဲ့ File ကို ဒီ Free-tier workflow မှာ မထောက်ပံ့ပါ။");
    const key = $("apiKey").value.trim();
    const mime = file.type || "video/mp4";
    setStatus("aiStatus", "Uploading local video to Gemini Files API…");
    let init;
    try {
      init = await fetch("https://generativelanguage.googleapis.com/upload/v1beta/files?key=" + encodeURIComponent(key), {
        method:"POST",
        headers: {
          "X-Goog-Upload-Protocol":"resumable",
          "X-Goog-Upload-Command":"start",
          "X-Goog-Upload-Header-Content-Length":String(file.size),
          "X-Goog-Upload-Header-Content-Type":mime,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({file:{display_name:file.name.slice(0,120)}}),
        signal
      });
    } catch (err) {
      throw Error("Files API upload ကို Browser မှ တိုက်ရိုက်ချိတ်မရပါ။ API CORS သို့မဟုတ် network ကန့်သတ်ချက် ဖြစ်နိုင်ပါတယ်။ " + err.message);
    }
    if (!init.ok) {
      const t = await init.text();
      throw Error("Gemini Upload start failed: " + t.slice(0,400));
    }
    const location = init.headers.get("x-goog-upload-url");
    if (!location || !location.startsWith("https://")) {
      throw Error("Upload URL ကို Browser က ရယူမရပါ။ Google CORS header မဖွင့်ပေးထားနိုင်ပါတယ်။ Small MP4 သို့မဟုတ် YouTube Link အသုံးပြုပါ။");
    }
    const done = await fetch(location, {
      method:"POST",
      headers: {"X-Goog-Upload-Offset":"0","X-Goog-Upload-Command":"upload, finalize", "Content-Type":mime},
      body:file, signal
    });
    const upload = await done.json().catch(() => ({}));
    if (!done.ok) throw Error((upload.error && upload.error.message) || "File upload failed: " + done.status);
    if (!upload.file || !upload.file.uri) throw Error("Gemini Files API did not return video uri.");
    let info = upload.file;
    for (let i=0;i<80;i++) {
      if (info.state === "ACTIVE") return info;
      if (info.state === "FAILED") throw Error("Gemini could not process this video file.");
      await pause(2000, signal);
      info = await geminiGet("/" + info.name, signal);
    }
    throw Error("Video Processing ကြာနေပါတယ်။ နောက်တစ်ကြိမ် ပြန်စမ်းပါ။");
  }
  function pause(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) return reject(new DOMException("Cancelled","AbortError"));
      const timer = setTimeout(() => {
        if (signal) signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      function onAbort() { clearTimeout(timer); reject(new DOMException("Cancelled","AbortError")); }
      if (signal) signal.addEventListener("abort", onAbort, {once:true});
    });
  }
  function parseNarrative(text) {
    if (!text || !text.trim()) throw Error("AI response ထဲမှာ Script မပါလာပါ။");
    const begin = text.indexOf("{");
    const finish = text.lastIndexOf("}");
    if (begin < 0 || finish <= begin) throw Error("AI Response က JSON Script format မဟုတ်ပါ။ နောက်တစ်ကြိမ်ပြန်စမ်းပါ။");
    let obj;
    try { obj = JSON.parse(text.substring(begin,finish+1)); }
    catch { throw Error("AI Response JSON က မမှန်ပါ။ နောက်တစ်ကြိမ်ပြန်စမ်းပါ။"); }
    if (!Array.isArray(obj.scenes)) throw Error("AI က Scene မပေးပါ။");
    const scenes = [];
    for (const raw of obj.scenes.slice(0,40)) {
      if (!raw || typeof raw !== "object") continue;
      const start = Number(raw.start_ms);
      const end = Number(raw.end_ms);
      const narration = String(raw.narration || raw.caption || "").trim().slice(0,1000);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || end > 16*3600000 || !narration) continue;
      scenes.push({startMs:Math.round(start),endMs:Math.round(end),text:narration,enabled:true});
    }
    scenes.sort((a,b) => a.startMs-b.startMs);
    if (!scenes.length) throw Error("အသုံးပြုနိုင်တဲ့ Scene တစ်ခုမှ မထွက်လာပါ။");
    return scenes;
  }
  async function analyze() {
    if (state.busy) return;
    const key = $("apiKey").value.trim();
    if (!key) return notify("Gemini API Key ထည့်ပါ။",true);
    const input = [{type:"text",text:buildPrompt()}];
    let origin = "link";
    if (state.mode === "link") {
      try { parseYouTube($("youtube").value); loadYouTube(); if (!state.youtubeUrl) return; }
      catch (err) { notify(err.message,true); return; }
      input.push({type:"video",uri:state.youtubeUrl});
    } else {
      if (!state.videoFile) return notify("Video File ကို ရွေးပါ။",true);
      origin = "file";
    }
    state.busy = true;
    $("analyzeBtn").disabled = true;
    $("cancelBtn").classList.remove("hidden");
    state.abort = new AbortController();
    const signal = state.abort.signal;
    $("progressWrap").classList.remove("hidden");
    $("progressBar").style.width="10%";
    setStatus("aiStatus","Preparing video analysis…");
    try {
      if (origin === "file") {
        const f = state.videoFile;
        if (f.size <= 12 * 1024 * 1024) {
          setStatus("aiStatus","Encoding short video for Gemini…");
          input.push({type:"video",data:await toBase64(f),mime_type:f.type || "video/mp4"});
        } else {
          $("progressBar").style.width="22%";
          const uploaded = await uploadFile(f,signal);
          input.push({type:"video",uri:uploaded.uri,mime_type:uploaded.mimeType || uploaded.mime_type || f.type || "video/mp4"});
        }
      }
      $("progressBar").style.width="36%";
      setStatus("aiStatus","Gemini is analyzing audio, visuals and story scenes…");
      let result = await geminiRequest("/interactions",
        {model:"gemini-3.8-flash",input:input,background:true}, signal);
      if (result.status === "in_progress" && !result.id) throw Error("Background analysis ID မရပါ။");
      let count = 0;
      while (result.status === "in_progress" || result.status === "pending") {
        if (++count > 90) throw Error("Analysis timeout. Shorter video ကို စမ်းပါ။");
        $("progressBar").style.width = Math.min(90, 42 + count * 0.6) + "%";
        setStatus("aiStatus","Analyzing movie • " + count + " checks completed…");
        await pause(2500,signal);
        result = await geminiGet("/interactions/" + encodeURIComponent(result.id),signal);
      }
      if (result.status && result.status !== "completed") {
        throw Error("AI request status: " + result.status + ". " +
          ((result.error && result.error.message) || ""));
      }
      const scenes = parseNarrative(extractText(result));
      state.scenes = scenes; state.selected=0;
      invalidateVoice();
      renderScenes();
      $("progressBar").style.width="100%";
      setStatus("aiStatus",scenes.length + " story scenes generated. Edit, narrate and export.");
      notify("AI Myanmar Recap Script ထုတ်ပြီးပါပြီ။");
      $("editor").scrollIntoView({behavior:"smooth"});
    } catch (err) {
      setStatus("aiStatus",err.name === "AbortError" ? "Cancelled" : err.message, true);
      if (err.name !== "AbortError") notify(err.message, true);
      $("progressBar").style.width="0%";
    } finally {
      state.busy = false;
      state.abort = null;
      $("analyzeBtn").disabled=false;
      $("cancelBtn").classList.add("hidden");
    }
  }
  $("analyzeBtn").addEventListener("click",analyze);
  $("cancelBtn").addEventListener("click",() => { if (state.abort) state.abort.abort(); });

  function updateFullScript() {
    $("fullScript").value = state.scenes.map((s) => s.text).join("\n");
  }
  function renderScenes() {
    const list = $("sceneList");
    list.replaceChildren();
    $("sceneCount").textContent = state.scenes.length + " scenes";
    updateFullScript();
    if (!state.scenes.length) {
      const empty=document.createElement("div");empty.className="empty-scenes";
      empty.textContent="Scene မရှိသေးပါ။ AI Generate နှိပ်ပါ သို့မဟုတ် + နှိပ်ပြီး ကိုယ်တိုင်ထည့်ပါ။";
      list.appendChild(empty);return;
    }
    state.scenes.forEach((scene,index) => {
      const card = document.createElement("div");
      card.className="scene-item" + (state.selected===index?" selected":"");
      const top=document.createElement("div");top.className="scene-top";
      const name=document.createElement("span");name.textContent="SCENE "+String(index+1).padStart(2,"0");
      const enabledLabel=document.createElement("label");
      const enabled=document.createElement("input");enabled.type="checkbox";enabled.checked=scene.enabled;
      enabled.addEventListener("change",()=>{scene.enabled=enabled.checked;invalidateVoice();});
      enabledLabel.appendChild(enabled);
      enabledLabel.appendChild(document.createTextNode(" Enable"));
      top.append(name,enabledLabel);
      const narration=document.createElement("textarea");
      narration.className="scene-text";narration.value=scene.text;narration.placeholder="မြန်မာ ဇာတ်လမ်းပြော စာသား…";
      narration.addEventListener("input",()=>{scene.text=narration.value;state.selected=index;updateFullScript();invalidateVoice();});
      const time=document.createElement("div");time.className="time-pair";
      function timeInput(which,text) {
        const wrap=document.createElement("label");
        wrap.textContent=text;
        const input=document.createElement("input");input.type="text";input.value=formatTime(scene[which]);
        input.placeholder="MM:SS";
        input.addEventListener("change",()=>{
          const ms=msFromText(input.value);
          if (!Number.isFinite(ms)||ms<0) {input.value=formatTime(scene[which]);notify("Valid MM:SS time ထည့်ပါ။",true);return;}
          if ((which==="startMs" && ms >= scene.endMs) || (which==="endMs" && ms <= scene.startMs)) {
            input.value=formatTime(scene[which]);notify("End time က Start time ထက် နောက်ကျရပါမယ်။",true);return;
          }
          scene[which]=ms;input.value=formatTime(ms);
        });
        wrap.appendChild(input);return wrap;
      }
      time.append(timeInput("startMs","START · MM:SS"),timeInput("endMs","END · MM:SS"));
      const actions=document.createElement("div");actions.className="scene-buttons";
      const buttons=[
        ["▶ Preview",()=>previewSelected(index)],
        ["↑",()=>moveScene(index,-1)],["↓",()=>moveScene(index,1)],
        ["Duplicate",()=>{state.scenes.splice(index+1,0,Object.assign({},scene));state.selected=index+1;invalidateVoice();renderScenes();}],
        ["Delete",()=>{state.scenes.splice(index,1);state.selected=0;invalidateVoice();renderScenes();}]
      ];
      buttons.forEach(([label,handler])=>{
        const b=document.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",handler);actions.appendChild(b);
      });
      card.append(top,narration,time,actions);
      card.addEventListener("click",()=>{if(state.selected!==index){state.selected=index;list.querySelectorAll(".scene-item").forEach((el,i)=>el.classList.toggle("selected",index===i));}});
      list.appendChild(card);
    });
  }
  function moveScene(index, delta) {
    const other=index+delta;if(other<0||other>=state.scenes.length)return;
    const temp=state.scenes[index];state.scenes[index]=state.scenes[other];state.scenes[other]=temp;
    state.selected=other;invalidateVoice();renderScenes();
  }
  function previewSelected(index) {
    state.selected=index;
    const scene=state.scenes[index];if(!scene)return;
    $("sceneList").querySelectorAll(".scene-item").forEach((el,i)=>el.classList.toggle("selected",i===index));
    if(state.videoFile){
      const p=$("localPlayer");
      p.currentTime=scene.startMs/1000;
      p.play().catch(()=>notify("Preview play ပိတ်ထားပါသည်။ Play ကို နှိပ်ပါ။"));
      const end=scene.endMs/1000;
      const onTime=()=>{if(p.currentTime>=end){p.pause();p.removeEventListener("timeupdate",onTime);}};
      p.addEventListener("timeupdate",onTime);
    } else if(state.youtubeId){
      const iframe=$("youtubeEmbed").querySelector("iframe");
      if(iframe)iframe.src="https://www.youtube-nocookie.com/embed/"+state.youtubeId+"?start="+Math.floor(scene.startMs/1000)+"&autoplay=1&rel=0";
    } else notify("Video ကို အရင် ရွေးပါ။",true);
  }
  $("previewScene").addEventListener("click",()=>previewSelected(state.selected));
  $("addScene").addEventListener("click",()=>{
    const prev=state.scenes[state.scenes.length-1];
    const start=prev?prev.endMs:0;
    state.scenes.push({startMs:start,endMs:start+8000,text:"မြန်မာလို ဇာတ်လမ်းပြောစာသား ရေးပါ။",enabled:true});
    state.selected=state.scenes.length-1;invalidateVoice();renderScenes();
  });
  $("applyScript").addEventListener("click",()=>{
    const lines=$("fullScript").value.split("\n").map((s)=>s.trim()).filter(Boolean);
    if(!lines.length){notify("Script စာသားထည့်ပါ။",true);return;}
    state.scenes=lines.slice(0,60).map((line,i)=>{
      const old=state.scenes[i];
      const begin=i?state.scenes[i-1]?state.scenes[i-1].endMs:i*8000:0;
      return old?Object.assign({},old,{text:line}):{startMs:begin,endMs:begin+8000,text:line,enabled:true};
    });
    state.selected=0;invalidateVoice();renderScenes();notify("Script ကို Scenes နဲ့ ချိတ်ဆက်ပြီးပါပြီ။");
  });
  $("copyScript").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText($("fullScript").value);notify("Script copied.");}
    catch{notify("Browser clipboard permission မရပါ။",true);}
  });
  $("downloadTxt").addEventListener("click",()=>fileTextDownload($("fullScript").value,"future-code-recap-script.txt"));


  function parseSrtTime(text) {
    const match=String(text).trim().match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
    if(!match)return NaN;
    return (+match[1]*3600 + +match[2]*60 + +match[3])*1000 + Number(match[4].padEnd(3,"0"));
  }
  function parseSrt(text){
    const blocks=String(text).replace(/\r/g,"").replace(/^\uFEFF/,"").trim().split(/\n\s*\n/);
    const scenes=[];
    for(const block of blocks){
      const lines=block.split("\n").map(s=>s.trim()).filter(Boolean);
      if(!lines.length)continue;
      const at=lines.findIndex(line=>line.includes("-->"));
      if(at<0)continue;
      const m=lines[at].match(/(\d{2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{1,3})/);
      if(!m)continue;
      const start=parseSrtTime(m[1]),end=parseSrtTime(m[2]);
      const text=lines.slice(at+1).join(" ").trim();
      if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||!text)continue;
      scenes.push({startMs:start,endMs:end,text:text.slice(0,1000),enabled:true});
      if(scenes.length===80)break;
    }
    if(!scenes.length)throw Error("SRT timecoded subtitle format မမှန်ပါ။");
    return scenes;
  }
  $("importSrtBtn").addEventListener("click",()=>$("srtFile").click());
  $("srtFile").addEventListener("change",async(e)=>{
    const file=e.target.files[0];if(!file)return;
    try{
      if(file.size>2*1024*1024)throw Error("SRT file 2MB အောက် ဖြစ်ရပါမယ်။");
      const scenes=parseSrt(await file.text());
      if(state.scenes.length&&!confirm("Existing scenes ကို SRT နဲ့ အစားထိုးမှာလား?"))return;
      state.scenes=scenes;state.selected=0;invalidateVoice();renderScenes();
      notify(scenes.length+" SRT scenes imported.");
      $("editor").scrollIntoView({behavior:"smooth"});
    }catch(err){notify(err.message,true);}
    finally{e.target.value="";}
  });
  async function importOwnAudio(file){
    if(state.busy)return;
    const scenes=selectedScenes();
    if(!scenes.length)return notify("စာသား Scene တွေ အရင်ပြုလုပ်ထားပါ။",true);
    if(!file||file.size>80*1024*1024)return notify("80MB အောက် Audio file ကိုသာ သုံးပါ။",true);
    state.busy=true;setStatus("ttsStatus","Decoding your narration locally…");
    let context;
    try{
      context=new (window.AudioContext||window.webkitAudioContext)();
      const decoded=await context.decodeAudioData(await file.arrayBuffer());
      if(decoded.duration>1200)throw Error("Imported Audio ကို 20 minutes အောက်ထားပါ။");
      if(decoded.duration<.3)throw Error("Audio File အလွန်တိုနေပါတယ်။");
      const samples=Math.ceil(decoded.duration*24000);
      const offline=new OfflineAudioContext(1,samples,24000);
      const source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);
      source.start();
      const rendered=await offline.startRendering();
      const floats=rendered.getChannelData(0);
      const weights=scenes.map(s=>Math.max(1500,Math.min(18000,s.endMs-s.startMs)));
      const total=weights.reduce((a,b)=>a+b,0);
      const parts=[];let cursor=0;let passed=0;
      for(let i=0;i<weights.length;i++){
        passed+=weights[i];
        const end=i===weights.length-1?floats.length:Math.round(floats.length*passed/total);
        const n=Math.max(0,end-cursor);
        if(n<200)throw Error("Audio File ထဲမှာ Scene တစ်ခုချင်းစီအတွက် အသံမလုံလောက်ပါ။");
        const bytes=new Uint8Array(n*2);
        const view=new DataView(bytes.buffer);
        for(let j=0;j<n;j++){
          const v=Math.max(-1,Math.min(1,floats[cursor+j]));
          view.setInt16(j*2,Math.round(v<0?v*32768:v*32767),true);
        }
        cursor=end;parts.push(bytes);
      }
      invalidateVoice();
      state.audioParts=parts;state.audioDurations=parts.map(p=>Math.round(p.length/2/24));
      state.audioBlob=wavBlob(parts);state.audioUrl=URL.createObjectURL(state.audioBlob);
      $("voicePlayer").src=state.audioUrl;
      $("audioResult").classList.remove("hidden");
      setStatus("ttsStatus","Own voice ready • "+formatTime(state.audioDurations.reduce((a,b)=>a+b,0)));
      notify("Your narration imported. Preview / render to check alignment.");
    }catch(err){setStatus("ttsStatus",err.message,true);notify(err.message,true);}
    finally{if(context)await context.close().catch(()=>{});state.busy=false;}
  }
  $("ownAudioFile").addEventListener("change",async(e)=>{
    const file=e.target.files[0];
    if(file)await importOwnAudio(file);
    e.target.value="";
  });

  function exportSrtText(){
    const scenes=selectedScenes();
    if(!scenes.length)throw Error("Scene မရှိသေးပါ။");
    let cursor=0;
    return scenes.map((s,i)=>{
      const d=state.audioDurations.length===scenes.length ?
        state.audioDurations[i] : Math.min(12000,Math.max(2500,s.endMs-s.startMs));
      const row=(i+1)+"\n"+srtTime(cursor)+" --> "+srtTime(cursor+d)+"\n"+s.text.trim()+"\n";
      cursor+=d;return row;
    }).join("\n");
  }
  $("exportSrt").addEventListener("click",()=>{
    try{fileTextDownload(exportSrtText(),"future-code-recap.srt","application/x-subrip;charset=utf-8");notify("SRT file downloaded.");}
    catch(e){notify(e.message,true);}
  });
  function projectData() {
    return {version:2, app:"Future Code Movie Recap Studio",savedAt:new Date().toISOString(),
      mode:state.mode,youtubeUrl:state.youtubeUrl,
      duration:$("duration").value,style:$("style").value,sourceLanguage:$("sourceLanguage").value,
      movieTitle:$("movieTitle").value,voiceName:$("voiceName").value,voiceStyle:$("voiceStyle").value,
      ratio:$("ratio").value,subtitleColor:$("subtitleColor").value,subtitleBg:$("subtitleBg").value,
      subtitleSize:$("subtitleSize").value,scenes:state.scenes.map(s=>({...s}))};
  }
  function downloadProject(){
    fileTextDownload(JSON.stringify(projectData(),null,2),"future-code-recap-project.json","application/json");
    notify("Project saved. Video File, Voice WAV, API Key မပါပါ။");
  }
  $("exportJson").addEventListener("click",downloadProject);
  $("saveProject").addEventListener("click",downloadProject);
  $("importJson").addEventListener("click",()=>$("importFile").click());
  $("importFile").addEventListener("change",async(e)=>{
    const file=e.target.files[0];if(!file)return;
    try{
      const data=JSON.parse(await file.text());
      if(!Array.isArray(data.scenes))throw Error("Invalid project file.");
      state.scenes=data.scenes.slice(0,80).map(s=>({
        startMs:Math.max(0,Number(s.startMs)||0),
        endMs:Math.max(Number(s.startMs)||0,Number(s.endMs)||8000),
        text:String(s.text||"").slice(0,1000),enabled:s.enabled!==false
      })).filter(s=>s.endMs>s.startMs);
      for (const id of ["duration","style","sourceLanguage","ratio","voiceName","voiceStyle"]) {
        if(data[id]!=null) $(id).value=String(data[id]);
      }
      for(const id of ["movieTitle","subtitleColor","subtitleBg","subtitleSize"]){
        if(data[id]!=null)$(id).value=String(data[id]);
      }
      $("fontValue").textContent=$("subtitleSize").value+" px";
      if(data.youtubeUrl && /^https:\/\/www\.youtube\.com\/watch\?v=/.test(data.youtubeUrl)) {
        $("youtube").value=data.youtubeUrl;
        switchMode("link");loadYouTube();
      }
      state.selected=0;invalidateVoice();renderScenes();
      notify("Project restored. Video / Voice များကို လိုအပ်သလို ပြန်ရွေးပါ။");
    }catch(err){notify("Project import failed: "+err.message,true);}
    e.target.value="";
  });

  function collectPcm(bytes) {
    if(bytes.length>=44 && String.fromCharCode(...bytes.slice(0,4))==="RIFF"){
      const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
      let offset=12, sample=24000, channels=1, bits=16, audioType=1, part=null;
      while(offset+8<=bytes.length){
        const chunk=String.fromCharCode(...bytes.slice(offset,offset+4));
        const size=dv.getUint32(offset+4,true);
        const begin=offset+8;
        if(begin+size>bytes.length)break;
        if(chunk==="fmt " && size>=16){
          audioType=dv.getUint16(begin,true);channels=dv.getUint16(begin+2,true);
          sample=dv.getUint32(begin+4,true);bits=dv.getUint16(begin+14,true);
        }
        if(chunk==="data")part=bytes.slice(begin,begin+size);
        offset=begin+size+(size%2);
      }
      if(!part||audioType!==1||bits!==16||channels!==1||sample!==24000)
        throw Error("AI returned unsupported WAV format. Expected 24kHz 16-bit mono PCM.");
      return part;
    }
    if(bytes.length<100 || bytes.length%2!==0)throw Error("Invalid PCM audio from Gemini.");
    return bytes;
  }
  function wavBlob(chunks) {
    const pcmSize=chunks.reduce((n,c)=>n+c.byteLength,0);
    if(!pcmSize||pcmSize>0x7fffffff-44)throw Error("Voiceover is too large.");
    const buffer=new ArrayBuffer(44+pcmSize);
    const view=new DataView(buffer);
    function fourCC(at,str){for(let i=0;i<4;i++)view.setUint8(at+i,str.charCodeAt(i));}
    fourCC(0,"RIFF");view.setUint32(4,36+pcmSize,true);fourCC(8,"WAVE");
    fourCC(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);
    view.setUint16(22,1,true);view.setUint32(24,24000,true);
    view.setUint32(28,48000,true);view.setUint16(32,2,true);
    view.setUint16(34,16,true);fourCC(36,"data");view.setUint32(40,pcmSize,true);
    let at=44;
    for (const chunk of chunks){new Uint8Array(buffer,at,chunk.length).set(chunk);at+=chunk.length;}
    return new Blob([buffer],{type:"audio/wav"});
  }
  function extractAudio(response) {
    let audio = response.output_audio && response.output_audio.data;
    if(!audio){
      for(const step of response.steps||[]){
        if(step.type!=="model_output")continue;
        for(const item of step.content||[]) if(item.type==="audio" && item.data) audio=item.data;
      }
    }
    if(!audio)throw Error("Gemini TTS response မှာ Audio မပါလာပါ။");
    return collectPcm(fromBase64(audio));
  }
  async function generateVoice() {
    if(state.busy)return;
    const scenes=selectedScenes();
    if(!scenes.length)return notify("AI Script / Scenes မရှိသေးပါ။",true);
    if(!$("apiKey").value.trim())return notify("Gemini API Key ထည့်ပါ။",true);
    if(scenes.length>40)return notify("Voice export အတွက် Scenes 40 အောက် ရွေးပါ။",true);
    state.busy=true;$("ttsBtn").disabled=true;
    state.abort=new AbortController();
    const parts=[];
    try{
      for(let i=0;i<scenes.length;i++){
        setStatus("ttsStatus","Voice generating: scene "+(i+1)+" / "+scenes.length);
        const phrase=scenes[i].text.trim().slice(0,1500);
        const result=await geminiRequest("/interactions",{
          model:"gemini-3.8-flash-tts",
          input:[{type:"user_input",content:[{type:"text",text:phrase,annotations:[{
            type:"speech_metadata",style:$("voiceStyle").value
          }]}]}],
          response_format:{type:"audio",mime_type:"audio/l16",sample_rate:24000},
          generation_config:{speech_config:[{voice:$("voiceName").value}]}
        },state.abort.signal);
        parts.push(extractAudio(result));
      }
      const blob=wavBlob(parts);
      invalidateVoice();
      state.audioParts=parts;state.audioDurations=parts.map(p=>Math.round(p.length/2/24000*1000));
      state.audioBlob=blob;state.audioUrl=URL.createObjectURL(blob);
      $("voicePlayer").src=state.audioUrl;
      $("audioResult").classList.remove("hidden");
      setStatus("ttsStatus","Myanmar AI WAV ready • "+formatTime(state.audioDurations.reduce((a,b)=>a+b,0)));
      notify("Voice generated. Listen before publishing.");
    }catch(error){
      setStatus("ttsStatus",error.name==="AbortError"?"Voice cancelled.":error.message,true);
      if(error.name!=="AbortError")notify(error.message,true);
    }finally{
      state.busy=false;state.abort=null;$("ttsBtn").disabled=false;
    }
  }
  $("ttsBtn").addEventListener("click",generateVoice);
  $("downloadWav").addEventListener("click",()=>{
    if(!state.audioBlob)return notify("Voiceover အရင်ထုတ်ပါ။",true);
    downloadBlob(state.audioBlob,"future-code-burmese-voice.wav");
  });

  function drawVideo(ctx,video,w,h,text) {
    ctx.fillStyle="#07090d";ctx.fillRect(0,0,w,h);
    const vw=video.videoWidth||16,vh=video.videoHeight||9;
    const scale=Math.max(w/vw,h/vh),dw=vw*scale,dh=vh*scale;
    if(video.readyState>=2)ctx.drawImage(video,(w-dw)/2,(h-dh)/2,dw,dh);
    const fontsize=Number($("subtitleSize").value);
    const font=Math.round(fontsize*(w/720));
    const lines=wrapLines(ctx,text,w*.84,font);
    if(!lines.length)return;
    ctx.font="700 "+font+'px "Noto Sans Myanmar", sans-serif';
    ctx.textAlign="center";ctx.textBaseline="middle";
    const lineH=font*1.8;
    const bottom=h*.89,top=bottom-lines.length*lineH-14;
    ctx.fillStyle=$("subtitleBg").value+"df";
    ctx.fillRect(w*.06,top,w*.88,(lines.length+.4)*lineH);
    ctx.fillStyle=$("subtitleColor").value;
    lines.forEach((line,i)=>ctx.fillText(line,w/2,top+lineH*(i+.6),w*.82));
  }
  function wrapLines(ctx,text,maxWidth,font){
    ctx.font="700 "+font+'px "Noto Sans Myanmar",sans-serif';
    const words=text.trim().split(/\s+/);
    const lines=[];let current="";
    for(const word of words){
      const next=(current?current+" ":"")+word;
      if(ctx.measureText(next).width>maxWidth && current){lines.push(current);current=word;}
      else current=next;
    }
    if(current)lines.push(current);
    return lines.slice(0,5);
  }
  function audioBuffer(ctx,bytes){
    const arr=new Int16Array(bytes.buffer,bytes.byteOffset,Math.floor(bytes.byteLength/2));
    const buffer=ctx.createBuffer(1,arr.length,24000), samples=buffer.getChannelData(0);
    for(let i=0;i<arr.length;i++)samples[i]=arr[i]/32768;
    return buffer;
  }
  async function seekVideo(video,time){
    if(Math.abs(video.currentTime-time)<.12 && video.readyState>=2)return;
    await new Promise((resolve,reject)=>{
      let timer;
      const onDone=()=>{cleanup();resolve();};
      const onError=()=>{cleanup();reject(Error("Video seek failed. Unsupported codec or invalid timestamp."));};
      function cleanup(){clearTimeout(timer);video.removeEventListener("seeked",onDone);video.removeEventListener("error",onError);}
      video.addEventListener("seeked",onDone,{once:true});
      video.addEventListener("error",onError,{once:true});
      timer=setTimeout(()=>{cleanup();reject(Error("Video seek timed out. Try MP4/H.264."));},13000);
      try{video.currentTime=Math.max(0,time);}catch(e){onError();}
    });
  }
  async function renderVideo() {
    if(state.rendering)return;
    if(!state.videoFile)return notify("Video MP4/WebM Render အတွက် ကိုယ်ပိုင် Local Video File ထည့်ရန် လိုပါတယ်။",true);
    const scenes=selectedScenes();
    if(!scenes.length)return notify("Scene မရှိသေးပါ။",true);
    if(!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream)return notify("This browser does not support local video recording. Use latest Chrome/Edge.",true);
    const types=["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"];
    const mime=types.find(t=>MediaRecorder.isTypeSupported(t));
    if(!mime)return notify("No suitable video MediaRecorder format supported.",true);
    const [w,h]=$("ratio").value==="16:9"?[1280,720]:$("ratio").value==="1:1"?[720,720]:[720,1280];
    const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext("2d",{alpha:false});
    const video=$("localPlayer");
    const oldMuted=video.muted;
    video.pause();video.muted=true;
    const auCtx=new (window.AudioContext||window.webkitAudioContext)();
    const destination=auCtx.createMediaStreamDestination();
    const stream=canvas.captureStream(24);
    destination.stream.getAudioTracks().forEach(t=>stream.addTrack(t));
    const chunks=[];
    let recorder;
    try{
      recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4000000});
    }catch(err){
      await auCtx.close();video.muted=oldMuted;return notify("Could not start recording: "+err.message,true);
    }
    state.rendering=true;state.stopRender=false;state.recorder=recorder;
    $("exportVideo").disabled=true;$("renderProgressWrap").classList.remove("hidden");
    $("stopRender").classList.remove("hidden");$("videoDownload").classList.add("hidden");
    if(state.exportedUrl)URL.revokeObjectURL(state.exportedUrl);
    const done=new Promise((resolve,reject)=>{
      recorder.ondataavailable=(e)=>{if(e.data&&e.data.size)chunks.push(e.data);};
      recorder.onerror=(e)=>reject(Error(e.error?.message||"Video recorder failed"));
      recorder.onstop=resolve;
    });
    try{
      await auCtx.resume();
      const useVoice=state.audioParts.length===scenes.length;
      if(!useVoice)setStatus("renderStatus","No generated voice: exporting SILENT video with captions.");
      const lengths=scenes.map((s,i)=>useVoice?state.audioDurations[i]:
        Math.max(2000,Math.min(12000,s.endMs-s.startMs)));
      const durationAll=lengths.reduce((n,v)=>n+v,0);
      let elapsed=0;
      await seekVideo(video,scenes[0].startMs/1000);
      drawVideo(ctx,video,w,h,scenes[0].text);
      recorder.start(250);
      for(let i=0;i<scenes.length;i++){
        if(state.stopRender)break;
        const scene=scenes[i],duration=lengths[i],sourceEnd=scene.endMs/1000;
        if(i>0)await seekVideo(video,scene.startMs/1000);
        let voiceSource;
        if(useVoice){
          voiceSource=auCtx.createBufferSource();
          voiceSource.buffer=audioBuffer(auCtx,state.audioParts[i]);
          voiceSource.connect(destination);
        }
        await video.play();
        if(voiceSource)voiceSource.start();
        const start=performance.now();
        while(performance.now()-start<duration && !state.stopRender){
          const t=performance.now()-start;
          if(video.currentTime>=sourceEnd && !video.paused)video.pause();
          drawVideo(ctx,video,w,h,scene.text);
          const progress=Math.min(100,(elapsed+t)/durationAll*100);
          $("renderProgress").style.width=progress.toFixed(1)+"%";
          setStatus("renderStatus","Rendering scene "+(i+1)+" / "+scenes.length+" • "+Math.floor(progress)+"%");
          await new Promise(r=>setTimeout(r,40));
        }
        video.pause();if(voiceSource)try{voiceSource.stop();}catch{}
        elapsed+=duration;
      }
      if(recorder.state!=="inactive")recorder.stop();
      await done;
      if(state.stopRender){setStatus("renderStatus","Render cancelled");notify("Render cancelled.");}
      else if(chunks.length){
        const blob=new Blob(chunks,{type:mime});
        state.exportedUrl=URL.createObjectURL(blob);
        const link=$("videoDownload");
        link.href=state.exportedUrl;link.download="future-code-movie-recap."+(mime.includes("mp4")?"mp4":"webm");
        link.classList.remove("hidden");
        $("renderProgress").style.width="100%";
        setStatus("renderStatus","Video Render Complete · "+(blob.size/1048576).toFixed(1)+" MB · "+(mime.includes("mp4")?"MP4":"WebM"));
        notify("Video rendered. Download နိုပ်ပြီး သိမ်းပါ။");
      }else throw Error("Recorder created an empty file.");
    }catch(err){
      if(recorder.state!=="inactive")recorder.stop();
      setStatus("renderStatus",err.message,true);notify(err.message,true);
    }finally{
      video.pause();video.muted=oldMuted;
      stream.getTracks().forEach(t=>t.stop());
      await auCtx.close().catch(()=>{});
      state.recorder=null;state.rendering=false;state.stopRender=false;
      $("stopRender").classList.add("hidden");$("exportVideo").disabled=false;
    }
  }
  $("exportVideo").addEventListener("click",renderVideo);
  $("stopRender").addEventListener("click",()=>{state.stopRender=true;setStatus("renderStatus","Stopping render…");});
  renderScenes();
})();
