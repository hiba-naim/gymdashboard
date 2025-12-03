import React from "react";

function formatNumber(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number" && !Number.isNaN(value)) {
    return new Intl.NumberFormat(undefined).format(value);
  }
  return value;
}

export default function KPICards({ totalMembers, premiumVsStandard = {}, avgVisits, avgTime }) {
  const items = [
    {
      key: "total",
      title: (
        <>
          <div className="kpi-title-line">Total</div>
          <div className="kpi-title-line">Members</div>
        </>
      ),
      value: typeof totalMembers === "number" ? totalMembers : Number(totalMembers) || 0,
      desc: (
        <>
          <span className="kpi-trend positive">+8%</span>
          <span className="kpi-desc-sub">vs last month</span>
        </>
      ),
    },
    {
      key: "premium",
      icon: "⭐",
      title: "Premium",
      value: premiumVsStandard.premium ?? 0,
      desc: <span className="kpi-desc-sub">Premium vs Standard</span>,
    },
    {
      key: "visits",
      icon: "",
      title: "Avg Visits / Week",
      value: avgVisits ?? "-",
      desc: <span className="kpi-desc-sub">per member</span>,
    },
    {
      key: "time",
      icon: "",
      title: "Avg Time in gym",
      value: avgTime !== "-" ? `${avgTime}` : "-",
      desc: <span className="kpi-desc-sub">per visit</span>,
    },
  ];

  const renderValue = (val, key) => {
    if (key === "premium") return `${val}%`;
    if (key === "time") return val === "-" ? "-" : `${val} min`;
    if (key === "visits") return typeof val === "number" ? Number(val).toFixed(1) : val;
    // default: format numbers with thousands separator
    return formatNumber(val);
  };

  return (
    <div className="kpi-compact-grid" role="list" aria-label="KPI cards">
      {items.map((it) => (
        <div className="kpi-card-compact" role="listitem" key={it.key}>
          <div className="kpi-title-row">
            {it.icon ? (
              <span className="kpi-icon-inline" aria-hidden>
                {it.icon}
              </span>
            ) : (
              <span className="kpi-icon-inline empty" aria-hidden />
            )}

            <div className="kpi-title">{it.title}</div>
          </div>

          <div className="kpi-value">{renderValue(it.value, it.key)}</div>

          <div className={`kpi-desc`}>{it.desc}</div>
        </div>
      ))}
    </div>
  );
}
