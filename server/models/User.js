import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    passwordHash: { type: String },
    googleId: { type: String, index: true },
    authProvider: { type: String, enum: ["password", "google"], default: "password" },
    sessionToken: { type: String, index: true },
    role: { type: String, enum: ["customer", "advisor"], default: "customer" },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
