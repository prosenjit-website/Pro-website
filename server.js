const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
  max: 5
});

app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 8
  }
}));

/* =========================
   DATABASE
========================= */

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content(
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS buttons(
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT DEFAULT '→',
      location TEXT DEFAULT 'home',
      visible BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS diary(
      id SERIAL PRIMARY KEY,
      chapter TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT DEFAULT '',
      body TEXT DEFAULT '',
      date_text TEXT DEFAULT '',
      visible BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0
    );
  `);

  const user = await pool.query("SELECT id FROM users LIMIT 1");

  if (user.rowCount === 0) {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const hash = await bcrypt.hash(password, 12);

    await pool.query(
      "INSERT INTO users(username,password) VALUES($1,$2)",
      [username, hash]
    );
  }

  const defaults = {
    name: "Prosenjit Ray",
    tagline: "Dream • Learn • Create",
    intro: "Honours 1st Year student at Dinajpur Government College. This is my digital space for my education, ideas, experiences and journey.",
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
      `INSERT INTO content(key,value)
       VALUES($1,$2)
       ON CONFLICT(key) DO NOTHING`,
      [key, value]
    );
  }

  const buttonCount = await pool.query(
    "SELECT COUNT(*)::int AS c FROM buttons"
  );

  if (buttonCount.rows[0].c === 0) {
    const buttons = [
      ["Explore My World", "#about", "→", "hero", 1],
      ["Read My Diary", "#diary", "↗", "hero", 2],
      ["Let's Talk", "#contact", "✦", "hero", 3]
    ];

    for (const b of buttons) {
      await pool.query(
        `INSERT INTO buttons
        (label,url,icon,location,sort_order)
        VALUES($1,$2,$3,$4,$5)`,
        b
      );
    }
  }

  const diaryCount = await pool.query(
    "SELECT COUNT(*)::int AS c FROM diary"
  );

  if (diaryCount.rows[0].c === 0) {
    const diary = [
      [
        "CHAPTER 01",
        "The Beginning",
        "Every journey starts somewhere.",
        "Every journey starts with a first step. This chapter is about dreams, questions, challenges and possibilities.",
        "2026",
        1
      ],
      [
        "CHAPTER 02",
        "A New Chapter",
        "A new phase of education and growth.",
        "A new academic chapter brings new people, new lessons and new responsibilities. I want to make this chapter meaningful.",
        "2026",
        2
      ]
    ];

    for (const d of diary) {
      await pool.query(
        `INSERT INTO diary
        (chapter,title,excerpt,body,date_text,sort_order)
        VALUES($1,$2,$3,$4,$5,$6)`,
        d
      );
    }
  }
}

async function getContent() {
  const result = await pool.query(
    "SELECT key,value FROM content"
  );

  return Object.fromEntries(
    result.rows.map(row => [row.key, row.value])
  );
}

function auth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  next();
}

/* =========================
   STATIC WEBSITE
========================= */

/* Files are currently uploaded directly in repository root */
app.use(express.static(__dirname));

/* Explicit homepage route */
app.get("/", (req, res) => {
  const rootIndex = path.join(__dirname, "index.html");
  const publicIndex = path.join(__dirname, "public", "index.html");

  res.sendFile(rootIndex, err => {
    if (err) {
      res.sendFile(publicIndex, err2 => {
        if (err2) {
          res.status(404).send("Homepage not found");
        }
      });
    }
  });
});

/* =========================
   PUBLIC API
========================= */

app.get("/api/site", async (req, res) => {
  try {
    const [content, buttons, diary] = await Promise.all([
      getContent(),

      pool.query(
        `SELECT * FROM buttons
         WHERE visible=TRUE
         ORDER BY sort_order,id`
      ),

      pool.query(
        `SELECT * FROM diary
         WHERE visible=TRUE
         ORDER BY sort_order,id`
      )
    ]);

    res.json({
      content,
      buttons: buttons.rows,
      diary: diary.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Database error"
    });
  }
});

/* =========================
   LOGIN
========================= */

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE username=$1",
      [username || ""]
    );

    const user = result.rows[0];

    if (
      !user ||
      !(await bcrypt.compare(password || "", user.password))
    ) {
      return res.status(401).json({
        error: "Invalid login"
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username
    };

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Login error"
    });
  }
});

app.post("/api/logout", auth, (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/me", (req, res) => {
  res.json({
    loggedIn: !!req.session.user,
    username: req.session.user?.username || null
  });
});

/* =========================
   ADMIN CONTENT
========================= */

app.get("/api/admin/content", auth, async (req, res) => {
  res.json(await getContent());
});

app.put("/api/admin/content", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const [key, value] of Object.entries(req.body || {})) {
      await client.query(
        `INSERT INTO content(key,value)
         VALUES($1,$2)
         ON CONFLICT(key)
         DO UPDATE SET value=EXCLUDED.value`,
        [key, String(value)]
      );
    }

    await client.query("COMMIT");

    res.json({
      ok: true,
      content: await getContent()
    });

  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({
      error: "Save failed"
    });

  } finally {
    client.release();
  }
});

/* =========================
   ADMIN BUTTONS
========================= */

app.get("/api/admin/buttons", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM buttons ORDER BY sort_order,id"
  );

  res.json(result.rows);
});

app.post("/api/admin/buttons", auth, async (req, res) => {
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
      error: "Label and URL required"
    });
  }

  const result = await pool.query(
    `INSERT INTO buttons
    (label,url,icon,location,visible,sort_order)
    VALUES($1,$2,$3,$4,$5,$6)
    RETURNING *`,
    [
      label,
      url,
      icon,
      location,
      !!visible,
      Number(sort_order) || 0
    ]
  );

  res.json(result.rows[0]);
});

app.put("/api/admin/buttons/:id", auth, async (req, res) => {
  const {
    label,
    url,
    icon,
    location,
    visible,
    sort_order
  } = req.body;

  await pool.query(
    `UPDATE buttons
     SET label=$1,
         url=$2,
         icon=$3,
         location=$4,
         visible=$5,
         sort_order=$6
     WHERE id=$7`,
    [
      label,
      url,
      icon || "→",
      location || "custom",
      !!visible,
      Number(sort_order) || 0,
      req.params.id
    ]
  );

  res.json({ ok: true });
});

app.delete("/api/admin/buttons/:id", auth, async (req, res) => {
  await pool.query(
    "DELETE FROM buttons WHERE id=$1",
    [req.params.id]
  );

  res.json({ ok: true });
});

/* =========================
   ADMIN DIARY
========================= */

app.get("/api/admin/diary", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM diary ORDER BY sort_order,id"
  );

  res.json(result.rows);
});

app.post("/api/admin/diary", auth, async (req, res) => {
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
      error: "Chapter and title required"
    });
  }

  const result = await pool.query(
    `INSERT INTO diary
    (chapter,title,excerpt,body,date_text,visible,sort_order)
    VALUES($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,
    [
      chapter,
      title,
      excerpt,
      body,
      date_text,
      !!visible,
      Number(sort_order) || 0
    ]
  );

  res.json(result.rows[0]);
});

app.put("/api/admin/diary/:id", auth, async (req, res) => {
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
    `UPDATE diary
     SET chapter=$1,
         title=$2,
         excerpt=$3,
         body=$4,
         date_text=$5,
         visible=$6,
         sort_order=$7
     WHERE id=$8`,
    [
      chapter,
      title,
      excerpt,
      body,
      date_text,
      !!visible,
      Number(sort_order) || 0,
      req.params.id
    ]
  );

  res.json({ ok: true });
});

app.delete("/api/admin/diary/:id", auth, async (req, res) => {
  await pool.query(
    "DELETE FROM diary WHERE id=$1",
    [req.params.id]
  );

  res.json({ ok: true });
});

/* =========================
   ADMIN PAGE
========================= */

app.get("/admin", (req, res) => {
  res.send(`
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport"
content="width=device-width,initial-scale=1">
<title>Admin Panel</title>

<link rel="stylesheet" href="/admin.css">

</head>

<body>

<div id="login" class="login">

<div>

<b>PROSENJIT<span>.</span> ADMIN</b>

<h1>Control your website.</h1>

<input
id="user"
placeholder="Username"
value="admin">

<input
id="pass"
type="password"
placeholder="Password">

<button onclick="login()">
Sign In →
</button>

<small>
Use the ADMIN_USERNAME and ADMIN_PASSWORD
from Render Environment Variables.
</small>

</div>

</div>


<div id="app" class="hidden">

<aside>

<b>
PROSENJIT<span>.</span>
</b>

<button onclick="show('content')">
Site Content
</button>

<button onclick="show('buttons')">
Buttons
</button>

<button onclick="show('diary')">
Diary
</button>

<a href="/" target="_blank">
View Website ↗
</a>

<button onclick="logout()">
Logout
</button>

</aside>


<main>

<header>

<h1 id="title">
Site Content
</h1>

<span>
ADMIN DASHBOARD
</span>

</header>

<section id="content"></section>

<section
id="buttons"
class="hidden">
</section>

<section
id="diary"
class="hidden">
</section>

</main>

</div>


<script src="/admin.js"></script>

</body>
</html>
`);
});

/* =========================
   START SERVER
========================= */

initDb()
  .then(() => {

    app.listen(PORT, "0.0.0.0", () => {

      console.log(
        `Prosenjit site running on port ${PORT}`
      );

    });

  })
  .catch(error => {

    console.error(
      "Database initialization failed:",
      error
    );

    process.exit(1);

  });
