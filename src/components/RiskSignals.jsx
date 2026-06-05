import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { riskSignals } from "../lib/taxEngine";

const icons = {
  low: CheckCircle2,
  medium: AlertTriangle,
  high: ShieldAlert,
};

export default function RiskSignals({ model }) {
  return (
    <div className="risk-list">
      {riskSignals(model).map((signal) => {
        const Icon = icons[signal.level];
        return (
          <article className={`risk-row level-${signal.level}`} key={signal.title}>
            <Icon size={18} />
            <div>
              <header>
                <strong>{signal.title}</strong>
                <span>{signal.level}</span>
              </header>
              <p>{signal.body}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
