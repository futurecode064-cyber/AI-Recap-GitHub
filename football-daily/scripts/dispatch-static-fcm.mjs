// Bridge existing GitHub static-data publication to owner's authenticated Cloudflare FCM Worker.
// No Firebase server private key is placed into this repository or bundled with APKs.
import {existsSync,readFileSync} from "node:fs";
import {resolve} from "node:path";
const ISO=/^\d{4}-\d{2}-\d{2}$/;
const SHA=/^[a-f0-9]{40}$/;
function previousDay(day){
 const d=new Date(day+"T12:00:00Z");
 if(Number.isNaN(d.valueOf()))throw new Error("Invalid day");
 d.setUTCDate(d.getUTCDate()-1);
 return d.toISOString().slice(0,10);
}
export function preparePayload(root,sourceCommit){
 if(!SHA.test(sourceCommit))throw new Error("40-character Git commit required");
 const base=resolve(root,"football-daily");
 const today=JSON.parse(readFileSync(resolve(base,"data/today.json"),"utf8"));
 const day=today.reportDate;
 if(!ISO.test(day)||!today.published)throw new Error("Today's published editorial data is required");
 const files=["data/today.json","data/odds/"+day+".json","data/archive/"+previousDay(day)+".json","data/odds/evening/"+day+".json"];
 const resources={};
 for(const file of files){
  const path=resolve(base,file);
  if(existsSync(path))resources[file]=JSON.parse(readFileSync(path,"utf8"));
 }
 return {editorialDate:day,version:sourceCommit,resources};
}
export async function notifyStaticSite(args,send=fetch){
 const {root=".",sha,token,url}=args;
 if(!token||token.length<32)throw new Error("FC_WORKER_ADMIN_TOKEN is missing/invalid");
 if(!/^https:\/\/[a-z0-9.-]+\.workers\.dev(?:\/)?$/i.test(url))throw new Error("Trusted Cloudflare Worker endpoint required");
 const payload=preparePayload(root,sha);
 const response=await send(url.replace(/\/$/,"")+"/api/admin/push-static",{
  method:"POST",
  headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
  body:JSON.stringify(payload)
 });
 const data=await response.json();
 if(!response.ok)throw new Error("FCM Worker refused request ("+response.status+"): "+(data.error||"unavailable"));
 if(["disabled","missing-firebase-secret","failed","partial"].includes(data.status))
  throw new Error("FCM was not completely sent ("+data.status+"): "+JSON.stringify(data).slice(0,350));
 return {day:payload.editorialDate,...data};
}
if(process.argv[1]&&import.meta.url===new URL("file://"+resolve(process.argv[1])).href){
 try{
  const result=await notifyStaticSite({
   root:process.cwd(),sha:process.env.GITHUB_SHA||"",
   token:process.env.FC_WORKER_ADMIN_TOKEN||"",
   url:process.env.FC_PUSH_WORKER_URL||"https://future-code-football-engine.futurecode-dubai-86851bf2.workers.dev"
  });
  console.log("FCM dispatch: "+JSON.stringify(result));
 }catch(e){
  console.error("FCM NOT SENT: "+String(e.message||e));
  process.exitCode=1;
 }
}
