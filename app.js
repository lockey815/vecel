const esc=s=>String(s??"").replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
const $=s=>document.querySelector(s);
async function api(path,body,token){
  const r=await fetch(CFG.SUPA+"/functions/v1/"+path,{method:"POST",
    headers:{"Content-Type":"application/json",apikey:CFG.KEY,Authorization:"Bearer "+(token||CFG.KEY)},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||"Something went wrong. Please try again.");
  return j;
}
if($("#nav"))$("#nav").innerHTML=`<header class="nav"><div class="container nav-inner"><a href="index.html" class="logo"><span class="logo-mark">JHIE</span><span class="logo-text">JS Health Initiative</span></a><nav class="nav-links"><a href="index.html">Home</a><a href="volunteer.html">Volunteer</a><a href="contact.html">Contact</a><a href="donate.html" class="btn">Donate</a></nav></div></header>`;
if($("#foot"))$("#foot").innerHTML=`<footer><div class="container footer-inner"><div><p>&copy; ${new Date().getFullYear()} JS Health Initiative East Africa Ltd. Registered in Uganda · Company limited by guarantee.</p><p class="muted">Mbarara · P.O. Box 424082</p></div><form class="stacked-form" data-type="subscribe"><label>Get updates<input name="email" type="email" placeholder="you@example.com" required></label><button class="btn">Subscribe</button><p class="form-status" role="status"></p></form></div></footer>`;

// All public forms: <form data-type="contact|volunteer|subscribe|donate">
document.querySelectorAll("form[data-type]").forEach(f=>{
  f.insertAdjacentHTML("afterbegin",'<input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">'); // spam honeypot
  f.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{f.amount.value=b.dataset.a});
  f.addEventListener("submit",async e=>{
    e.preventDefault();
    const s=f.querySelector(".form-status"),b=f.querySelector("button:not([type=button])");
    if(!f.checkValidity()){f.reportValidity();return}
    const d=Object.fromEntries(new FormData(f));d.type=f.dataset.type;
    b.disabled=true;s.textContent=d.type==="donate"?"Opening secure payment page…":"Sending…";
    try{
      const j=await api(d.type==="donate"?"donate":"submit",d);
      if(j.link){location.href=j.link;return}
      s.textContent=j.message;f.reset();
    }catch(x){s.textContent=x.message}
    b.disabled=false;
  });
});

// Donation return banner (Flutterwave appends ?status=)
if($("#banner")){const st=new URLSearchParams(location.search).get("status");
  if(st)$("#banner").innerHTML=(st==="successful"||st==="completed")
    ?'<div class="banner">Thank you for your donation! A receipt will be emailed to you once the payment is confirmed.</div>'
    :'<div class="banner bad">The payment was not completed. You have not been charged. You can try again below.</div>';}

// Unsubscribe link from emails
const un=new URLSearchParams(location.search).get("unsub");
if(un)api("submit",{type:"unsubscribe",token:un}).then(j=>alert(j.message)).catch(()=>{});

// Latest updates (public read of published rows only)
if($("#updates"))fetch(CFG.SUPA+"/rest/v1/updates?published=eq.true&order=created_at.desc&limit=3",{headers:{apikey:CFG.KEY}})
  .then(r=>r.json()).then(a=>{$("#updates").innerHTML=Array.isArray(a)&&a.length
    ?a.map(u=>`<article class="feature">${u.image_url?`<img src="${esc(u.image_url)}" alt="">`:""}<h3>${esc(u.title)}</h3><p>${esc(u.body)}</p></article>`).join("")
    :'<p class="muted">No updates yet. Subscribe below to be the first to hear from us.</p>'}).catch(()=>{});
