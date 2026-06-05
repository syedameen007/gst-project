import {
  ArrowUpRight,
  Calculator,
  IndianRupee,
  Landmark,
  MoreVertical,
  Search,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, StackedBars, VerticalBars } from "../components/Charts";
import DataInputs from "../components/DataInputs";
import MetricCard from "../components/MetricCard";
import MobilePreview from "../components/MobilePreview";
import PageHeader from "../components/PageHeader";
import RecommendationList from "../components/RecommendationList";
import TaxCompare from "../components/TaxCompare";
import { useFinance } from "../lib/financeContext";
import { money } from "../lib/taxEngine";

export default function CommandCenter() {
  const { model, prediction } = useFinance();
  const trend = [92, 98, 105, 101, 115, 127, 136, 148, 161, 174, 188, 204];
  const realized = [68, 70, 73, 76, 80, 83, 88, 91, 96, 100, 106, 112];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Dashboard"
        title="Portfolio Overview"
        subtitle="Tax savings, GST compliance, investment planning, and AI support in one workspace."
      />

      <section className="metric-grid">
        <MetricCard
          label="Total Tax Reduced"
          value={money(model.totalSaved)}
          meta="+ deductions + ITC"
          tone="green"
        />
        <MetricCard
          label="Portfolio Value"
          value={money(model.currentPortfolio)}
          meta={`${model.portfolioGain >= 0 ? "+" : "-"} ${money(Math.abs(model.portfolioGain))}`}
          tone="blue"
        />
        <MetricCard
          label="GST ITC Opportunity"
          value={money(model.itcGap)}
          meta="claimable credit gap"
          tone="amber"
        />
        <MetricCard
          label="Best Regime"
          value={prediction ? `${Math.round(prediction.monthlyReturn * 10000) / 100}%` : model.bestRegime}
          meta={prediction ? "ML monthly return forecast" : "regime result"}
          tone="rose"
        />
      </section>

      <section className="dashboard-layout">
        <article className="panel hero-chart dark-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Financial intelligence</span>
              <h2>{money(model.currentPortfolio)}</h2>
              <p>
                <ArrowUpRight size={16} /> {Math.round(model.portfolioReturn * 1000) / 10}% tax-aware return
              </p>
            </div>
            <button type="button" className="icon-pill dark">
              <MoreVertical size={18} />
            </button>
          </header>
          <LineChart
            values={trend}
            secondary={realized}
            color="#14d9a5"
            labels={["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
          />
        </article>

        <article className="panel controls-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Current data</span>
              <h2>Scenario Inputs</h2>
            </div>
            <Search size={18} />
          </header>
          <DataInputs
            compact
            fields={["annualIncome", "plannedInvestment", "current80c", "currentNps", "outputGst", "eligibleItc"]}
          />
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Before vs after</span>
              <h2>Tax Payable</h2>
            </div>
            <IndianRupee size={18} />
          </header>
          <TaxCompare model={model} />
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Investment assets</span>
              <h2>Value by Category</h2>
            </div>
            <Landmark size={18} />
          </header>
          <StackedBars
            groups={[
              {
                label: "Q1",
                values: [
                  { label: "80C", value: 48, color: "#14d9a5" },
                  { label: "NPS", value: 24, color: "#8e7cff" },
                  { label: "ITC", value: 31, color: "#ffb84d" },
                ],
              },
              {
                label: "Q2",
                values: [
                  { label: "80C", value: 54, color: "#14d9a5" },
                  { label: "NPS", value: 30, color: "#8e7cff" },
                  { label: "ITC", value: 44, color: "#ffb84d" },
                ],
              },
              {
                label: "Q3",
                values: [
                  { label: "80C", value: 62, color: "#14d9a5" },
                  { label: "NPS", value: 42, color: "#8e7cff" },
                  { label: "ITC", value: 52, color: "#ffb84d" },
                ],
              },
              {
                label: "Q4",
                values: [
                  { label: "80C", value: 74, color: "#14d9a5" },
                  { label: "NPS", value: 50, color: "#8e7cff" },
                  { label: "ITC", value: 63, color: "#ffb84d" },
                ],
              },
            ]}
          />
        </article>

        <article className="panel dark-card">
          <header className="panel-header">
            <div>
              <span className="eyebrow">ML prediction</span>
              <h2>
                {prediction
                  ? `${Math.round(prediction.confidence * 100)}% confidence`
                  : money(model.projectedInvestmentValue)}
              </h2>
            </div>
            <Sparkles size={18} />
          </header>
          <VerticalBars
            bars={[
              { label: "80C", value: model.allocate80c || 1, color: "#14d9a5" },
              { label: "NPS", value: model.allocateNps || 1, color: "#8e7cff" },
              { label: "ITC", value: model.itcGap || 1, color: "#ffb84d" },
              { label: "Tax", value: model.totalSaved || 1, color: "#66c7f4" },
            ]}
          />
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">AI suggestions</span>
              <h2>Next Moves</h2>
            </div>
            <Calculator size={18} />
          </header>
          <RecommendationList model={model} limit={3} />
        </article>
      </section>

      <section className="feature-strip">
        {[
          ["/investments", "Tax Investments", "Invest to reduce liability"],
          ["/portfolio", "Portfolio Impact", "Before vs after tax"],
          ["/planning-engine", "Planning Engine", "GST + income + investments"],
          ["/simulator", "What-If Simulator", "Try ₹20,000 scenarios"],
          ["/advisor", "AI Advisor", "Tax-aware customer chat"],
        ].map(([to, title, body]) => (
          <Link className="feature-link" key={to} to={to}>
            <strong>{title}</strong>
            <span>{body}</span>
          </Link>
        ))}
      </section>

      <section className="web-phone-grid">
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Web support</span>
              <h2>Desktop Dashboard</h2>
            </div>
          </header>
          <div className="desktop-frame">
            <TaxCompare model={model} />
          </div>
        </article>
        <article className="panel phone-preview-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Phone support</span>
              <h2>Mobile Portfolio</h2>
            </div>
          </header>
          <MobilePreview model={model} />
        </article>
      </section>
    </div>
  );
}
