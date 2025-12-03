import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import LayoutDashboard from "../layouts/LayoutDashboard.jsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// --- Helpers (defined once at module top) -------------------------------
const AGE_BUCKETS = [
  { label: '18–25', min: 18, max: 25 },
  { label: '26–35', min: 26, max: 35 },
  { label: '36–45', min: 36, max: 45 },
  { label: '46+', min: 46, max: Infinity },
];

function getAgeSleepDonutData(healthFitnessData) {
  const buckets = AGE_BUCKETS.map((b) => ({ ...b, count: 0, totalHours: 0 }));

  healthFitnessData.forEach((row) => {
    const age = Number(row.Age ?? row.age);
    const hours = Number(row.hours_sleep ?? row.hoursSleep ?? row.Hours_Sleep);
    if (!Number.isFinite(age) || !Number.isFinite(hours)) return;

    const bucket = buckets.find((x) => age >= x.min && age <= x.max);
    if (!bucket) return;

    bucket.count += 1;
    bucket.totalHours += hours;
  });

  return buckets.map((b) => ({ label: b.label, value: b.count, avgSleep: b.count ? b.totalHours / b.count : 0 }));
}

const AGE_SLEEP_COLORS = ["#4F8DFD", "#3B82F6", "#2563EB", "#1D4ED8"];
const RADIAN = Math.PI / 180;

function renderAgeSleepLabel(props) {
  const { cx, cy, midAngle, innerRadius, outerRadius, payload } = props;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const avgSleep = payload && payload.avgSleep;

  if (!Number.isFinite(avgSleep)) return null;

  return (
    <text x={x} y={y} fill="#F9FAFB" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600}>
      {`${avgSleep.toFixed(1)}h`}
    </text>
  );
}

function getGroupLessonEnrollmentData(gymMembershipData) {
  let yes = 0;
  let no = 0;

  gymMembershipData.forEach((row) => {
    const value = row.attend_group_lesson;

    const isYes = value === true || value === 1 || value === "1" || (typeof value === 'string' && value.toLowerCase() === 'yes');

    if (isYes) yes += 1; else no += 1;
  });

  const total = yes + no || 1;
  return [{ label: 'Yes', value: (yes / total) * 100 }, { label: 'No', value: (no / total) * 100 }];
}

function getStressLevelHistogramData(healthFitnessData) {
  const bins = [
    { label: '4.5–4.9', min: 4.5, max: 4.9, count: 0 },
    { label: '5.0–5.2', min: 5.0, max: 5.2, count: 0 },
    { label: '5.3–5.5', min: 5.3, max: 5.5, count: 0 },
    { label: '5.6–5.8', min: 5.6, max: 5.8, count: 0 },
  ];

  healthFitnessData.forEach((row) => {
    const value = Number(row.stress_level);
    if (!Number.isFinite(value)) return;
    const bin = bins.find((b) => value >= b.min && value <= b.max);
    if (bin) bin.count += 1;
  });

  return bins.map(({ label, count }) => ({ label, count }));
}

function getIntensityVsVisitsStackedData(gymMembershipData, healthFitnessData) {
  // Index healthFitnessData by id so we can look up intensity
  const fitnessById = new Map();
  healthFitnessData.forEach((row) => {
    const id = Number(row.id);
    if (Number.isFinite(id)) {
      fitnessById.set(id, row);
    }
  });

  const buckets = {};

  gymMembershipData.forEach((member) => {
    const id = Number(member.id);
    const visits = Number(member.visit_per_week);
    if (!Number.isFinite(id) || !Number.isFinite(visits)) return;

    const fitness = fitnessById.get(id);
    if (!fitness) return;

    const raw = (fitness.intensity ?? '').toString().toLowerCase().trim();
    let key;
    if (raw === 'low') key = 'low';
    else if (raw === 'medium') key = 'medium';
    else if (raw === 'high') key = 'high';
    else return; // ignore unknown values

    if (!buckets[visits]) {
      buckets[visits] = { visits, low: 0, medium: 0, high: 0, total: 0 };
    }

    buckets[visits][key] += 1;
    buckets[visits].total += 1;
  });

  // Convert to percentage per visits bucket
  return Object.values(buckets)
    .map((b) => {
      const total = b.total || 1;
      return {
        visits: b.visits,
        low: (b.low / total) * 100,
        medium: (b.medium / total) * 100,
        high: (b.high / total) * 100,
      };
    })
    .sort((a, b) => a.visits - b.visits);
}

// -------------------------------------------------------------------------

export default function MembersPage() {
  const [healthData, setHealthData] = useState([]);
  const [gymData, setGymData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let aborted = false;

    async function load() {
      try {
        const [hRes, gRes] = await Promise.all([
          fetch('/health_fitness_dataset.csv'),
          fetch('/gym_membership.csv'),
        ]);
        if (!hRes.ok) throw new Error(`HTTP ${hRes.status} fetching health dataset`);
        if (!gRes.ok) throw new Error(`HTTP ${gRes.status} fetching gym dataset`);

        const [hText, gText] = await Promise.all([hRes.text(), gRes.text()]);
        const hParsed = Papa.parse(hText, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
        const gParsed = Papa.parse(gText, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });

        if (aborted) return;
        setHealthData(Array.isArray(hParsed.data) ? hParsed.data : []);
        setGymData(Array.isArray(gParsed.data) ? gParsed.data : []);
      } catch (err) {
        if (!aborted) {
          console.error('Failed to load datasets', err);
          setError(err?.message || String(err));
        }
      }
    }

    load();

    return () => {
      aborted = true;
    };
  }, []);

  // Helper: parse numeric safely
  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  const stressHistogramData = getStressLevelHistogramData(healthData);
  const intensityData = getIntensityVsVisitsStackedData(gymData, healthData);



  // prepare age donut data once
  const ageSleepData = getAgeSleepDonutData(healthData);
  const ageTotalValue = (ageSleepData.reduce((sum, d) => sum + (d.value || 0), 0) || 1);

  // Chart grid markup (reuse app card styles)
  const chartsGrid = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      {/* Age vs Hours Sleep (donut) */}
      <div className="card" style={{ padding: 12 }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Age vs Hours Sleep</h4>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: '0 0 50%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageSleepData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="45%"
                  outerRadius="80%"
                  paddingAngle={0.5}
                  cornerRadius={8}
                  stroke="none"
                  strokeWidth={0}
                  labelLine={false}
                  label={renderAgeSleepLabel}
                >
                  {ageSleepData.map((entry, index) => (
                    <Cell
                      key={entry.label}
                      fill={AGE_SLEEP_COLORS[index % AGE_SLEEP_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(_value, _name, item) => {
                    const d = item && item.payload;
                    return d && d.avgSleep
                      ? [`${d.avgSleep.toFixed(1)} h sleep`, d.label]
                      : [null, d?.label];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

                <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', gap: 8, color: '#e6eefc', fontSize: 16 }}>
                  {ageSleepData.map((item, index) => {
                    const percent = Math.round((item.value / ageTotalValue) * 100);
                    return (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: 12, height: 12, borderRadius: 6, background: AGE_SLEEP_COLORS[index % AGE_SLEEP_COLORS.length], display: 'inline-block', marginRight: 8 }} />
                        <span>{item.label}</span>
                        <span style={{ marginLeft: 16, color: '#c9d3df' }}>{`${percent}%`}</span>
                      </div>
                    );
                  })}
                </div>
        </div>
      </div>

      {/* Group Lesson Attendance */}
      <div className="card" style={{ padding: 12 }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Group Lesson Attendance</h4>
        <div style={{ marginBottom: 8, color: 'var(--muted)' }}>% of members attending group lessons</div>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={getGroupLessonEnrollmentData(gymData)} margin={{ top: 8, right: 12, left: 24, bottom: 8 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" domain={[0,100]} tickFormatter={(v) => `${v}%`} tick={{ fill: '#9aa3b3' }} />
              <YAxis dataKey="label" type="category" tick={{ fill: '#9aa3b3' }} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(0)}%`} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
              <Bar
                dataKey="value"
                fill="#a855f7"
                radius={[4, 4, 4, 4]}
                isAnimationActive={true}
                label={{ position: 'right', formatter: (v) => `${Number(v).toFixed(0)}%` }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stress Level Distribution */}
      <div className="card" style={{ padding: 12 }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Stress Level Distribution</h4>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stressHistogramData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: '#9aa3b3' }} />
              <YAxis tick={{ fill: '#9aa3b3' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intensity vs Visits per Week */}
      <div className="card" style={{ padding: 12 }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Intensity vs Visits per Week</h4>
        <div style={{ marginBottom: 8, color: 'var(--muted)' }}>% of members by intensity level for each visits per week</div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={intensityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="visits" />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value, name) => [`${Number(value).toFixed(0)}%`, name]} labelFormatter={(label) => `Visits per week: ${label}`} />
              <Legend />
              <Bar dataKey="low" name="Low" stackId="intensity" fill="#93c5fd" />
              <Bar dataKey="medium" name="Medium" stackId="intensity" fill="#3b82f6" />
              <Bar dataKey="high" name="High" stackId="intensity" fill="#1d4ed8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <LayoutDashboard
      header={(
        <div>
          <h1>Members Analytics</h1>
          <p className="muted">View member statistics and performance</p>
        </div>
      )}
      filters={null}
      stats={null}
      chart={chartsGrid}
      table={null}
    />
  );
}
