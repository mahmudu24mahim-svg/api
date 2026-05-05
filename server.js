const express = require("express");
const axios = require("axios");
const db = require("./db");
const path = require("path");

const app = express();

// ================= STATIC FILES (IMPORTANT FIX) =================
app.use(express.static(__dirname));

// ================= HOME =================
app.get("/", (req, res) => {
  res.send("🚀 API SYSTEM RUNNING");
});

// ================= API SEND =================
app.get("/api/send", async (req, res) => {
  const { key, number, msg } = req.query;

  // KEY CHECK
  if (!key || !db.users[key]) {
    return res.json({ status: "error", msg: "Invalid API Key" });
  }

  // INPUT CHECK
  if (!number || !msg) {
    return res.json({ status: "error", msg: "Missing number/msg" });
  }

  let user = db.users[key];

  // LIMIT CHECK
  if (user.used >= user.limit) {
    return res.json({ status: "error", msg: "Limit reached" });
  }

  user.used++;

  try {
    // EXTERNAL API CALL
    const url = `http://xlahr.pro.bd/Key/sub.php?key=${key}&number=${number}&msg=${msg}`;

    const response = await axios.get(url);

    res.json({
      status: "success",
      forwarded: true,
      external_response: response.data,
      used: user.used,
      limit: user.limit,
      remaining: user.limit - user.used
    });

  } catch (err) {
    res.json({
      status: "error",
      msg: "External API failed",
      error: err.message
    });
  }
});

// ================= STATUS =================
app.get("/api/status", (req, res) => {
  const { key } = req.query;

  if (!key || !db.users[key]) {
    return res.json({ status: "error", msg: "Invalid API Key" });
  }

  let user = db.users[key];

  res.json({
    key,
    limit: user.limit,
    used: user.used,
    remaining: user.limit - user.used
  });
});

// ================= ADMIN ADD USER =================
app.get("/admin/add", (req, res) => {
  const { key, limit } = req.query;

  if (!key) {
    return res.json({ status: "error", msg: "Key required" });
  }

  db.users[key] = {
    limit: Number(limit) || 5,
    used: 0
  };

  res.json({ status: "user created", key });
});

// ================= RESET ALL =================
app.get("/admin/reset", (req, res) => {
  Object.keys(db.users).forEach(k => {
    db.users[k].used = 0;
  });

  res.json({ status: "reset done" });
});

// ================= RENDER PORT FIX =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server running on port", PORT));
