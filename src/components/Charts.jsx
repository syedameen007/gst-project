import { clamp, money } from "../lib/taxEngine";

export function LineChart({ values, labels, color = "#14d9a5", secondary }) {
  const width = 520;
  const height = 220;
  const max = Math.max(...values, ...(secondary || []), 1);
  const min = Math.min(...values, ...(secondary || []), 0);
  const span = Math.max(max - min, 1);

  function points(series) {
    return series
      .map((value, index) => {
        const x = (index / Math.max(series.length - 1, 1)) * width;
        const y = height - ((value - min) / span) * height;
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <div className="chart-card line-chart-card">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Financial trend chart">
        <defs>
          <linearGradient id="lineGlow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.2, 0.4, 0.6, 0.8].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={height * line}
            y2={height * line}
            className="grid-line"
          />
        ))}
        {secondary && <polyline points={points(secondary)} className="secondary-line" />}
        <polyline points={points(values)} className="main-line" style={{ stroke: color }} />
      </svg>
      <div className="chart-labels">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

export function StackedBars({ groups }) {
  return (
    <div className="stacked-chart">
      {groups.map((group) => {
        const total = group.values.reduce((sum, item) => sum + item.value, 0) || 1;
        return (
          <div className="stacked-bar-group" key={group.label}>
            <div className="stacked-bar">
              {group.values.map((item) => (
                <span
                  key={item.label}
                  style={{
                    height: `${clamp((item.value / total) * 100, 8, 100)}%`,
                    background: item.color,
                  }}
                  title={`${item.label}: ${money(item.value)}`}
                />
              ))}
            </div>
            <small>{group.label}</small>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({ segments, center, subcenter }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let current = 0;
  const gradient = segments
    .map((segment) => {
      const start = (current / total) * 100;
      current += segment.value;
      const end = (current / total) * 100;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="donut-center">
          <strong>{center}</strong>
          <span>{subcenter}</span>
        </div>
      </div>
      <div className="legend">
        {segments.map((segment) => (
          <span key={segment.label}>
            <i style={{ background: segment.color }} />
            {segment.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function VerticalBars({ bars }) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <div className="vertical-bars">
      {bars.map((bar) => (
        <div className="vertical-bar" key={bar.label}>
          <span style={{ height: `${clamp((bar.value / max) * 100, 6, 100)}%`, background: bar.color }} />
          <small>{bar.label}</small>
        </div>
      ))}
    </div>
  );
}
