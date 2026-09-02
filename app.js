async function site(){return (await fetch("/api/site")).json()}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
async function loadHome(){
 const d=await site(), c=d.content;
 const n=document.getElementById("name"),i=document.getElementById("intro");
 if(n)n.innerHTML=esc(c.name).replace(" ","<br>")+"<br><em>Ray</em>";
 if(i)i.textContent=c.intro;
 const hb=document.getElementById("heroBtns");
 if(hb)hb.innerHTML=d.buttons.filter(x=>x.location==="hero").map((b,j)=>`<a class="btn ${j?'alt':''}" href="${esc(b.url)}">${esc(b.label)} ${esc(b.icon)}</a>`).join("");
}
async function loadDiary(){
 const d=await site(), g=document.getElementById("diaryGrid");
 g.innerHTML=d.diary.map(x=>`<article><small>${esc(x.chapter)}</small><h3>${esc(x.title)}</h3><p>${esc(x.excerpt)}</p><button class="btn alt" onclick='openDiary(${JSON.stringify(x)})'>Open Chapter →</button></article>`).join("");
}
function openDiary(x){reader.classList.add("open");rchapter.textContent=x.chapter;rtitle.textContent=x.title;rbody.textContent=x.body}
async function loadContacts(){
 const c=(await site()).content, el=document.getElementById("contacts");
 const items=[["Facebook",c.facebook],["Twitter / X",c.twitter],["WhatsApp",c.whatsapp],["Mobile",c.mobile],["Gmail",c.gmail]];
 el.innerHTML=items.map(([n,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener"><span>${n}</span><strong>Connect →</strong></a>`).join("");
}
const dots=document.getElementById("dots"), mobile=document.getElementById("mobile");
if(dots){dots.onclick=()=>{mobile.classList.toggle("open");if(!mobile.innerHTML)mobile.innerHTML=["Home","About","Education","Diary","Projects","Contact"].map(x=>`<a href="${x==="Home"?"/":"/"+x.toLowerCase()+".html"}">${x}</a>`).join("")}}
document.getElementById("year")&&(document.getElementById("year").textContent=new Date().getFullYear());
if(location.pathname==="/"||location.pathname==="/index.html")loadHome();
