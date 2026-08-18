import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
    {
        shop: { type: String, required: true, unique: true, index: true },
        accessToken: { type: String, required: true },
        scope: String,
    },
    { timestamps: true }
);

export default mongoose.model("Shop", shopSchema);