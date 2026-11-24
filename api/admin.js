const ADMIN='60311c4f-a3c2-4f31-8c3c-ed327d9aaea3';
module.exports=async(req,res)=>{
res.setHeader('Cache-Control','no-store');
if(req.method!=='POST')return res.status(405).json({error:'method'});
const url=(process.env.SUPABASE_URL||'').replace(/\/$/,'');const key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!url||!key)return res.status(503).json({error:'configuration'});
const b=req.body||{};try{
if(b.action==='login'){
if(typeof b.email!=='string'||typeof b.password!=='string')return res.status(400).json({error:'validation'});
const r=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:b.email,password:b.password})});
if(!r.ok)return res.status(401).json({error:'login'});const x=await r.json();if(x.user?.id!==ADMIN)return res.status(403).json({error:'role'});return res.json({token:x.access_token});}
const auth=req.headers.authorization;if(!auth?.startsWith('Bearer '))return res.status(401).json({error:'auth'});
const headers={apikey:key,Authorization:auth,'Content-Type':'application/json'};
const u=await fetch(url+'/auth/v1/user',{headers});if(!u.ok)return res.status(401).json({error:'auth'});if((await u.json()).id!==ADMIN)return res.status(403).json({error:'role'});
const base=url+'/rest/v1/customer_requests';
if(b.action==='list'){const r=await fetch(base+'?select=id,full_name,phone,request_details,status,appointment_date,payment_status&order=id.desc&limit=500',{headers});if(!r.ok)return res.status(502).json({error:'database'});return res.json({rows:await r.json()});}
if(b.action==='update'){if(!Number.isSafeInteger(b.id)||b.id<1||!['Νέο αίτημα','Εγκρίθηκε','Απορρίφθηκε','Ολοκληρώθηκε'].includes(b.status)||(b.appointment_date!==null&&(typeof b.appointment_date!=='string'||!Number.isFinite(Date.parse(b.appointment_date)))))return res.status(400).json({error:'validation'});const r=await fetch(base+'?id=eq.'+b.id,{method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({status:b.status,appointment_date:b.appointment_date})});if(!r.ok||!(await r.json()).length)return res.status(502).json({error:'database'});return res.json({ok:true});}
return res.status(400).json({error:'action'});
}catch{return res.status(502).json({error:'connection'});}};
