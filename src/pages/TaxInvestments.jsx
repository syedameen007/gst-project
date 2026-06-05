import { PiggyBank, TrendingUp } from "lucide-react";
import DataInputs from "../components/DataInputs";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import RecommendationList from "../components/RecommendationList";
import { VerticalBars } from "../components/Charts";
import { useFinance } from "../lib/financeContext";
import { money } from "../lib/taxEngine";

export default function TaxInvestments() {
  const { model } = useFinance();

  return (
    <div className="page">
      <PageHeader
        eyebrow="Feature 1"
        title="Tax-Optimized Investment Suggestions"
        subtitle="Use tax-saving instruments while keeping portfolio choices aligned with compliance and savings."
      />
      <section className="metric-grid">
        <MetricCard label="Income Tax Reduced" value={money(model.incomeTaxSaved)} meta="regime-aware estimate" tone="green" />
        <MetricCard label="80C Remaining" value={money(model.remaining80c)} meta="ELSS, PPF, EPF" tone="blue" />
        <MetricCard label="NPS Remaining" value={money(model.remainingNps)} meta="80CCD(1B)" tone="amber" />
        <MetricCard label="Projected Value" value={money(model.projectedInvestmentValue)} meta={`${model.projectionYears} year projection`} tone="rose" />
      </section>

      <section className="two-column">
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Deduction inputs</span>
              <h2>Investment Planner</h2>
            </div>
            <PiggyBank size={18} />
          </header>
          <DataInputs fields={["annualIncome", "current80c", "currentNps", "plannedInvestment", "returnRate", "projectionYears"]} />
        </article>
        <article className="panel dark-card">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Tax-aware allocation</span>
              <h2>{money(model.allocate80c + model.allocateNps)}</h2>
            </div>
            <TrendingUp size={18} />
          </header>
          <VerticalBars
            bars={[
              { label: "80C", value: model.allocate80c || 1, color: "#14d9a5" },
              { label: "NPS", value: model.allocateNps || 1, color: "#8e7cff" },
              { label: "Overflow", value: model.overflow || 1, color: "#ffb84d" },
            ]}
          />
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">AI suggestions</span>
              <h2>Recommended Moves</h2>
            </div>
          </header>
          <RecommendationList model={model} />
        </article>
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Instruments</span>
              <h2>Eligible Buckets</h2>
            </div>
          </header>
          <div className="instrument-list">
            {[
              ["ELSS Tax Saver", "80C", "Market-linked, lock-in oriented"],
              ["PPF / EPF / VPF", "80C", "Long-term savings bucket"],
              ["Life Insurance Premium", "80C", "Protection-linked deduction"],
              ["NPS Tier I", "80CCD(1B)", "Additional retirement bucket"],
            ].map(([name, tag, body]) => (
              <article key={name}>
                <div>
                  <strong>{name}</strong>
                  <span>{body}</span>
                </div>
                <small>{tag}</small>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
