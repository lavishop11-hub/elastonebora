module.exports = async (req,res) => {
  if(req.method !== 'POST') return res.status(405).json({error:'method'});
  const {name,phone,product}=req.body||{};
  if(typeof name!=='string'||!name.trim()||name.length>90||typeof phone!=='string'||! /^(\+30)?69\d{8}$/.test(phone)||typeof product!=='string'||!product.trim()||product.length>500) return res.status(400).json({error:'validation'});
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key) return res.status(503).json({error:'configuration'});
  try {
    const r=await fetch(url.replace(/\/$/,'')+'/rest/v1/customer_requests',{method:'POST',headers:{apikey:key,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({full_name:name.trim(),phone,request_details:product.trim(),status:'Νέο αίτημα',duration_minutes:60,appointment_price:40,payment_status:'pending',contact_method:'Viber'})});
    if(!r.ok) return res.status(502).json({error:'database'});
    return res.status(201).json({ok:true});
  } catch {return res.status(502).json({error:'connection'});}
};
