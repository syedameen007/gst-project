import { Bell, Plus } from "lucide-react";
import { useFinance } from "../lib/financeContext";

export default function PageHeader({ eyebrow, title, subtitle, action }) {
  const { regime, setRegime, syncStatus } = useFinance();

  return (
    <section className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-actions">
        <div className="segmented" role="group" aria-label="Current tax regime">
          <button
            className={regime === "old" ? "active" : ""}
            type="button"
            onClick={() => setRegime("old")}
          >
            Old
          </button>
          <button
            className={regime === "new" ? "active" : ""}
            type="button"
            onClick={() => setRegime("new")}
          >
            New
          </button>
        </div>
        <span className={`sync-pill status-${syncStatus}`}>
          {syncStatus === "mongo" ? "MongoDB" : syncStatus === "saving" ? "Saving" : "Local"}
        </span>
        <button className="icon-pill" type="button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        {action || (
          <button className="primary-action" type="button">
            Add New
            <Plus size={17} />
          </button>
        )}
      </div>
    </section>
  );
}
