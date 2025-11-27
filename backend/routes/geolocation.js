const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/search", async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "Query is required" });

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    const response = await axios.get(url, {
        headers: { "User-Agent": "ecommerce-app" }
    });

    res.json(response.data);
});

router.get("/pickup", (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon) return res.status(400).json({ error: "lat & lon required" });

    const points = [
        { name: "Point 1", lat: parseFloat(lat) + 0.01, lon: parseFloat(lon) + 0.01 },
        { name: "Point 2", lat: parseFloat(lat) - 0.01, lon: parseFloat(lon) - 0.01 }
    ];
    res.json(points);
});

module.exports = router;
