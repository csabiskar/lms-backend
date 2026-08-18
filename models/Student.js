import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    shop: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
  },
  { timestamps: true }
);

studentSchema.index({ shop: 1, email: 1 }, { unique: true });

export default mongoose.model("Student", studentSchema);