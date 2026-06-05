import mongoose from "mongoose";

const scenarioSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, default: "Current scenario" },
    inputs: { type: Object, required: true },
    regime: { type: String, enum: ["old", "new"], default: "old" },
    deterministicModel: { type: Object, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Scenario", scenarioSchema);
