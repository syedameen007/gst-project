import { ArrowDown, BrainCircuit, Database, ShieldAlert } from "lucide-react";
import DataInputs from "../components/DataInputs";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import RecommendationList from "../components/RecommendationList";
import RiskSignals from "../components/RiskSignals";
import { useFinance } from "../lib/financeContext";
import { money, riskSignals } from "../lib/taxEngine";

export default function PlanningEngine() {
  const { model } = useFinance();
  const highestRisk = riskSignals(model).some((risk) => risk.level === "high")
    ? "High"
    : riskSignals(model).some((risk) => risk.level === "medium")
      ? "Medium"
      : "Low";

  return (
    <div className="page">
      <PageHeader
        eyebrow="Feature 3"
        title="Smart Tax Planning Engine"
        subtitle="Combines GST insights, income/expense analysis, investment planning, and compliance signals."
      />
      <section className="metric-grid">
        <MetricCard label="Combined Savings" value={money(model.totalSaved)} meta="tax + GST" tone="green" />
        <MetricCard label="ITC Gap" value={money(model.itcGap)} meta="claimable credit" tone="amber" />
        <MetricCard label="Investment Tax Cut" value={money(model.incomeTaxSaved)} meta="deduction impact" tone="blue" />
        <MetricCard label="Risk Level" value={highestRisk} meta="fraud + compliance" tone="rose" />
      </section>

      <section className="engine-layout">
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Data inputs</span>
              <h2>GST + Income + Expense</h2>
            </div>
            <Database size={18} />
          </header>
          <DataInputs fields={["annualIncome", "current80c", "currentNps", "plannedInvestment", "outputGst", "claimedItc", "eligibleItc", "expenseScore"]} />
        </article>

        <article className="panel dark-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Architecture</span>
              <h2>AI Engine Flow</h2>
            </div>
            <BrainCircuit size={18} />
          </header>
          <div className="engine-flow">
            {["User Data", "AI Engine", "Fraud Detection", "Tax Optimization", "Portfolio Optimizer", "Insights + Dashboard + Chat"].map((node, index, list) => (
              <div className="engine-node" key={node}>
                <span>{node}</span>
                {index < list.length - 1 && <ArrowDown size={18} />}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Planning engine</span>
              <h2>Combined Recommendations</h2>
            </div>
          </header>
          <RecommendationList model={model} />
        </article>
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Fraud detection</span>
              <h2>Compliance Signals</h2>
            </div>
            <ShieldAlert size={18} />
          </header>
          <RiskSignals model={model} />
        </article>
      </section>
    </div>
  );
}
