export default function FilterBar({
  data,
  filters,
  setFilters,
  selectedField,
  setSelectedField,
  numericFields,
  filterFields,
}) {
  const unique = (field) => {
    const vals = new Set();
    data.forEach((row) => {
      const v = row[field];
      if (v !== undefined && v !== null && v !== "") vals.add(String(v));
    });
    return ["All", ...Array.from(vals)];
  };

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
      {filterFields.map((field) => (
        <div key={field}>
          <label style={{ fontSize: 12, color: "#666" }}>{field}</label><br />
          <select
            value={filters[field] || "All"}
            onChange={(e) => setFilters((p) => ({ ...p, [field]: e.target.value }))}
          >
            {unique(field).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      ))}

      <div>
        <label style={{ fontSize: 12, color: "#666" }}>Field for analysis</label><br />
        <select value={selectedField} onChange={(e) => setSelectedField(e.target.value)}>
          {numericFields.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
