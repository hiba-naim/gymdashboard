import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function DataChart({ data, selectedField, compact = false }) {
  // Aggregate data by selectedField
  const aggregatedData = selectedField
    ? data.reduce((acc, row) => {
        const value = row[selectedField];
        if (value !== undefined && value !== null) {
          acc[value] = acc[value] ? acc[value] + 1 : 1;
        }
        return acc;
      }, {})
    : {};

  // Convert aggregated data to an array for the chart and sort by count desc
  const chartData = Object.keys(aggregatedData)
    .map((key) => ({ name: key, count: aggregatedData[key] }))
    .sort((a, b) => b.count - a.count);

  if (!selectedField || chartData.length === 0) {
    return <p>No data available for chart for “{selectedField || "(none)"}”.</p>;
  }

  const chart = (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  if (compact) {
    return (
      <div style={{ width: "100%" }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>{selectedField}</h3>
        {chart}
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: 20,
        padding: 12,
        borderRadius: 8,
        border: "1px solid #eee",
        width: "100%",
        overflowX: "auto",
      }}
    >
      <h2 style={{ marginTop: 0 }}>{selectedField} </h2>
      {chart}
    </div>
  );
}