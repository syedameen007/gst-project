import { ArrowUpRight, Menu, MoreVertical } from "lucide-react";
import { money } from "../lib/taxEngine";
import { DonutChart, LineChart } from "./Charts";

export default function MobilePreview({ model }) {
  return (
    <div className="phone-shell">
      <div className="phone-status">
        <strong>9:41</strong>
        <span>Fiscal Lens</span>
      </div>
      <div className="phone-actions">
        <button type="button" aria-label="Menu">
          <Menu size={18} />
        </button>
        <button type="button" aria-label="More">
          <MoreVertical size={18} />
        </button>
      </div>
      <section className="phone-card hero">
        <span>Portfolio Value</span>
        <strong>{money(model.currentPortfolio)}</strong>
        <small>
          <ArrowUpRight size={13} />
          {Math.round(model.portfolioReturn * 1000) / 10}% tax-aware return
        </small>
        <LineChart
          color="#384cff"
          labels={["Apr", "Jun", "Aug", "Oct", "Dec"]}
          values={[18, 28, 45, 34, 65, 58, 84]}
        />
      </section>
      <section className="phone-card">
        <header>
          <h3>Allocation</h3>
          <span>{money(model.totalSaved)} saved</span>
        </header>
        <DonutChart
          center={money(model.allocate80c + model.allocateNps)}
          subcenter="Tax-aware"
          segments={[
            { label: "80C", value: Math.max(model.allocate80c, 1), color: "#14d9a5" },
            { label: "NPS", value: Math.max(model.allocateNps, 1), color: "#8e7cff" },
            { label: "ITC", value: Math.max(model.itcGap, 1), color: "#ffb84d" },
          ]}
        />
      </section>
    </div>
  );
}
