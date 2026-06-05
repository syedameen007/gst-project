import { Bot, MessageSquareText } from "lucide-react";
import AdvisorChat from "../components/AdvisorChat";
import DataInputs from "../components/DataInputs";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import RiskSignals from "../components/RiskSignals";
import { useFinance } from "../lib/financeContext";
import { money } from "../lib/taxEngine";

export default function AIFinancialAdvisor() {
  const { model, prediction } = useFinance();

  return (
    <div className="page">
      <PageHeader
        eyebrow="Feature 5"
        title="AI Financial Advisor Chat"
        subtitle="Customer-support assistant for tax planning, GST ITC, portfolio impact, and scenario questions."
      />

      <section className="advisor-layout">
        <article className="panel dark-panel advisor-main">
          <header className="panel-header">
            <div>
              <span className="eyebrow">AI advisor</span>
              <h2>Tax Planning Chat</h2>
            </div>
            <Bot size={18} />
          </header>
          <AdvisorChat model={model} large />
        </article>

        <aside className="side-stack">
          <MetricCard label="Total Tax Reduced" value={money(model.totalSaved)} meta="deductions + ITC" tone="green" />
          <MetricCard label="GST ITC Gap" value={money(model.itcGap)} meta="customer support context" tone="amber" />
          <MetricCard
            label="ML Forecast"
            value={prediction ? `${Math.round(prediction.monthlyReturn * 10000) / 100}%` : model.bestRegime}
            meta={prediction?.modelName || "live model result"}
            tone="rose"
          />
        </aside>
      </section>

      <section className="two-column">
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Advisor context</span>
              <h2>Live Inputs</h2>
            </div>
            <MessageSquareText size={18} />
          </header>
          <DataInputs fields={["annualIncome", "plannedInvestment", "current80c", "currentNps", "outputGst", "eligibleItc"]} />
        </article>
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Support signals</span>
              <h2>What AI Watches</h2>
            </div>
          </header>
          <RiskSignals model={model} />
        </article>
      </section>
    </div>
  );
}
