import { Calculator, SlidersHorizontal } from "lucide-react";
import { LineChart, VerticalBars } from "../components/Charts";
import DataInputs from "../components/DataInputs";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import RecommendationList from "../components/RecommendationList";
import { useFinance } from "../lib/financeContext";
import { money } from "../lib/taxEngine";

export default function WhatIfSimulator() {
  const { inputs, model, prediction, updateInput } = useFinance();
  const monthlyReturn = prediction?.monthlyReturn ?? model.returnRate / 12;
  const values = Array.from({ length: model.projectionYears }, (_, index) =>
    model.simAmount * Math.pow(1 + monthlyReturn, (index + 1) * 12),
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Feature 4"
        title="What-If Simulator"
        subtitle="Try investment scenarios and see tax reduction plus projected portfolio growth."
      />

      <section className="simulator-hero">
        <article className="panel dark-panel simulator-card">
          <header className="panel-header">
            <div>
              <span className="eyebrow">What if I invest?</span>
              <h2>{money(model.simAmount)}</h2>
              <p>Tax reduction: {money(model.simTaxReduction)}</p>
            </div>
            <SlidersHorizontal size={18} />
          </header>
          <input
            className="range-input"
            type="range"
            min="0"
            max="200000"
            step="5000"
            value={inputs.simAmount}
            onChange={(event) => updateInput("simAmount", event.target.value)}
            aria-label="Investment scenario amount"
          />
          <LineChart
            color="#14d9a5"
            values={values.length ? values : [0]}
            labels={values.map((_, index) => `Y${index + 1}`)}
          />
        </article>

        <aside className="side-stack">
        <MetricCard label="Tax Reduction" value={money(model.simTaxReduction)} meta="based on scenario amount" tone="green" />
          <MetricCard label="ML Projected Value" value={money(values.at(-1) || 0)} meta={`${model.projectionYears} years`} tone="blue" />
          <MetricCard label="ML Confidence" value={`${Math.round((prediction?.confidence || 0.62) * 100)}%`} meta={prediction?.modelName || "fallback model"} tone="amber" />
        </aside>
      </section>

      <section className="two-column">
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Scenario inputs</span>
              <h2>Assumptions</h2>
            </div>
            <Calculator size={18} />
          </header>
          <DataInputs fields={["annualIncome", "current80c", "currentNps", "returnRate", "projectionYears"]} />
        </article>
        <article className="panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Allocation</span>
              <h2>Scenario Split</h2>
            </div>
          </header>
          <VerticalBars
            bars={[
              { label: "80C", value: model.sim80c || 1, color: "#14d9a5" },
              { label: "NPS", value: model.simNps || 1, color: "#8e7cff" },
              { label: "Growth", value: Math.max(model.simProjectedValue - model.simAmount, 1), color: "#ffb84d" },
            ]}
          />
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <span className="eyebrow">AI suggestions</span>
            <h2>Scenario Recommendations</h2>
          </div>
        </header>
        <RecommendationList model={model} />
      </section>
    </div>
  );
}
