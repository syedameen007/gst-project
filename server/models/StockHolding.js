import mongoose from "mongoose";

const stockHoldingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    companyName: { type: String, default: "" },
    sector: { type: String, default: "General" },
    quantity: { type: Number, required: true, min: 0 },
    averagePrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, required: true, min: 0 },
    return7d: { type: Number, default: 0 },
    return21d: { type: Number, default: 0 },
    volatilityRange: { type: Number, default: 2 },
    volumeRatio: { type: Number, default: 1 },
    holdingPeriodMonths: { type: Number, default: 12 },
    taxClass: {
      type: String,
      enum: ["Equity", "Debt fund", "International", "Other"],
      default: "Equity",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("StockHolding", stockHoldingSchema);
