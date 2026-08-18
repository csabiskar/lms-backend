import jwt from "jsonwebtoken";
import Shop from "../models/Shop.js";

export async function verifyRequest(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Missing session token" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.SHOPIFY_API_SECRET, { algorithms: ["HS256"] });
    } catch (err) {
      // Distinguish "expired" from "invalid" — the frontend can silently
      // refresh the token itself on 401 without treating it as an install issue.
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Session token expired", code: "TOKEN_EXPIRED" });
      }
      return res.status(401).json({ error: "Invalid session token", code: "TOKEN_INVALID" });
    }

    // aud must match this app's client id — confirms the token was issued for THIS app,
    // not just any valid Shopify session token.
    if (payload.aud !== process.env.SHOPIFY_API_KEY) {
      return res.status(401).json({ error: "Token was not issued for this app", code: "TOKEN_INVALID" });
    }

    const shopDomain = payload.dest?.replace("https://", "");
    if (!shopDomain) {
      return res.status(401).json({ error: "Invalid token payload", code: "TOKEN_INVALID" });
    }

    const shopRecord = await Shop.findOne({ shop: shopDomain });
    if (!shopRecord) {
      // Token is valid, but this shop hasn't completed OAuth (or was uninstalled).
      // Frontend uses this specific code to redirect into the install flow.
      return res.status(401).json({ error: "Shop not installed", code: "NOT_INSTALLED", shop: shopDomain });
    }

    req.shop = shopDomain;
    req.shopAccessToken = shopRecord.accessToken;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ error: "Invalid or expired session token" });
  }
}