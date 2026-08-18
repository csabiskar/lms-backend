import jwt from "jsonwebtoken";
import Shop from "../models/Shop.js";

export async function verifyRequest(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing session token" });

    const payload = jwt.verify(token, process.env.SHOPIFY_API_SECRET, { algorithms: ["HS256"] });
    const shopDomain = payload.dest.replace("https://", "");

    const shopRecord = await Shop.findOne({ shop: shopDomain });
    if (!shopRecord) return res.status(401).json({ error: "Shop not installed" });

    req.shop = shopDomain;
    req.shopAccessToken = shopRecord.accessToken;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ error: "Invalid or expired session token" });
  }
}