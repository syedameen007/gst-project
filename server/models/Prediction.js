import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    scenarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Scenario" },
    modelName: { type: String, required: true },
    modelVersion: { type: String, required: true },
    features: { type: Object, required: true },
    output: { type: Object, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.72 },
  },
  { timestamps: true },
);

export default mongoose.model("Prediction", predictionSchema);
