const express = require("express");
const db = require("./db");

const app = express();
app.use(express.json());

// ================= HOME =================
app.get("/", (req, res) => {
  res.send("🚀 Professional API System Running");
});

// ================= API MIDDLEWARE =================
function auth(req, res, next) {
  const key = req.query.key;

  if (!key || !db.users[key]) {
    return res.json({ status: "error", msg: "Invalid API Key" });
  }

  req.user = db.users[key];
  req.key = key;
  next();
}

// ================= SEND API =================
app.get("/api/send", auth, (req, res) => {
  const { number, msg } = req.query;

  if (!number || !msg) {
    return res.json({ status: "error", msg: "Missing number/msg" });
  }

  // LIMIT CHECK
  if (req.user.used >= req.user.limit) {
    return res.json({ status: "error", msg: "Limit reached" });
  }

  req.user.used++;

  console.log(`SEND → ${number} : ${msg}`);

  res.json({
    status: "success",
    number,
    msg,
    used: req.user.used,
    remaining: req.user.limit - req.user.used
  });
});

// ================= ADMIN ADD USER =================
app.get("/admin/add", (req, res) => {
  const { key, limit } = req.query;

  if (!key) return res.json({ msg: "key required" });

  db.users[key] = {
    limit: Number(limit) || 5,
    used: 0
  };

  res.json({ status: "user added", key });
});

// ================= RESET LIMIT =================
app.get("/admin/reset", (req, res) => {
  Object.keys(db.users).forEach(k => {
    db.users[k].used = 0;
  });

  res.json({ status: "reset done" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
