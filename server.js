const express = require("express");
const axios = require("axios");
const db = require("./db");

const app = express();

// ================= API ROUTE =================
app.get("/api/send", async (req, res) => {
  const { key, number, msg } = req.query;

  // validation
  if (!key || !db.users[key]) {
    return res.json({ status: "error", msg: "Invalid API Key" });
  }

  if (!number || !msg) {
    return res.json({ status: "error", msg: "Missing number/msg" });
  }

  let user = db.users[key];

  // limit check
  if (user.used >= user.limit) {
    return res.json({ status: "error", msg: "Limit reached" });
  }

  user.used++;

  try {
    // 🔥 External API call (YOUR URL)
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

// ================= CHECK LIMIT =================
app.get("/api/status", (req, res) => {
  const { key } = req.query;

  if (!db.users[key]) {
    return res.json({ status: "invalid key" });
  }

  let user = db.users[key];

  res.json({
    key,
    limit: user.limit,
    used: user.used,
    remaining: user.limit - user.used
  });
});

// ================= ADD USER (ADMIN) =================
app.get("/admin/add", (req, res) => {
  const { key, limit } = req.query;

  db.users[key] = {
    limit: Number(limit) || 5,
    used: 0
  };

  res.json({ status: "user created", key });
});

// ================= RESET =================
app.get("/admin/reset", (req, res) => {
  Object.keys(db.users).forEach(k => {
    db.users[k].used = 0;
  });

  res.json({ status: "reset done" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API running"));
