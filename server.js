const express = require("express");
const axios = require("axios");
const db = require("./db");

const app = express();
app.use(express.static("public"));

// ================= CREATE KEY =================
app.get("/admin/create", (req, res) => {
  const { pass, key, limit, days } = req.query;

  if (pass !== db.adminPassword) {
    return res.json({ status: "error", msg: "Wrong password" });
  }

  const expiry = Date.now() + (Number(days) * 86400000);

  db.users[key] = {
    limit: Number(limit),
    used: 0,
    expiry
  };

  res.json({ status: "created", key });
});

// ================= GET ALL KEYS =================
app.get("/admin/list", (req, res) => {
  if (req.query.pass !== db.adminPassword) {
    return res.json({ status: "error" });
  }

  res.json(db.users);
});

// ================= DELETE =================
app.get("/admin/delete", (req, res) => {
  const { pass, key } = req.query;

  if (pass !== db.adminPassword) return res.json({ status: "error" });

  delete db.users[key];
  res.json({ status: "deleted" });
});

// ================= USER STATUS =================
app.get("/api/status", (req, res) => {
  const { key } = req.query;

  if (!db.users[key]) return res.json({ status: "invalid key" });

  const u = db.users[key];

  res.json({
    limit: u.limit,
    used: u.used,
    remaining: u.limit - u.used,
    expiry: new Date(u.expiry)
  });
});

// ================= MAIN API PROXY =================
app.get("/api/send", async (req, res) => {
  const { key, number, msg } = req.query;

  const user = db.users[key];

  if (!user) return res.json({ status: "Invalid key" });

  if (Date.now() > user.expiry) {
    return res.json({ status: "expired" });
  }

  if (user.used >= user.limit) {
    return res.json({ status: "limit reached" });
  }

  user.used++;

  try {
    const url = `http://xlahr.pro.bd/Key/sub.php?key=${db.mainApiKey}&number=${number}&msg=${msg}`;

    const r = await axios.get(url);

    res.json({
      status: "success",
      data: r.data,
      used: user.used,
      remaining: user.limit - user.used
    });

  } catch (e) {
    res.json({ status: "error", msg: "main api failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("RUNNING"));
