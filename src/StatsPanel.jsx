function computeStats(data, field) {
  if (!field || !Array.isArray(data) || data.length === 0) return null;

  const nums = [];
  for (let i = 0; i < data.length; i++) {
    const v = data[i][field];
    if (typeof v === "number" && Number.isFinite(v)) nums.push(v);
  }
  if (nums.length === 0) return null;

  const count = nums.length;
  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < nums.length; i++) {
    const v = nums[i];
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const mean = sum / count;

  let sq = 0;
  for (let i = 0; i < nums.length; i++) {
    const diff = nums[i] - mean;
    sq += diff * diff;
  }
  const variance = sq / count;
  const std = Math.sqrt(variance);

  return { count, mean, min, max, std };
}

export default function StatsPanel({ data, selectedField }) {
  const stats = computeStats(data, selectedField);

  return (
    <div style={{ marginBottom: 20, padding: 12, borderRadius: 8, border: "1px solid #eee" }}>
      <h2 style={{ marginTop: 0 }}>Descriptive Statistics</h2>
      <p style={{ marginTop: 0, color: "#666" }}>
        Field: <strong>{selectedField || "(none)"}</strong> (filtered rows only)
      </p>

      {!stats ? (
        <p>No numeric data available for this field.</p>
      ) : (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Stat label="Count" value={stats.count} />
          <Stat label="Mean" value={stats.mean.toFixed(2)} />
          <Stat label="Min" value={stats.min.toFixed(2)} />
          <Stat label="Max" value={stats.max.toFixed(2)} />
          <Stat label="Std Dev" value={stats.std.toFixed(2)} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 8,
        background: "#fafafa",
        border: "1px solid #eee",
        minWidth: 90,
      }}
    >
      <div style={{ fontSize: 12, textTransform: "uppercase", color: "#888" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
