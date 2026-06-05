import mongoose from "mongoose";

const financialProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, unique: true },
    regime: { type: String, enum: ["old", "new"], default: "old" },
    inputs: {
      annualIncome: { type: Number, default: 0 },
      current80c: { type: Number, default: 0 },
      currentNps: { type: Number, default: 0 },
      plannedInvestment: { type: Number, default: 0 },
      outputGst: { type: Number, default: 0 },
      claimedItc: { type: Number, default: 0 },
      eligibleItc: { type: Number, default: 0 },
      expenseScore: { type: Number, default: 0 },
      costBasis: { type: Number, default: 0 },
      currentPortfolio: { type: Number, default: 0 },
      returnRate: { type: Number, default: 0 },
      projectionYears: { type: Number, default: 1 },
      simAmount: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export default mongoose.model("FinancialProfile", financialProfileSchema);
