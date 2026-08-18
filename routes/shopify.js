import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/shop-info", async (req, res) => {
  try {
    const response = await axios.post(
      `https://${req.shop}/admin/api/2024-10/graphql.json`,
      { query: `{ shop { name email myshopifyDomain plan { displayName } } }` },
      { headers: { "X-Shopify-Access-Token": req.shopAccessToken, "Content-Type": "application/json" } }
    );
    res.json(response.data.data.shop);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch shop info from Shopify" });
  }
});

export default router;