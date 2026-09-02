const express = require("express");
const session = require("express-session");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 10000;
const DATABASE_URL = process.env.DATABASE_URL;


// =====================================================
// DATABASE
// =====================================================

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL ? { rejectUnauthorized: false } : false
});


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json({ limit: "5mb" }));
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

      sameSite: "lax",

      maxAge:
        1000 * 60 * 60 * 24 * 7
    }
  })
);


// =====================================================
// PUBLIC DIRECTORY
// =====================================================

const PUBLIC_DIR = path.join(
  __dirname,
  "public"
);

app.use(
  express.static(PUBLIC_DIR)
);


// =====================================================
// DEFAULT WEBSITE DATA
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

  ],

  sections: {

    hero: true,

    about: true,

    education: true,

    skills: true,

    diary: true,

    projects: true,

    contact: true

  }

};


// =====================================================
// DATABASE INITIALIZATION
// =====================================================

async function initializeDatabase() {

  if (!DATABASE_URL) {

    console.log(
      "⚠ DATABASE_URL is not configured."
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
        sort_order INTEGER DEFAULT 0,
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


    // Existing database হলে sort_order column add করবে
    await pool.query(`
      ALTER TABLE diary
      ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);


    const existing =
      await pool.query(
        "SELECT id FROM site_content WHERE id = 1"
      );


    if (existing.rows.length === 0) {

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
      "✓ Database initialized successfully."
    );

  } catch (error) {

    console.error(
      "Database initialization error:",
      error.message
    );

  }

}


// =====================================================
// AUTH
// =====================================================

function requireAdmin(
  req,
  res,
  next
) {

  if (
    req.session &&
    req.session.admin === true
  ) {

    return next();

  }

  return res.status(401).json({

    success: false,

    error: "Unauthorized"

  });

}


// =====================================================
// GET CURRENT SITE DATA HELPER
// =====================================================

async function getSiteData() {

  if (!DATABASE_URL) {

    return DEFAULT_SITE;

  }

  const result =
    await pool.query(
      "SELECT data FROM site_content WHERE id = 1"
    );


  return (
    result.rows[0]?.data ||
    DEFAULT_SITE
  );

}


// =====================================================
// SAVE SITE DATA HELPER
// =====================================================

async function saveSiteData(data) {

  await pool.query(
    `
    INSERT INTO site_content
    (id, data)

    VALUES
    (1, $1)

    ON CONFLICT (id)

    DO UPDATE SET
      data = EXCLUDED.data
    `,
    [
      JSON.stringify(data)
    ]
  );

}


// =====================================================
// PUBLIC SITE API
// =====================================================

app.get(
  "/api/site",
  async (req, res) => {

    try {

      const data =
        await getSiteData();

      res.json(data);

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        error:
          "Unable to load site data"

      });

    }

  }
);


// =====================================================
// PUBLIC DIARY
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
            date,
            sort_order
          FROM diary

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

        success: false,

        error:
          "Unable to load diary"

      });

    }

  }
);


// =====================================================
// PUBLIC PROJECTS
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
            image,
            sort_order
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

        success: false,

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

    const adminUsername =
      process.env.ADMIN_USERNAME ||
      "admin";

    const adminPassword =
      process.env.ADMIN_PASSWORD ||
      "admin123";


    const username =
      String(
        req.body.username || ""
      ).trim();


    const password =
      String(
        req.body.password || ""
      );


    if (
      username !== adminUsername ||
      password !== adminPassword
    ) {

      return res.status(401).json({

        success: false,

        error:
          "Invalid username or password"

      });

    }


    req.session.admin = true;


    res.json({

      success: true,

      message:
        "Login successful"

    });

  }
);


// =====================================================
// ADMIN SESSION
// =====================================================

app.get(
  "/api/admin/session",
  (req, res) => {

    res.json({

      loggedIn:
        req.session?.admin === true

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
      () => {

        res.json({

          success: true

        });

      }
    );

  }
);


// =====================================================
// ADMIN GET ALL SITE CONTENT
// =====================================================

app.get(
  "/api/admin/content",
  requireAdmin,
  async (req, res) => {

    try {

      const data =
        await getSiteData();

      res.json(data);

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        error:
          "Unable to load content"

      });

    }

  }
);


// =====================================================
// ADMIN UPDATE ALL SITE CONTENT
// =====================================================

app.put(
  "/api/admin/content",
  requireAdmin,
  async (req, res) => {

    try {

      const oldData =
        await getSiteData();


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


        sections: {

          ...DEFAULT_SITE.sections,

          ...(oldData.sections || {}),

          ...(incoming.sections || {})

        },


        skills:
          Array.isArray(incoming.skills)
            ? incoming.skills
            : oldData.skills,


        buttons:
          Array.isArray(incoming.buttons)
            ? incoming.buttons
            : oldData.buttons

      };


      await saveSiteData(
        finalData
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
          "Unable to save content"

      });

    }

  }
);


// =====================================================
// BUTTONS
// ADD / EDIT / DELETE / SHOW-HIDE / REORDER
// =====================================================


// GET BUTTONS

app.get(
  "/api/admin/buttons",
  requireAdmin,
  async (req, res) => {

    try {

      const data =
        await getSiteData();


      const buttons =
        Array.isArray(data.buttons)
          ? data.buttons
          : [];


      res.json(
        buttons.sort(
          (a, b) =>
            Number(a.order || 0) -
            Number(b.order || 0)
        )
      );

    } catch (error) {

      res.status(500).json({

        error:
          "Unable to load buttons"

      });

    }

  }
);


// ADD BUTTON

app.post(
  "/api/admin/buttons",
  requireAdmin,
  async (req, res) => {

    try {

      const data =
        await getSiteData();


      const buttons =
        Array.isArray(data.buttons)
          ? data.buttons
          : [];


      const label =
        String(
          req.body.label || ""
        ).trim();


      const url =
        String(
          req.body.url || ""
        ).trim();


      if (!label) {

        return res.status(400).json({

          success: false,

          error:
            "Button label is required"

        });

      }


      const newButton = {

        id:
          "button-" +
          Date.now(),

        label,

        url,

        visible:
          req.body.visible !== false,

        order:
          buttons.length + 1

      };


      buttons.push(
        newButton
      );


      data.buttons =
        buttons;


      await saveSiteData(
        data
      );


      res.json({

        success: true,

        button:
          newButton,

        data

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        error:
          "Unable to add button"

      });

    }

  }
);


// EDIT BUTTON

app.put(
  "/api/admin/buttons/:id",
  requireAdmin,
  async (req, res) => {

    try {

      const data =
        await getSiteData();


      const buttons =
        data.buttons || [];


      const index =
        buttons.findIndex(
          button =>
            String(button.id) ===
            String(req.params.id)
        );


      if (index === -1) {

        return res.status(404).json({

          success: false,

          error:
            "Button not found"

        });

      }


      buttons[index] = {

        ...buttons[index],

        ...req.body,

        id:
          buttons[index].id

      };


      data.buttons =
        buttons;


      await saveSiteData(
        data
      );


      res.json({

        success: true,

        button:
          buttons[index],

        data

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        error:
          "Unable to update button"

      });

    }

  }
);


// DELETE BUTTON

app.delete(
  "/api/admin/buttons/:id",
  requireAdmin,
  async (req, res) => {

    try {

      const data =
        await getSiteData();


      data.buttons =
        (data.buttons || [])
          .filter(
            button =>
              String(button.id) !==
              String(req.params.id)
          );


      data.buttons =
        data.buttons.map(
          (button, index) => ({

            ...button,

            order:
              index + 1

          })
        );


      await saveSiteData(
        data
      );


      res.json({

        success: true,

        data

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        error:
          "Unable to delete button"

      });

    }

  }
);


// REORDER BUTTONS

app.put(
  "/api/admin/buttons-order",
  requireAdmin,
  async (req, res) => {

    try {

      const data =
        await getSiteData();


      const ids =
        Array.isArray(req.body.ids)
          ? req.body.ids
          : [];


      data.buttons =
        (data.buttons || [])
          .sort(
            (a, b) =>
              ids.indexOf(a.id) -
              ids.indexOf(b.id)
          )
          .map(
            (button, index) => ({

              ...button,

              order:
                index + 1

            })
          );


      await saveSiteData(
        data
      );


      res.json({

        success: true,

        data

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        error:
          "Unable to reorder buttons"

      });

    }

  }
);


// =====================================================
// SKILLS
// =====================================================


// ADD SKILL

app.post(
  "/api/admin/skills",
  requireAdmin,
  async (req, res) => {

    try {

      const data =
        await getSiteData();


      const skill =
        String(
          req.body.skill || ""
        ).trim();


      if (!skill) {

        return res.status(400).json({

          success: false,

          error:
            "Skill is required"

        });

      }


      if (
        !Array.isArray(data.skills)
      ) {

        data.skills = [];

      }


      data.skills.push(
        skill
      );


      await saveSiteData(
        data
      );


      res.json({

        success: true,

        data

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        error:
          "Unable to add skill"

      });

    }

  }
);


// EDIT SKILL

app.put(
  "/api/admin/skills/:index",
  requireAdmin,
  async (req, res) => {

    try {

      const data =
        await getSiteData();


      const index =
        Number(
          req.params.index
        );


      const skill =
        String(
          req.body.skill || ""
        ).trim();


      if (
        !Array.isArray(data.skills) ||
        !data.skills[index]
      ) {

        return res.status(404).json({

          success: false,

          error:
            "Skill not found"

        });

      }


      if (!skill) {

        return res.status(400).json({

          success: false,

          error:
            "Skill is required"

        });

      }


      data.skills[index] =
        skill;


      await saveSiteData(
        data
      );


      res.json({

        success: true,

        data

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        error:
          "Unable to update skill"

      });

    }

  }
);


// DELETE SKILL

app.delete(
  "/api/admin/skills/:index",
  requireAdmin,
  async (req, res) => {

    try {

      const data =
        await getSiteData();


      const index =
        Number(
          req.params.index
        );


      if (
        !Array.isArray(data.skills)
      ) {

        return res.status(404).json({

          success: false,

          error:
            "Skills not found"

        });

      }


      data.skills.splice(
        index,
        1
      );


      await saveSiteData(
        data
      );


      res.json({

        success: true,

        data

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        error:
          "Unable to delete skill"

      });

    }

  }
);


// =====================================================
// SECTION SHOW / HIDE
// =====================================================

app.put(
  "/api/admin/sections/:section",
  requireAdmin,
  async (req, res) => {

    try {

      const data =
        await getSiteData();


      const section =
        String(
          req.params.section
        );


      const allowed = [

        "hero",
        "about",
        "education",
        "skills",
        "diary",
        "projects",
        "contact"

      ];


      if (
        !allowed.includes(section)
      ) {

        return res.status(400).json({

          success: false,

          error:
            "Invalid section"

        });

      }


      if (!data.sections) {

        data.sections = {};

      }


      data.sections[section] =
        req.body.visible !== false;


      await saveSiteData(
        data
      );


      res.json({

        success: true,

        data

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        error:
          "Unable to update section"

      });

    }

  }
);


// =====================================================
// DIARY ADMIN
// =====================================================


// LIST

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
          "Unable to load diary"

      });

    }

  }
);


// ADD

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


      const sortOrder =
        Number(
          req.body.sort_order || 0
        );


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
          (
            title,
            content,
            date,
            visible,
            sort_order
          )

          VALUES
          ($1,$2,$3,$4,$5)

          RETURNING *
          `,
          [
            title,
            content,
            date,
            req.body.visible !== false,
            sortOrder
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


// EDIT

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


      const sortOrder =
        Number(
          req.body.sort_order || 0
        );


      await pool.query(
        `
        UPDATE diary

        SET
          title = $1,
          content = $2,
          date = $3,
          visible = $4,
          sort_order = $5

        WHERE id = $6
        `,
        [
          title,
          content,
          date,
          visible,
          sortOrder,
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


// DELETE

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
// DIARY REORDER
// =====================================================

app.put(
  "/api/admin/diary-order",
  requireAdmin,
  async (req, res) => {

    try {

      const ids =
        Array.isArray(req.body.ids)
          ? req.body.ids
          : [];


      for (
        let i = 0;
        i < ids.length;
        i++
      ) {

        await pool.query(
          `
          UPDATE diary
          SET sort_order = $1
          WHERE id = $2
          `,
          [
            i + 1,
            Number(ids[i])
          ]
        );

      }


      res.json({

        success: true

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        error:
          "Unable to reorder diary"

      });

    }

  }
);


// =====================================================
// PROJECTS ADMIN
// =====================================================


// LIST

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

      console.error(error);

      res.status(500).json({

        error:
          "Unable to load projects"

      });

    }

  }
);


// ADD

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


      const sortOrder =
        Number(
          req.body.sort_order || 0
        );


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
          ($1,$2,$3,$4,$5,$6)

          RETURNING *
          `,
          [
            title,
            description,
            url,
            image,
            req.body.visible !== false,
            sortOrder
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


// EDIT

app.put(
  "/api/admin/projects/:id",
  requireAdmin,
  async (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        );


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
          "Unable to update project"

      });

    }

  }
);


// DELETE

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
// PROJECT REORDER
// =====================================================

app.put(
  "/api/admin/projects-order",
  requireAdmin,
  async (req, res) => {

    try {

      const ids =
        Array.isArray(req.body.ids)
          ? req.body.ids
          : [];


      for (
        let i = 0;
        i < ids.length;
        i++
      ) {

        await pool.query(
          `
          UPDATE projects
          SET sort_order = $1
          WHERE id = $2
          `,
          [
            i + 1,
            Number(ids[i])
          ]
        );

      }


      res.json({

        success: true

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        success: false,

        error:
          "Unable to reorder projects"

      });

    }

  }
);


// =====================================================
// PAGE ROUTES
// =====================================================

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
  color:#fff;
  font-family:Arial,sans-serif;
  text-align:center;
}

.box{
  padding:40px;
}

h1{
  font-size:80px;
  margin:0 0 10px;
}

a{
  color:#d6b46a;
  text-decoration:none;
}

</style>

</head>

<body>

<div class="box">

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
        `✓ Prosenjit Ultra Pro Max running on port ${PORT}`
      );

    }
  );

}


startServer();
