import { BarChart3, IndianRupee, WalletCards } from "lucide-react";
import { DonutChart, LineChart } from "../components/Charts";
import DataInputs from "../components/DataInputs";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import PortfolioAllocation from "../components/PortfolioAllocation";
import TaxCompare from "../components/TaxCompare";
import { useFinance } from "../lib/financeContext";
import { money } from "../lib/taxEngine";

export default function PortfolioImpact() {
  const { model } = useFinance();

  return (
    <div className="page">
      <PageHeader
        eyebrow="Feature 2"
        title="Portfolio + Tax Impact Dashboard"
        subtitle="Portfolio value, gains/losses, GST impact, and tax payable before vs after optimization."
      />
      <section className="metric-grid">
        <MetricCard label="Portfolio Value" value={money(model.currentPortfolio)} meta={`${money(Math.abs(model.portfolioGain))} ${model.portfolioGain >= 0 ? "gain" : "loss"}`} tone="blue" />
        <MetricCard label="Total Tax Reduced" value={money(model.totalSaved)} meta="income tax + GST" tone="green" />
        <MetricCard label="Tax Before" value={money(model.taxBeforeTotal)} meta="selected regime + GST" tone="amber" />
        <MetricCard label="Tax After" value={money(model.taxAfterTotal)} meta="best regime + ITC" tone="rose" />
      </section>

      <section className="portfolio-layout">
        <article className="panel dark-panel large-chart">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Portfolio value</span>
              <h2>{money(model.currentPortfolio)}</h2>
              <p>{Math.round(model.portfolioReturn * 1000) / 10}% from cost basis</p>
            </div>
            <WalletCards size={18} />
          </header>
          <LineChart
            values={[62, 72, 68, 86, 94, 91, 110, 122, 130, 144, 156]}
            secondary={[56, 60, 64, 70, 78, 82, 90, 96, 101, 108, 116]}
            color="#8e7cff"
            labels={["Jan", "Mar", "May", "Jul", "Sep", "Nov"]}
          />
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Input controls</span>
              <h2>Portfolio Data</h2>
            </div>
            <BarChart3 size={18} />
          </header>
          <DataInputs fields={["costBasis", "currentPortfolio", "annualIncome", "plannedInvestment", "current80c", "currentNps"]} />
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Tax impact</span>
              <h2>Before vs After</h2>
            </div>
            <IndianRupee size={18} />
          </header>
          <TaxCompare model={model} />
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Exposure</span>
              <h2>Tax-Aware Allocation</h2>
            </div>
          </header>
          <PortfolioAllocation model={model} />
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <span className="eyebrow">Tax support</span>
            <h2>Portfolio Role</h2>
          </div>
        </header>
        <div className="insight-grid">
          <article>
            <strong>Compliance + savings</strong>
            <span>Portfolio suggestions prioritize eligible deduction buckets and GST working-capital impact.</span>
          </article>
          <article>
            <strong>No stock prediction</strong>
            <span>The dashboard avoids trading calls and keeps investments tied to tax planning outcomes.</span>
          </article>
          <article>
            <strong>Regime-aware</strong>
            <span>Old and new regime estimates are compared before showing the optimized tax payable.</span>
          </article>
        </div>
      </section>
    </div>
  );
}
