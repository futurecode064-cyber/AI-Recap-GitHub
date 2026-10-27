import { createRemoteJWKSet, jwtVerify } from "npm:jose@6.1.0";
import postgres from "npm:postgres@3.4.7";
const jwks=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"));
const repo="futurecode064-cyber/AI-Recap-GitHub";
const expectedWorkflow=repo+"/.github/workflows/english-academy-apk.yml@refs/heads/main";
const db=postgres(Deno.env.get("SUPABASE_DB_URL")!,{max:1,prepare:false,ssl:"require",connect_timeout:7,idle_timeout:5});
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"no-store"}});
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return reply({error:"method"},405);
 const auth=req.headers.get("Authorization")||"";
 if(!auth.startsWith("Bearer ")||auth.length>10000)return reply({error:"unauthorized"},401);
 try {
   const {payload}=await jwtVerify(auth.slice(7),jwks,{issuer:"https://token.actions.githubusercontent.com",audience:"future-code-english-signing-v1",algorithms:["RS256"]});
   if(payload.repository!==repo||payload.ref!=="refs/heads/main"||payload.workflow_ref!==expectedWorkflow||!(payload.event_name==="push"||payload.event_name==="workflow_dispatch"))return reply({error:"forbidden"},403);
 } catch { return reply({error:"unauthorized"},401); }
 try {
   if(Number(req.headers.get("content-length")||"0")>2000)return reply({error:"large request"},413);
   const body=await req.json();
   if(body.action!=="get")return reply({error:"invalid action"},400);
   const rows=await db`select store_password,keystore_b64,key_alias from app_private.fc_english_signing where id=1 limit 1`;
   if(!rows.length)return reply({ready:false});
   return reply({ready:true,store_password:rows[0].store_password,keystore_b64:rows[0].keystore_b64,key_alias:rows[0].key_alias});
 } catch { return reply({error:"internal"},500); }
});
