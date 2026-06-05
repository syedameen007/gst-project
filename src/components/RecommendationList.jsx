import { CheckCircle2 } from "lucide-react";
import { recommendations } from "../lib/taxEngine";

export default function RecommendationList({ model, limit }) {
  const items = recommendations(model).slice(0, limit);

  return (
    <div className="recommendation-list">
      {items.map((item) => (
        <article className="recommendation-row" key={item.title}>
          <div className={`status-dot tone-${item.tone}`}>
            <CheckCircle2 size={16} />
          </div>
          <div>
            <header>
              <h3>{item.title}</h3>
              <span className={`tag tone-${item.tone}`}>{item.tag}</span>
            </header>
            <p>{item.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
