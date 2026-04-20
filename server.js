require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const AUTH_TOKEN = process.env.BLYNK_TOKEN;

let cache = null;
let lastFetch = 0;

const TOTAL_SLOTS = 10;

const TOTAL_SLOTS = 10;

async function fetchData() {
  try {
    // generate pin query: V0&V1&V2...
    const pinQuery = Array.from({ length: TOTAL_SLOTS }, (_, i) => `V${i}`).join("&");

    const url = `https://blynk.cloud/external/api/get?token=${AUTH_TOKEN}&${pinQuery}`;

    const res = await axios.get(url);

    const values = res.data.map(v => parseInt(v));

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

app.get("/", (req, res) => {
  res.send("Smart Parking API is running 🚀");
});

app.get("/api/parking-status", async (req, res) => {
  try {
    if (Date.now() - lastFetch < 2000 && cache) {
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});