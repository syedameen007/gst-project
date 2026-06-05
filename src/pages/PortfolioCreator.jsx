import { Plus, Save, Trash2, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DonutChart, VerticalBars } from "../components/Charts";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import { fetchPortfolio, savePortfolio } from "../lib/api";
import { useFinance } from "../lib/financeContext";
import { money } from "../lib/taxEngine";

const emptyAsset = {
  name: "New tax-aware asset",
  type: "Investment",
  amount: 10000,
  taxBucket: "Tax neutral",
  expectedReturn: 8,
  risk: "Medium",
  notes: "",
};

const taxBuckets = ["80C", "80CCD(1B)", "GST ITC", "Tax neutral"];
const riskLevels = ["Low", "Medium", "High"];

function summarize(assets) {
  const totalValue = assets.reduce((sum, asset) => sum + Number(asset.amount || 0), 0);
  const taxSavingAssets = assets
    .filter((asset) => asset.taxBucket !== "Tax neutral")
    .reduce((sum, asset) => sum + Number(asset.amount || 0), 0);
  const weightedReturn =
    totalValue > 0
      ? assets.reduce(
          (sum, asset) =>
            sum + Number(asset.amount || 0) * (Number(asset.expectedReturn || 0) / 100),
          0,
        ) / totalValue
      : 0;
  const highRiskShare =
    totalValue > 0
      ? assets
          .filter((asset) => asset.risk === "High")
          .reduce((sum, asset) => sum + Number(asset.amount || 0), 0) / totalValue
      : 0;

  return { totalValue, taxSavingAssets, weightedReturn, highRiskShare };
}

export default function PortfolioCreator() {
  const { userId, updateInput } = useFinance();
  const [name, setName] = useState("Tax-aware portfolio");
  const [assets, setAssets] = useState([
    {
      name: "ELSS Tax Saver",
      type: "Equity-linked savings",
      amount: 50000,
      taxBucket: "80C",
      expectedReturn: 11,
      risk: "High",
      notes: "Tax-aware growth allocation",
    },
    {
      name: "NPS Tier I",
      type: "Retirement",
      amount: 25000,
      taxBucket: "80CCD(1B)",
      expectedReturn: 9,
      risk: "Medium",
      notes: "Additional retirement deduction bucket",
    },
  ]);
  const [status, setStatus] = useState("Ready");
  const summary = useMemo(() => summarize(assets), [assets]);

  useEffect(() => {
    let active = true;
    fetchPortfolio(userId)
      .then((portfolio) => {
        if (!active) return;
        setName(portfolio.name || "Tax-aware portfolio");
        setAssets(portfolio.assets?.length ? portfolio.assets : assets);
        setStatus("Loaded from MongoDB");
      })
      .catch(() => setStatus("Local draft"));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function updateAsset(index, field, value) {
    setAssets((current) =>
      current.map((asset, assetIndex) =>
        assetIndex === index
          ? {
              ...asset,
              [field]: ["amount", "expectedReturn"].includes(field) ? Number(value) : value,
            }
          : asset,
      ),
    );
  }

  function addAsset() {
    setAssets((current) => [...current, { ...emptyAsset }]);
  }

  function removeAsset(index) {
    setAssets((current) => current.filter((_, assetIndex) => assetIndex !== index));
  }

  function applyToDashboard() {
    updateInput("currentPortfolio", summary.totalValue);
    updateInput("costBasis", Math.round(summary.totalValue * 0.86));
    updateInput("plannedInvestment", Math.min(summary.taxSavingAssets, 200000));
    setStatus("Applied to dashboard inputs");
  }

  async function save() {
    setStatus("Saving");
    try {
      const portfolio = await savePortfolio(userId, { name, assets });
      setName(portfolio.name);
      setAssets(portfolio.assets);
      setStatus("Saved to MongoDB");
    } catch {
      setStatus("Could not reach MongoDB, kept local draft");
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Builder"
        title="Portfolio Creator"
        subtitle="Create a tax-aware investment portfolio that supports compliance and savings."
      />

      <section className="metric-grid">
        <MetricCard label="Portfolio Value" value={money(summary.totalValue)} meta={status} tone="blue" />
        <MetricCard label="Tax-Saving Assets" value={money(summary.taxSavingAssets)} meta="80C + NPS + ITC buckets" tone="green" />
        <MetricCard label="Weighted Return" value={`${Math.round(summary.weightedReturn * 1000) / 10}%`} meta="asset-weighted estimate" tone="amber" />
        <MetricCard label="High Risk Share" value={`${Math.round(summary.highRiskShare * 100)}%`} meta="portfolio risk mix" tone="rose" />
      </section>

      <section className="creator-layout">
        <article className="panel creator-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Portfolio details</span>
              <h2>Asset Builder</h2>
            </div>
            <button className="primary-action" type="button" onClick={addAsset}>
              <Plus size={17} />
              Add Asset
            </button>
          </header>
          <label className="portfolio-name">
            Portfolio name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <div className="asset-table">
            {assets.map((asset, index) => (
              <article className="asset-row" key={`${asset.name}-${index}`}>
                <label>
                  Asset
                  <input
                    value={asset.name}
                    onChange={(event) => updateAsset(index, "name", event.target.value)}
                  />
                </label>
                <label>
                  Type
                  <input
                    value={asset.type}
                    onChange={(event) => updateAsset(index, "type", event.target.value)}
                  />
                </label>
                <label>
                  Amount
                  <input
                    type="number"
                    value={asset.amount}
                    onChange={(event) => updateAsset(index, "amount", event.target.value)}
                  />
                </label>
                <label>
                  Tax bucket
                  <select
                    value={asset.taxBucket}
                    onChange={(event) => updateAsset(index, "taxBucket", event.target.value)}
                  >
                    {taxBuckets.map((bucket) => (
                      <option key={bucket}>{bucket}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Return %
                  <input
                    type="number"
                    value={asset.expectedReturn}
                    onChange={(event) => updateAsset(index, "expectedReturn", event.target.value)}
                  />
                </label>
                <label>
                  Risk
                  <select value={asset.risk} onChange={(event) => updateAsset(index, "risk", event.target.value)}>
                    {riskLevels.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </label>
                <button className="icon-pill danger" type="button" onClick={() => removeAsset(index)} aria-label="Remove asset">
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
          <div className="creator-actions">
            <button className="primary-action" type="button" onClick={save}>
              <Save size={17} />
              Save Portfolio
            </button>
            <button className="primary-action secondary-action" type="button" onClick={applyToDashboard}>
              <WandSparkles size={17} />
              Apply to Dashboard
            </button>
          </div>
        </article>

        <aside className="side-stack">
          <article className="panel">
            <header className="panel-header">
              <div>
                <span className="eyebrow">Allocation</span>
                <h2>Tax Buckets</h2>
              </div>
            </header>
            <DonutChart
              center={money(summary.totalValue)}
              subcenter="Total"
              segments={taxBuckets.map((bucket, index) => ({
                label: bucket,
                value:
                  assets
                    .filter((asset) => asset.taxBucket === bucket)
                    .reduce((sum, asset) => sum + Number(asset.amount || 0), 0) || 1,
                color: ["#14d9a5", "#8e7cff", "#ffb84d", "#66c7f4"][index],
              }))}
            />
          </article>
          <article className="panel dark-card">
            <header className="panel-header">
              <div>
                <span className="eyebrow">Risk mix</span>
                <h2>Allocation by Risk</h2>
              </div>
            </header>
            <VerticalBars
              bars={riskLevels.map((risk, index) => ({
                label: risk,
                value:
                  assets
                    .filter((asset) => asset.risk === risk)
                    .reduce((sum, asset) => sum + Number(asset.amount || 0), 0) || 1,
                color: ["#14d9a5", "#ffb84d", "#ff5d7d"][index],
              }))}
            />
          </article>
        </aside>
      </section>
    </div>
  );
}
