export default function MetricCard({ label, value, meta, tone = "neutral", dark = false }) {
  return (
    <article className={`metric-card tone-${tone} ${dark ? "dark-card" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </article>
  );
}
