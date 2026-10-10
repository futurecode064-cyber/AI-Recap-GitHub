'use strict';
// Preserve existing browser device keys and sessions across the portal update.
window.FCStudentAccess=(()=>{
 const API='https://mxwervqihaqlxybghdak.supabase.co/functions/v1/video-studio-gate';
 const DB_NAME='fc_video_student_keys_v1',STORE='device_keys',TOKEN='fc_student_browser_session',USER='fc_student_username';
 class AccessError extends Error{constructor(message,status=0){super(message);this.status=status}}
 async function post(action,fields={}){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),25000);
  try{
   const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...fields,action}),signal:c.signal});
   const data=await res.json().catch(()=>null);
   if(!res.ok)throw new AccessError(data?.error||'Server error (HTTP '+res.status+')',res.status);
   if(!data)throw new AccessError('Server response မမှန်ပါ။ ပြန်စမ်းပါ။');
   return data;
  }catch(e){if(e.name==='AbortError')throw new AccessError('အချိန်ကြာနေပါတယ်။ အင်တာနက် / VPN စစ်ပြီး ပြန်စမ်းပါ။');throw e}finally{clearTimeout(t)}
 }
 function dbOpen(){return new Promise((r,j)=>{const q=indexedDB.open(DB_NAME,1);q.onupgradeneeded=()=>q.result.createObjectStore(STORE);q.onsuccess=()=>r(q.result);q.onerror=()=>j(new AccessError('Device storage မရပါ။ Browser site storage ကို ခွင့်ပြုပါ။'))})}
 async function deviceKey(name){
  const d=await dbOpen();
  try{
   const existing=await new Promise((r,j)=>{const q=d.transaction(STORE,'readonly').objectStore(STORE).get(name);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});
   if(existing)return existing;
   const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
   await new Promise((r,j)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(pair,name);tx.oncomplete=r;tx.onerror=()=>j(tx.error);tx.onabort=()=>j(tx.error)});
   return pair;
  }finally{d.close()}
 }
 function base64(b){let s='';for(const n of new Uint8Array(b))s+=String.fromCharCode(n);return btoa(s)}
 async function proof(pair,text){return base64(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,new TextEncoder().encode(text)))}
 function session(){return {token:sessionStorage.getItem(TOKEN)||'',username:sessionStorage.getItem(USER)||''}}
 function clear(){sessionStorage.removeItem(TOKEN);sessionStorage.removeItem(USER)}
 async function login(username,password){
  username=username.trim().toLowerCase();if(!/^[a-z0-9._-]{3,40}$/.test(username))throw new AccessError('Username a-z, 0-9 နဲ့ 3 လုံးအနည်းဆုံး လိုပါတယ်။');
  const pair=await deviceKey(username),nonce=(await post('challenge',{username})).nonce;
  const spki=base64(await crypto.subtle.exportKey('spki',pair.publicKey)),signature=await proof(pair,username+'|'+nonce);
  const data=await post('student_login',{username,password,nonce,spki,signature});
  sessionStorage.setItem(TOKEN,data.token);sessionStorage.setItem(USER,username);return data;
 }
 async function me(){
  const s=session();if(!s.token||!s.username)throw new AccessError('Student Login ဝင်ပါ။',401);
  const pair=await deviceKey(s.username),timestamp=Date.now(),signature=await proof(pair,'me|'+s.token+'|'+timestamp);
  return post('student_me',{token:s.token,timestamp,signature});
 }
 async function logout(){const {token}=session();clear();if(token)await post('logout',{token}).catch(()=>{})}
 return {login,me,logout,session,clear,AccessError};
})();
