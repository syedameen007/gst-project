import { portfolioAllocation, money } from "../lib/taxEngine";
import { DonutChart } from "./Charts";

export default function PortfolioAllocation({ model }) {
  const rows = portfolioAllocation(model);
  const total = rows.reduce((sum, row) => sum + row.amount, 0) || 1;

  return (
    <div className="allocation-grid">
      <DonutChart
        center={money(model.currentPortfolio)}
        subcenter="Portfolio"
        segments={rows.map((row) => ({
          label: row.tag,
          value: Math.max(row.amount, total * 0.08),
          color: row.color,
        }))}
      />
      <div className="allocation-list">
        {rows.map((row) => (
          <article className="allocation-row" key={row.name}>
            <div>
              <strong>{row.name}</strong>
              <span>{row.tag}</span>
            </div>
            <div className="allocation-value">
              <strong>{money(row.amount)}</strong>
              <small>{Math.round((row.amount / total) * 100)}%</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
