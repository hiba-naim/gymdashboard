import { useLocation, useNavigate, useParams } from "react-router-dom";
import LayoutMember from "../layouts/LayoutMember";
import "../styles/member_dashboard.css";
import { useEffect, useState } from "react";
import Papa from "papaparse";

export default function MemberPage() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [mergedRow, setMergedRow] = useState(state?.row || null);
  const [loading, setLoading] = useState(!state?.row);

  useEffect(() => {
    // If state.row exists and looks complete, still attempt to fetch health data and merge.
    let aborted = false;
    async function loadAndMerge() {
      setLoading(true);
      try {
        const [gymRes, healthRes] = await Promise.all([
          fetch('/gym_membership.csv'),
          fetch('/health_fitness_dataset.csv')
        ]);
        const [gymText, healthText] = await Promise.all([gymRes.text(), healthRes.text()]);

        const gymParsed = Papa.parse(gymText, { header: true, skipEmptyLines: true }).data || [];
        const healthParsed = Papa.parse(healthText, { header: true, skipEmptyLines: true }).data || [];

        const gymRow = state?.row || gymParsed.find(r => String(r.id) === String(id) || String(r.ID) === String(id));
        const healthRow = healthParsed.find(r => String(r.id) === String(id) || String(r.ID) === String(id));

        // Merge: prefer gymRow's keys; if healthRow has keys that collide, keep gym and add health_<key>
        const merged = {};
        if (gymRow) Object.assign(merged, gymRow);
        if (healthRow) {
          Object.keys(healthRow).forEach((k) => {
            if (merged[k] == null || merged[k] === '') {
              merged[k] = healthRow[k];
            } else if (String(merged[k]) !== String(healthRow[k])) {
              // avoid overwriting gym values - store health under health_<key>
              const hk = `health_${k}`;
              merged[hk] = healthRow[k];
            }
          });
        }

        if (!aborted) setMergedRow(merged);
      } catch (e) {
        console.error('Error loading member data', e);
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    loadAndMerge();
    return () => { aborted = true; };
  }, [id, state]);

  const row = mergedRow || {};
  const v = (k, d = "–") => (row?.[k] ?? row?.[k.toLowerCase()] ?? d);

  const title = id ? `Member ${id}` : (row?.name || 'Member Dashboard');
  // small helper to render yes/no pills
  const renderBadge = (val) => {
    const s = String(val ?? '').toLowerCase();
    const yes = ['yes', 'true', '1', 'y', 'available', 'has'].some((k) => s.includes(k));
    const label = yes ? 'Yes' : 'No';
    const style = {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: 9999,
      fontSize: 12,
      backgroundColor: yes ? '#0ea5a4' : '#ef4444',
      color: '#fff',
    };
    return <span style={style}>{label}</span>;
  };

  const lessons = (v('fav_group_lesson', '') || '')
    .toString()
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter((x) => x && x !== '0' && x !== '00000000');

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const heightCm = Number(v('height_cm') || v('Height') || 0);
  const weightKg = Number(v('weight_kg') || v('Weight') || 0);
  const bmi = (heightCm > 0 && weightKg > 0) ? (weightKg / Math.pow(heightCm/100, 2)) : null;
  const bmiCategory = bmi ? (bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : 'Overweight') : null;

  const hasPt = Boolean(row?.name_personal_trainer && String(row.name_personal_trainer).toLowerCase() !== 'no pt');
  const hasGroupLessons = lessons.length > 0;

  const content = (
    <div className="max-w-6xl mx-auto py-6 px-4 grid gap-6 lg:grid-cols-[2fr,1fr]">

      {/* LEFT column */}
      <div className="space-y-6">
        {/* Row 1: three small stat cards */}
        <div className="flex gap-4">
          <div className="card p-4 flex-1">
            <div className="text-sm text-muted">Visits per Week</div>
            <div className="text-2xl font-semibold mt-2">{v('visit_per_week', '–')}</div>
          </div>
          <div className="card p-4 flex-1">
            <div className="text-sm text-muted">Avg Session Time</div>
            <div className="text-2xl font-semibold mt-2">{v('avg_time_in_gym') || v('avg_time_check_in') || '–'}</div>
          </div>
          <div className="card p-4 flex-1">
            <div className="text-sm text-muted">Workout Intensity</div>
            <div className="mt-2">{(() => {
              const intensity = (v('intensity') || v('Intensity') || '').toString();
              const color = intensity.toLowerCase() === 'high' ? '#ef4444' : intensity.toLowerCase() === 'medium' ? '#f59e0b' : '#10b981';
              return <span style={{ padding: '6px 10px', borderRadius: 9999, background: color, color: '#fff' }}>{intensity || '–'}</span>;
            })()}</div>
          </div>
        </div>

        {/* Row 2: Activity Growth placeholder */}
        <div className="card p-4">
          <h3 className="section-title">Activity Growth</h3>
          <div style={{ height: 260 }} className="mt-3" />
        </div>

        {/* Row 3: Services | Weekly Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-4">
            <h3 className="section-title">Services</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              <div>
                <div className="text-sm text-muted">Drink Abonnement</div>
                <div className="mt-1">{renderBadge(v('drink_abonnement') || v('drink') || 'No')}</div>
              </div>
              <div>
                <div className="text-sm text-muted">Personal Training</div>
                <div className="mt-1">{renderBadge(hasPt ? 'Yes' : 'No')}</div>
              </div>
              <div>
                <div className="text-sm text-muted">Sauna Access</div>
                <div className="mt-1">{renderBadge(v('sauna_access') || v('has_sauna') || 'No')}</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="section-title">Weekly Schedule</h3>
            <div className="grid grid-cols-7 gap-2 mt-3">
              {days.map((d) => {
                const key = `schedule_${d.toLowerCase()}`;
                const val = v(key, '0');
                const ok = ['1','yes','true','y'].includes(String(val).toLowerCase());
                return (
                  <div key={d} className="text-center" style={{ padding: 8, borderRadius: 8, background: '#071025' }}>
                    <div className="text-xs opacity-80">{d}</div>
                    <div className="mt-2 text-lg">{ok ? '✓' : '✕'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 4: Favorite Group Lessons */}
        <div className="card p-4">
          <h3 className="section-title">Favorite Group Lessons</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {lessons.length > 0 ? lessons.map((l, i) => (
              <div key={i} className="px-3 py-1 rounded-full text-sm" style={{ background: '#0ea5a4', color: '#fff' }}>{l}</div>
            )) : <div className="text-muted">No favorite lessons listed</div>}
          </div>
        </div>
      </div>

      {/* RIGHT column (dark sidebar) */}
      <aside className="card p-4 bg-slate-900/80 border-slate-700 text-white">
        <div className="space-y-6">
          <div>
            <h4 className="section-title">BMI / Body Stats</h4>
            <div className="mt-2 text-sm">
              <div>Height: {heightCm ? `${heightCm} cm` : '–'}</div>
              <div>Weight: {weightKg ? `${weightKg} kg` : '–'}</div>
              <div className="mt-2">BMI: {bmi ? bmi.toFixed(1) : '–'} {bmiCategory ? <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ background: '#111827', color: '#fff' }}>{bmiCategory}</span> : null}</div>
            </div>
          </div>

          <div>
            <h4 className="section-title">Recovery Overview</h4>
            <div className="mt-2 text-sm">
              <div>Stress Level: {v('stress_level', '–')}</div>
              <div>Hours Sleep: {v('hours_sleep', '–')}</div>
            </div>
          </div>

          <div>
            <h4 className="section-title">Quick Insights</h4>
            <ul className="mt-2 text-sm space-y-1">
              <li>Personal trainer: {hasPt ? 'Yes' : 'No'}</li>
              <li>Group lessons: {hasGroupLessons ? 'Yes' : 'No'}</li>
              <li>Most frequent day: {v('most_frequent_day', 'N/A')}</li>
            </ul>
          </div>
        </div>
      </aside>

    </div>
  );

  return (
    <LayoutMember
      header={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>User Profile</h1>
            <p className="muted">Performance metrics for {row?.name || title}</p>
          </div>
          <button className="btn" onClick={() => navigate(-1)}>← Back</button>
        </div>
      }
      content={content}
    />
  );
}