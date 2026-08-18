import express from "express";
import crypto from "crypto";
import axios from "axios";
import Shop from "../models/Shop.js";
import OAuthState from "../models/OAuthState.js";

const router = express.Router();

// STEP 1: merchant visits /auth?shop=xxx.myshopify.com -> redirect to Shopify
router.get("/auth", async (req, res) => {
  try {
    const { shop } = req.query;
    if (!shop || !/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop)) {
      return res.status(400).send("Missing or invalid ?shop parameter");
    }

    const state = crypto.randomBytes(16).toString("hex");
    await OAuthState.create({ shop, state });

    const redirectUri = `${process.env.HOST}/auth/callback`;
    const installUrl =
      `https://${shop}/admin/oauth/authorize` +
      `?client_id=${process.env.SHOPIFY_API_KEY}` +
      `&scope=${process.env.SHOPIFY_SCOPES}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}`;

    res.redirect(installUrl);
  } catch (err) {
    console.error("Auth start error:", err.message);
    res.status(500).send("Could not start installation");
  }
});

// STEP 2: Shopify redirects back with a code -> exchange for access token
router.get("/auth/callback", async (req, res) => {
  try {
    const { shop, hmac, code, state } = req.query;
    if (!shop || !hmac || !code) {
      return res.status(400).send("Missing required parameters");
    }

    const storedState = await OAuthState.findOne({ shop, state }).sort({ createdAt: -1 });
    if (!storedState) return res.status(403).send("Request origin could not be verified");
    await OAuthState.deleteMany({ shop });

    // --- HMAC validation, done against the RAW query string ---
    // Rebuilding the message from req.query (an already-decoded object) can
    // change encoding (e.g. "+" vs "%20", or key ordering with duplicate
    // params) and cause valid requests to fail HMAC validation. Shopify
    // signs the raw query string it sent, so we validate against that
    // instead of a re-serialized version.
    const rawQuery = req.originalUrl.split("?")[1] || "";
    const params = new URLSearchParams(rawQuery);
    params.delete("hmac");
    params.delete("signature");

    const message = [...params.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");

    const generatedHash = crypto
      .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
      .update(message)
      .digest("hex");

    const hmacBuffer = Buffer.from(hmac, "utf-8");
    const generatedBuffer = Buffer.from(generatedHash, "utf-8");
    const hmacValid =
      hmacBuffer.length === generatedBuffer.length &&
      crypto.timingSafeEqual(hmacBuffer, generatedBuffer);

    if (!hmacValid) {
      console.error("HMAC mismatch", { message, generatedHash, hmac });
      return res.status(400).send("HMAC validation failed");
    }

    const { data } = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    });

    await Shop.findOneAndUpdate(
      { shop },
      { shop, accessToken: data.access_token, scope: data.scope },
      { upsert: true, new: true }
    );

    res.redirect(`https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`);
  } catch (err) {
    console.error("Auth callback error:", err.response?.data || err.message);
    res.status(500).send("Could not complete installation");
  }
});

export default router;