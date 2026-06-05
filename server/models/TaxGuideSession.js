import mongoose from "mongoose";

const taxGuideSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    answers: {
      type: [
        {
          questionId: { type: String, required: true },
          question: { type: String, required: true },
          answer: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model("TaxGuideSession", taxGuideSessionSchema);
