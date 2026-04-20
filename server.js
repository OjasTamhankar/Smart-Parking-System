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

async function fetchData() {
  const pins = ["V0", "V1", "V2", "V3"];

  const values = await Promise.all(
    pins.map(async (pin) => {
      const url = `https://blynk.cloud/external/api/get?token=${AUTH_TOKEN}&${pin}`;
      const res = await axios.get(url);
      return parseInt(res.data);
    })
  );

  const spots = values.map((v, i) => ({
    id: i + 1,
    occupied: v === 1
  }));

  const available = spots.filter(s => !s.occupied).length;

  return {
    success: true,
    timestamp: Date.now(),
    totalSpots: 4,
    availableSpots: available,
    occupiedSpots: 4 - available,
    spots
  };
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