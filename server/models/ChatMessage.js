import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    page: { type: String, default: "support" },
    role: { type: String, enum: ["user", "assistant"], required: true },
    message: { type: String, required: true },
    modelSnapshot: { type: Object },
  },
  { timestamps: true },
);

export default mongoose.model("ChatMessage", chatMessageSchema);
