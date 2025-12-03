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

  return (
    <LayoutMember
      header={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>{title}</h1>
            <p className="muted">Performance metrics for {row?.name || title}</p>
          </div>
          <button className="btn" onClick={() => navigate(-1)}>← Back</button>
        </div>
      }
      profile={
        <div className="stats-grid">
          <div className="stat-box"><span className="section-title">Age</span><h3>{v("Age")}</h3></div>
          <div className="stat-box"><span className="section-title">Gender</span><h3>{v("gender")}</h3></div>
          <div className="stat-box"><span className="section-title">Height</span><h3>{v("height_cm")}</h3></div>
          <div className="stat-box"><span className="section-title">Weight</span><h3>{v("weight_kg")}</h3></div>
          <div className="stat-box"><span className="section-title">BMI</span><h3>{v("bmi")}</h3></div>
          <div className="stat-box"><span className="section-title">Fitness Level</span><h3>{v("fitness_level")}</h3></div>
        </div>
      }
      health={
        <div className="stats-grid">
          <div className="stat-box"><span className="section-title">Avg Heart Rate</span><h3>{v("avg_heart_rate")}</h3></div>
          <div className="stat-box"><span className="section-title">Stress Level</span><h3>{v("stress_level")}</h3></div>
          <div className="stat-box"><span className="section-title">Sleep Hours</span><h3>{v("hours_sleep")}</h3></div>
        </div>
      }
      lifestyle={
        <div className="stats-grid">
          <div className="stat-box"><span className="section-title">Steps/Day</span><h3>{v("daily_steps")}</h3></div>
          <div className="stat-box"><span className="section-title">Calories Burned</span><h3>{v("calories_burned")}</h3></div>
          <div className="stat-box"><span className="section-title">Hydration (L)</span><h3>{v("hydration_level")}</h3></div>
          <div className="stat-box"><span className="section-title">Activity</span><h3>{v("fav_group_lesson")}</h3></div>
          <div className="stat-box"><span className="section-title">Intensity</span><h3>{v("intensity")}</h3></div>
        </div>
      }
    />
  );
}
