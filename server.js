const express = require("express");
const session = require("express-session");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 10000;

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});


// =====================================================
// BASIC MIDDLEWARE
// =====================================================

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));


// =====================================================
// SESSION
// =====================================================

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "CHANGE_THIS_SESSION_SECRET",

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      secure:
        process.env.NODE_ENV === "production",

      maxAge: 1000 * 60 * 60 * 24
    }
  })
);


// =====================================================
// STATIC PUBLIC WEBSITE
// =====================================================

const PUBLIC_DIR = path.join(
  __dirname,
  "public"
);

app.use(
  express.static(PUBLIC_DIR)
);


// =====================================================
// DEFAULT SITE DATA
// =====================================================

const DEFAULT_SITE = {

  name: "Prosenjit Ray",

  tagline:
    "Student • Dreamer • Builder",

  college:
    "Dinajpur Government College",

  education:
    "Honours 1st Year",

  about:
    "I am Prosenjit Ray, an Honours 1st Year student at Dinajpur Government College. This is my personal digital space where I share my story, ideas, diary, projects and future journey.",

  photo: "",

  skills: [
    "Creative Thinking",
    "Web Design",
    "Communication",
    "Learning"
  ],

  social: {
    facebook: "",
    instagram: "",
    github: "",
    email: ""
  },

  buttons: [
    {
      id: "primary",
      label: "Explore My Story",
      url: "/about.html",
      visible: true,
      order: 1
    },

    {
      id: "secondary",
      label: "Get In Touch",
      url: "/contact.html",
      visible: true,
      order: 2
    }
  ]
};


// =====================================================
// DATABASE INITIALIZATION
// =====================================================

async function initializeDatabase() {

  if (!DATABASE_URL) {

    console.log(
      "DATABASE_URL is not configured."
    );

    return;
  }

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


    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        url TEXT DEFAULT '',
        image TEXT DEFAULT '',
        visible BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);


    const site =
      await pool.query(
        "SELECT id FROM site_content WHERE id = 1"
      );


    if (site.rows.length === 0) {

      await pool.query(
        `
        INSERT INTO site_content
        (id, data)
        VALUES
        (1, $1)
        `,
        [
          JSON.stringify(DEFAULT_SITE)
        ]
      );

    }


    console.log(
      "Database initialized successfully."
    );

  } catch (error) {

    console.error(
      "Database initialization error:",
      error.message
    );

  }
}


// =====================================================
// AUTH MIDDLEWARE
// =====================================================

function requireAdmin(
  req,
  res,
  next
) {

  if (req.session &&
      req.session.admin === true) {

    return next();

  }

  return res.status(401).json({
    success: false,
    error: "Unauthorized"
  });

}


// =====================================================
// SITE API
// =====================================================

app.get(
  "/api/site",
  async (req, res) => {

    try {

      const result =
        await pool.query(
          "SELECT data FROM site_content WHERE id = 1"
        );


      if (
        result.rows.length === 0
      ) {

        return res.json(
          DEFAULT_SITE
        );

      }


      res.json(
        result.rows[0].data
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Unable to load site data"
      });

    }

  }
);


// =====================================================
// DIARY PUBLIC API
// =====================================================

app.get(
  "/api/diary",
  async (req, res) => {

    try {

      const result =
        await pool.query(`
          SELECT
            id,
            title,
            content,
            date
          FROM diary
          WHERE visible = TRUE
          ORDER BY created_at DESC
        `);


      res.json(
        result.rows
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Unable to load diary"
      });

    }

  }
);


// =====================================================
// PROJECT PUBLIC API
// =====================================================

app.get(
  "/api/projects",
  async (req, res) => {

    try {

      const result =
        await pool.query(`
          SELECT
            id,
            title,
            description,
            url,
            image
          FROM projects
          WHERE visible = TRUE
          ORDER BY
            sort_order ASC,
            created_at DESC
        `);


      res.json(
        result.rows
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Unable to load projects"
      });

    }

  }
);


// =====================================================
// ADMIN LOGIN
// =====================================================

app.post(
  "/api/admin/login",
  (req, res) => {

    const username =
      process.env.ADMIN_USERNAME ||
      "admin";

    const password =
      process.env.ADMIN_PASSWORD ||
      "admin123";


    const submittedUsername =
      String(
        req.body.username || ""
      );

    const submittedPassword =
      String(
        req.body.password || ""
      );


    if (
      submittedUsername !== username ||
      submittedPassword !== password
    ) {

      return res.status(401).json({

        success: false,

        error:
          "Invalid username or password"

      });

    }


    req.session.admin = true;


    res.json({
      success: true
    });

  }
);


// =====================================================
// ADMIN LOGOUT
// =====================================================

app.post(
  "/api/admin/logout",
  requireAdmin,
  (req, res) => {

    req.session.destroy(
      function () {

        res.json({
          success: true
        });

      }
    );

  }
);


// =====================================================
// ADMIN SESSION CHECK
// =====================================================

app.get(
  "/api/admin/session",
  (req, res) => {

    res.json({

      loggedIn:
        req.session &&
        req.session.admin === true

    });

  }
);


// =====================================================
// ADMIN GET SITE CONTENT
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
        result.rows[0]?.data ||
        DEFAULT_SITE
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Unable to load content"
      });

    }

  }
);


// =====================================================
// ADMIN UPDATE SITE CONTENT
// =====================================================

app.put(
  "/api/admin/content",
  requireAdmin,
  async (req, res) => {

    try {

      const result =
        await pool.query(
          "SELECT data FROM site_content WHERE id = 1"
        );


      const oldData =
        result.rows[0]?.data ||
        DEFAULT_SITE;


      const incoming =
        req.body || {};


      const finalData = {

        ...DEFAULT_SITE,

        ...oldData,

        ...incoming,


        social: {

          ...DEFAULT_SITE.social,

          ...(oldData.social || {}),

          ...(incoming.social || {})

        },


        skills:
          Array.isArray(
            incoming.skills
          )
            ? incoming.skills
            : oldData.skills,


        buttons:
          Array.isArray(
            incoming.buttons
          )
            ? incoming.buttons
            : oldData.buttons

      };


      await pool.query(
        `
        UPDATE site_content
        SET data = $1
        WHERE id = 1
        `,
        [
          JSON.stringify(
            finalData
          )
        ]
      );


      res.json({
        success: true,
        data: finalData
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        error:
          "Unable to save site content"

      });

    }

  }
);


// =====================================================
// ADMIN DIARY LIST
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
          ORDER BY
            created_at DESC
        `);


      res.json(
        result.rows
      );

    } catch (error) {

      res.status(500).json({
        error:
          "Unable to load diary"
      });

    }

  }
);


// =====================================================
// ADMIN ADD DIARY
// =====================================================

app.post(
  "/api/admin/diary",
  requireAdmin,
  async (req, res) => {

    try {

      const title =
        String(
          req.body.title || ""
        ).trim();

      const content =
        String(
          req.body.content || ""
        ).trim();

      const date =
        String(
          req.body.date || ""
        ).trim();


      if (
        !title ||
        !content
      ) {

        return res.status(400).json({

          success: false,

          error:
            "Title and content are required"

        });

      }


      const result =
        await pool.query(
          `
          INSERT INTO diary
          (title, content, date, visible)
          VALUES
          ($1, $2, $3, TRUE)
          RETURNING *
          `,
          [
            title,
            content,
            date
          ]
        );


      res.json({

        success: true,

        diary:
          result.rows[0]

      });


    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        error:
          "Unable to add diary"

      });

    }

  }
);


// =====================================================
// ADMIN UPDATE DIARY
// =====================================================

app.put(
  "/api/admin/diary/:id",
  requireAdmin,
  async (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        );


      const title =
        String(
          req.body.title || ""
        ).trim();

      const content =
        String(
          req.body.content || ""
        ).trim();

      const date =
        String(
          req.body.date || ""
        ).trim();

      const visible =
        req.body.visible !== false;


      await pool.query(
        `
        UPDATE diary

        SET
          title = $1,
          content = $2,
          date = $3,
          visible = $4

        WHERE id = $5
        `,
        [
          title,
          content,
          date,
          visible,
          id
        ]
      );


      res.json({
        success: true
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        error:
          "Unable to update diary"
      });

    }

  }
);


// =====================================================
// ADMIN DELETE DIARY
// =====================================================

app.delete(
  "/api/admin/diary/:id",
  requireAdmin,
  async (req, res) => {

    try {

      await pool.query(
        "DELETE FROM diary WHERE id = $1",
        [
          Number(
            req.params.id
          )
        ]
      );


      res.json({
        success: true
      });


    } catch (error) {

      res.status(500).json({
        success: false,
        error:
          "Unable to delete diary"
      });

    }

  }
);


// =====================================================
// ADMIN PROJECT LIST
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
          ORDER BY
            sort_order ASC,
            created_at DESC
        `);


      res.json(
        result.rows
      );


    } catch (error) {

      res.status(500).json({
        error:
          "Unable to load projects"
      });

    }

  }
);


// =====================================================
// ADMIN ADD PROJECT
// =====================================================

app.post(
  "/api/admin/projects",
  requireAdmin,
  async (req, res) => {

    try {

      const title =
        String(
          req.body.title || ""
        ).trim();

      const description =
        String(
          req.body.description || ""
        ).trim();

      const url =
        String(
          req.body.url || ""
        ).trim();

      const image =
        String(
          req.body.image || ""
        ).trim();


      if (!title) {

        return res.status(400).json({

          success: false,

          error:
            "Project title is required"

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
          ($1,$2,$3,$4,TRUE,0)

          RETURNING *
          `,
          [
            title,
            description,
            url,
            image
          ]
        );


      res.json({

        success: true,

        project:
          result.rows[0]

      });


    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        error:
          "Unable to add project"

      });

    }

  }
);


// =====================================================
// ADMIN UPDATE PROJECT
// =====================================================

app.put(
  "/api/admin/projects/:id",
  requireAdmin,
  async (req, res) => {

    try {

      await pool.query(
        `
        UPDATE projects

        SET
          title = $1,
          description = $2,
          url = $3,
          image = $4,
          visible = $5,
          sort_order = $6

        WHERE id = $7
        `,
        [
          String(
            req.body.title || ""
          ).trim(),

          String(
            req.body.description || ""
          ).trim(),

          String(
            req.body.url || ""
          ).trim(),

          String(
            req.body.image || ""
          ).trim(),

          req.body.visible !== false,

          Number(
            req.body.sort_order || 0
          ),

          Number(
            req.params.id
          )
        ]
      );


      res.json({
        success: true
      });


    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        error:
          "Unable to update project"

      });

    }

  }
);


// =====================================================
// ADMIN DELETE PROJECT
// =====================================================

app.delete(
  "/api/admin/projects/:id",
  requireAdmin,
  async (req, res) => {

    try {

      await pool.query(
        "DELETE FROM projects WHERE id = $1",
        [
          Number(
            req.params.id
          )
        ]
      );


      res.json({
        success: true
      });


    } catch (error) {

      res.status(500).json({

        success: false,

        error:
          "Unable to delete project"

      });

    }

  }
);


// =====================================================
// PAGE ROUTES
// =====================================================

// Root automatically loads:
// public/index.html

app.get(
  "/about",
  (req, res) => {

    res.sendFile(
      path.join(
        PUBLIC_DIR,
        "about.html"
      )
    );

  }
);


app.get(
  "/education",
  (req, res) => {

    res.sendFile(
      path.join(
        PUBLIC_DIR,
        "education.html"
      )
    );

  }
);


app.get(
  "/diary",
  (req, res) => {

    res.sendFile(
      path.join(
        PUBLIC_DIR,
        "diary.html"
      )
    );

  }
);


app.get(
  "/projects",
  (req, res) => {

    res.sendFile(
      path.join(
        PUBLIC_DIR,
        "projects.html"
      )
    );

  }
);


app.get(
  "/contact",
  (req, res) => {

    res.sendFile(
      path.join(
        PUBLIC_DIR,
        "contact.html"
      )
    );

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
        PUBLIC_DIR,
        "admin",
        "index.html"
      )
    );

  }
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/health",
  (req, res) => {

    res.json({

      status: "ok",

      project:
        "Prosenjit Ultra Pro Max",

      time:
        new Date().toISOString()

    });

  }
);


// =====================================================
// 404
// =====================================================

app.use(
  (req, res) => {

    res.status(404).send(`
      <!DOCTYPE html>

      <html>

      <head>

      <meta
      name="viewport"
      content="width=device-width,initial-scale=1"
      >

      <title>404 · Prosenjit Ray</title>

      <style>

      body{
        margin:0;
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#05070b;
        color:white;
        font-family:Arial;
        text-align:center;
      }

      a{
        color:white;
      }

      </style>

      </head>

      <body>

      <div>

      <h1>404</h1>

      <p>Page not found.</p>

      <a href="/">← Back Home</a>

      </div>

      </body>

      </html>
    `);

  }
);


// =====================================================
// START SERVER
// =====================================================

async function startServer() {

  await initializeDatabase();


  app.listen(
    PORT,
    "0.0.0.0",
    () => {

      console.log(
        `Prosenjit Ultra Pro Max running on port ${PORT}`
      );

    }
  );

}


startServer();
