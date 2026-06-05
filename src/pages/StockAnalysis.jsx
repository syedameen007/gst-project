import {
  Activity,
  BrainCircuit,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DonutChart, LineChart, VerticalBars } from "../components/Charts";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import { addStock, deleteStock, fetchStocks } from "../lib/api";
import { useFinance } from "../lib/financeContext";
import { money } from "../lib/taxEngine";

const defaultStock = {
  symbol: "TCS",
  companyName: "Tata Consultancy Services",
  sector: "IT Services",
  quantity: 10,
  averagePrice: 3450,
  currentPrice: 3820,
  return7d: 1.8,
  return21d: 4.6,
  volatilityRange: 3.1,
  volumeRatio: 1.2,
  holdingPeriodMonths: 14,
  taxClass: "Equity",
  notes: "Tax-aware long-term holding review",
};

const quickStocks = [
  {
    symbol: "RELIANCE",
    companyName: "Reliance Industries",
    sector: "Energy",
    averagePrice: 2710,
    currentPrice: 2895,
    return7d: 1.2,
    return21d: 3.8,
    volatilityRange: 2.7,
    volumeRatio: 1.35,
    holdingPeriodMonths: 10,
  },
  {
    symbol: "INFY",
    companyName: "Infosys",
    sector: "IT Services",
    averagePrice: 1460,
    currentPrice: 1588,
    return7d: 2.5,
    return21d: 5.1,
    volatilityRange: 3.4,
    volumeRatio: 1.18,
    holdingPeriodMonths: 16,
  },
  {
    symbol: "HDFCBANK",
    companyName: "HDFC Bank",
    sector: "Banking",
    averagePrice: 1540,
    currentPrice: 1665,
    return7d: 0.9,
    return21d: 2.8,
    volatilityRange: 2.2,
    volumeRatio: 0.98,
    holdingPeriodMonths: 8,
  },
  {
    symbol: "AAPL",
    companyName: "Apple",
    sector: "International",
    averagePrice: 16500,
    currentPrice: 18100,
    return7d: 1.4,
    return21d: 4.2,
    volatilityRange: 3.7,
    volumeRatio: 1.11,
    holdingPeriodMonths: 20,
    taxClass: "International",
  },
];

const taxClasses = ["Equity", "Debt fund", "International", "Other"];
const colors = ["#14d9a5", "#384cff", "#ffb84d", "#ff5d7d", "#8e7cff", "#66c7f4"];

function percent(value) {
  return `${Math.round(Number(value || 0) * 1000) / 10}%`;
}

function inputNumber(value) {
  return Number(value) || 0;
}

function summarize(stocks) {
  return stocks.reduce(
    (summary, stock) => {
      const analysis = stock.analysis || {};
      summary.marketValue += Number(analysis.marketValue || 0);
      summary.investedValue += Number(analysis.investedValue || 0);
      summary.projectedValue += Number(analysis.projectedValue || 0);
      summary.taxWatch += Number(stock.holdingPeriodMonths || 0) < 12 ? 1 : 0;
      return summary;
    },
    { marketValue: 0, investedValue: 0, projectedValue: 0, taxWatch: 0 },
  );
}

function sectorsFor(stocks) {
  const sectorMap = new Map();
  stocks.forEach((stock) => {
    const sector = stock.sector || "General";
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + Number(stock.analysis?.marketValue || 0));
  });
  return Array.from(sectorMap.entries()).map(([label, value], index) => ({
    label,
    value: value || 1,
    color: colors[index % colors.length],
  }));
}

export default function StockAnalysis() {
  const { userId, updateInput } = useFinance();
  const [stocks, setStocks] = useState([]);
  const [form, setForm] = useState(defaultStock);
  const [status, setStatus] = useState("Ready");
  const [saving, setSaving] = useState(false);
  const summary = useMemo(() => summarize(stocks), [stocks]);
  const totalGain = summary.marketValue - summary.investedValue;
  const projectedGain = summary.projectedValue - summary.marketValue;

  useEffect(() => {
    let active = true;
    fetchStocks(userId)
      .then((records) => {
        if (!active) return;
        setStocks(records);
        setStatus(records.length ? "Loaded from MongoDB" : "Add your first stock");
      })
      .catch(() => setStatus("Could not load stock records"));
    return () => {
      active = false;
    };
  }, [userId]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: [
        "quantity",
        "averagePrice",
        "currentPrice",
        "return7d",
        "return21d",
        "volatilityRange",
        "volumeRatio",
        "holdingPeriodMonths",
      ].includes(field)
        ? inputNumber(value)
        : value,
    }));
  }

  function fillPreset(stock) {
    setForm((current) => ({
      ...current,
      ...stock,
      quantity: current.quantity || 10,
      taxClass: stock.taxClass || "Equity",
      notes: `Analyze ${stock.symbol} for tax-aware portfolio decisions`,
    }));
    setStatus(`${stock.symbol} ready for analysis`);
  }

  async function submitStock(event) {
    event.preventDefault();
    if (!form.symbol.trim()) {
      setStatus("Stock symbol is required");
      return;
    }
    setSaving(true);
    setStatus("Saving stock");
    try {
      const saved = await addStock(userId, form);
      setStocks((current) => [saved, ...current]);
      setStatus(`${saved.symbol} saved with ML analysis`);
    } catch {
      setStatus("Could not save stock. Check API and MongoDB.");
    } finally {
      setSaving(false);
    }
  }

  async function removeStock(stockId) {
    try {
      await deleteStock(userId, stockId);
      setStocks((current) => current.filter((stock) => stock._id !== stockId));
      setStatus("Stock removed");
    } catch {
      setStatus("Could not remove stock");
    }
  }

  function applyToPortfolio() {
    updateInput("currentPortfolio", Math.round(summary.marketValue));
    updateInput("costBasis", Math.round(summary.investedValue));
    setStatus("Applied stock values to tax dashboard");
  }

  const leadingStock = stocks[0];
  const trendBase = leadingStock?.currentPrice || form.currentPrice;
  const trendReturn = leadingStock?.analysis?.predictedMonthlyReturn || 0.012;
  const chartValues = [0, 1, 2, 3, 4, 5].map((month) =>
    Math.round(trendBase * Math.pow(1 + trendReturn, month)),
  );
  const baselineValues = [0, 1, 2, 3, 4, 5].map((month) => Math.round(trendBase * (1 + month * 0.005)));

  return (
    <div className="page">
      <PageHeader
        eyebrow="Stocks"
        title="Stock Prediction & Tax Analysis"
        subtitle="Add stock holdings directly, run ML-assisted return analysis, and review capital-gains tax impact before portfolio decisions."
        action={
          <button className="primary-action" type="button" onClick={applyToPortfolio}>
            <Sparkles size={17} />
            Apply Values
          </button>
        }
      />

      <section className="metric-grid">
        <MetricCard label="Stock Market Value" value={money(summary.marketValue)} meta={status} tone="blue" />
        <MetricCard
          label="Unrealized Gain/Loss"
          value={money(totalGain)}
          meta={`${summary.investedValue ? percent(totalGain / summary.investedValue) : "0%"} vs cost`}
          tone={totalGain >= 0 ? "green" : "rose"}
        />
        <MetricCard
          label="ML 1M Projection"
          value={money(summary.projectedValue || summary.marketValue)}
          meta={`${projectedGain >= 0 ? "+" : ""}${money(projectedGain)} projected`}
          tone="amber"
        />
        <MetricCard
          label="Tax Watch"
          value={`${summary.taxWatch}`}
          meta="holdings under 12 months"
          tone={summary.taxWatch ? "rose" : "green"}
        />
      </section>

      <section className="stock-layout">
        <article className="panel stock-form-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Direct entry</span>
              <h2>Add Stock for Prediction</h2>
              <p>Use quick presets or enter any symbol manually.</p>
            </div>
            <TrendingUp size={22} />
          </header>

          <div className="quick-stock-row" aria-label="Quick stock presets">
            {quickStocks.map((stock) => (
              <button key={stock.symbol} type="button" onClick={() => fillPreset(stock)}>
                {stock.symbol}
              </button>
            ))}
          </div>

          <form className="stock-form-grid" onSubmit={submitStock}>
            <label>
              Symbol
              <input value={form.symbol} onChange={(event) => updateField("symbol", event.target.value.toUpperCase())} />
            </label>
            <label>
              Company
              <input value={form.companyName} onChange={(event) => updateField("companyName", event.target.value)} />
            </label>
            <label>
              Sector
              <input value={form.sector} onChange={(event) => updateField("sector", event.target.value)} />
            </label>
            <label>
              Tax class
              <select value={form.taxClass} onChange={(event) => updateField("taxClass", event.target.value)}>
                {taxClasses.map((taxClass) => (
                  <option key={taxClass}>{taxClass}</option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input type="number" min="0" value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} />
            </label>
            <label>
              Avg buy price
              <input type="number" min="0" value={form.averagePrice} onChange={(event) => updateField("averagePrice", event.target.value)} />
            </label>
            <label>
              Current price
              <input type="number" min="0" value={form.currentPrice} onChange={(event) => updateField("currentPrice", event.target.value)} />
            </label>
            <label>
              Holding months
              <input
                type="number"
                min="0"
                value={form.holdingPeriodMonths}
                onChange={(event) => updateField("holdingPeriodMonths", event.target.value)}
              />
            </label>
            <label>
              7D return %
              <input type="number" value={form.return7d} onChange={(event) => updateField("return7d", event.target.value)} />
            </label>
            <label>
              21D return %
              <input type="number" value={form.return21d} onChange={(event) => updateField("return21d", event.target.value)} />
            </label>
            <label>
              Volatility %
              <input
                type="number"
                min="0"
                value={form.volatilityRange}
                onChange={(event) => updateField("volatilityRange", event.target.value)}
              />
            </label>
            <label>
              Volume ratio
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={form.volumeRatio}
                onChange={(event) => updateField("volumeRatio", event.target.value)}
              />
            </label>
            <label className="stock-notes">
              Notes
              <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
            </label>
            <button className="primary-action stock-submit" type="submit" disabled={saving}>
              <Plus size={17} />
              {saving ? "Analyzing" : "Add Stock"}
            </button>
          </form>
        </article>

        <aside className="side-stack">
          <article className="panel dark-card stock-chart-panel">
            <header className="panel-header">
              <div>
                <span className="eyebrow">ML projection</span>
                <h2>{leadingStock?.symbol || form.symbol} 6-Month View</h2>
              </div>
              <BrainCircuit size={21} />
            </header>
            <LineChart
              values={chartValues}
              secondary={baselineValues}
              labels={["Now", "M1", "M2", "M3", "M4", "M5"]}
              color="#14d9a5"
            />
            <p className="stock-disclaimer">Projection is ML-assisted and should be reviewed with risk and tax context.</p>
          </article>
          <article className="panel">
            <header className="panel-header">
              <div>
                <span className="eyebrow">Allocation</span>
                <h2>Sector Exposure</h2>
              </div>
            </header>
            <DonutChart
              center={money(summary.marketValue)}
              subcenter="Stocks"
              segments={sectorsFor(stocks.length ? stocks : [{ sector: form.sector, analysis: { marketValue: form.quantity * form.currentPrice } }])}
            />
          </article>
        </aside>
      </section>

      <section className="stock-results-grid">
        <article className="panel stock-table-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Analysis</span>
              <h2>Saved Stocks</h2>
            </div>
            <Activity size={21} />
          </header>
          <div className="stock-list">
            {stocks.length === 0 ? (
              <div className="empty-state">
                <TrendingUp size={24} />
                <strong>No stock saved yet</strong>
                <span>Add a symbol above to store it in MongoDB and generate analysis.</span>
              </div>
            ) : (
              stocks.map((stock) => (
                <article className="stock-row" key={stock._id}>
                  <div className="stock-symbol-block">
                    <strong>{stock.symbol}</strong>
                    <span>{stock.companyName || stock.sector}</span>
                  </div>
                  <div>
                    <span>Value</span>
                    <strong>{money(stock.analysis?.marketValue)}</strong>
                  </div>
                  <div>
                    <span>Gain/Loss</span>
                    <strong className={stock.analysis?.gainLoss >= 0 ? "positive-text" : "negative-text"}>
                      {money(stock.analysis?.gainLoss)}
                    </strong>
                    <small>{percent(stock.analysis?.gainLossPct)}</small>
                  </div>
                  <div>
                    <span>Predicted price</span>
                    <strong>{money(stock.analysis?.predictedPrice)}</strong>
                    <small>{percent(stock.analysis?.predictedMonthlyReturn)} monthly</small>
                  </div>
                  <div>
                    <span>Confidence</span>
                    <strong>{percent(stock.analysis?.confidence)}</strong>
                    <small>{stock.analysis?.modelName}</small>
                  </div>
                  <button className="icon-pill danger" type="button" onClick={() => removeStock(stock._id)} aria-label={`Remove ${stock.symbol}`}>
                    <Trash2 size={17} />
                  </button>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="panel dark-card">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Capital gains</span>
              <h2>Tax-Aware Signals</h2>
            </div>
            <ShieldCheck size={21} />
          </header>
          <div className="tax-signal-list">
            {(stocks.length ? stocks.slice(0, 5) : [{ symbol: form.symbol, analysis: { taxNote: "Add a holding to review capital-gains treatment." } }]).map(
              (stock) => (
                <article key={stock._id || stock.symbol}>
                  <strong>{stock.symbol}</strong>
                  <span>{stock.analysis?.taxNote}</span>
                </article>
              ),
            )}
          </div>
          <VerticalBars
            bars={[
              { label: "Invested", value: summary.investedValue || form.quantity * form.averagePrice, color: "#8e7cff" },
              { label: "Current", value: summary.marketValue || form.quantity * form.currentPrice, color: "#14d9a5" },
              { label: "Projected", value: summary.projectedValue || form.quantity * form.currentPrice * 1.03, color: "#ffb84d" },
            ]}
          />
        </article>
      </section>
    </div>
  );
}
