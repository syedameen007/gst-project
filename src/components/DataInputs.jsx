import { useFinance } from "../lib/financeContext";

const labels = {
  annualIncome: "Annual taxable income",
  current80c: "Current 80C investment",
  currentNps: "Current NPS Tier I",
  plannedInvestment: "Proposed investment",
  outputGst: "Output GST liability",
  claimedItc: "ITC already claimed",
  eligibleItc: "Eligible ITC found",
  expenseScore: "Expense quality score",
  costBasis: "Portfolio cost basis",
  currentPortfolio: "Current portfolio value",
  returnRate: "Expected annual return %",
  projectionYears: "Projection years",
  simAmount: "What-if investment",
};

export default function DataInputs({ fields, compact = false }) {
  const { inputs, updateInput } = useFinance();

  return (
    <div className={`input-grid ${compact ? "compact" : ""}`}>
      {fields.map((field) => (
        <label key={field}>
          <span>{labels[field]}</span>
          <input
            type="number"
            min="0"
            step={field.includes("Rate") ? "0.5" : "5000"}
            value={inputs[field]}
            onChange={(event) => updateInput(field, event.target.value)}
          />
        </label>
      ))}
    </div>
  );
}
