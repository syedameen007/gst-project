import mongoose from "mongoose";

const taxDocumentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, default: 0 },
    category: { type: String, default: "Other" },
    documentDate: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["Uploaded", "Reviewed"], default: "Uploaded" },
  },
  { timestamps: true },
);

export default mongoose.model("TaxDocument", taxDocumentSchema);
