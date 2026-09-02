const express = require("express");
const path = require("path");
const session = require("express-session");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 10000;

// =====================================================
// DATABASE
// =====================================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "prosenjit-change-this-secret",

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// =====================================================
// DATABASE SETUP
// =====================================================

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id INTEGER PRIMARY KEY,
        data JSONB NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS diary (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT DEFAULT '',
        visible BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await pool.query(
      "SELECT id FROM site_content WHERE id = 1"
    );

    if (result.rows.length === 0) {
      const data = {
        name: "Prosenjit Ray",

        college:
          "Dinajpur Government College",

        education:
          "Honours 1st Year",

        about:
          "I am Prosenjit Ray, an Honours 1st Year student at Dinajpur Government College. I believe every chapter of life deserves to be remembered.",

        skills: [
          "Creative Thinking",
          "Web Design",
          "Communication"
        ],

        projects: [],

        social: {
          facebook: "",
          instagram: "",
          github: "",
          email: ""
        }
      };

      await pool.query(
        "INSERT INTO site_content (id, data) VALUES (1, $1)",
        [JSON.stringify(data)]
      );
    }

    console.log("Database initialized successfully.");

  } catch (error) {
    console.error(
      "Database initialization error:",
      error.message
    );
  }
}

// =====================================================
// HELPER
// =====================================================

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =====================================================
// STATIC FILES
// =====================================================

app.use(
  express.static(__dirname, {
    index: false
  })
);

// =====================================================
// PUBLIC HOME
// =====================================================

app.get("/", async (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>

<title>Prosenjit Ray</title>

<meta
name="description"
content="Personal website of Prosenjit Ray"
/>

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
}

html{
scroll-behavior:smooth;
}

body{

font-family:
Inter,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
sans-serif;

background:
radial-gradient(
circle at 15% 10%,
rgba(93,111,255,.18),
transparent 35%
),

radial-gradient(
circle at 85% 30%,
rgba(0,210,255,.10),
transparent 35%
),

#05070b;

color:#fff;

min-height:100vh;

}

a{
text-decoration:none;
color:inherit;
}

.container{

width:min(1120px,92%);
margin:auto;

}


/* NAV */

nav{

position:fixed;

top:0;
left:0;
right:0;

z-index:1000;

background:
rgba(5,7,11,.72);

backdrop-filter:blur(18px);

border-bottom:
1px solid rgba(255,255,255,.08);

}

.nav-inner{

height:72px;

display:flex;

align-items:center;

justify-content:space-between;

}

.logo{

font-size:21px;

font-weight:800;

letter-spacing:-.5px;

}

.logo span{
opacity:.35;
}

.nav-links{

display:flex;

gap:28px;

}

.nav-links a{

font-size:14px;

opacity:.65;

transition:.25s;

}

.nav-links a:hover{
opacity:1;
}

.menu{

display:none;

width:43px;

height:43px;

border-radius:13px;

border:
1px solid rgba(255,255,255,.12);

background:
rgba(255,255,255,.06);

color:#fff;

font-size:23px;

cursor:pointer;

}

.mobile-menu{

display:none;

padding:10px 0 20px;

}

.mobile-menu a{

display:block;

padding:14px 0;

border-bottom:
1px solid rgba(255,255,255,.07);

opacity:.75;

}


/* HERO */

.hero{

min-height:100vh;

display:flex;

align-items:center;

padding-top:72px;

}

.hero-grid{

display:grid;

grid-template-columns:
1.15fr .85fr;

gap:70px;

align-items:center;

}

.badge{

display:inline-block;

padding:8px 13px;

border-radius:50px;

border:
1px solid rgba(255,255,255,.1);

background:
rgba(255,255,255,.05);

font-size:11px;

letter-spacing:2px;

opacity:.7;

margin-bottom:22px;

}

h1{

font-size:
clamp(50px,8vw,88px);

line-height:.94;

letter-spacing:-5px;

margin-bottom:25px;

}

.gradient{

background:
linear-gradient(
110deg,
#fff,
#aab5ff,
#78eaff
);

-webkit-background-clip:text;

background-clip:text;

color:transparent;

}

.hero-description{

max-width:580px;

font-size:17px;

line-height:1.8;

color:
rgba(255,255,255,.55);

margin-bottom:30px;

}

.buttons{

display:flex;

gap:12px;

flex-wrap:wrap;

}

.btn{

padding:14px 21px;

border-radius:13px;

border:
1px solid rgba(255,255,255,.12);

background:
rgba(255,255,255,.06);

font-size:14px;

transition:.25s;

}

.btn:hover{

transform:translateY(-3px);

background:
rgba(255,255,255,.12);

}

.btn-primary{

background:#fff;

color:#000;

font-weight:700;

}


/* HERO CARD */

.hero-card{

min-height:430px;

border-radius:32px;

border:
1px solid rgba(255,255,255,.1);

background:
linear-gradient(
145deg,
rgba(255,255,255,.09),
rgba(255,255,255,.025)
);

display:flex;

align-items:center;

justify-content:center;

position:relative;

overflow:hidden;

box-shadow:
0 40px 100px rgba(0,0,0,.4);

}

.hero-card:before{

content:"";

position:absolute;

width:220px;

height:220px;

border-radius:50%;

background:
rgba(120,140,255,.18);

filter:blur(55px);

}

.avatar{

position:relative;

width:190px;

height:190px;

border-radius:50%;

display:flex;

align-items:center;

justify-content:center;

font-size:65px;

font-weight:900;

background:
linear-gradient(
145deg,
#1c2438,
#090c14
);

border:
1px solid rgba(255,255,255,.14);

box-shadow:
0 30px 80px rgba(0,0,0,.55);

}


/* SECTION */

section{
padding:110px 0;
}

.section-label{

font-size:11px;

letter-spacing:3px;

text-transform:uppercase;

opacity:.4;

margin-bottom:14px;

}

.section-title{

font-size:
clamp(35px,5vw,55px);

letter-spacing:-2px;

margin-bottom:40px;

}


/* CARDS */

.cards{

display:grid;

grid-template-columns:
repeat(3,1fr);

gap:18px;

}

.card{

padding:28px;

border-radius:22px;

border:
1px solid rgba(255,255,255,.09);

background:
rgba(255,255,255,.035);

transition:.3s;

}

.card:hover{

transform:translateY(-6px);

background:
rgba(255,255,255,.055);

}

.card h3{

font-size:19px;

margin-bottom:12px;

}

.card p{

font-size:14px;

line-height:1.75;

color:
rgba(255,255,255,.55);

}


/* DIARY */

.diary-list{

display:grid;

gap:15px;

}

.diary-item{

padding:25px;

border-left:
2px solid rgba(255,255,255,.25);

border-radius:
0 18px 18px 0;

background:
rgba(255,255,255,.035);

}

.diary-date{

font-size:11px;

letter-spacing:2px;

text-transform:uppercase;

opacity:.4;

margin-bottom:8px;

}

.diary-item h3{

margin-bottom:8px;

}

.diary-item p{

line-height:1.75;

color:
rgba(255,255,255,.55);

}


/* FOOTER */

footer{

padding:45px 0;

border-top:
1px solid rgba(255,255,255,.07);

text-align:center;

font-size:13px;

color:
rgba(255,255,255,.35);

}


/* MOBILE */

@media(max-width:800px){

.nav-links{
display:none;
}

.menu{
display:block;
}

.mobile-menu.open{
display:block;
}

.hero{

padding-top:140px;

padding-bottom:70px;

}

.hero-grid{

grid-template-columns:1fr;

gap:45px;

}

h1{

letter-spacing:-3px;

}

.hero-card{

min-height:330px;

}

.avatar{

width:150px;

height:150px;

font-size:52px;

}

.cards{

grid-template-columns:1fr;

}

section{

padding:80px 0;

}

}

</style>

</head>


<body>


<nav>

<div class="container">

<div class="nav-inner">

<a href="/" class="logo">
Prosenjit<span>.</span>
</a>

<div class="nav-links">

<a href="/">Home</a>

<a href="/about.html">About</a>

<a href="/education.html">Education</a>

<a href="/diary.html">Diary</a>

<a href="/projects.html">Projects</a>

<a href="/contact.html">Contact</a>

</div>

<button
class="menu"
onclick="toggleMenu()"
>
⋮
</button>

</div>


<div
id="mobileMenu"
class="mobile-menu"
>

<a href="/">Home</a>

<a href="/about.html">About</a>

<a href="/education.html">Education</a>

<a href="/diary.html">Diary</a>

<a href="/projects.html">Projects</a>

<a href="/contact.html">Contact</a>

</div>

</div>

</nav>


<section class="hero">

<div class="container">

<div class="hero-grid">


<div>

<div class="badge">
PERSONAL SPACE · 2026
</div>

<h1>

Hello, I'm

<br>

<span
class="gradient"
id="name"
>
Prosenjit Ray
</span>

</h1>

<p
class="hero-description"
id="about"
>
A student, dreamer and someone who believes
every chapter of life deserves to be remembered.
</p>


<div class="buttons">

<a
href="/about.html"
class="btn btn-primary"
>
Explore Me
</a>

<a
href="/contact.html"
class="btn"
>
Contact
</a>

</div>

</div>


<div class="hero-card">

<div
class="avatar"
id="avatar"
>
PR
</div>

</div>


</div>

</div>

</section>


<section>

<div class="container">

<div class="section-label">
WHO I AM
</div>

<h2 class="section-title">
A little about me.
</h2>


<div class="cards">


<div class="card">

<h3>
About
</h3>

<p id="aboutCard">
Loading...
</p>

</div>


<div class="card">

<h3>
Education
</h3>

<p id="education">
Dinajpur Government College · Honours 1st Year
</p>

</div>


<div class="card">

<h3>
Skills
</h3>

<p id="skills">
Creative Thinking · Web Design · Communication
</p>

</div>


</div>

</div>

</section>


<section>

<div class="container">

<div class="section-label">
LIFE CHAPTERS
</div>

<h2 class="section-title">
My Diary.
</h2>

<div
id="diary"
class="diary-list"
>

<div class="diary-item">

<div class="diary-date">
MY STORY
</div>

<h3>
Every chapter matters.
</h3>

<p>
My thoughts, memories and life chapters
will live here.
</p>

</div>

</div>

</div>

</section>


<footer>

© 2026 Prosenjit Ray · All rights reserved.

</footer>


<script>

function toggleMenu(){

const menu =
document.getElementById("mobileMenu");

menu.classList.toggle("open");

}


function safeText(value){

return String(value || "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}


async function loadSite(){

try{

const response =
await fetch("/api/site");

const data =
await response.json();


if(data.name){

document.getElementById("name")
.textContent = data.name;

const initials =
data.name
.split(" ")
.map(function(x){
return x.charAt(0);
})
.join("")
.substring(0,2)
.toUpperCase();

document.getElementById("avatar")
.textContent = initials;

document.title =
data.name;

}


if(data.about){

document.getElementById("about")
.textContent =
data.about;

document.getElementById("aboutCard")
.textContent =
data.about;

}


if(data.college || data.education){

document.getElementById("education")
.textContent =
(data.college || "") +
" · " +
(data.education || "");

}


if(Array.isArray(data.skills)){

document.getElementById("skills")
.textContent =
data.skills.join(" · ");

}

}catch(error){

console.log(error);

}

}


async function loadDiary(){

try{

const response =
await fetch("/api/diary");

const items =
await response.json();

if(!items.length){
return;
}

const container =
document.getElementById("diary");

container.innerHTML =
items.map(function(item){

return (
'<div class="diary-item">' +

'<div class="diary-date">' +
safeText(item.date || "") +
'</div>' +

'<h3>' +
safeText(item.title) +
'</h3>' +

'<p>' +
safeText(item.content) +
'</p>' +

'</div>'
);

}).join("");

}catch(error){

console.log(error);

}

}


loadSite();

loadDiary();

</script>


</body>

</html>
  `);
});

// =====================================================
// PUBLIC API
// =====================================================

app.get("/api/site", async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT data FROM site_content WHERE id = 1"
    );

    res.json(
      result.rows[0]
        ? result.rows[0].data
        : {}
    );

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to load site"
    });

  }

});


app.get("/api/diary", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM diary
      WHERE visible = TRUE
      ORDER BY created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to load diary"
    });

  }

});

// =====================================================
// ADMIN AUTH MIDDLEWARE
// =====================================================

function requireAdmin(req, res, next) {

  if (!req.session.admin) {

    return res.status(401).json({
      error: "Unauthorized"
    });

  }

  next();

}

// =====================================================
// ADMIN LOGIN API
// =====================================================

app.post("/api/admin/login", async (req, res) => {

  const username =
    req.body.username || "";

  const password =
    req.body.password || "";

  const correctUsername =
    process.env.ADMIN_USERNAME || "admin";

  const correctPassword =
    process.env.ADMIN_PASSWORD || "admin123";


  if (
    username !== correctUsername ||
    password !== correctPassword
  ) {

    return res.status(401).json({
      success: false,
      error: "Invalid username or password"
    });

  }


  req.session.admin = true;


  res.json({
    success: true
  });

});

// =====================================================
// ADMIN LOGOUT
// =====================================================

app.post("/api/admin/logout", (req, res) => {

  req.session.destroy(function() {

    res.json({
      success: true
    });

  });

});

// =====================================================
// ADMIN PAGE
// =====================================================

app.get("/admin", (req, res) => {

  if (!req.session.admin) {

    res.send(`
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>

<title>Admin Login</title>

<style>

*{
box-sizing:border-box;
}

body{

margin:0;

min-height:100vh;

display:flex;

align-items:center;

justify-content:center;

font-family:Arial,sans-serif;

color:#fff;

background:
radial-gradient(
circle at top,
#1b263d,
#05070b 65%
);

}

.login{

width:90%;

max-width:400px;

padding:35px 28px;

border-radius:25px;

background:
rgba(255,255,255,.06);

border:
1px solid rgba(255,255,255,.12);

backdrop-filter:blur(20px);

box-shadow:
0 30px 80px rgba(0,0,0,.5);

}

.login h1{

margin:0 0 8px;

}

.login p{

opacity:.5;

margin-bottom:28px;

}

input{

width:100%;

padding:15px;

margin-bottom:15px;

border-radius:12px;

border:
1px solid rgba(255,255,255,.12);

background:
rgba(0,0,0,.3);

color:#fff;

outline:none;

}

button{

width:100%;

padding:15px;

border:none;

border-radius:12px;

background:#fff;

color:#000;

font-weight:bold;

cursor:pointer;

}

#error{

color:#ff7777;

margin-top:15px;

}

</style>

</head>

<body>


<div class="login">

<h1>
Prosenjit Ray
</h1>

<p>
Private Admin Panel
</p>


<form onsubmit="login(event)">

<input
id="username"
placeholder="Username"
required
>

<input
id="password"
type="password"
placeholder="Password"
required
>

<button>
Login
</button>

</form>


<div id="error"></div>

</div>


<script>

async function login(event){

event.preventDefault();

const username =
document.getElementById("username").value;

const password =
document.getElementById("password").value;


try{

const response =
await fetch("/api/admin/login",{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({
username:username,
password:password
})

});


const data =
await response.json();


if(data.success){

location.href="/admin";

}else{

document.getElementById("error")
.textContent =
data.error || "Login failed";

}

}catch(error){

document.getElementById("error")
.textContent =
"Server error";

}

}

</script>

</body>

</html>
    `);

    return;
  }


  res.send(`
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>

<title>Prosenjit Admin Panel</title>

<style>

*{
box-sizing:border-box;
}

body{

margin:0;

background:#06080d;

color:#fff;

font-family:
Arial,
sans-serif;

}

.container{

width:92%;

max-width:1000px;

margin:auto;

padding:30px 0 80px;

}

.header{

display:flex;

justify-content:space-between;

align-items:center;

gap:15px;

margin-bottom:25px;

}

.header h1{

margin:0;

}

.header p{

opacity:.45;

}

.card{

padding:25px;

margin-bottom:18px;

border-radius:20px;

background:
rgba(255,255,255,.045);

border:
1px solid rgba(255,255,255,.1);

}

label{

display:block;

font-size:13px;

opacity:.6;

margin-bottom:8px;

}

input,
textarea{

width:100%;

padding:14px;

margin-bottom:18px;

border-radius:12px;

border:
1px solid rgba(255,255,255,.1);

background:
rgba(0,0,0,.3);

color:#fff;

outline:none;

}

textarea{

min-height:130px;

resize:vertical;

}

button{

padding:13px 18px;

border:none;

border-radius:11px;

cursor:pointer;

font-weight:bold;

margin:4px;

}

.primary{

background:#fff;

color:#000;

}

.secondary{

background:
rgba(255,255,255,.08);

color:#fff;

border:
1px solid rgba(255,255,255,.1);

}

.danger{

background:#8d2929;

color:#fff;

}

.diary{

margin-top:18px;

padding-top:18px;

border-top:
1px solid rgba(255,255,255,.1);

}

.small{

font-size:12px;

opacity:.4;

margin:7px 0;

}

#message{

margin-top:15px;

color:#80ffad;

}

@media(max-width:600px){

.header{

align-items:flex-start;

flex-direction:column;

}

}

</style>

</head>


<body>


<div class="container">


<div class="header">

<div>

<h1>
Admin Panel
</h1>

<p>
Prosenjit Ray Website
</p>

</div>


<div>

<button
class="secondary"
onclick="location.href='/'"
>
Website
</button>

<button
class="danger"
onclick="logout()"
>
Logout
</button>

</div>

</div>


<div class="card">

<h2>
Site Content
</h2>


<label>
Name
</label>

<input id="name">


<label>
College
</label>

<input id="college">


<label>
Education
</label>

<input id="education">


<label>
About
</label>

<textarea id="about"></textarea>


<label>
Skills
</label>

<input
id="skills"
placeholder="Web Design, Coding, Communication"
>


<label>
Facebook
</label>

<input id="facebook">


<label>
Instagram
</label>

<input id="instagram">


<label>
GitHub
</label>

<input id="github">


<label>
Email
</label>

<input id="email">


<button
class="primary"
onclick="saveContent()"
>
Save Changes
</button>


<div id="message"></div>

</div>


<div class="card">

<h2>
Diary
</h2>


<label>
Title
</label>

<input
id="diaryTitle"
placeholder="My Life Chapter"
>


<label>
Date
</label>

<input
id="diaryDate"
placeholder="September 2026"
>


<label>
Content
</label>

<textarea
id="diaryContent"
placeholder="Write your diary..."
></textarea>


<button
class="primary"
onclick="addDiary()"
>
Add Diary
</button>


<div id="diaryList"></div>

</div>


</div>


<script>


function escapeHtml(value){

return String(value || "")

.replace(/&/g,"&amp;")

.replace(/</g,"&lt;")

.replace(/>/g,"&gt;")

.replace(/"/g,"&quot;")

.replace(/'/g,"&#039;");

}


async function loadContent(){

try{

const response =
await fetch("/api/admin/content");

if(response.status===401){

location.href="/admin";

return;

}

const data =
await response.json();


document.getElementById("name").value =
data.name || "";

document.getElementById("college").value =
data.college || "";

document.getElementById("education").value =
data.education || "";

document.getElementById("about").value =
data.about || "";


document.getElementById("skills").value =
Array.isArray(data.skills)
? data.skills.join(", ")
: "";


document.getElementById("facebook").value =
data.social && data.social.facebook
? data.social.facebook
: "";


document.getElementById("instagram").value =
data.social && data.social.instagram
? data.social.instagram
: "";


document.getElementById("github").value =
data.social && data.social.github
? data.social.github
: "";


document.getElementById("email").value =
data.social && data.social.email
? data.social.email
: "";


}catch(error){

console.log(error);

}

}


async function saveContent(){

const data={

name:
document.getElementById("name").value,

college:
document.getElementById("college").value,

education:
document.getElementById("education").value,

about:
document.getElementById("about").value,

skills:
document.getElementById("skills").value
.split(",")
.map(function(x){
return x.trim();
})
.filter(Boolean),

social:{

facebook:
document.getElementById("facebook").value,

instagram:
document.getElementById("instagram").value,

github:
document.getElementById("github").value,

email:
document.getElementById("email").value

}

};


try{

const response =
await fetch(
"/api/admin/content",
{

method:"PUT",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify(data)

});


const result =
await response.json();


if(result.success){

document.getElementById("message")
.textContent =
"✓ Saved successfully";

}else{

document.getElementById("message")
.textContent =
result.error || "Save failed";

}

}catch(error){

document.getElementById("message")
.textContent =
"Server error";

}

}


async function loadDiary(){

try{

const response =
await fetch("/api/admin/diary");

if(response.status===401){

location.href="/admin";

return;

}

const items =
await response.json();


const container =
document.getElementById("diaryList");


if(!items.length){

container.innerHTML =
"<p style='opacity:.4'>No diary yet.</p>";

return;

}


container.innerHTML =
items.map(function(item){

return (

'<div class="diary">' +

'<h3>' +
escapeHtml(item.title) +
'</h3>' +

'<div class="small">' +
escapeHtml(item.date || "") +
'</div>' +

'<p>' +
escapeHtml(item.content) +
'</p>' +

'<button class="danger" onclick="deleteDiary(' +
item.id +
')">' +
'Delete' +
'</button>' +

'</div>'

);

}).join("");


}catch(error){

console.log(error);

}

}


async function addDiary(){

const title =
document.getElementById("diaryTitle").value;

const date =
document.getElementById("diaryDate").value;

const content =
document.getElementById("diaryContent").value;


if(!title || !content){

alert("Title and content are required.");

return;

}


const response =
await fetch(
"/api/admin/diary",
{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

title:title,

date:date,

content:content,

visible:true

})

});


const result =
await response.json();


if(result.success){

document.getElementById("diaryTitle")
.value="";

document.getElementById("diaryDate")
.value="";

document.getElementById("diaryContent")
.value="";

loadDiary();

}else{

alert(
result.error ||
"Could not add diary"
);

}

}


async function deleteDiary(id){

if(!confirm(
"Are you sure you want to delete this diary?"
)){

return;

}


await fetch(
"/api/admin/diary/" + id,
{
method:"DELETE"
}
);


loadDiary();

}


async function logout(){

await fetch(
"/api/admin/logout",
{
method:"POST"
}
);

location.href="/admin";

}


loadContent();

loadDiary();

</script>


</body>

</html>
  `);

});

// =====================================================
// ADMIN CONTENT
// =====================================================

app.get(
  "/api/admin/content",
  requireAdmin,
  async (req, res) => {

    try {

      const result = await pool.query(
        "SELECT data FROM site_content WHERE id = 1"
      );

      res.json(
        result.rows[0]
          ? result.rows[0].data
          : {}
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Failed to load content"
      });

    }

  }
);

// =====================================================
// UPDATE CONTENT
// =====================================================

app.put(
  "/api/admin/content",
  requireAdmin,
  async (req, res) => {

    try {

      await pool.query(
        `
        UPDATE site_content
        SET data = $1
        WHERE id = 1
        `,
        [JSON.stringify(req.body)]
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Failed to save content"
      });

    }

  }
);

// =====================================================
// ADMIN DIARY
// =====================================================

app.get(
  "/api/admin/diary",
  requireAdmin,
  async (req, res) => {

    try {

      const result = await pool.query(`
        SELECT *
        FROM diary
        ORDER BY created_at DESC
      `);

      res.json(result.rows);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Failed to load diary"
      });

    }

  }
);

// =====================================================
// ADD DIARY
// =====================================================

app.post(
  "/api/admin/diary",
  requireAdmin,
  async (req, res) => {

    try {

      const title =
        req.body.title || "";

      const content =
        req.body.content || "";

      const date =
        req.body.date || "";

      const visible =
        req.body.visible !== false;


      if (!title || !content) {

        return res.status(400).json({
          error: "Title and content are required"
        });

      }


      const result =
        await pool.query(
          `
          INSERT INTO diary
          (title, content, date, visible)
          VALUES ($1, $2, $3, $4)
          RETURNING *
          `,
          [
            title,
            content,
            date,
            visible
          ]
        );


      res.json({
        success: true,
        diary: result.rows[0]
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Failed to add diary"
      });

    }

  }
);

// =====================================================
// DELETE DIARY
// =====================================================

app.delete(
  "/api/admin/diary/:id",
  requireAdmin,
  async (req, res) => {

    try {

      await pool.query(
        "DELETE FROM diary WHERE id = $1",
        [req.params.id]
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Failed to delete diary"
      });

    }

  }
);

// =====================================================
// HEALTH
// =====================================================

app.get("/health", (req, res) => {

  res.json({
    status: "OK",
    website: "Prosenjit Ray"
  });

});

// =====================================================
// START
// =====================================================

async function startServer(){

  await initDatabase();

  app.listen(
    PORT,
    "0.0.0.0",
    function(){

      console.log(
        "Prosenjit site running on port " +
        PORT
      );

    }
  );

}

startServer();
