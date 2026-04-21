require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const AUTH_TOKEN = process.env.BLYNK_TOKEN;

// ===== CONFIG =====
const TOTAL_SLOTS = 10;
const CACHE_DURATION = 2000; // 2 seconds

// ===== CACHE =====
let cache = null;
let lastFetch = 0;

// ===== FETCH FUNCTION =====
async function fetchData() {
  try {
    // Create query: V0&V1&V2...V9
    const pinQuery = Array.from({ length: TOTAL_SLOTS }, (_, i) => `V${i}`).join("&");

    const url = `https://blynk.cloud/external/api/get?token=${AUTH_TOKEN}&${pinQuery}`;

    const res = await axios.get(url, { timeout: 3000 });

    // Debug (check logs on Render if needed)
    console.log("Blynk raw response:", res.data);

    // Ensure always array
    const data = res.data;

    // Convert object → ordered array [V0, V1, ..., V9]
    const values = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
      const key = `V${i}`;
      return parseInt(data[key]) || 0;
    });

    const spots = values.map((v, i) => ({
      id: i + 1,
      occupied: v === 1
    }));

    const available = spots.filter(s => !s.occupied).length;

    return {
      success: true,
      timestamp: Date.now(),
      totalSpots: TOTAL_SLOTS,
      availableSpots: available,
      occupiedSpots: TOTAL_SLOTS - available,
      spots
    };

  } catch (err) {
    console.error("Blynk fetch error:", err.message);
    throw err;
  }
}

// ===== ROUTES =====

// Root route
app.get("/", (req, res) => {
  res.send("Smart Parking API is running 🚀");
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Main API
app.get("/api/parking-status", async (req, res) => {
  try {
    // Serve cache if fresh
    if (Date.now() - lastFetch < CACHE_DURATION && cache) {
      return res.json(cache);
    }

    const data = await fetchData();

    cache = data;
    lastFetch = Date.now();

    res.json(data);

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch parking data"
    });
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});