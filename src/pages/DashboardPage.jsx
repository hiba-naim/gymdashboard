import LayoutDashboard from "../layouts/LayoutDashboard.jsx";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import FilterBar from "../FilterBar.jsx";
import DataTable from "../DataTable.jsx";
import StatsPanel from "../StatsPanel.jsx";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const MAX_ROWS_PER_DATASET = 5000;

const DATASETS = {
  gym: {
    name: "Gym Membership Dataset",
    url: "/gym_membership.csv",
    numericFields: ["visit_per_week", "days_per_week", "avg_time_in_gym"],
    filterFields: ["gender", "abonement_type", "abonoment_type"],
  },
  health: {
    name: "FitLife Health & Fitness Dataset",
    url: "/health_fitness_dataset.csv",
    numericFields: ["daily_steps", "calories_burned", "hours_sleep", "avg_heart_rate", "bmi"],
    filterFields: ["gender", "activity_type"],
  },
};

export default function DashboardPage() {
  const [datasetKey, setDatasetKey] = useState("gym");
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [availableNumericFields, setAvailableNumericFields] = useState([]);
  const [availableFilterFields, setAvailableFilterFields] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedField, setSelectedField] = useState("");

  const activeSet = DATASETS[datasetKey];

 
  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");
      setRawData([]);
      setAvailableNumericFields([]);
      setAvailableFilterFields([]);
      setFilters({});
      setSelectedField("");

      const timeoutId = setTimeout(() => {
        if (!aborted) controller.abort("timeout");
      }, 15000);

      try {
        const res = await fetch(activeSet.url, { cache: "no-store", signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${activeSet.url}`);

        const csvText = await res.text();

        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
          transform: (v) => (typeof v === "string" ? v.trim() : v),
        });

        let rows = Array.isArray(parsed.data) ? parsed.data : [];
          if (!rows.length) throw new Error(`CSV parsed but 0 rows from ${activeSet.url}`);


        if (rows.length > MAX_ROWS_PER_DATASET) rows = rows.slice(0, MAX_ROWS_PER_DATASET);

        const headers = Object.keys(rows[0] || {});
        const headerSet = new Set(headers);
        const numericAvail = activeSet.numericFields.filter((f) => headerSet.has(f));
        const filterAvail = activeSet.filterFields.filter((f) => headerSet.has(f));

        setRawData(rows);
        setAvailableNumericFields(numericAvail);
        setAvailableFilterFields(filterAvail);
        if (numericAvail.length) setSelectedField(numericAvail[0]);
      } catch (e) {
        if (e.name !== "AbortError") setError(String(e.message || e));
      } finally {
        if (!aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      aborted = true;
      controller.abort("unmount/change");
    };
  }, [datasetKey, activeSet.url]);


  const filteredData = useMemo(() => {
    if (!rawData.length) return [];
    const keys = Object.keys(filters).filter((k) => filters[k] !== "" && filters[k] != null);
    if (!keys.length) return rawData;
    return rawData.filter((row) =>
      keys.every((k) => String(row?.[k]) === String(filters[k]))
    );
  }, [rawData, filters]);

  // KPI calculations (presentation only) - keep hooks stable by declaring them
  // before any early returns so hook order never changes between renders.
  const totalMembers = rawData.length;

  const activeMemberships = useMemo(() => {
    if (!rawData || !rawData.length) return 0;
    let count = 0;
    for (const r of rawData) {
      if (!r) continue;
      const abon = (r.abonement_type || r.abonoment_type || r.membership_type || '').toString().toLowerCase();
      const status = (r.status || r.membership_status || '').toString().toLowerCase();
      if (status.includes('active') || abon.includes('active') || abon.includes('premium') || abon.includes('standard')) {
        if (!/cancel|expire|expired|none|n\/a/.test(abon) && !/cancel|expire|expired/.test(status)) count++;
      }
    }
    return count;
  }, [rawData]);

  const avgVisits = useMemo(() => {
    const field = availableNumericFields.find((f) => /visit/.test(f)) || availableNumericFields[0];
    if (!field) return '-';
    const vals = rawData.map(r => Number(r?.[field])).filter(Number.isFinite);
    if (!vals.length) return '-';
    const sum = vals.reduce((s,v)=>s+v,0);
    return (sum / vals.length).toFixed(1);
  }, [rawData, availableNumericFields]);

  const avgTime = useMemo(() => {
    const field = availableNumericFields.find((f) => /time|min/.test(f)) || 'avg_time_in_gym';
    if (!field) return '-';
    const vals = rawData.map(r => Number(r?.[field])).filter(Number.isFinite);
    if (!vals.length) return '-';
    const sum = vals.reduce((s,v)=>s+v,0);
    return Math.round(sum / vals.length);
  }, [rawData, availableNumericFields]);

  const premiumVsStandard = useMemo(() => {
    if (!rawData.length) return { premium: 0, standard: 0 };
    const field = rawData[0].abonement_type ? 'abonement_type' : (rawData[0].abonoment_type ? 'abonoment_type' : null);
    if (!field) return { premium: 0, standard: 0 };
    let p=0,s=0,other=0;
    for (const r of rawData) {
      const v = (r[field]||'').toString().toLowerCase();
      if (v.includes('premium')) p++; else if (v.includes('standard')) s++; else other++;
    }
    const total = p+s+other || 1;
    return { premium: Math.round((p/total)*100), standard: Math.round((s/total)*100) };
  }, [rawData]);

  if (loading) {
    return (
      <LayoutDashboard
        header={<p className="muted">Loading {activeSet.name}…</p>}
        filters={<p className="muted">…</p>}
        stats={<p className="muted">…</p>}
        chart={<p className="muted">…</p>}
        table={<p className="muted">…</p>}
      />
    );
  }

  const headerContent = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Dashboard</h1>
        <p className="muted" style={{ margin: 0 }}>Gym membership overview</p>
      </div>
    </div>
  );

  function MembershipDonut({ data }) {
    // Use precomputed membership breakdown if available, otherwise compute
    const counts = { premium: 0, standard: 0 };
    const field = data.length && (data[0].abonement_type ? 'abonement_type' : (data[0].abonoment_type ? 'abonoment_type' : null));
    if (field) {
      for (const r of data) {
        const v = (r[field] || '').toString().toLowerCase();
        if (v.includes('premium')) counts.premium++; else if (v.includes('standard')) counts.standard++; else {/*ignore*/}
      }
    }
    const total = counts.premium + counts.standard || 1;
    const pctPremium = Math.round((counts.premium / total) * 100);
    const pctStandard = Math.round((counts.standard / total) * 100);
    const COLORS = ['#8b5cf6', '#3b82f6'];

    return (
      <div className="chart-card membership-card">
        <div className="chart-card-inner">
          <h3 className="chart-card-title">Membership Type</h3>

          <div className="membership-inner">
            <div className="membership-donut" aria-hidden>
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie data={[{ name: 'Premium', value: counts.premium }, { name: 'Standard', value: counts.standard }]} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                    <Cell fill={COLORS[0]} />
                    <Cell fill={COLORS[1]} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="membership-legend">
              <div className="legend-row">
                <span className="legend-dot" style={{ background: COLORS[0] }} />
                <span className="legend-label">Premium</span>
                <span className="legend-value">{pctPremium} %</span>
              </div>
              <div className="legend-row">
                <span className="legend-dot" style={{ background: COLORS[1] }} />
                <span className="legend-label">Standard</span>
                <span className="legend-value">{pctStandard} %</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // KPI cards inline (compact SaaS style)
  const kpiItems = [
    { key: 'total', label: 'Total Members', value: totalMembers, sub: '+8% vs last month' },
    { key: 'premium', label: 'Premium', value: `${premiumVsStandard.premium ?? 0}%`, sub: 'Premium vs Standard' },
    { key: 'visits', label: 'Avg Visits / Week', value: avgVisits ?? '-', sub: 'per member' },
    { key: 'time', label: 'Avg Time in gym', value: avgTime !== '-' ? `${avgTime} min` : '-', sub: 'per visit' },
  ];

  function VisitsChart({ data, field }) {
    // aggregate counts by field (visit_per_week)
    const counts = {};
    for (const r of data) {
      const v = Number(r?.[field]);
      if (Number.isFinite(v)) {
        counts[v] = (counts[v] || 0) + 1;
      }
    }
    // ensure x-axis values 1..5 present
    const chartData = [1,2,3,4,5].map((n) => ({ name: String(n), count: counts[n] || 0 }));

    return (
      <div style={{ width: '100%' }}>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" tick={{ fill: '#9aa3b3', fontSize: 13 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#9aa3b3', fontSize: 13 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  const overview = (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 12, alignItems: 'stretch' }}>
        {kpiItems.map((it) => (
          <div key={it.key} style={{ minWidth: 240, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px', boxShadow: '0 6px 18px rgba(3,6,12,0.28)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', minHeight: 110 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#cfd9e8' }}>{it.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginTop: 6 }}>{it.value}</div>
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>{it.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginTop: 14, alignItems: 'stretch' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 14, boxShadow: '0 6px 18px rgba(3,6,12,0.28)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 320 }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: 20, color: '#e6eef7' }}>Membership Type</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
            <div style={{ width: 200, height: 200, flex: '0 0 200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: 'Premium', value: (rawData || []).filter(r => ((r.abonement_type||r.abonoment_type||'').toString().toLowerCase().includes('premium')) ).length }, { name: 'Standard', value: (rawData || []).filter(r => ((r.abonement_type||r.abonoment_type||'').toString().toLowerCase().includes('standard')) ).length }]} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#3b82f6" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, paddingRight: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 6, background: '#8b5cf6', display: 'inline-block', marginRight: 12 }} />
                  <span style={{ color: '#dfe7f5', fontWeight: 600 }}>Premium</span>
                </div>
                <div style={{ color: '#c9d3df', fontWeight: 600 }}>{premiumVsStandard.premium ?? 0} %</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 6, background: '#3b82f6', display: 'inline-block', marginRight: 12 }} />
                  <span style={{ color: '#dfe7f5', fontWeight: 600 }}>Standard</span>
                </div>
                <div style={{ color: '#c9d3df', fontWeight: 600 }}>{premiumVsStandard.standard ?? 0} %</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 14, boxShadow: '0 6px 18px rgba(3,6,12,0.28)', display: 'flex', flexDirection: 'column', minHeight: 320 }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: 20, color: '#e6eef7' }}>Visits per week</h3>
          <div style={{ flex: 1 }}>
            <div style={{ width: '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(() => { const counts={}; for (const r of rawData){ const v = Number(r?.[availableNumericFields.find(f => /visit/.test(f)) || 'visit_per_week']); if (Number.isFinite(v)) counts[v]=(counts[v]||0)+1;} return [1,2,3,4,5].map(n=>({name:String(n),count:counts[n]||0})); })()} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#9aa3b3', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#9aa3b3', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <LayoutDashboard
      header={headerContent}
      overview={overview}
      filters={
        <FilterBar
          data={rawData}
          filters={filters}
          setFilters={setFilters}
          selectedField={selectedField}
          setSelectedField={setSelectedField}
          numericFields={availableNumericFields}
          filterFields={availableFilterFields}
        />
      }
      stats={null}
      chart={null}
      table={<DataTable data={filteredData} />}
    />
  );
}