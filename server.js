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
    secret: process.env.SESSION_SECRET || "prosenjit-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// =====================================================
// DATABASE INITIALIZATION
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
      const defaultData = {
        name: "Prosenjit Ray",
        college: "Dinajpur Government College",
        education: "Honours 1st Year",

        about:
          "I am Prosenjit Ray, an Honours 1st Year student at Dinajpur Government College. Welcome to my personal space on the web.",

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
        `
        INSERT INTO site_content (id, data)
        VALUES (1, $1)
        `,
        [JSON.stringify(defaultData)]
      );
    }

    console.log("Database ready.");
  } catch (error) {
    console.error("Database error:", error.message);
  }
}

// =====================================================
// IMPORTANT
// =====================================================
// We DO NOT use index.html for "/".
// This prevents the Admin Panel index.html problem.
// =====================================================


// =====================================================
// PUBLIC WEBSITE
// =====================================================

app.get("/", (req, res) => {
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
  content="Official personal website of Prosenjit Ray"
/>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  background:
    radial-gradient(
      circle at 20% 10%,
      rgba(90, 110, 255, .15),
      transparent 35%
    ),
    radial-gradient(
      circle at 80% 30%,
      rgba(0, 220, 255, .08),
      transparent 35%
    ),
    #05070b;

  color: #fff;

  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

.container {
  width: min(1120px, 92%);
  margin: auto;
}


/* NAVIGATION */

nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;

  z-index: 1000;

  background: rgba(5, 7, 11, .72);

  backdrop-filter: blur(18px);

  border-bottom:
    1px solid rgba(255,255,255,.08);
}

.nav-inner {
  height: 72px;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -.5px;
}

.logo span {
  opacity: .45;
}

.nav-links {
  display: flex;
  gap: 28px;
}

.nav-links a {
  font-size: 14px;
  opacity: .72;
  transition: .25s;
}

.nav-links a:hover {
  opacity: 1;
}


/* MOBILE MENU */

.menu {
  display: none;

  width: 42px;
  height: 42px;

  border: 1px solid rgba(255,255,255,.12);

  background: rgba(255,255,255,.06);

  border-radius: 12px;

  color: white;

  font-size: 22px;

  cursor: pointer;
}

.mobile-menu {
  display: none;

  padding: 15px 0 20px;
}

.mobile-menu a {
  display: block;

  padding: 13px 0;

  border-bottom:
    1px solid rgba(255,255,255,.07);

  opacity: .8;
}


/* HERO */

.hero {
  min-height: 100vh;

  display: flex;
  align-items: center;

  padding-top: 72px;
}

.hero-grid {
  display: grid;

  grid-template-columns:
    1.15fr .85fr;

  gap: 70px;

  align-items: center;
}

.badge {
  display: inline-flex;

  padding: 8px 13px;

  border:
    1px solid rgba(255,255,255,.1);

  background:
    rgba(255,255,255,.05);

  border-radius: 100px;

  font-size: 12px;

  margin-bottom: 22px;

  opacity: .8;
}

h1 {
  font-size: clamp(48px, 8vw, 88px);

  line-height: .94;

  letter-spacing: -5px;

  margin-bottom: 25px;
}

.gradient {
  background:
    linear-gradient(
      110deg,
      #ffffff,
      #a8b4ff,
      #7cecff
    );

  -webkit-background-clip: text;
  background-clip: text;

  color: transparent;
}

.hero p {
  max-width: 570px;

  color: rgba(255,255,255,.58);

  font-size: 17px;

  line-height: 1.8;

  margin-bottom: 30px;
}

.buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 14px 21px;

  border-radius: 13px;

  border:
    1px solid rgba(255,255,255,.12);

  background:
    rgba(255,255,255,.07);

  transition: .25s;

  font-size: 14px;
}

.btn:hover {
  transform: translateY(-3px);

  background:
    rgba(255,255,255,.12);
}

.btn-primary {
  background: white;
  color: black;
  font-weight: 700;
}


/* HERO CARD */

.hero-card {
  position: relative;

  min-height: 430px;

  border:
    1px solid rgba(255,255,255,.1);

  border-radius: 32px;

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.09),
      rgba(255,255,255,.025)
    );

  box-shadow:
    0 40px 100px rgba(0,0,0,.4);

  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-card::before {
  content: "";

  position: absolute;

  width: 220px;
  height: 220px;

  border-radius: 50%;

  background:
    rgba(120, 140, 255, .18);

  filter: blur(50px);
}

.avatar {
  position: relative;

  width: 190px;
  height: 190px;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 70px;

  font-weight: 900;

  background:
    linear-gradient(
      145deg,
      #1b2235,
      #0b0e17
    );

  border:
    1px solid rgba(255,255,255,.14);

  box-shadow:
    0 25px 80px rgba(0,0,0,.55);
}


/* SECTIONS */

section {
  padding: 110px 0;
}

.section-label {
  text-transform: uppercase;

  letter-spacing: 3px;

  font-size: 11px;

  opacity: .4;

  margin-bottom: 15px;
}

.section-title {
  font-size: clamp(34px, 5vw, 55px);

  letter-spacing: -2px;

  margin-bottom: 40px;
}


/* CARDS */

.cards {
  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 18px;
}

.card {
  padding: 28px;

  border:
    1px solid rgba(255,255,255,.09);

  border-radius: 22px;

  background:
    rgba(255,255,255,.035);

  transition: .3s;
}

.card:hover {
  transform: translateY(-6px);

  background:
    rgba(255,255,255,.055);
}

.card h3 {
  margin-bottom: 12px;

  font-size: 19px;
}

.card p {
  color: rgba(255,255,255,.55);

  line-height: 1.7;

  font-size: 14px;
}


/* DIARY */

.diary-list {
  display: grid;
  gap: 15px;
}

.diary-item {
  padding: 25px;

  border-left:
    2px solid rgba(255,255,255,.2);

  background:
    rgba(255,255,255,.035);

  border-radius: 0 18px 18px 0;
}

.diary-date {
  font-size: 11px;

  text-transform: uppercase;

  letter-spacing: 2px;

  opacity: .4;

  margin-bottom: 8px;
}

.diary-item h3 {
  margin-bottom: 8px;
}

.diary-item p {
  color: rgba(255,255,255,.58);

  line-height: 1.7;
}


/* FOOTER */

footer {
  padding: 45px 0;

  border-top:
    1px solid rgba(255,255,255,.07);

  color: rgba(255,255,255,.4);

  font-size: 13px;

  text-align: center;
}


/* RESPONSIVE */

@media(max-width: 800px) {

  .nav-links {
    display: none;
  }

  .menu {
    display: block;
  }

  .mobile-menu.open {
    display: block;
  }

  .hero {
    min-height: auto;

    padding-top: 140px;

    padding-bottom: 80px;
  }

  .hero-grid {
    grid-template-columns: 1fr;

    gap: 45px;
  }

  h1 {
    letter-spacing: -3px;
  }

  .hero-card {
    min-height: 330px;
  }

  .avatar {
    width: 150px;
    height: 150px;

    font-size: 55px;
  }

  .cards {
    grid-template-columns: 1fr;
  }

  section {
    padding: 80px 0;
  }
}

</style>

</head>

<body>


<nav>

<div class="container">

<div class="nav-inner">

<a class="logo" href="/">
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


<main>


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
<span class="gradient" id="heroName">
Prosenjit Ray
</span>
</h1>

<p id="heroAbout">
A student, dreamer and someone who believes
that every chapter of life deserves to be remembered.
</p>

<div class="buttons">

<a
  class="btn btn-primary"
  href="/about.html"
>
Explore Me
</a>

<a
  class="btn"
  href="/contact.html"
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

<p id="aboutText">
Loading...
</p>

</div>


<div class="card">

<h3>
Education
</h3>

<p id="educationText">
Dinajpur Government College · Honours 1st Year
</p>

</div>


<div class="card">

<h3>
Skills
</h3>

<p id="skillsText">
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
  id="diaryList"
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
This is where my thoughts, memories
and life chapters will live.
</p>

</div>

</div>

</div>

</section>


</main>


<footer>

© 2026 Prosenjit Ray · All rights reserved.

</footer>


<script>

function toggleMenu() {

  const menu =
    document.getElementById("mobileMenu");

  menu.classList.toggle("open");

}


async function loadSite() {

  try {

    const response =
      await fetch("/api/site");

    const data =
      await response.json();

    if (data.name) {

      document.getElementById("heroName")
        .textContent = data.name;

      document.title = data.name;

      const initials =
        data.name
          .split(" ")
          .map(x => x[0])
          .join("")
          .slice(0,2)
          .toUpperCase();

      document.getElementById("avatar")
        .textContent = initials;

    }

    if (data.about) {

      document.getElementById("heroAbout")
        .textContent = data.about;

      document.getElementById("aboutText")
        .textContent = data.about;

    }

    if (data.education || data.college) {

      document.getElementById("educationText")
        .textContent =
          (data.college || "") +
          " · " +
          (data.education || "");

    }

    if (Array.isArray(data.skills)) {

      document.getElementById("skillsText")
        .textContent =
          data.skills.join(" · ");

    }

  } catch (error) {

    console.log(error);

  }

}


async function loadDiary() {

  try {

    const response =
      await fetch("/api/diary");

    const diary =
      await response.json();

    const container =
      document.getElementById("diaryList");

    if (!diary.length) return;

    container.innerHTML =
      diary.map(item => `

        <div class="diary-item">

          <div class="diary-date">
            ${escapeHtml(item.date || "")}
          </div>

          <h3>
            ${escapeHtml(item.title)}
          </h3>

          <p>
            ${escapeHtml(item.content)}
          </p>

        </div>

      `).join("");

  } catch (error) {

    console.log(error);

  }

}


function escapeHtml(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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
      result.rows[0]?.data || {}
    );

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Unable to load site"
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
      error: "Unable to load diary"
    });

  }

});


// =====================================================
// ADMIN AUTH
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
// ADMIN LOGIN
// =====================================================

app.post("/api/admin/login", async (req, res) => {

  const {
    username,
    password
  } = req.body;

  const adminUsername =
    process.env.ADMIN_USERNAME || "admin";

  const adminPassword =
    process.env.ADMIN_PASSWORD || "admin123";


  if (
    username !== adminUsername ||
    password !== adminPassword
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
// ADMIN PAGE
// =====================================================

app.get("/admin", (req, res) => {

  if (!req.session.admin) {

    return res.send(`
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

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  min-height: 100vh;

  display: flex;

  align-items: center;

  justify-content: center;

  background:
    radial-gradient(
      circle at top,
      #182033,
      #05070b 65%
    );

  color: white;

  font-family:
    Arial,
    sans-serif;

}

.login {

  width: 90%;

  max-width: 400px;

  padding: 35px 28px;

  border-radius: 25px;

  background:
    rgba(255,255,255,.06);

  border:
    1px solid rgba(255,255,255,.12);

  backdrop-filter:
    blur(20px);

  box-shadow:
    0 30px 80px rgba(0,0,0,.5);

}

.login h1 {

  margin: 0 0 8px;

}

.login p {

  opacity: .5;

  margin-bottom: 28px;

}

input {

  width: 100%;

  padding: 15px;

  margin-bottom: 15px;

  border-radius: 12px;

  border:
    1px solid rgba(255,255,255,.12);

  background:
    rgba(0,0,0,.25);

  color: white;

  outline: none;

}

button {

  width: 100%;

  padding: 15px;

  border: none;

  border-radius: 12px;

  background: white;

  color: black;

  font-weight: bold;

  cursor: pointer;

}

#error {

  color: #ff7777;

  margin-top: 15px;

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

async function login(e) {

  e.preventDefault();

  const username =
    document.getElementById("username").value;

  const password =
    document.getElementById("password").value;


  const response =
    await fetch("/api/admin/login", {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        username,
        password
      })

    });


  const data =
    await response.json();


  if (data.success) {

    location.href = "/admin";

  } else {

    document.getElementById("error")
      .textContent =
      data.error || "Login failed";

  }

}

</script>

</body>

</html>
    `);

  }


  // ===================================================
  // LOGGED IN ADMIN DASHBOARD
  // ===================================================

  res.send(`
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0"
>

<title>Admin Panel</title>

<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  background: #06080d;

  color: white;

  font-family:
    Arial,
    sans-serif;

}

.container {

  width: 92%;

  max-width: 1000px;

  margin: auto;

  padding: 35px 0 80px;

}

.header {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 15px;

  margin-bottom: 30px;

}

.header h1 {

  margin: 0;

}

.header p {

  opacity: .45;

}

.card {

  background:
    rgba(255,255,255,.045);

  border:
    1px solid rgba(255,255,255,.1);

  border-radius: 20px;

  padding: 25px;

  margin-bottom: 18px;

}

label {

  display: block;

  margin-bottom: 8px;

  opacity: .65;

  font-size: 13px;

}

input,
textarea {

  width: 100%;

  padding: 14px;

  border-radius: 12px;

  border:
    1px solid rgba(255,255,255,.1);

  background:
    rgba(0,0,0,.3);

  color: white;

  outline: none;

  margin-bottom: 18px;

}

textarea {

  min-height: 130px;

  resize: vertical;

}

button {

  padding: 13px 18px;

  border: none;

  border-radius: 11px;

  cursor: pointer;

  font-weight: bold;

  margin: 4px;

}

.primary {

  background: white;

  color: black;

}

.secondary {

  background:
    rgba(255,255,255,.08);

  color: white;

  border:
    1px solid rgba(255,255,255,.1);

}

.danger {

  background:
    #8d2525;

  color: white;

}

.diary {

  border-top:
    1px solid rgba(255,255,255,.1);

  padding-top: 18px;

  margin-top: 18px;

}

.small {

  opacity: .45;

  font-size: 12px;

}

#message {

  margin-top: 15px;

  color: #8cffae;

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

<br>


<label>
Name
</label>

<input
id="name"
>


<label>
College
</label>

<input
id="college"
>


<label>
Education
</label>

<input
id="education"
>


<label>
About
</label>

<textarea
id="about"
></textarea>


<label>
Skills
</label>

<input
id="skills"
placeholder="Example: Web Design, Coding, Communication"
>


<label>
Facebook Link
</label>

<input
id="facebook"
>


<label>
Instagram Link
</label>

<input
id="instagram"
>


<label>
GitHub Link
</label>

<input
id="github"
>


<label>
Email
</label>

<input
id="email"
>


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

<br>


<label>
Title
</label>

<input
id="diaryTitle"
placeholder="My first chapter"
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
placeholder="Write your life chapter..."
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


async function loadContent() {

  const response =
    await fetch("/api/admin/content");

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
    data.social?.facebook || "";

  document.getElementById("instagram").value =
    data.social?.instagram || "";

  document.getElementById("github").value =
    data.social?.github || "";

  document.getElementById("email").value =
    data.social?.email || "";

}


async function saveContent() {

  const data = {

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
        .map(x => x.trim())
        .filter(Boolean),

    social: {

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


  const response =
    await fetch("/api/admin/content", {

      method: "PUT",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify(data)

    });


  const result =
    await response.json();


  if (result.success) {

    document.getElementById("message")
      .textContent =
      "✓ Saved successfully";

  } else {

    document.getElementById("message")
      .textContent =
      result.error || "Save failed";

  }

}


async function loadDiary() {

  const response =
    await fetch("/api/admin/diary");

  const diary =
    await response.json();


  const container =
    document.getElementById("diaryList");


  container.innerHTML =
    diary.map(item => `

      <div class="diary">

        <h3>
          ${escapeHtml(item.title)}
        </h3>

        <div class="small">
          ${escapeHtml(item.date || "")}
        </div>

        <p>
          ${escapeHtml(item.content)}
        </p>

        <button
          class="danger"
          onclick="deleteDiary(${item.id})"
        >
          Delete
        </button>

      </div>

    `).join("");

}


async function addDiary() {

  const title =
    document.getElementById("diaryTitle").value;

  const date =
    document.getElementById("diaryDate").value;

  const content =
    document.getElementById("diaryContent").value;


  if (!title || !content) {

    alert("Title and content required.");

    return;

  }


  const response =
    await fetch("/api/admin/diary", {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({

        title,
        date,
        content,
        visible: true

      })

    });


  const result =
    await response.json();


  if (result.success) {

    document.getElementById("diaryTitle")
      .value = "";

    document.getElementById("diaryDate")
      .value = "";

    document.getElementById("diaryContent")
      .value = "";

    loadDiary();

  }

}


async function deleteDiary(id) {

  if (!confirm("Delete this diary?")) {
    return;
  }


  await fetch(
    "/api/admin/diary/" + id,
    {
      method: "DELETE"
    }
  );


  loadDiary();

}


async function logout() {

  await fetch(
    "/api/admin/logout",
    {
      method: "POST"
    }
  );

  location.href = "/admin";

}


function escapeHtml(text) {

  return String(text)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


loadContent();
loadDiary();

</script>


</body>

</html>
  `);

});


// =====================================================
// ADMIN CONTENT API
// =====================================================

app.get(
  "/api/admin/content",
  requireAdmin,
  async (req, res) => {

    try {

      const result =
        await pool.query(
          "SELECT data FROM site_content WHERE id = 1"
        );

      res.json(
        result.rows[0]?.data || {}
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Unable to load content"
      });

    }

  }
);


// =====================================================
// UPDATE SITE CONTENT
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
        error: "Unable to save content"
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

      const result =
        await pool.query(`
          SELECT *
          FROM diary
          ORDER BY created_at DESC
        `);

      res.json(result.rows);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Unable to load diary"
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

      const {
        title,
        content,
        date,
        visible
      } = req.body;


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
            date || "",
            visible !== false
          ]
        );


      res.json({
        success: true,
        diary: result.rows[0]
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Unable to add diary"
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
        error: "Unable to delete diary"
      });

    }

  }
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/health", (req, res) => {

  res.json({
    status: "OK",
    website: "Prosenjit Ray"
  });

});


// =====================================================
// START SERVER
// =====================================================

async function start() {

  await initDatabase();

  app.listen(
    PORT,
    "0.0.0.0",
    () => {

      console.log(
        "Prosenjit site running on port " + PORT
      );

    }
  );

}

start();
