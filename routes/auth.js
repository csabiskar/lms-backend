import express from "express";
import axios from "axios";
import Shop from "../models/Shop.js";

const router = express.Router();

router.post("/api/auth/token-exchange", async (req, res) => {
  try {
    const { shop, sessionToken } = req.body;
    if (!shop || !sessionToken) {
      return res.status(400).json({ error: "Missing shop or session token" });
    }

    const { data } = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      subject_token: sessionToken,
      subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
      requested_token_type: "urn:ietf:params:oauth:token-type:offline-access-token",
    });

    await Shop.findOneAndUpdate(
      { shop },
      { shop, accessToken: data.access_token, scope: data.scope },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Token exchange error:", err.response?.data || err.message);
    res.status(500).json({ error: "Token exchange failed" });
  }
});

export default router;