const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "portfolio.json");

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
}

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* Public website */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* Admin panel */
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "index.html"));
});

/* Admin assets */
app.use("/admin", express.static(path.join(__dirname, "admin")));

/* Get portfolio data */
app.get("/api/portfolio", (req, res) => {
  res.json(readData());
});

/* Replace complete portfolio */
app.put("/api/portfolio", (req, res) => {
  try {
    writeData(req.body);
    res.json({
      success: true,
      message: "তথ্য সফলভাবে সংরক্ষণ হয়েছে"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "তথ্য সংরক্ষণ করা যায়নি"
    });
  }
});

/* Update a single section */
app.put("/api/portfolio/:section", (req, res) => {
  try {
    const data = readData();

    data[req.params.section] = req.body;

    writeData(data);

    res.json({
      success: true,
      message: "সফলভাবে আপডেট হয়েছে",
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "আপডেট করা যায়নি"
    });
  }
});

/* Delete a section */
app.delete("/api/portfolio/:section", (req, res) => {
  try {
    const data = readData();

    delete data[req.params.section];

    writeData(data);

    res.json({
      success: true,
      message: "সফলভাবে মুছে ফেলা হয়েছে"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "মুছে ফেলা যায়নি"
    });
  }
});

app.listen(PORT, () => {
  console.log("");
  console.log("=================================");
  console.log(" Portfolio Server চালু হয়েছে");
  console.log("=================================");
  console.log(`Website : http://localhost:${PORT}`);
  console.log(`Admin   : http://localhost:${PORT}/admin`);
  console.log("");
});
