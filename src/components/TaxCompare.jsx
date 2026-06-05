import { money } from "../lib/taxEngine";

export default function TaxCompare({ model }) {
  const max = Math.max(model.taxBeforeTotal, model.taxAfterTotal, 1);
  const before = `${Math.max(5, (model.taxBeforeTotal / max) * 100)}%`;
  const after = `${Math.max(5, (model.taxAfterTotal / max) * 100)}%`;

  return (
    <div className="tax-compare-card">
      <div className="compare-row">
        <div>
          <span>Before optimization</span>
          <strong>{money(model.taxBeforeTotal)}</strong>
        </div>
        <div className="compare-track">
          <span className="before" style={{ width: before }} />
        </div>
      </div>
      <div className="compare-row">
        <div>
          <span>After optimization</span>
          <strong>{money(model.taxAfterTotal)}</strong>
        </div>
        <div className="compare-track">
          <span className="after" style={{ width: after }} />
        </div>
      </div>
      <div className="compare-split">
        <div>
          <span>Old regime</span>
          <strong>{money(model.oldAfter.total)}</strong>
        </div>
        <div>
          <span>New regime</span>
          <strong>{money(model.newTax.total)}</strong>
        </div>
        <div>
          <span>GST after ITC</span>
          <strong>{money(model.gstAfter)}</strong>
        </div>
      </div>
    </div>
  );
}
