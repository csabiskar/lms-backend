import mongoose from "mongoose";

const oauthStateSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  state: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // auto-deletes after 10 min
});

export default mongoose.model("OAuthState", oauthStateSchema);