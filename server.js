require("dotenv").config();

const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.json({ limit: "10mb" }));

// Public Website
app.use(express.static(path.join(__dirname, "public")));

// Admin Panel
app.use("/admin", express.static(path.join(__dirname, "admin")));


// ============================
// Website
// ============================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// ============================
// Admin
// ============================

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "index.html"));
});


// ============================
// Get Portfolio
// ============================

app.get("/api/portfolio", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT data FROM portfolio ORDER BY id ASC LIMIT 1"
    );

    if (!result.rows.length) {
      return res.json({});
    }

    res.json(result.rows[0].data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database থেকে data load করা যায়নি"
    });
  }
});


// ============================
// Save Portfolio
// ============================

app.put("/api/portfolio", async (req, res) => {
  try {
    const data = req.body;

    const result = await pool.query(
      `
      UPDATE portfolio
      SET data = $1::jsonb,
          updated_at = NOW()
      WHERE id = (
        SELECT id
        FROM portfolio
        ORDER BY id ASC
        LIMIT 1
      )
      RETURNING data
      `,
      [JSON.stringify(data)]
    );

    if (!result.rows.length) {
      const inserted = await pool.query(
        `
        INSERT INTO portfolio (data)
        VALUES ($1::jsonb)
        RETURNING data
        `,
        [JSON.stringify(data)]
      );

      return res.json({
        success: true,
        data: inserted.rows[0].data
      });
    }

    res.json({
      success: true,
      message: "তথ্য সংরক্ষণ হয়েছে",
      data: result.rows[0].data
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "তথ্য সংরক্ষণ করা যায়নি"
    });
  }
});


// ============================
// Database Test
// ============================

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      database: "connected"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      database: "disconnected"
    });
  }
});


// ============================
// Start Server
// ============================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
