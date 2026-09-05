require("dotenv").config();
const express = require("express");
const path = require("path");

const registerHandler = require("./api/register");

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static student app files
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.post("/api/register", (req, res) => registerHandler(req, res));

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🚀 SSC Student Registration App Server is Live!`);
  console.log(`----------------------------------------------------`);
  console.log(`👉 Local Access URL:   http://localhost:${PORT}`);
  console.log(`👉 Loopback IP URL:    http://127.0.0.1:${PORT}`);
  console.log(`👉 Network IP URL:     http://10.64.17.53:${PORT}`);
  console.log(`====================================================`);
});
