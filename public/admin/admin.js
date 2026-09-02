const loginBox =
document.getElementById("loginBox");

const dashboard =
document.getElementById("dashboard");

const loginForm =
document.getElementById("loginForm");

const loginMessage =
document.getElementById("loginMessage");


async function checkLogin(){

try{

const res =
await fetch("/api/admin/content");

if(res.ok){

showDashboard();

loadContent();
loadDiary();
loadProjects();

}

}catch(e){}

}


function showDashboard(){

loginBox.classList.add("hidden");
dashboard.classList.remove("hidden");

}


loginForm.addEventListener("submit",async e=>{

e.preventDefault();

loginMessage.textContent="প্রবেশ করা হচ্ছে...";

try{

const res=await fetch("/api/admin/login",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

username:
document.getElementById("username").value,

password:
document.getElementById("password").value

})

});

const data=await res.json();

if(!res.ok){

loginMessage.textContent=
data.error || "লগইন ব্যর্থ হয়েছে।";

return;

}

showDashboard();

loadContent();
loadDiary();
loadProjects();

}catch(err){

loginMessage.textContent=
"সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।";

}

});


async function loadContent(){

try{

const res=
await fetch("/api/admin/content");

if(!res.ok)return;

const data=
await res.json();

document.getElementById("siteName").value=
data.name || "";

document.getElementById("tagline").value=
data.tagline || "";

document.getElementById("college").value=
data.college || "";

document.getElementById("education").value=
data.education || "";

document.getElementById("photo").value=
data.photo || "";

document.getElementById("about").value=
data.about || "";

}catch(e){}

}


document
.getElementById("saveContent")
.addEventListener("click",async()=>{

const message=
document.getElementById("saveMessage");

message.textContent=
"সংরক্ষণ করা হচ্ছে...";

const content={

name:
document.getElementById("siteName").value,

tagline:
document.getElementById("tagline").value,

college:
document.getElementById("college").value,

education:
document.getElementById("education").value,

photo:
document.getElementById("photo").value,

about:
document.getElementById("about").value

};

try{

const res=
await fetch("/api/admin/content",{

method:"PUT",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(content)

});

if(res.ok){

message.textContent=
"✓ তথ্য সফলভাবে সংরক্ষণ হয়েছে।";

}else{

message.textContent=
"তথ্য সংরক্ষণ করা যায়নি।";

}

}catch(e){

message.textContent=
"সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।";

}

});


const diaryForm=
document.getElementById("diaryForm");


diaryForm.addEventListener("submit",async e=>{

e.preventDefault();

try{

const res=
await fetch("/api/admin/diary",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

title:
document.getElementById("diaryTitle").value,

content:
document.getElementById("diaryContent").value,

excerpt:
document.getElementById("diaryExcerpt").value

})

});

if(res.ok){

diaryForm.reset();

loadDiary();

alert("ডায়েরি যোগ হয়েছে ✓");

}else{

alert("ডায়েরি যোগ করা যায়নি।");

}

}catch(e){

alert("সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।");

}

});


async function loadDiary(){

const box=
document.getElementById("diaryList");

try{

const res=
await fetch("/api/admin/diary");

if(!res.ok)return;

const data=
await res.json();

box.innerHTML="";

data.forEach(item=>{

const div=
document.createElement("div");

div.className="item";

div.innerHTML=`

<h3>${escapeHtml(item.title)}</h3>

<p>
${escapeHtml(item.excerpt || "")}
</p>

<button class="delete">
মুছে ফেলুন
</button>

`;

div.querySelector(".delete")
.onclick=()=>deleteDiary(item.id);

box.appendChild(div);

});

}catch(e){}

}


async function deleteDiary(id){

if(!confirm("এই অধ্যায়টি মুছে ফেলতে চান?"))
return;

const res=
await fetch("/api/admin/diary/"+id,{

method:"DELETE"

});

if(res.ok){

loadDiary();

}

}


const projectForm=
document.getElementById("projectForm");


projectForm.addEventListener("submit",async e=>{

e.preventDefault();

try{

const res=
await fetch("/api/admin/projects",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

title:
document.getElementById("projectTitle").value,

category:
document.getElementById("projectCategory").value,

description:
document.getElementById("projectDescription").value,

link:
document.getElementById("projectLink").value

})

});

if(res.ok){

projectForm.reset();

loadProjects();

alert("প্রকল্প যোগ হয়েছে ✓");

}else{

alert("প্রকল্প যোগ করা যায়নি।");

}

}catch(e){

alert("সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।");

}

});


async function loadProjects(){

const box=
document.getElementById("projectList");

try{

const res=
await fetch("/api/admin/projects");

if(!res.ok)return;

const data=
await res.json();

box.innerHTML="";

data.forEach(item=>{

const div=
document.createElement("div");

div.className="item";

div.innerHTML=`

<h3>
${escapeHtml(item.title)}
</h3>

<p>
${escapeHtml(item.description || "")}
</p>

<button class="delete">
মুছে ফেলুন
</button>

`;

div.querySelector(".delete")
.onclick=()=>deleteProject(item.id);

box.appendChild(div);

});

}catch(e){}

}


async function deleteProject(id){

if(!confirm("এই প্রকল্পটি মুছে ফেলতে চান?"))
return;

const res=
await fetch("/api/admin/projects/"+id,{

method:"DELETE"

});

if(res.ok){

loadProjects();

}

}


document
.getElementById("logout")
.addEventListener("click",async()=>{

await fetch("/api/admin/logout",{
method:"POST"
});

location.reload();

});


function escapeHtml(text){

const div=
document.createElement("div");

div.textContent=text ?? "";

return div.innerHTML;

}


checkLogin();
