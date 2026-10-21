'use strict';
(() => {
  const BASE = "https://mxwervqihaqlxybghdak.supabase.co";
  const KEY = "sb_publishable_JBcF0nEMbcFSSf7OlCCqmQ_lC1DEM0A";
  const SESSION_KEY = "fc_private_download_session_v1";
  const $ = (id) => document.getElementById(id);
  const format = new Intl.NumberFormat("en-US");
  let session = null;
  const headers = { "apikey": KEY, "Content-Type": "application/json" };
  function setStatus(id, msg, type) {
    const el = $(id);
    el.textContent = msg || "";
    el.className = "status" + (type ? " " + type : "");
  }
  function setBusy(flag) {
    ["loginBtn","sendOtp","verifyOtp","refresh"].forEach(id => $(id).disabled = flag);
  }
  async function jsonRequest(path, options) {
    const resp = await fetch(BASE + path, options);
    const raw = await resp.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}
    if (!resp.ok) throw Object.assign(new Error(data.msg || data.error_description || data.message || data.error || ("HTTP " + resp.status)), {status: resp.status});
    return data;
  }
  function saveSession(data) {
    session = {access_token:data.access_token, refresh_token:data.refresh_token, expires_at: Date.now() + Math.max(30, (data.expires_in || 3600)-45)*1000};
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (_) {}
  }
  function clearSession() {
    session = null;
    try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
  }
  async function accessToken() {
    if (!session?.access_token) throw Error("Please log in.");
    if (Date.now() < session.expires_at) return session.access_token;
    if (!session.refresh_token) { clearSession(); throw Error("Session expired. Please log in again."); }
    const data = await jsonRequest("/auth/v1/token?grant_type=refresh_token", {
      method:"POST", headers, body:JSON.stringify({refresh_token:session.refresh_token})
    });
    saveSession(data);
    return session.access_token;
  }
  function openDashboard() {
    $("authView").hidden = true;
    $("dashboard").hidden = false;
  }
  function showLogin() {
    $("dashboard").hidden = true;
    $("authView").hidden = false;
  }
  function render(data) {
    for (const [id,value] of [
      ["visits",data.pageViews],["downloads",data.downloadClicks],
      ["browsers",data.uniqueBrowsers],["today",data.todayDownloads],
      ["week",data.weekDownloads],["month",data.monthDownloads]
    ]) $(id).textContent = format.format(value || 0);
    const sites = data.sites || [];
    const groups = [
      {key:"future-code",label:"📱 Future Code AI Studio — APK များ"},
      {key:"football",label:"⚽ ဘောလုံးဂျာနယ် APK Website များ"}
    ];
    const siteHost = $("siteSections");
    siteHost.replaceChildren();
    for (const group of groups) {
      const members = sites.filter(site => site.group === group.key);
      if (!members.length) continue;
      const section=document.createElement("section");
      section.className="site-group";
      const heading=document.createElement("h3");heading.textContent=group.label;
      const grid=document.createElement("div");grid.className="site-grid";
      for(const site of members){
        const card=document.createElement("article");card.className="site-card";
        const top=document.createElement("div");top.className="site-heading";
        const name=document.createElement("strong");name.textContent=site.name;
        const link=document.createElement("a");link.href=site.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Website ကြည့်ရန် ↗";
        top.append(name,link);card.append(top);
        const metrics=document.createElement("div");metrics.className="metrics";
        for (const [label,count] of [
          ["Page Views",site.pageViews],["Unique Browsers",site.uniqueBrowsers],
          ["Downloads",site.downloadClicks],["ဒီနေ့",site.today],
          ["ဒီအပတ်",site.week],["ဒီလ",site.month]
        ]){
          const cell=document.createElement("div");cell.className="site-metric";
          const small=document.createElement("small");small.textContent=label;
          const value=document.createElement("b");value.textContent=format.format(count||0);
          cell.append(small,value);metrics.append(cell);
        }
        card.append(metrics);
        const note=document.createElement("p");note.className="site-note";
        note.textContent=site.trackingSince ?
          "မှတ်တမ်းစတင်: "+new Date(site.trackingSince).toLocaleDateString("en-GB",{timeZone:"Asia/Yangon",dateStyle:"medium"})+" · Myanmar Time" :
          "ဒီ Website အတွက် စာရင်းမရောက်သေးပါ";
        card.append(note);grid.append(card);
      }
      section.append(heading,grid);siteHost.append(section);
    }
    const rows = $("appRows");
    rows.replaceChildren();
    for (const site of sites) {
      const apps=(data.apps||[]).filter(app=>app.siteKey===site.key);
      if(!apps.length)continue;
      const tr=document.createElement("tr");tr.className="table-group";
      const td=document.createElement("td");td.colSpan=6;td.textContent=site.name;
      tr.append(td);rows.append(tr);
      for(const app of apps){
        const line=document.createElement("tr");
        const texts=[app.name,app.clicks,app.today,app.week,app.month,app.uniqueBrowsers];
        texts.forEach((v,i)=>{
          const cell=document.createElement("td");if(i)cell.className="num";
          cell.textContent=i ? format.format(v||0) : v;
          line.append(cell);
        });
        rows.append(line);
      }
    }
    const chart = $("chart");
    chart.replaceChildren();
    const days = new Map((data.daily || []).map(x => [x.date,x.count]));
    const today = new Date();
    const fmtDay = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Yangon",year:"numeric",month:"2-digit",day:"2-digit"});
    const parts = fmtDay.formatToParts(today);
    const year=Number(parts.find(x=>x.type==="year").value);
    const month=Number(parts.find(x=>x.type==="month").value);
    const day=Number(parts.find(x=>x.type==="day").value);
    const timeline=[];
    for(let i=29;i>=0;i--){
      const d=new Date(Date.UTC(year,month-1,day-i));
      const s=d.toISOString().slice(0,10);
      timeline.push({day:s,value:days.get(s)||0});
    }
    const max=Math.max(1,...timeline.map(v=>v.value));
    timeline.forEach(t=>{
      const bar=document.createElement("div");
      bar.className="bar";
      bar.style.height=Math.max(2,t.value/max*100)+"%";
      bar.title=t.day+" · "+t.value+" clicks";
      chart.appendChild(bar);
    });
    $("chartRange").textContent = timeline[0].day + " — " + timeline[timeline.length-1].day + " · Myanmar Time";
    $("lastUpdated").textContent = "နောက်ဆုံး Refresh — " + new Date(data.generatedAt || Date.now()).toLocaleString("en-GB",{timeZone:"Asia/Yangon",dateStyle:"medium",timeStyle:"short"}) + " MMT";
  }
  async function loadDashboard() {
    setBusy(true);
    try {
      const token=await accessToken();
      const data=await jsonRequest("/rest/v1/rpc/fc_download_portfolio_dashboard", {
        method:"POST", headers:{...headers,"Authorization":"Bearer "+token},body:"{}"
      });
      openDashboard();
      render(data);
      refreshNotificationHistory();
      setStatus("dashStatus","Statistics Update အောင်မြင်ပါပြီ။","ok");
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        showLogin();
        clearSession();
        setStatus("authStatus","ဒီအကောင့်ကို Statistics Admin အဖြစ် ခွင့်မပြုရသေးပါ။ သတ်မှတ်ထားသော Admin Email ဖြင့် ဝင်ပါ။","error");
      } else {
        if (!session) showLogin();
        setStatus(session ? "dashStatus" : "authStatus", e.message, "error");
      }
    } finally { setBusy(false); }
  }
  $("passwordForm").addEventListener("submit", async e=>{
    e.preventDefault();
    const email=$("email").value.trim();
    const password=$("password").value;
    if(!email || !password)return;
    setBusy(true);setStatus("authStatus","Login စစ်ဆေးနေပါသည်...");
    try{
      const data=await jsonRequest("/auth/v1/token?grant_type=password",{
        method:"POST", headers,body:JSON.stringify({email,password})
      });
      $("password").value="";
      saveSession(data);
      await loadDashboard();
    }catch(err){setStatus("authStatus",err.message,"error");}
    finally{setBusy(false);}
  });
  $("sendOtp").addEventListener("click",async()=>{
    const email=$("email").value.trim();
    if(!email){setStatus("authStatus","Email အရင်ဖြည့်ပါ။","error");return;}
    setBusy(true);
    try{
      await jsonRequest("/auth/v1/otp?redirect_to="+encodeURIComponent(new URL("admin.html",location.href).href),{method:"POST",headers,body:JSON.stringify({email,create_user:true})});
      $("otpFields").hidden=false;
      setStatus("authStatus","Email ထဲက Login Code ကို ဖြည့်ပါ။ Email Provider အလိုက် Magic Link လည်း ရောက်နိုင်ပါသည်။","ok");
    }catch(err){setStatus("authStatus",err.message,"error");}
    finally{setBusy(false);}
  });
  $("verifyOtp").addEventListener("click",async()=>{
    const email=$("email").value.trim(),token=$("otp").value.trim();
    if(!email||!token){setStatus("authStatus","Email နဲ့ Code ဖြည့်ပါ။","error");return;}
    setBusy(true);
    try{
      const data=await jsonRequest("/auth/v1/verify",{
        method:"POST",headers,body:JSON.stringify({email,token,type:"email"})
      });
      saveSession(data);
      $("otp").value="";
      await loadDashboard();
    }catch(err){setStatus("authStatus",err.message,"error");}
    finally{setBusy(false);}
  });
  const NOTIFY_API=BASE+"/functions/v1/future-code-updates";
  async function notificationApi(action, fields={}) {
    const token=await accessToken();
    return jsonRequest("/functions/v1/future-code-updates", {
      method:"POST",
      headers,
      body:JSON.stringify({action,token,...fields})
    });
  }
  async function refreshNotificationHistory(){
    const el=$("notificationHistory");if(!el)return;
    try {
      const data=await notificationApi("list");
      el.replaceChildren();
      const heading=document.createElement("p");
      heading.textContent="နောက်ဆုံး Notification များ ("+(data.notices||[]).length+")";
      el.append(heading);
      for(const notice of (data.notices||[]).slice(0,7)){
        const p=document.createElement("p");
        p.textContent="#"+notice.id+" · "+notice.app_id+" · "+notice.title;
        el.append(p);
      }
    }catch(e){el.textContent="Notification history: "+e.message;}
  }
  $("notificationForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const button=$("notificationSend"),app=$("notificationApp").value,
      title=$("notificationTitle").value.trim(),message=$("notificationMessage").value.trim();
    if(!title||!message)return;
    if(!confirm("Notification ကို "+app+" ထံ Publish လုပ်မလား?"))return;
    button.disabled=true;setStatus("notificationStatus","Publish လုပ်နေပါတယ်...");
    try{
      const result=await notificationApi("publish",{app,title,message});
      setStatus("notificationStatus","✓ Notification ထုတ်ပြီးပါပြီ (ID "+result.notice.id+"). App စစ်ဆေးချိန်မှာ ရောက်ပါမည်။","ok");
      $("notificationMessage").value="";await refreshNotificationHistory();
    }catch(error){setStatus("notificationStatus",error.message,"error");}
    finally{button.disabled=false;}
  });
  $("refresh").addEventListener("click",loadDashboard);
  $("logout").addEventListener("click",async()=>{
    const token=session?.access_token;
    clearSession();showLogin();setStatus("authStatus","Logout လုပ်ပြီးပါပြီ။","ok");
    if(token){try{await fetch(BASE+"/auth/v1/logout",{method:"POST",headers:{...headers,Authorization:"Bearer "+token}});}catch(_){}}
  });
  try{
    const saved=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");
    if(saved?.access_token&&saved?.refresh_token)session=saved;
  }catch(_){}
  // Supabase may send a verification magic link instead of a numeric OTP.
  // If the mail redirects back here with a hash token, finish sign-in.
  if (!session && location.hash && location.hash.includes("access_token=")) {
    try {
      const fields = new URLSearchParams(location.hash.slice(1));
      const token = fields.get("access_token");
      const refresh = fields.get("refresh_token");
      if (token && refresh) {
        saveSession({access_token:token,refresh_token:refresh,expires_in:Number(fields.get("expires_in") || 3600)});
        history.replaceState(null,"",location.pathname+location.search);
      }
    } catch (_) {}
  }
  if(session)loadDashboard();
})();
