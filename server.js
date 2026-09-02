const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

console.log("=================================");
console.log("PROSENJIT PREMIUM WEBSITE");
console.log("Starting server...");
console.log("=================================");

// ===============================
// DATABASE
// ===============================

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is missing.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err.message);
});

// ===============================
// EXPRESS SETTINGS
// ===============================

app.set("trust proxy", 1);

app.use(express.json({
  limit: "2mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "2mb"
}));

// ===============================
// SESSION
// ===============================

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "prosenjit-site-session-change-this-secret",

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

// ===============================
// FILE LOCATIONS
// ===============================

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");

function fileExists(file) {
  try {
    return fs.existsSync(file);
  } catch {
    return false;
  }
}

// ===============================
// STATIC FILES
// ===============================

// If public folder exists
if (fileExists(PUBLIC)) {
  app.use(express.static(PUBLIC));
}

// Also serve files from root.
// This is important because your GitHub repo
// currently has index.html, style.css etc. in root.
app.use(express.static(ROOT));

// ===============================
// DATABASE INITIALIZATION
// ===============================

async function initDatabase() {
  console.log("Connecting to database...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS buttons (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT DEFAULT '→',
      location TEXT DEFAULT 'custom',
      visible BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS diary (
      id SERIAL PRIMARY KEY,
      chapter TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT DEFAULT '',
      body TEXT DEFAULT '',
      date_text TEXT DEFAULT '',
      visible BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0
    )
  `);

  console.log("Database tables ready.");

  // ===============================
  // ADMIN USER
  // ===============================

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const userCheck = await pool.query(
    "SELECT id FROM users WHERE username = $1",
    [username]
  );

  if (userCheck.rowCount === 0) {
    const hash = await bcrypt.hash(password, 12);

    await pool.query(
      "INSERT INTO users(username,password) VALUES($1,$2)",
      [username, hash]
    );

    console.log("Admin account created.");
  }

  // ===============================
  // DEFAULT CONTENT
  // ===============================

  const defaults = {
    name: "Prosenjit Ray",

    tagline: "Dream • Learn • Create",

    intro:
      "Honours 1st Year student at Dinajpur Government College. This is my digital space for my education, ideas, experiences and journey.",

    college: "Dinajpur Government College",

    education: "Honours 1st Year",

    facebook: "https://facebook.com/YOUR_USERNAME",

    twitter: "https://x.com/YOUR_USERNAME",

    whatsapp: "https://wa.me/8801XXXXXXXXX",

    mobile: "tel:+8801XXXXXXXXX",

    gmail: "mailto:yourmail@gmail.com",

    profile: "profile.jpg"
  };

  for (const [key, value] of Object.entries(defaults)) {
    await pool.query(
      `
      INSERT INTO content(key,value)
      VALUES($1,$2)
      ON CONFLICT(key) DO NOTHING
      `,
      [key, value]
    );
  }

  // ===============================
  // DEFAULT BUTTONS
  // ===============================

  const buttonCount = await pool.query(
    "SELECT COUNT(*)::int AS count FROM buttons"
  );

  if (buttonCount.rows[0].count === 0) {
    const buttons = [
      [
        "Explore My World",
        "#about",
        "→",
        "hero",
        true,
        1
      ],
      [
        "Read My Diary",
        "#diary",
        "↗",
        "hero",
        true,
        2
      ],
      [
        "Let's Talk",
        "#contact",
        "✦",
        "hero",
        true,
        3
      ]
    ];

    for (const button of buttons) {
      await pool.query(
        `
        INSERT INTO buttons
        (label,url,icon,location,visible,sort_order)
        VALUES($1,$2,$3,$4,$5,$6)
        `,
        button
      );
    }
  }

  // ===============================
  // DEFAULT DIARY
  // ===============================

  const diaryCount = await pool.query(
    "SELECT COUNT(*)::int AS count FROM diary"
  );

  if (diaryCount.rows[0].count === 0) {
    const diary = [
      [
        "CHAPTER 01",
        "The Beginning",
        "Every journey starts somewhere.",
        "Every journey starts with a first step. This chapter is about dreams, questions, challenges and possibilities.",
        "2026",
        true,
        1
      ],

      [
        "CHAPTER 02",
        "A New Chapter",
        "A new phase of education and growth.",
        "A new academic chapter brings new people, new lessons and new responsibilities. I want to make this chapter meaningful.",
        "2026",
        true,
        2
      ]
    ];

    for (const item of diary) {
      await pool.query(
        `
        INSERT INTO diary
        (chapter,title,excerpt,body,date_text,visible,sort_order)
        VALUES($1,$2,$3,$4,$5,$6,$7)
        `,
        item
      );
    }
  }

  console.log("Default data ready.");
}

// ===============================
// CONTENT HELPER
// ===============================

async function getContent() {
  const result = await pool.query(
    "SELECT key,value FROM content ORDER BY key"
  );

  return Object.fromEntries(
    result.rows.map(row => [
      row.key,
      row.value
    ])
  );
}

// ===============================
// AUTH MIDDLEWARE
// ===============================

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  next();
}

// ===============================
// HEALTH CHECK
// ===============================

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      website: "Prosenjit Premium",
      database: "connected"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

// ===============================
// MAIN WEBSITE
// ===============================

// Explicit root route.
// This fixes Cannot GET /
app.get("/", (req, res) => {
  const rootIndex = path.join(ROOT, "index.html");
  const publicIndex = path.join(PUBLIC, "index.html");

  if (fileExists(rootIndex)) {
    return res.sendFile(rootIndex);
  }

  if (fileExists(publicIndex)) {
    return res.sendFile(publicIndex);
  }

  res.status(404).send("Website index.html not found.");
});

// ===============================
// PUBLIC SITE API
// ===============================

app.get("/api/site", async (req, res) => {
  try {
    const content = await getContent();

    const buttons = await pool.query(`
      SELECT *
      FROM buttons
      WHERE visible = TRUE
      ORDER BY sort_order ASC, id ASC
    `);

    const diary = await pool.query(`
      SELECT *
      FROM diary
      WHERE visible = TRUE
      ORDER BY sort_order ASC, id ASC
    `);

    res.json({
      content,
      buttons: buttons.rows,
      diary: diary.rows
    });

  } catch (error) {
    console.error("Site API error:", error);

    res.status(500).json({
      error: "Database error"
    });
  }
});

// ===============================
// LOGIN
// ===============================

app.post("/api/login", async (req, res) => {
  try {
    const username = String(req.body.username || "");
    const password = String(req.body.password || "");

    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: "Invalid username or password"
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.password
    );

    if (!valid) {
      return res.status(401).json({
        error: "Invalid username or password"
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username
    };

    res.json({
      ok: true,
      username: user.username
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: "Login failed"
    });
  }
});

// ===============================
// LOGOUT
// ===============================

app.post("/api/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.json({
      ok: true
    });
  });
});

// ===============================
// CHECK LOGIN
// ===============================

app.get("/api/me", (req, res) => {
  res.json({
    loggedIn: !!req.session.user,
    username: req.session.user
      ? req.session.user.username
      : null
  });
});

// ===============================
// ADMIN CONTENT
// ===============================

app.get(
  "/api/admin/content",
  requireAuth,
  async (req, res) => {
    try {
      res.json(await getContent());
    } catch (error) {
      res.status(500).json({
        error: "Failed to load content"
      });
    }
  }
);

app.put(
  "/api/admin/content",
  requireAuth,
  async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const [key, value] of Object.entries(req.body || {})) {
        await client.query(
          `
          INSERT INTO content(key,value)
          VALUES($1,$2)
          ON CONFLICT(key)
          DO UPDATE SET value = EXCLUDED.value
          `,
          [
            key,
            String(value)
          ]
        );
      }

      await client.query("COMMIT");

      res.json({
        ok: true,
        content: await getContent()
      });

    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Content save error:", error);

      res.status(500).json({
        error: "Save failed"
      });

    } finally {
      client.release();
    }
  }
);

// ===============================
// ADMIN BUTTONS
// ===============================

app.get(
  "/api/admin/buttons",
  requireAuth,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT *
        FROM buttons
        ORDER BY sort_order ASC, id ASC
      `);

      res.json(result.rows);

    } catch (error) {
      res.status(500).json({
        error: "Failed to load buttons"
      });
    }
  }
);

app.post(
  "/api/admin/buttons",
  requireAuth,
  async (req, res) => {
    try {
      const {
        label,
        url,
        icon = "→",
        location = "custom",
        visible = true,
        sort_order = 0
      } = req.body;

      if (!label || !url) {
        return res.status(400).json({
          error: "Label and URL are required"
        });
      }

      const result = await pool.query(
        `
        INSERT INTO buttons
        (label,url,icon,location,visible,sort_order)
        VALUES($1,$2,$3,$4,$5,$6)
        RETURNING *
        `,
        [
          label,
          url,
          icon,
          location,
          Boolean(visible),
          Number(sort_order) || 0
        ]
      );

      res.json(result.rows[0]);

    } catch (error) {
      console.error("Button create error:", error);

      res.status(500).json({
        error: "Failed to create button"
      });
    }
  }
);

app.put(
  "/api/admin/buttons/:id",
  requireAuth,
  async (req, res) => {
    try {
      const {
        label,
        url,
        icon = "→",
        location = "custom",
        visible = true,
        sort_order = 0
      } = req.body;

      await pool.query(
        `
        UPDATE buttons
        SET
          label = $1,
          url = $2,
          icon = $3,
          location = $4,
          visible = $5,
          sort_order = $6
        WHERE id = $7
        `,
        [
          label,
          url,
          icon,
          location,
          Boolean(visible),
          Number(sort_order) || 0,
          req.params.id
        ]
      );

      res.json({
        ok: true
      });

    } catch (error) {
      console.error("Button update error:", error);

      res.status(500).json({
        error: "Failed to update button"
      });
    }
  }
);

app.delete(
  "/api/admin/buttons/:id",
  requireAuth,
  async (req, res) => {
    try {
      await pool.query(
        "DELETE FROM buttons WHERE id = $1",
        [req.params.id]
      );

      res.json({
        ok: true
      });

    } catch (error) {
      res.status(500).json({
        error: "Failed to delete button"
      });
    }
  }
);

// ===============================
// ADMIN DIARY
// ===============================

app.get(
  "/api/admin/diary",
  requireAuth,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT *
        FROM diary
        ORDER BY sort_order ASC, id ASC
      `);

      res.json(result.rows);

    } catch (error) {
      res.status(500).json({
        error: "Failed to load diary"
      });
    }
  }
);

app.post(
  "/api/admin/diary",
  requireAuth,
  async (req, res) => {
    try {
      const {
        chapter,
        title,
        excerpt = "",
        body = "",
        date_text = "",
        visible = true,
        sort_order = 0
      } = req.body;

      if (!chapter || !title) {
        return res.status(400).json({
          error: "Chapter and title are required"
        });
      }

      const result = await pool.query(
        `
        INSERT INTO diary
        (chapter,title,excerpt,body,date_text,visible,sort_order)
        VALUES($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        `,
        [
          chapter,
          title,
          excerpt,
          body,
          date_text,
          Boolean(visible),
          Number(sort_order) || 0
        ]
      );

      res.json(result.rows[0]);

    } catch (error) {
      console.error("Diary create error:", error);

      res.status(500).json({
        error: "Failed to create diary"
      });
    }
  }
);

app.put(
  "/api/admin/diary/:id",
  requireAuth,
  async (req, res) => {
    try {
      const {
        chapter,
        title,
        excerpt = "",
        body = "",
        date_text = "",
        visible = true,
        sort_order = 0
      } = req.body;

      await pool.query(
        `
        UPDATE diary
        SET
          chapter = $1,
          title = $2,
          excerpt = $3,
          body = $4,
          date_text = $5,
          visible = $6,
          sort_order = $7
        WHERE id = $8
        `,
        [
          chapter,
          title,
          excerpt,
          body,
          date_text,
          Boolean(visible),
          Number(sort_order) || 0,
          req.params.id
        ]
      );

      res.json({
        ok: true
      });

    } catch (error) {
      console.error("Diary update error:", error);

      res.status(500).json({
        error: "Failed to update diary"
      });
    }
  }
);

app.delete(
  "/api/admin/diary/:id",
  requireAuth,
  async (req, res) => {
    try {
      await pool.query(
        "DELETE FROM diary WHERE id = $1",
        [req.params.id]
      );

      res.json({
        ok: true
      });

    } catch (error) {
      res.status(500).json({
        error: "Failed to delete diary"
      });
    }
  }
);

// ===============================
// ADMIN PAGE
// ===============================

app.get("/admin", (req, res) => {

  const possibleFiles = [
    path.join(ROOT, "admin", "index.html"),
    path.join(PUBLIC, "admin", "index.html")
  ];

  for (const file of possibleFiles) {
    if (fileExists(file)) {
      return res.sendFile(file);
    }
  }

  // If admin/index.html doesn't exist,
  // provide built-in login page.

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport"
content="width=device-width,initial-scale=1">

<title>Prosenjit Admin</title>

<style>
*{
box-sizing:border-box;
}

body{
margin:0;
min-height:100vh;
background:#080b10;
color:#f5f5f5;
font-family:Arial,sans-serif;
display:flex;
align-items:center;
justify-content:center;
padding:24px;
}

.box{
width:100%;
max-width:580px;
background:#10151f;
border:1px solid #242b38;
border-radius:28px;
padding:56px;
}

.brand{
font-weight:800;
font-size:18px;
margin-bottom:45px;
}

.brand span{
color:#d6b36a;
}

h1{
font-family:Georgia,serif;
font-size:52px;
font-weight:400;
line-height:1.05;
margin:0 0 45px;
}

input{
width:100%;
padding:20px;
margin-bottom:18px;
border-radius:14px;
border:1px solid #29303c;
background:#070a0e;
color:white;
font-size:16px;
outline:none;
}

button{
width:100%;
padding:20px;
border:0;
border-radius:14px;
background:#d6b36a;
color:#080808;
font-size:17px;
font-weight:700;
cursor:pointer;
}

small{
display:block;
margin-top:20px;
color:#7d8796;
line-height:1.6;
}

#error{
color:#ff7676;
margin-top:15px;
}
</style>
</head>

<body>

<div class="box">

<div class="brand">
PROSENJIT<span>.</span> ADMIN
</div>

<h1>
Control your<br>
website.
</h1>

<input
id="username"
placeholder="Username"
value="admin"
/>

<input
id="password"
type="password"
placeholder="Password"
/>

<button onclick="login()">
Sign In →
</button>

<div id="error"></div>

<small>
Use the ADMIN_USERNAME and ADMIN_PASSWORD
values configured in Render.
</small>

</div>

<script>

async function login(){

const username =
document.getElementById("username").value;

const password =
document.getElementById("password").value;

const error =
document.getElementById("error");

error.textContent = "";

try{

const response = await fetch("/api/login",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
username,
password
})

});

const data = await response.json();

if(!response.ok){

error.textContent =
data.error || "Login failed";

return;

}

window.location.href="/admin";

}catch(e){

error.textContent =
"Connection error";

}

}

</script>

</body>
</html>
`);
});

// ===============================
// 404 HANDLER
// ===============================

app.use((req, res) => {

  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      error: "API endpoint not found"
    });
  }

  res.status(404).send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport"
content="width=device-width,initial-scale=1">
<title>404</title>
<style>
body{
background:#080b10;
color:white;
font-family:Arial;
display:flex;
align-items:center;
justify-content:center;
min-height:100vh;
text-align:center;
}
h1{
font-size:70px;
margin:0;
}
a{
color:#d6b36a;
}
</style>
</head>
<body>
<div>
<h1>404</h1>
<p>Page not found.</p>
<a href="/">Go Home</a>
</div>
</body>
</html>
`);
});

// ===============================
// START SERVER
// ===============================

async function startServer() {

  try {

    await initDatabase();

    app.listen(
      PORT,
      HOST,
      () => {

        console.log("");
        console.log("=================================");
        console.log("YOUR SERVICE IS LIVE 🎉");
        console.log("Port:", PORT);
        console.log("Host:", HOST);
        console.log("=================================");
        console.log("");
      }
    );

  } catch (error) {

    console.error("");
    console.error("DATABASE INITIALIZATION FAILED");
    console.error(error.message);
    console.error("");
    process.exit(1);
  }
}

startServer();
