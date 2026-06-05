import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, default: "" },
    vendor: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
    paymentMode: { type: String, default: "Bank" },
    hasInvoice: { type: Boolean, default: true },
    taxTreatment: {
      type: String,
      enum: ["Business expense", "Input tax credit", "Personal", "Review needed"],
      default: "Business expense",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Expense", expenseSchema);
