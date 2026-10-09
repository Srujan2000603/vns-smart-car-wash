import { env as cloudflareEnv } from "cloudflare:workers";
type D1Statement={bind:(...x:unknown[])=>D1Statement;first:<T=Record<string,unknown>>()=>Promise<T|null>;all:<T=Record<string,unknown>>()=>Promise<{results:T[]}>;run:()=>Promise<unknown>};
type DB={prepare:(s:string)=>D1Statement};
type Env={DB?:DB;BOOTSTRAP_SECRET?:string};
const json=(x:unknown,status=200,headers?:HeadersInit)=>new Response(JSON.stringify(x),{status,headers:{"content-type":"application/json","cache-control":"no-store",...headers}});
const bytes=(b:Uint8Array)=>Array.from(b).map(x=>x.toString(16).padStart(2,"0")).join("");
const random=()=>bytes(crypto.getRandomValues(new Uint8Array(32)));
async function sha(t:string){return bytes(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t))))}
async function pbkdf(pin:string,salt:string){const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);return bytes(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:100000,hash:"SHA-256"},k,256)))}
const validPin=(p:unknown)=>typeof p==="string" && /^\d{6,12}$/.test(p);
const validDay=(d:unknown)=>typeof d==="string" && /^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+"T00:00:00Z"));
const validStr=(s:unknown,max=150)=>typeof s==="string"&&s.trim().length>0&&s.length<=max;
const strictEqual=(a:string,b:string)=>a.length===b.length && a.split("").reduce((v,c,i)=>v | (c.charCodeAt(0)^b.charCodeAt(i)),0)===0;
function isSameOrigin(req:Request){const origin=req.headers.get("origin");if(!origin)return false;try{return new URL(origin).origin===new URL(req.url).origin}catch{return false}}
async function body(req:Request){if(Number(req.headers.get("content-length")||"0")>16000)throw Error("Request too large");return await req.json() as Record<string,unknown>}
type User={id:string;company_id:string;display_name:string;role:"admin"|"cleaner";pin_hash:string;pin_salt:string;active:number;failed_attempts:number;locked_until:number};
async function session(req:Request,db:DB):Promise<User|null>{
 const token=req.headers.get("cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith("vns_session="))?.slice(12);
 if(!token || !/^[a-f0-9]{64}$/.test(token))return null;
 const row=await db.prepare("SELECT u.* FROM crew_sessions s JOIN crew_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1").bind(await sha(token),Date.now()).first<User>();
 return row??null;
}
function view(u:User){return {id:u.id,name:u.display_name,role:u.role}}
export async function handleCrewApi(req:Request,env:unknown):Promise<Response>{
 const e={...(env as Env | undefined),...(cloudflareEnv as Env)};const db=e?.DB;
 if(!db)return json({error:"Cloudflare D1 is not configured. Do not use real customer data."},503);
 const path=new URL(req.url).pathname;const method=req.method;
 if(path==="/api/crew/health"&&method==="GET"){
   try{
     const tables=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('crew_users','crew_sessions','crew_jobs')").all<{name:string}>();
     const present=tables.results.map(x=>x.name);
     const missing=["crew_users","crew_sessions","crew_jobs"].filter(x=>!present.includes(x));
     return json({database:"connected",schema:missing.length?"incomplete":"ready",missingTables:missing});
   }catch(err){console.error("VNS D1 health check error",err);return json({database:"error",error:"Database query failed; inspect Cloudflare Worker logs"},500)}
 }
 if(method!=="GET"&&!isSameOrigin(req))return json({error:"Cross-site request refused"},403);
 try{
 if(path==="/api/crew/bootstrap"&&method==="POST"){
  const secret=req.headers.get("x-bootstrap-secret");
  if(!e.BOOTSTRAP_SECRET || !secret || !strictEqual(secret,e.BOOTSTRAP_SECRET))return json({error:"Unauthorized"},401);
  const old=await db.prepare("SELECT id FROM crew_users LIMIT 1").first();
  if(old)return json({error:"Already initialized"},409);
  const b=await body(req);if(!validPin(b.pin)||!validStr(b.name)||!validStr(b.companyId,60))return json({error:"Supply companyId, name and unique 6-12 digit PIN"},400);
  const salt=random();await db.prepare("INSERT INTO crew_users(id,company_id,display_name,role,pin_salt,pin_hash) VALUES(?,?,?,?,?,?)").bind("ADMIN001",b.companyId,b.name,"admin",salt,await pbkdf(b.pin as string,salt)).run();
  return json({created:true,adminId:"ADMIN001"});
 }
 if(path==="/api/crew/login"&&method==="POST"){
  const b=await body(req);if(!validStr(b.id,60)||!validPin(b.pin))return json({error:"Invalid credentials"},401);
  const u=await db.prepare("SELECT * FROM crew_users WHERE id=?").bind(b.id).first<User>();
  if(!u||!u.active||u.locked_until>Date.now())return json({error:"Invalid credentials or locked account"},401);
  const hash=await pbkdf(b.pin as string,u.pin_salt);
  if(!strictEqual(hash,u.pin_hash)){
   const attempts=u.failed_attempts+1;await db.prepare("UPDATE crew_users SET failed_attempts=?, locked_until=? WHERE id=?").bind(attempts>=5?0:attempts,attempts>=5?Date.now()+15*60*1000:0,u.id).run();
   return json({error:"Invalid credentials"},401);
  }
  await db.prepare("UPDATE crew_users SET failed_attempts=0,locked_until=0 WHERE id=?").bind(u.id).run();
  const token=random(),expires=Date.now()+8*60*60*1000;
  await db.prepare("INSERT INTO crew_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").bind(await sha(token),u.id,expires).run();
  return json({user:view(u)},200,{"set-cookie":`vns_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/api/crew; Max-Age=28800`});
 }
 const u=await session(req,db);if(!u)return json({error:"Sign in required"},401);
 if(path==="/api/crew/me"&&method==="GET")return json({user:view(u)});
 if(path==="/api/crew/logout"&&method==="POST"){
  const token=req.headers.get("cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith("vns_session="))?.slice(12);
  if(token)await db.prepare("DELETE FROM crew_sessions WHERE token_hash=?").bind(await sha(token)).run();
  return json({ok:true},200,{"set-cookie":"vns_session=; HttpOnly; Secure; SameSite=Strict; Path=/api/crew; Max-Age=0"});
 }
 if(path==="/api/crew/jobs"&&method==="GET"){
  const date=new URL(req.url).searchParams.get("date");
  if(!validDay(date))return json({error:"Valid date required"},400);
  const todayDubai=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Dubai",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  if(u.role==="cleaner"&&date!==todayDubai)return json({error:"Cleaners may only view today\x27s assigned jobs"},403);
  const monday=new Date(date+"T00:00:00Z").getUTCDay()===1;
  const sql=u.role==="admin"
   ?"SELECT id,worker_id,day,building,car_plate,parking,customer_name,status,reason,updated_at FROM crew_jobs WHERE company_id=? AND day=? ORDER BY worker_id,building,parking"
   :"SELECT id,worker_id,day,building,car_plate,parking,customer_name,status,reason,updated_at FROM crew_jobs WHERE company_id=? AND day=? AND worker_id=? ORDER BY building,parking";
  const result=await db.prepare(sql).bind(...(u.role==="admin"?[u.company_id,date]:[u.company_id,date,u.id])).all();
  return json({day:date,mondayOff:monday,jobs:result.results});
 }
 if(path==="/api/crew/job-status"&&method==="POST"){
  const b=await body(req);
  if(!validStr(b.id,80)||!["done","delayed","skipped"].includes(String(b.status))||((b.status==="delayed"||b.status==="skipped")&&!validStr(b.reason,300)))return json({error:"Status or reason invalid"},400);
  const job=await db.prepare("SELECT id,worker_id,day,status FROM crew_jobs WHERE id=? AND company_id=?").bind(b.id,u.company_id).first<{id:string;worker_id:string;day:string;status:string}>();
  if(!job || (u.role!=="admin"&&job.worker_id!==u.id))return json({error:"Not allowed"},403);
  if(job.day!==new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Dubai",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()))return json({error:"Only today's jobs may be changed"},409);
  if(new Date(job.day+"T00:00:00Z").getUTCDay()===1)return json({error:"Monday is a holiday"},409);
  if(job.status==="done"&&u.role!=="admin")return json({error:"Completed work can only be corrected by a manager"},409);
  await db.prepare("UPDATE crew_jobs SET status=?,reason=?,updated_by=?,updated_at=? WHERE id=? AND company_id=?").bind(b.status,b.status==="done"?null:b.reason,u.id,new Date().toISOString(),job.id,u.company_id).run();
  return json({ok:true});
 }
 if(u.role!=="admin")return json({error:"Admin only"},403);
 if(path==="/api/crew/workers"&&method==="GET"){
  const r=await db.prepare("SELECT id,display_name,role,active FROM crew_users WHERE company_id=? ORDER BY id").bind(u.company_id).all();return json({workers:r.results});
 }
 if(path==="/api/crew/workers"&&method==="POST"){
  const b=await body(req);if(!validStr(b.id,60)||!validStr(b.name)||!validPin(b.pin)||!/^WRK[0-9A-Z_-]{2,30}$/.test(String(b.id)))return json({error:"Use WRK... employee ID, name, unique 6-12 digit PIN"},400);
  const salt=random();await db.prepare("INSERT INTO crew_users(id,company_id,display_name,role,pin_salt,pin_hash) VALUES(?,?,?,?,?,?)").bind(b.id,u.company_id,b.name,"cleaner",salt,await pbkdf(b.pin as string,salt)).run();return json({created:true,id:b.id},201);
 }
 if(path==="/api/crew/jobs"&&method==="POST"){
  const b=await body(req);if(!validDay(b.day)||!validStr(b.workerId,60)||!validStr(b.building)||!validStr(b.carPlate,60)||!validStr(b.parking,80)||!validStr(b.customerName))return json({error:"Missing job fields"},400);
  if(new Date((b.day as string)+"T00:00:00Z").getUTCDay()===1)return json({error:"Monday is a holiday"},400);
  const worker=await db.prepare("SELECT id FROM crew_users WHERE id=? AND company_id=? AND role='cleaner' AND active=1").bind(b.workerId,u.company_id).first();
  if(!worker)return json({error:"Worker does not belong to your company"},403);
  const id=random().slice(0,32);
  await db.prepare("INSERT INTO crew_jobs(id,company_id,worker_id,day,building,car_plate,parking,customer_name) VALUES(?,?,?,?,?,?,?,?)").bind(id,u.company_id,b.workerId,b.day,b.building,b.carPlate,b.parking,b.customerName).run();return json({created:true,id},201);
 }
 return json({error:"Unknown API route"},404);
 }catch(err){console.error("VNS crew API failure",path,err);const msg=String(err);if(msg.includes("UNIQUE constraint"))return json({error:"Record already exists"},409);return json({error:"Request rejected; check setup and database migrations"},500)}
}