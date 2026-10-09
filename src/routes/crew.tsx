import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/crew")({component:CrewPortal});
type User={id:string;name:string;role:"admin"|"cleaner"};
type Job={id:string;worker_id:string;day:string;building:string;car_plate:string;parking:string;customer_name:string;status:string;reason?:string|null;updated_at?:string|null};
async function request(path:string,opts?:RequestInit) {
 const resp=await fetch("/api/crew/"+path,{credentials:"same-origin",headers:{"content-type":"application/json",...opts?.headers},...opts});
 const body=await resp.json();if(!resp.ok)throw Error(body.error||"Server request failed");return body;
}
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Dubai",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
function CrewPortal(){
 const [user,setUser]=useState<User|null>(null),[id,setId]=useState(""),[pin,setPin]=useState(""),[date,setDate]=useState(today()),[jobs,setJobs]=useState<Job[]>([]);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false),[reasons,setReasons]=useState<Record<string,string>>({}),[workers,setWorkers]=useState<Array<{id:string;display_name:string}>>([]);
 const [newWorker,setNewWorker]=useState({id:"",name:"",pin:""}),[newJob,setNewJob]=useState({workerId:"",building:"",carPlate:"",parking:"",customerName:""});
 async function refresh(selected=date){try{const r=await request("jobs?date="+encodeURIComponent(selected));setJobs(r.jobs)}catch(e){setError(String(e))}}
 useEffect(()=>{request("me").then(r=>setUser(r.user)).catch(()=>{});},[]);
 useEffect(()=>{if(user){refresh(date);if(user.role==="admin")request("workers").then(r=>setWorkers(r.workers)).catch(()=>{});const t=setInterval(()=>refresh(date),15000);return()=>clearInterval(t)}},[user,date]);
 async function login(){setBusy(true);setError("");try{const r=await request("login",{method:"POST",body:JSON.stringify({id,pin})});setUser(r.user);setPin("")}catch(e){setError(String(e))}finally{setBusy(false)}}
 async function logout(){await request("logout",{method:"POST",body:"{}"}).catch(()=>{});setUser(null);setJobs([]);setWorkers([])}
 async function mark(job:Job,status:"done"|"delayed"|"skipped"){setBusy(true);setError("");try{await request("job-status",{method:"POST",body:JSON.stringify({id:job.id,status,reason:reasons[job.id]||""})});await refresh()}catch(e){setError(String(e))}finally{setBusy(false)}}
 async function addWorker(){setBusy(true);setError("");try{await request("workers",{method:"POST",body:JSON.stringify(newWorker)});setNewWorker({id:"",name:"",pin:""});const r=await request("workers");setWorkers(r.workers)}catch(e){setError(String(e))}finally{setBusy(false)}}
 async function addJob(){setBusy(true);setError("");try{await request("jobs",{method:"POST",body:JSON.stringify({...newJob,day:date})});setNewJob({workerId:"",building:"",carPlate:"",parking:"",customerName:""});await refresh()}catch(e){setError(String(e))}finally{setBusy(false)}}
 const done=jobs.filter(j=>j.status==="done").length,delayed=jobs.filter(j=>j.status==="delayed").length,skipped=jobs.filter(j=>j.status==="skipped").length;
 return <div className="min-h-screen bg-slate-50 p-4 text-slate-900"><main className="mx-auto max-w-4xl space-y-4">
   <header className="rounded-xl bg-slate-900 p-5 text-white"><h1 className="text-xl font-bold">VNS · Live Cleaner Portal</h1><p className="text-sm">Cloudflare D1 shared jobs · Secure employee access</p></header>
   {error&&<div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
   {!user?<section className="max-w-md space-y-4 rounded-xl border bg-white p-5">
    <h2 className="text-lg font-semibold">Employee sign-in</h2><label className="block text-sm">Employee ID<Input autoComplete="username" value={id} onChange={e=>setId(e.target.value)} placeholder="WRK001 or ADMIN001"/></label>
    <label className="block text-sm">PIN (6–12 digits)<Input type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={e=>setPin(e.target.value)}/></label>
    <Button disabled={busy||!id||!/^[0-9]{6,12}$/.test(pin)} onClick={login}>Sign in</Button><p className="text-xs text-slate-500">Accounts must first be created by the manager after setting up the D1 database.</p>
   </section>:<>
     <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"><div><strong>{user.name}</strong><p className="text-xs text-slate-500">{user.id} · {user.role}</p></div><Button variant="outline" onClick={logout}>Sign out</Button></div>
     <div className="rounded-xl border bg-white p-4">{user.role==="admin" ? <label className="text-sm font-semibold">Work date <Input className="mt-1 max-w-xs" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label> : <p className="text-sm font-semibold">Today\x27s assignments · {today()} (Dubai)</p>}<div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">{[["Assigned",jobs.length],["Done",done],["Delayed",delayed],["Skipped",skipped]].map(([label,n])=><div key={String(label)} className="rounded-lg bg-slate-100 p-2"><div className="text-xl font-bold">{n}</div>{label}</div>)}</div></div>
     <section className="space-y-3"><h2 className="text-lg font-bold">{user.role==="admin"?"Company job monitoring":"My assigned cars"} ({jobs.length})</h2>
       {date&&new Date(date+"T00:00:00Z").getUTCDay()===1&&<p className="rounded-lg bg-amber-100 p-3 font-semibold">Monday is the weekly holiday. No jobs should be assigned.</p>}
       {jobs.map(j=><article key={j.id} className="space-y-3 rounded-xl border bg-white p-4">
        <div className="flex justify-between gap-2"><div><strong>{j.car_plate}</strong><p className="text-sm">{j.building} · Parking {j.parking}</p><p className="text-sm text-slate-600">{j.customer_name}</p>{user.role==="admin"&&<p className="text-xs">Worker: {j.worker_id}</p>}</div><span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{j.status}</span></div>
        {j.reason&&<p className="rounded-lg bg-amber-50 p-2 text-sm">Reason: {j.reason}</p>}
        <Input placeholder="Reason required for delayed / skipped" value={reasons[j.id]??""} onChange={e=>setReasons(x=>({...x,[j.id]:e.target.value}))}/>
        <div className="flex flex-wrap gap-2"><Button disabled={busy||date!==today()} onClick={()=>mark(j,"done")}>Done</Button><Button variant="outline" disabled={busy||date!==today()||!reasons[j.id]?.trim()} onClick={()=>mark(j,"delayed")}>Delayed</Button><Button variant="outline" disabled={busy||date!==today()||!reasons[j.id]?.trim()} onClick={()=>mark(j,"skipped")}>Skipped</Button></div>
       </article>)}{!jobs.length&&<p className="rounded-xl border bg-white p-4 text-sm text-slate-600">No assignments for this date.</p>}
     </section>
     {user.role==="admin"&&<section className="space-y-4 rounded-xl border bg-white p-5"><h2 className="text-lg font-bold">Manager setup</h2>
       <div className="grid gap-2 sm:grid-cols-3"><Input placeholder="Employee ID e.g. WRK001" value={newWorker.id} onChange={e=>setNewWorker({...newWorker,id:e.target.value})}/><Input placeholder="Worker name" value={newWorker.name} onChange={e=>setNewWorker({...newWorker,name:e.target.value})}/><Input type="password" inputMode="numeric" placeholder="Unique PIN (6–12 digits)" value={newWorker.pin} onChange={e=>setNewWorker({...newWorker,pin:e.target.value})}/></div>
       <Button onClick={addWorker} disabled={busy||!newWorker.id||!newWorker.name||!/^[0-9]{6,12}$/.test(newWorker.pin)}>Create cleaner login</Button>
       <h3 className="font-semibold">Assign one job</h3>
       <select className="w-full rounded-md border p-2" value={newJob.workerId} onChange={e=>setNewJob({...newJob,workerId:e.target.value})}><option value="">Choose cleaner</option>{workers.filter(w=>w.id.startsWith("WRK")).map(w=><option key={w.id} value={w.id}>{w.display_name} ({w.id})</option>)}</select>
       <div className="grid gap-2 sm:grid-cols-2">{(["building","carPlate","parking","customerName"] as const).map(key=><Input key={key} placeholder={key} value={newJob[key]} onChange={e=>setNewJob({...newJob,[key]:e.target.value})}/>)}</div>
       <Button disabled={busy||!Object.values(newJob).every(Boolean)} onClick={addJob}>Add job for selected date</Button>
       <p className="text-xs text-slate-500">These are shared D1 records; they are separate from the original fictional local-browser demo. Bulk import and automatic subscription scheduling are not yet connected.</p>
     </section>}
   </>}
 </main></div>;
}