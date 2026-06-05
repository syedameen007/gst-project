import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, default: 0 },
    taxBucket: { type: String, default: "Tax neutral" },
    expectedReturn: { type: Number, default: 0 },
    risk: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    notes: { type: String, default: "" },
  },
  { _id: true },
);

const portfolioSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, default: "Tax-aware portfolio" },
    assets: { type: [assetSchema], default: [] },
    summary: {
      totalValue: { type: Number, default: 0 },
      taxSavingAssets: { type: Number, default: 0 },
      weightedReturn: { type: Number, default: 0 },
      highRiskShare: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Portfolio", portfolioSchema);
