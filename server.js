// server.js

// 1) Load environment variables first
require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { Pool } = require("pg");

// 2) Set up PostgreSQL pool
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

// 3) Create Express app
const app = express();
app.use(cors());
app.use(express.static("public"));
app.use(express.json());

// 4) Weather API key
const API_KEY = process.env.WEATHER_API_KEY;
console.log("WEATHER_API_KEY loaded:", API_KEY ? "✅ yes" : "❌ no");

// 5) Weather route
app.get("/weather/:city", async (req, res) => {
  const city = req.params.city;
  try {
    const url =
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}` +
      `&appid=${API_KEY}&units=metric`;

    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error("Weather API error:", err.response?.data || err.message);
    res.status(400).json({ error: "Could not fetch weather for that city." });
  }
});

// 6) Favorites routes (PostgreSQL)
app.get("/favorites", async (req, res) => {
  const result = await pool.query("SELECT city FROM favorites ORDER BY city ASC");
  res.json(result.rows); // [{ city: "Berlin" }, ...]
});

app.post("/favorites", async (req, res) => {
  const { city } = req.body;
  if (!city) return res.status(400).json({ error: "City is required" });

  try {
    await pool.query(
      "INSERT INTO favorites (city) VALUES ($1) ON CONFLICT (city) DO NOTHING",
      [city]
    );
    const result = await pool.query("SELECT city FROM favorites ORDER BY city ASC");
    res.json({ ok: true, favorites: result.rows });
  } catch (e) {
    console.error("DB error:", e.message);
    res.status(500).json({ error: "DB error" });
  }
});

app.delete("/favorites/:city", async (req, res) => {
  const city = req.params.city;
  await pool.query("DELETE FROM favorites WHERE LOWER(city) = LOWER($1)", [city]);
  const result = await pool.query("SELECT city FROM favorites ORDER BY city ASC");
  res.json({ ok: true, favorites: result.rows });
});

// 7) Start server
app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
