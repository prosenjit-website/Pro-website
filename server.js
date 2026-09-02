const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;
const PUBLIC_DIR = path.join(__dirname, "public");
const ADMIN_DIR = path.join(PUBLIC_DIR, "admin");


// =====================================================
// DATABASE
// =====================================================

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5
});


// =====================================================
// BASIC
// =====================================================

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));


// =====================================================
// RENDER / HTTPS SESSION FIX
// =====================================================

app.set("trust proxy", 1);

app.use(
  session({
    name: "prosenjit.sid",

    secret:
      process.env.SESSION_SECRET ||
      "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET",

    resave: false,

    saveUninitialized: false,

    rolling: true,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);


// =====================================================
// STATIC WEBSITE
// =====================================================

app.use(express.static(PUBLIC_DIR));


// =====================================================
// DATABASE INIT
// =====================================================

async function initDatabase() {

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS buttons (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT DEFAULT '→',
      location TEXT DEFAULT 'home',
      visible BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS diary (
      id SERIAL PRIMARY KEY,
      chapter TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT DEFAULT '',
      body TEXT DEFAULT '',
      date_text TEXT DEFAULT '',
      visible BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      url TEXT DEFAULT '',
      image TEXT DEFAULT '',
      visible BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);


  // ===================================================
  // ADMIN USER
  // ===================================================

  const user = await pool.query(
    "SELECT id FROM users WHERE username=$1",
    [process.env.ADMIN_USERNAME || "admin"]
  );

  if (user.rowCount === 0) {

    const username =
      process.env.ADMIN_USERNAME || "admin";

    const password =
      process.env.ADMIN_PASSWORD || "admin123";

    const hash =
      bcrypt.hashSync(password, 12);

    await pool.query(
      `
      INSERT INTO users(username,password)
      VALUES($1,$2)
      `,
      [username, hash]
    );

    console.log("Admin user created:", username);
  }


  // ===================================================
  // DEFAULT CONTENT
  // ===================================================

  const defaults = {

    name: "Prosenjit Ray",

    tagline:
      "Dream • Learn • Create",

    intro:
      "আমি Prosenjit Ray, Dinajpur Government College-এর Honours 1st Year-এর একজন শিক্ষার্থী। এটি আমার personal digital space।",

    college:
      "Dinajpur Government College",

    education:
      "Honours 1st Year",

    about:
      "আমি নতুন কিছু শিখতে, তৈরি করতে এবং নিজের journey document করতে ভালোবাসি।",

    profile:
      "profile.jpg",

    facebook: "",

    instagram: "",

    whatsapp: "",

    github: "",

    gmail: "",

    phone: ""
  };


  for (const [key, value] of Object.entries(defaults)) {

    await pool.query(
      `
      INSERT INTO content(key,value)
      VALUES($1,$2)
      ON CONFLICT(key)
      DO NOTHING
      `,
      [key, value]
    );

  }


  console.log("Database initialized successfully.");
}


// =====================================================
// AUTH
// =====================================================

function requireAdmin(req, res, next) {

  if (
    req.session &&
    (
      req.session.admin === true ||
      req.session.user
    )
  ) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: "Unauthorized"
  });
}


// =====================================================
// CONTENT HELPER
// =====================================================

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


// =====================================================
// PUBLIC SITE API
// =====================================================

app.get("/api/site", async (req, res) => {

  try {

    const [
      content,
      buttons,
      diary,
      projects
    ] = await Promise.all([

      getContent(),

      pool.query(`
        SELECT *
        FROM buttons
        WHERE visible=TRUE
        ORDER BY sort_order,id
      `),

      pool.query(`
        SELECT *
        FROM diary
        WHERE visible=TRUE
        ORDER BY sort_order,id
      `),

      pool.query(`
        SELECT *
        FROM projects
        WHERE visible=TRUE
        ORDER BY sort_order,id
      `)

    ]);


    res.json({

      content,

      buttons:
        buttons.rows,

      diary:
        diary.rows,

      projects:
        projects.rows

    });

  } catch (error) {

    console.error(
      "PUBLIC API ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      error: "Database error"
    });

  }

});


// =====================================================
// LOGIN
// =====================================================

async function loginHandler(req, res) {

  try {

    const username =
      String(
        req.body.username || ""
      ).trim();

    const password =
      String(
        req.body.password || ""
      );


    const result =
      await pool.query(
        `
        SELECT *
        FROM users
        WHERE username=$1
        `,
        [username]
      );


    const user =
      result.rows[0];


    if (
      !user ||
      !bcrypt.compareSync(
        password,
        user.password
      )
    ) {

      return res.status(401).json({
        success: false,
        error: "Invalid username or password"
      });

    }


    // VERY IMPORTANT
    req.session.admin = true;

    req.session.user = {
      id: user.id,
      username: user.username
    };


    // Force session save before response
    req.session.save(err => {

      if (err) {

        console.error(
          "SESSION SAVE ERROR:",
          err
        );

        return res.status(500).json({
          success: false,
          error: "Session save failed"
        });

      }


      res.json({
        success: true,
        ok: true,
        username: user.username
      });

    });

  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      error: "Login error"
    });

  }

}


// Support BOTH old and new login URLs

app.post(
  "/api/login",
  loginHandler
);

app.post(
  "/api/admin/login",
  loginHandler
);


// =====================================================
// SESSION CHECK
// =====================================================

app.get(
  "/api/me",
  (req, res) => {

    res.json({

      loggedIn:
        !!(
          req.session &&
          (
            req.session.admin === true ||
            req.session.user
          )
        ),

      username:
        req.session?.user?.username ||
        null

    });

  }
);


app.get(
  "/api/admin/session",
  (req, res) => {

    res.json({

      loggedIn:
        !!(
          req.session &&
          (
            req.session.admin === true ||
            req.session.user
          )
        )

    });

  }
);


// =====================================================
// LOGOUT
// =====================================================

function logoutHandler(req, res) {

  req.session.destroy(err => {

    if (err) {

      return res.status(500).json({
        success: false,
        error: "Logout failed"
      });

    }


    res.clearCookie(
      "prosenjit.sid",
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV === "production"
      }
    );


    res.json({
      success: true,
      ok: true
    });

  });

}


app.post(
  "/api/logout",
  logoutHandler
);

app.post(
  "/api/admin/logout",
  logoutHandler
);


// =====================================================
// ADMIN CONTENT
// =====================================================

app.get(
  "/api/admin/content",
  requireAdmin,
  async (req, res) => {

    try {

      res.json(
        await getContent()
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Unable to load content"
      });

    }

  }
);


app.put(
  "/api/admin/content",
  requireAdmin,
  async (req, res) => {

    try {

      const data =
        req.body || {};


      for (
        const [key, value]
        of Object.entries(data)
      ) {

        await pool.query(
          `
          INSERT INTO content(key,value)
          VALUES($1,$2)
          ON CONFLICT(key)
          DO UPDATE SET
          value=EXCLUDED.value
          `,
          [
            key,
            String(value ?? "")
          ]
        );

      }


      res.json({

        success: true,

        content:
          await getContent()

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error: "Save failed"
      });

    }

  }
);


// =====================================================
// BUTTONS
// =====================================================

app.get(
  "/api/admin/buttons",
  requireAdmin,
  async (req, res) => {

    try {

      const result =
        await pool.query(`
          SELECT *
          FROM buttons
          ORDER BY sort_order,id
        `);

      res.json(result.rows);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Unable to load buttons"
      });

    }

  }
);


app.post(
  "/api/admin/buttons",
  requireAdmin,
  async (req, res) => {

    try {

      const {
        label,
        url,
        icon = "→",
        location = "home",
        visible = true,
        sort_order = 0
      } = req.body;


      if (!label || !url) {

        return res.status(400).json({
          error:
            "Button label and URL required"
        });

      }


      const result =
        await pool.query(
          `
          INSERT INTO buttons
          (
            label,
            url,
            icon,
            location,
            visible,
            sort_order
          )
          VALUES
          ($1,$2,$3,$4,$5,$6)
          RETURNING *
          `,
          [
            String(label).trim(),
            String(url).trim(),
            String(icon || "→"),
            String(location || "home"),
            visible !== false,
            Number(sort_order) || 0
          ]
        );


      res.json({
        success: true,
        button: result.rows[0]
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error: "Unable to add button"
      });

    }

  }
);


app.put(
  "/api/admin/buttons/:id",
  requireAdmin,
  async (req, res) => {

    try {

      const {
        label,
        url,
        icon = "→",
        location = "home",
        visible = true,
        sort_order = 0
      } = req.body;


      await pool.query(
        `
        UPDATE buttons
        SET
          label=$1,
          url=$2,
          icon=$3,
          location=$4,
          visible=$5,
          sort_order=$6
        WHERE id=$7
        `,
        [
          String(label || "").trim(),
          String(url || "").trim(),
          String(icon || "→"),
          String(location || "home"),
          visible !== false,
          Number(sort_order) || 0,
          Number(req.params.id)
        ]
      );


      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error: "Unable to update button"
      });

    }

  }
);


app.delete(
  "/api/admin/buttons/:id",
  requireAdmin,
  async (req, res) => {

    try {

      await pool.query(
        "DELETE FROM buttons WHERE id=$1",
        [Number(req.params.id)]
      );


      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error: "Unable to delete button"
      });

    }

  }
);


// =====================================================
// DIARY
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
          ORDER BY sort_order,id
        `);

      res.json(result.rows);

    } catch (error) {

      console.error(
        "DIARY LOAD ERROR:",
        error
      );

      res.status(500).json({
        error: "Unable to load diary"
      });

    }

  }
);


app.post(
  "/api/admin/diary",
  requireAdmin,
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
          error:
            "Chapter and title required"
        });

      }


      const result =
        await pool.query(
          `
          INSERT INTO diary
          (
            chapter,
            title,
            excerpt,
            body,
            date_text,
            visible,
            sort_order
          )
          VALUES
          ($1,$2,$3,$4,$5,$6,$7)
          RETURNING *
          `,
          [
            String(chapter).trim(),
            String(title).trim(),
            String(excerpt || ""),
            String(body || ""),
            String(date_text || ""),
            visible !== false,
            Number(sort_order) || 0
          ]
        );


      res.json({
        success: true,
        diary: result.rows[0]
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error: "Unable to add diary"
      });

    }

  }
);


app.put(
  "/api/admin/diary/:id",
  requireAdmin,
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
          chapter=$1,
          title=$2,
          excerpt=$3,
          body=$4,
          date_text=$5,
          visible=$6,
          sort_order=$7
        WHERE id=$8
        `,
        [
          String(chapter || "").trim(),
          String(title || "").trim(),
          String(excerpt || ""),
          String(body || ""),
          String(date_text || ""),
          visible !== false,
          Number(sort_order) || 0,
          Number(req.params.id)
        ]
      );


      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error: "Unable to update diary"
      });

    }

  }
);


app.delete(
  "/api/admin/diary/:id",
  requireAdmin,
  async (req, res) => {

    try {

      await pool.query(
        "DELETE FROM diary WHERE id=$1",
        [Number(req.params.id)]
      );


      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error: "Unable to delete diary"
      });

    }

  }
);


// =====================================================
// PROJECTS
// =====================================================

app.get(
  "/api/admin/projects",
  requireAdmin,
  async (req, res) => {

    try {

      const result =
        await pool.query(`
          SELECT *
          FROM projects
          ORDER BY sort_order,id
        `);


      res.json(result.rows);

    } catch (error) {

      console.error(
        "PROJECT LOAD ERROR:",
        error
      );

      res.status(500).json({
        error: "Unable to load projects"
      });

    }

  }
);


app.post(
  "/api/admin/projects",
  requireAdmin,
  async (req, res) => {

    try {

      const {
        title,
        description = "",
        url = "",
        image = "",
        visible = true,
        sort_order = 0
      } = req.body;


      if (!title) {

        return res.status(400).json({
          error: "Project title required"
        });

      }


      const result =
        await pool.query(
          `
          INSERT INTO projects
          (
            title,
            description,
            url,
            image,
            visible,
            sort_order
          )
          VALUES
          ($1,$2,$3,$4,$5,$6)
          RETURNING *
          `,
          [
            String(title).trim(),
            String(description || ""),
            String(url || ""),
            String(image || ""),
            visible !== false,
            Number(sort_order) || 0
          ]
        );


      res.json({
        success: true,
        project: result.rows[0]
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error: "Unable to add project"
      });

    }

  }
);


app.put(
  "/api/admin/projects/:id",
  requireAdmin,
  async (req, res) => {

    try {

      const {
        title,
        description = "",
        url = "",
        image = "",
        visible = true,
        sort_order = 0
      } = req.body;


      await pool.query(
        `
        UPDATE projects
        SET
          title=$1,
          description=$2,
          url=$3,
          image=$4,
          visible=$5,
          sort_order=$6
        WHERE id=$7
        `,
        [
          String(title || "").trim(),
          String(description || ""),
          String(url || ""),
          String(image || ""),
          visible !== false,
          Number(sort_order) || 0,
          Number(req.params.id)
        ]
      );


      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error: "Unable to update project"
      });

    }

  }
);


app.delete(
  "/api/admin/projects/:id",
  requireAdmin,
  async (req, res) => {

    try {

      await pool.query(
        "DELETE FROM projects WHERE id=$1",
        [Number(req.params.id)]
      );


      res.json({
        success: true
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error: "Unable to delete project"
      });

    }

  }
);


// =====================================================
// ADMIN PAGE
// =====================================================

app.get(
  "/admin",
  (req, res) => {

    res.sendFile(
      path.join(
        ADMIN_DIR,
        "index.html"
      )
    );

  }
);


app.get(
  "/admin/",
  (req, res) => {

    res.sendFile(
      path.join(
        ADMIN_DIR,
        "index.html"
      )
    );

  }
);


// =====================================================
// HEALTH
// =====================================================

app.get(
  "/health",
  (req, res) => {

    res.json({
      status: "ok",
      project: "Prosenjit Ultra Pro Max",
      time: new Date().toISOString()
    });

  }
);


// =====================================================
// 404
// =====================================================

app.use(
  (req, res) => {

    res.status(404).json({
      success: false,
      error: "Not found"
    });

  }
);


// =====================================================
// START
// =====================================================

async function start() {

  try {

    await initDatabase();


    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          `Prosenjit Ultra Pro Max running on ${PORT}`
        );

      }
    );

  } catch (error) {

    console.error(
      "SERVER START ERROR:",
      error
    );

    process.exit(1);

  }

}

start();
