const express = require("express");
const session = require("express-session");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 10000;
const PUBLIC_DIR = path.join(__dirname, "public");

const DATABASE_URL = process.env.DATABASE_URL;

// =====================================================
// DATABASE
// =====================================================

const pool = new Pool({
  connectionString: DATABASE_URL,

  ssl: DATABASE_URL
    ? { rejectUnauthorized: false }
    : false,

  max: 10,

  idleTimeoutMillis: 30000,

  connectionTimeoutMillis: 10000
});


// =====================================================
// BASIC SETTINGS
// =====================================================

app.set("trust proxy", 1);

app.disable("x-powered-by");

app.use(
  express.json({
    limit: "5mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "5mb"
  })
);


// =====================================================
// SESSION
// =====================================================

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

      secure:
        process.env.NODE_ENV === "production",

      sameSite: "lax",

      maxAge:
        1000 * 60 * 60 * 24 * 7
    }
  })
);


// =====================================================
// STATIC WEBSITE
// =====================================================

app.use(
  express.static(PUBLIC_DIR)
);


// =====================================================
// DEFAULT WEBSITE DATA
// =====================================================

const DEFAULT_SITE = {

  name:
    "Prosenjit Ray",

  tagline:
    "Student • Dreamer • Builder",

  college:
    "Dinajpur Government College",

  education:
    "Honours 1st Year",

  about:
    "I am Prosenjit Ray, an Honours 1st Year student at Dinajpur Government College. This is my personal digital space where I share my story, ideas, diary, projects and future journey.",

  photo:
    "",

  skills: [
    "Creative Thinking",
    "Web Design",
    "Communication",
    "Learning"
  ],

  social: {

    facebook:
      "",

    instagram:
      "",

    whatsapp:
      "",

    github:
      "",

    email:
      ""
  },

  buttons: [

    {
      id:
        "primary",

      label:
        "Explore My Story",

      url:
        "/about.html",

      visible:
        true,

      order:
        1
    },

    {
      id:
        "secondary",

      label:
        "Get In Touch",

      url:
        "/contact.html",

      visible:
        true,

      order:
        2
    }
  ]
};


// =====================================================
// DATABASE INITIALIZATION
// =====================================================

async function initializeDatabase() {

  if (!DATABASE_URL) {

    console.warn(
      "WARNING: DATABASE_URL is not configured."
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
        `
        SELECT id
        FROM site_content
        WHERE id = 1
        `
      );


    if (
      site.rows.length === 0
    ) {

      await pool.query(
        `
        INSERT INTO site_content
        (id, data)
        VALUES
        (1, $1)
        `,
        [
          JSON.stringify(
            DEFAULT_SITE
          )
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
// ADMIN AUTH
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

    success:
      false,

    error:
      "Unauthorized",

    loggedIn:
      false

  });
}


// =====================================================
// HELPER
// =====================================================

function cleanString(
  value
) {

  return String(
    value ?? ""
  ).trim();

}


function normalizeSiteData(
  oldData,
  incomingData
) {

  const oldSite =
    oldData || {};

  const incoming =
    incomingData || {};


  let skills =
    Array.isArray(
      incoming.skills
    )
      ? incoming.skills
      : Array.isArray(oldSite.skills)
      ? oldSite.skills
      : DEFAULT_SITE.skills;


  skills =
    skills
      .map(item =>
        cleanString(item)
      )
      .filter(Boolean);


  let buttons =
    Array.isArray(
      incoming.buttons
    )
      ? incoming.buttons
      : Array.isArray(oldSite.buttons)
      ? oldSite.buttons
      : DEFAULT_SITE.buttons;


  buttons =
    buttons.map(
      (button, index) => {

        return {

          id:
            cleanString(
              button.id
            ) ||
            `button-${Date.now()}-${index}`,

          label:
            cleanString(
              button.label
            ) ||
            "Button",

          url:
            cleanString(
              button.url
            ) ||
            "#",

          visible:
            button.visible !== false,

          order:
            Number(
              button.order ?? index + 1
            )
        };

      }
    );


  buttons.sort(
    (a, b) =>
      Number(a.order) -
      Number(b.order)
  );


  return {

    ...DEFAULT_SITE,

    ...oldSite,

    ...incoming,


    name:
      cleanString(
        incoming.name ??
        oldSite.name ??
        DEFAULT_SITE.name
      ),


    tagline:
      cleanString(
        incoming.tagline ??
        oldSite.tagline ??
        DEFAULT_SITE.tagline
      ),


    college:
      cleanString(
        incoming.college ??
        oldSite.college ??
        DEFAULT_SITE.college
      ),


    education:
      cleanString(
        incoming.education ??
        oldSite.education ??
        DEFAULT_SITE.education
      ),


    about:
      cleanString(
        incoming.about ??
        oldSite.about ??
        DEFAULT_SITE.about
      ),


    photo:
      cleanString(
        incoming.photo ??
        oldSite.photo ??
        DEFAULT_SITE.photo
      ),


    skills,


    social: {

      ...DEFAULT_SITE.social,

      ...(oldSite.social || {}),

      ...(incoming.social || {})

    },


    buttons
  };
}


// =====================================================
// PUBLIC SITE DATA
// =====================================================

app.get(
  "/api/site",
  async (req, res) => {

    try {

      if (!DATABASE_URL) {

        return res.json(
          DEFAULT_SITE
        );

      }


      const result =
        await pool.query(
          `
          SELECT data
          FROM site_content
          WHERE id = 1
          `
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

      console.error(
        "GET /api/site:",
        error.message
      );


      res.json(
        DEFAULT_SITE
      );

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
        await pool.query(
          `
          SELECT
            id,
            title,
            content,
            date
          FROM diary
          WHERE visible = TRUE
          ORDER BY
            created_at DESC
          `
        );


      res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        "GET /api/diary:",
        error.message
      );


      res.status(500).json({

        success:
          false,

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
        await pool.query(
          `
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
          `
        );


      res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        "GET /api/projects:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to load projects"

      });

    }
  }
);


// =====================================================
// LOGIN
// =====================================================

app.post(
  "/api/admin/login",
  async (req, res) => {

    try {

      const username =
        process.env.ADMIN_USERNAME ||
        "admin";

      const password =
        process.env.ADMIN_PASSWORD ||
        "admin123";


      const submittedUsername =
        cleanString(
          req.body.username
        );


      const submittedPassword =
        String(
          req.body.password ?? ""
        );


      if (
        submittedUsername !== username ||
        submittedPassword !== password
      ) {

        return res.status(401).json({

          success:
            false,

          error:
            "Invalid username or password"

        });

      }


      req.session.admin =
        true;


      req.session.username =
        username;


      // IMPORTANT:
      // Force session to save before responding.

      req.session.save(
        (error) => {

          if (error) {

            console.error(
              "Session save error:",
              error
            );


            return res.status(500).json({

              success:
                false,

              error:
                "Login session could not be saved"

            });

          }


          return res.json({

            success:
              true,

            loggedIn:
              true

          });

        }
      );

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );


      res.status(500).json({

        success:
          false,

        error:
          "Login failed"

      });

    }
  }
);


// =====================================================
// SESSION CHECK
// =====================================================

app.get(
  "/api/admin/session",
  (req, res) => {

    res.json({

      success:
        true,

      loggedIn:
        !!(
          req.session &&
          req.session.admin === true
        )

    });

  }
);


// =====================================================
// LOGOUT
// =====================================================

app.post(
  "/api/admin/logout",
  (req, res) => {

    if (!req.session) {

      return res.json({

        success:
          true

      });

    }


    req.session.destroy(
      (error) => {

        if (error) {

          console.error(
            "Logout error:",
            error
          );


          return res.status(500).json({

            success:
              false,

            error:
              "Logout failed"

          });

        }


        res.clearCookie(
          "prosenjit.sid",
          {
            httpOnly:
              true,

            secure:
              process.env.NODE_ENV ===
              "production",

            sameSite:
              "lax"
          }
        );


        res.json({

          success:
            true

        });

      }
    );

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
          `
          SELECT data
          FROM site_content
          WHERE id = 1
          `
        );


      const data =
        result.rows[0]?.data ||
        DEFAULT_SITE;


      res.json(
        normalizeSiteData(
          DEFAULT_SITE,
          data
        )
      );

    } catch (error) {

      console.error(
        "ADMIN CONTENT GET:",
        error.message
      );


      res.status(500).json({

        success:
          false,

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
          `
          SELECT data
          FROM site_content
          WHERE id = 1
          `
        );


      const oldData =
        result.rows[0]?.data ||
        DEFAULT_SITE;


      const finalData =
        normalizeSiteData(
          oldData,
          req.body
        );


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
          JSON.stringify(
            finalData
          )
        ]
      );


      res.json({

        success:
          true,

        data:
          finalData

      });

    } catch (error) {

      console.error(
        "ADMIN CONTENT UPDATE:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to save website information"

      });

    }
  }
);


// =====================================================
// BUTTON MANAGER
// =====================================================

// GET ALL BUTTONS

app.get(
  "/api/admin/buttons",
  requireAdmin,
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT data
          FROM site_content
          WHERE id = 1
          `
        );


      const data =
        result.rows[0]?.data ||
        DEFAULT_SITE;


      res.json({

        success:
          true,

        buttons:
          Array.isArray(
            data.buttons
          )
            ? data.buttons
            : []

      });

    } catch (error) {

      console.error(
        "BUTTON GET:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to load buttons"

      });

    }
  }
);


// ADD NEW BUTTON

app.post(
  "/api/admin/buttons",
  requireAdmin,
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT data
          FROM site_content
          WHERE id = 1
          `
        );


      const oldData =
        result.rows[0]?.data ||
        DEFAULT_SITE;


      const buttons =
        Array.isArray(
          oldData.buttons
        )
          ? oldData.buttons
          : [];


      const newButton = {

        id:
          `button-${Date.now()}`,

        label:
          cleanString(
            req.body.label
          ) ||
          "New Button",

        url:
          cleanString(
            req.body.url
          ) ||
          "#",

        visible:
          req.body.visible !== false,

        order:
          buttons.length + 1

      };


      buttons.push(
        newButton
      );


      const finalData =
        normalizeSiteData(
          oldData,
          {
            buttons
          }
        );


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

        success:
          true,

        button:
          newButton

      });

    } catch (error) {

      console.error(
        "BUTTON ADD:",
        error.message
      );


      res.status(500).json({

        success:
          false,

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

      const result =
        await pool.query(
          `
          SELECT data
          FROM site_content
          WHERE id = 1
          `
        );


      const oldData =
        result.rows[0]?.data ||
        DEFAULT_SITE;


      const buttons =
        Array.isArray(
          oldData.buttons
        )
          ? oldData.buttons
          : [];


      const button =
        buttons.find(
          item =>
            String(item.id) ===
            String(req.params.id)
        );


      if (!button) {

        return res.status(404).json({

          success:
            false,

          error:
            "Button not found"

        });

      }


      if (
        req.body.label !== undefined
      ) {

        button.label =
          cleanString(
            req.body.label
          );

      }


      if (
        req.body.url !== undefined
      ) {

        button.url =
          cleanString(
            req.body.url
          );

      }


      if (
        req.body.visible !== undefined
      ) {

        button.visible =
          req.body.visible !== false;

      }


      if (
        req.body.order !== undefined
      ) {

        button.order =
          Number(
            req.body.order
          ) || 0;

      }


      const finalData =
        normalizeSiteData(
          oldData,
          {
            buttons
          }
        );


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

        success:
          true,

        button

      });

    } catch (error) {

      console.error(
        "BUTTON UPDATE:",
        error.message
      );


      res.status(500).json({

        success:
          false,

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

      const result =
        await pool.query(
          `
          SELECT data
          FROM site_content
          WHERE id = 1
          `
        );


      const oldData =
        result.rows[0]?.data ||
        DEFAULT_SITE;


      let buttons =
        Array.isArray(
          oldData.buttons
        )
          ? oldData.buttons
          : [];


      buttons =
        buttons.filter(
          item =>
            String(item.id) !==
            String(req.params.id)
        );


      buttons =
        buttons.map(
          (item, index) => ({
            ...item,
            order:
              index + 1
          })
        );


      const finalData =
        normalizeSiteData(
          oldData,
          {
            buttons
          }
        );


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

        success:
          true

      });

    } catch (error) {

      console.error(
        "BUTTON DELETE:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to delete button"

      });

    }
  }
);


// =====================================================
// DIARY ADMIN
// =====================================================

// GET DIARY

app.get(
  "/api/admin/diary",
  requireAdmin,
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT *
          FROM diary
          ORDER BY
            created_at DESC
          `
        );


      res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        "DIARY GET:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to load diary"

      });

    }
  }
);


// ADD DIARY

app.post(
  "/api/admin/diary",
  requireAdmin,
  async (req, res) => {

    try {

      const title =
        cleanString(
          req.body.title
        );


      const content =
        cleanString(
          req.body.content
        );


      const date =
        cleanString(
          req.body.date
        );


      if (
        !title ||
        !content
      ) {

        return res.status(400).json({

          success:
            false,

          error:
            "Title and content are required"

        });

      }


      const visible =
        req.body.visible !== false;


      const result =
        await pool.query(
          `
          INSERT INTO diary
          (
            title,
            content,
            date,
            visible
          )

          VALUES
          ($1,$2,$3,$4)

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

        success:
          true,

        diary:
          result.rows[0]

      });

    } catch (error) {

      console.error(
        "DIARY ADD:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to add diary"

      });

    }
  }
);


// EDIT DIARY

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
        cleanString(
          req.body.title
        );


      const content =
        cleanString(
          req.body.content
        );


      const date =
        cleanString(
          req.body.date
        );


      const visible =
        req.body.visible !== false;


      if (
        !title ||
        !content
      ) {

        return res.status(400).json({

          success:
            false,

          error:
            "Title and content are required"

        });

      }


      const result =
        await pool.query(
          `
          UPDATE diary

          SET
            title = $1,
            content = $2,
            date = $3,
            visible = $4

          WHERE id = $5

          RETURNING *
          `,
          [
            title,
            content,
            date,
            visible,
            id
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success:
            false,

          error:
            "Diary not found"

        });

      }


      res.json({

        success:
          true,

        diary:
          result.rows[0]

      });

    } catch (error) {

      console.error(
        "DIARY UPDATE:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to update diary"

      });

    }
  }
);


// SHOW / HIDE DIARY

app.patch(
  "/api/admin/diary/:id/visibility",
  requireAdmin,
  async (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        );


      const visible =
        req.body.visible === true;


      const result =
        await pool.query(
          `
          UPDATE diary

          SET
            visible = $1

          WHERE id = $2

          RETURNING *
          `,
          [
            visible,
            id
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success:
            false,

          error:
            "Diary not found"

        });

      }


      res.json({

        success:
          true,

        diary:
          result.rows[0]

      });

    } catch (error) {

      console.error(
        "DIARY VISIBILITY:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to change visibility"

      });

    }
  }
);


// DELETE DIARY

app.delete(
  "/api/admin/diary/:id",
  requireAdmin,
  async (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        );


      const result =
        await pool.query(
          `
          DELETE FROM diary
          WHERE id = $1
          RETURNING id
          `,
          [
            id
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success:
            false,

          error:
            "Diary not found"

        });

      }


      res.json({

        success:
          true

      });

    } catch (error) {

      console.error(
        "DIARY DELETE:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to delete diary"

      });

    }
  }
);


// =====================================================
// PROJECT ADMIN
// =====================================================

// GET PROJECTS

app.get(
  "/api/admin/projects",
  requireAdmin,
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT *
          FROM projects

          ORDER BY
            sort_order ASC,
            created_at DESC
          `
        );


      res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        "PROJECT GET:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to load projects"

      });

    }
  }
);


// ADD PROJECT

app.post(
  "/api/admin/projects",
  requireAdmin,
  async (req, res) => {

    try {

      const title =
        cleanString(
          req.body.title
        );


      const description =
        cleanString(
          req.body.description
        );


      const url =
        cleanString(
          req.body.url
        );


      const image =
        cleanString(
          req.body.image
        );


      const visible =
        req.body.visible !== false;


      const sortOrder =
        Number(
          req.body.sort_order
        ) || 0;


      if (!title) {

        return res.status(400).json({

          success:
            false,

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
            visible,
            sortOrder
          ]
        );


      res.json({

        success:
          true,

        project:
          result.rows[0]

      });

    } catch (error) {

      console.error(
        "PROJECT ADD:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to add project"

      });

    }
  }
);


// EDIT PROJECT

app.put(
  "/api/admin/projects/:id",
  requireAdmin,
  async (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        );


      const title =
        cleanString(
          req.body.title
        );


      const description =
        cleanString(
          req.body.description
        );


      const url =
        cleanString(
          req.body.url
        );


      const image =
        cleanString(
          req.body.image
        );


      const visible =
        req.body.visible !== false;


      const sortOrder =
        Number(
          req.body.sort_order
        ) || 0;


      if (!title) {

        return res.status(400).json({

          success:
            false,

          error:
            "Project title is required"

        });

      }


      const result =
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

          RETURNING *
          `,
          [
            title,
            description,
            url,
            image,
            visible,
            sortOrder,
            id
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success:
            false,

          error:
            "Project not found"

        });

      }


      res.json({

        success:
          true,

        project:
          result.rows[0]

      });

    } catch (error) {

      console.error(
        "PROJECT UPDATE:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to update project"

      });

    }
  }
);


// SHOW / HIDE PROJECT

app.patch(
  "/api/admin/projects/:id/visibility",
  requireAdmin,
  async (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        );


      const visible =
        req.body.visible === true;


      const result =
        await pool.query(
          `
          UPDATE projects

          SET
            visible = $1

          WHERE id = $2

          RETURNING *
          `,
          [
            visible,
            id
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success:
            false,

          error:
            "Project not found"

        });

      }


      res.json({

        success:
          true,

        project:
          result.rows[0]

      });

    } catch (error) {

      console.error(
        "PROJECT VISIBILITY:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to change visibility"

      });

    }
  }
);


// DELETE PROJECT

app.delete(
  "/api/admin/projects/:id",
  requireAdmin,
  async (req, res) => {

    try {

      const id =
        Number(
          req.params.id
        );


      const result =
        await pool.query(
          `
          DELETE FROM projects

          WHERE id = $1

          RETURNING id
          `,
          [
            id
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          success:
            false,

          error:
            "Project not found"

        });

      }


      res.json({

        success:
          true

      });

    } catch (error) {

      console.error(
        "PROJECT DELETE:",
        error.message
      );


      res.status(500).json({

        success:
          false,

        error:
          "Unable to delete project"

      });

    }
  }
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/health",
  (req, res) => {

    res.json({

      status:
        "ok",

      project:
        "Prosenjit Ultra Pro Max",

      database:
        DATABASE_URL
          ? "configured"
          : "not configured",

      time:
        new Date().toISOString()

    });

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
// 404
// =====================================================

app.use(
  (req, res) => {

    res.status(404).send(`
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1"
>

<title>404 · Prosenjit Ray</title>

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

  background:#05070b;
  color:#fff;

  font-family:Arial,sans-serif;

  text-align:center;
}

.box{
  padding:40px;
}

h1{
  font-size:90px;
  margin:0;
}

p{
  color:#999;
}

a{
  display:inline-block;
  margin-top:20px;
  padding:14px 24px;

  background:#d5b06a;
  color:#111;

  text-decoration:none;
  border-radius:12px;
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
        `Prosenjit Ultra Pro Max running on port ${PORT}`
      );

    }
  );

}


startServer();
