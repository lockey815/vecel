const sb=supabase.createClient(CFG.SUPA,CFG.KEY);
const T={applications:["created_at","name","email","phone","skills","status"],messages:["created_at","name","email","message","status"],subscribers:["created_at","email","active"],donations:["created_at","name","email","amount","currency","status"],updates:["created_at","title"]};
const ST=["new","reviewed","contacted","done"];let cur="applications";
async function boot(){
  const{data:{session}}=await sb.auth.getSession();
  if(!session){$("#login").hidden=false;$("#panel").hidden=true;return}
  const{data}=await sb.from("admins").select("user_id").maybeSingle();
  if(!data){await sb.auth.signOut();$("#login").hidden=false;$("#ls").textContent="This account is not an admin.";return}
  $("#login").hidden=true;$("#panel").hidden=false;
  $("#tabs").innerHTML=[...Object.keys(T),"compose"].map(k=>`<button class="btn btn-ghost" data-t="${k}">${k}</button>`).join("");
  show(cur);
}
$("#tabs").onclick=e=>{const t=e.target.dataset.t;if(t){cur=t;show(t)}};
$("#login").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);
  const{error}=await sb.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});
  if(error)$("#ls").textContent=error.message;else boot()};
$("#out").onclick=async()=>{await sb.auth.signOut();boot()};
async function show(t){
  const v=$("#view");
  if(t==="compose"){
    v.innerHTML=`<h2>Post an update</h2><form id="up" class="stacked-form"><label>Title<input name="title" required maxlength="150"></label><label>Text<textarea name="body" rows="4" required></textarea></label><label>Image (optional)<input name="image" type="file" accept="image/*"></label><button class="btn">Publish update</button></form>
    <h2>Email all subscribers</h2><form id="bc" class="stacked-form"><label>Subject<input name="subject" required maxlength="150"></label><label>Message<textarea name="message" rows="5" required></textarea></label><button class="btn">Send to subscribers</button></form>`;
    $("#up").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),file=f.get("image");let image_url=null;
      if(file&&file.size){const p=`${Date.now()}-${file.name.replace(/[^\w.-]/g,"_")}`;
        const{error}=await sb.storage.from("updates").upload(p,file);if(error)return alert(error.message);
        image_url=sb.storage.from("updates").getPublicUrl(p).data.publicUrl}
      const{error}=await sb.from("updates").insert({title:f.get("title"),body:f.get("body"),image_url});
      alert(error?error.message:"Published");if(!error)e.target.reset()};
    $("#bc").onsubmit=async e=>{e.preventDefault();if(!confirm("Send this email to all active subscribers?"))return;
      const{data:{session}}=await sb.auth.getSession();
      try{alert((await api("submit",{type:"broadcast",...Object.fromEntries(new FormData(e.target))},session.access_token)).message)}catch(x){alert(x.message)}};
    return;
  }
  const{data,error}=await sb.from(t).select("*").order("created_at",{ascending:false}).limit(500);
  if(error)return v.textContent=error.message;
  let sum="";
  if(t==="donations"){const m={};data.filter(d=>d.status==="succeeded").forEach(d=>m[d.currency]=(m[d.currency]||0)+Number(d.amount));
    sum=`<p><b>Received:</b> ${esc(Object.entries(m).map(([c,a])=>a.toLocaleString()+" "+c).join(" · ")||"nothing yet")}</p>`}
  const hasStatus=t==="applications"||t==="messages";
  v.innerHTML=`<h2>${t} (${data.length})</h2>${sum}<div class="scroll"><table><tr>${T[t].map(c=>`<th>${c}</th>`).join("")}</tr>${data.map(r=>`<tr>${T[t].map(c=>
    c==="status"&&hasStatus?`<td><select data-id="${r.id}">${ST.map(s=>`<option ${s===r.status?"selected":""}>${s}</option>`).join("")}</select></td>`
    :`<td>${esc(c==="created_at"?new Date(r[c]).toLocaleString():r[c])}</td>`).join("")}</tr>`).join("")}</table></div>`;
  v.querySelectorAll("select").forEach(s=>s.onchange=()=>sb.from(t).update({status:s.value}).eq("id",s.dataset.id));
}
boot();
