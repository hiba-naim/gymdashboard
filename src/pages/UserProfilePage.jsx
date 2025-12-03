import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/user-profile.css";

// BMI helpers
function getBmiCategory(bmi) {
  if (bmi == null || bmi === '' || Number.isNaN(Number(bmi))) return 'unknown';
  const v = Number(bmi);
  if (v < 18.5) return 'underweight';
  if (v < 25) return 'healthy';
  if (v < 30) return 'overweight';
  return 'obese';
}

function getBmiCategoryLabel(bmi) {
  const cat = getBmiCategory(bmi);
  switch (cat) {
    case 'underweight': return 'Underweight';
    case 'healthy': return 'Healthy';
    case 'overweight': return 'Overweight';
    case 'obese': return 'Obese';
    default: return 'No BMI data';
  }
}

function bmiToPercent(bmi) {
  if (bmi == null || bmi === '' || Number.isNaN(Number(bmi))) return '0%';
  const b = Number(bmi);
  const min = 15;
  const max = 40;
  const clamped = Math.min(max, Math.max(min, b));
  const pct = ((clamped - min) / (max - min)) * 100;
  return `${pct}%`;
}

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allMembers, setAllMembers] = useState([]);
  const [healthMetrics, setHealthMetrics] = useState({
    heightCm: null,
    weightKg: null,
    bmi: null,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/gym_membership.csv");
        const csvText = await res.text();

        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
        });

        const rows = Array.isArray(parsed.data) ? parsed.data : [];
        setAllMembers(rows);

        let targetId = id;

        // If user is not admin and no ID specified
        if (user?.role === "user" && !id) {
          // Use the member_id from the logged-in user's account
          if (user?.member_id) {
            targetId = user.member_id;
          } else {
            // Fallback to first member if no member_id set
            targetId = 1;
          }
        }

        // Find the user by ID
        const member = rows.find((row) => String(row.id) === String(targetId));

        if (!member) {
          setError("User not found");
        } else {
          setUserData(member);
        }

        // fetch health_fitness_dataset.csv and map to healthMetrics
        const healthRes = await fetch('/health_fitness_dataset.csv');
        const healthText = await healthRes.text();

        const lines = healthText.split('\n').filter(l => l.trim().length > 0);
        const headers = lines[0].split(',').map(h => h.trim());
        const healthRows = lines.slice(1).map(line => {
          const cols = line.split(',');
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = (cols[i] || '').trim();
          });
          return obj;
        });

        const healthRow = healthRows.find(
          (r) => String(r.id) === String(targetId) || String(r.id) === String(member?.id)
        );

        if (healthRow) {
          setHealthMetrics({
            heightCm: healthRow.height_cm ? Number(healthRow.height_cm) : null,
            weightKg: healthRow.weight_kg ? Number(healthRow.weight_kg) : null,
            bmi: healthRow.bmi ? Number(healthRow.bmi) : null,
          });
        } else {
          setHealthMetrics({ heightCm: null, weightKg: null, bmi: null });
        }
      } catch (err) {
        setError(String(err.message || err));
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, user?.role, user?.member_id]);

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading-spinner">Loading user data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="user-profile-container">
        <div className="error-message">User data not found</div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 24px 40px" }}>

        {/* Top header: consolidated wide card with left info + right stat tiles */}
        <div style={{ marginBottom: 16 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              {/* Left: title, abonnement badge, gender & age */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>User Profile – ID {userData.id}</h1>
                  {/* abonnement badge */}
                  {(() => {
                    const sub = userData.abonoment_type || userData.abonnement || '';
                    const isPremium = String(sub).toLowerCase() === 'premium';
                    const badgeStyle = {
                      display: 'inline-block',
                      padding: '6px 10px',
                      borderRadius: 9999,
                      fontWeight: 700,
                      fontSize: 13,
                      color: isPremium ? '#071025' : '#e6eef6',
                      background: isPremium ? 'linear-gradient(90deg,#7c3aed,#06b6d4)' : 'rgba(255,255,255,0.02)'
                    };
                    return <div style={badgeStyle}>{sub || 'Standard'}</div>;
                  })()}
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--muted)', background: 'rgba(255,255,255,0.02)', padding: '4px 8px', borderRadius: 6 }}>Gender: <span style={{ fontWeight: 600, marginLeft: 6, color: '#fff' }}>{userData.gender || 'N/A'}</span></div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', background: 'rgba(255,255,255,0.02)', padding: '4px 8px', borderRadius: 6 }}>Age: <span style={{ fontWeight: 600, marginLeft: 6, color: '#fff' }}>{userData.Age || 'N/A'}</span></div>
                </div>
              </div>

              {/* Right: three mini stat tiles */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Visits / Week */}
                <div style={{ minWidth: 140, padding: 10, borderRadius: 8, background: '#071025', boxShadow: '0 1px 0 rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Visits / Week</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>{userData.visit_per_week ? userData.visit_per_week : '–'}</div>
                </div>

                {/* Average Time in Gym */}
                <div style={{ minWidth: 180, padding: 10, borderRadius: 8, background: '#071025', boxShadow: '0 1px 0 rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Average Time in Gym</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>{userData.avg_time_in_gym ? `${userData.avg_time_in_gym} min` : (userData.avg_time_check_in ? `${userData.avg_time_check_in}` : '–')}</div>
                </div>

                {/* Preferred Check-in Time */}
                <div style={{ minWidth: 170, padding: 10, borderRadius: 8, background: '#071025', boxShadow: '0 1px 0 rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Preferred Check-in Time</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6 }}>{userData.avg_time_check_in || userData.pref_checkin_time || '–'}</div>
                </div>

                {user?.role === 'admin' && (
                  <button onClick={() => navigate('/')} className="back-btn" style={{ marginLeft: 6 }}>Back</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main grid: left (2fr) and right (1.1fr) */}
        <div style={{ maxWidth: '1150px', margin: '0 auto' }}>

          {/* LEFT COLUMN - detailed cards */}
          <div>
            {/* Personal Information */}
            <div className="card profile-section" style={{ width: '100%', marginBottom: 16 }}>
              <h2>Personal Information</h2>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>User ID</div>
                      <div style={{ fontSize: 16, fontWeight: 500, marginTop: 6 }}>{userData.id ?? '–'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Gender</div>
                      <div style={{ fontSize: 16, fontWeight: 500, marginTop: 6 }}>{userData.gender || 'N/A'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Age</div>
                      <div style={{ fontSize: 16, fontWeight: 500, marginTop: 6 }}>{userData.Age || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Abonnement Type on its own row as a badge */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Abonnement Type</div>
                    {(() => {
                      const sub = userData.abonoment_type || '';
                      const isPremium = String(sub).toLowerCase() === 'premium';
                      const badgeStyle = {
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: 9999,
                        marginTop: 8,
                        fontWeight: 600,
                        fontSize: 13,
                        color: isPremium ? '#0f172a' : '#e6eef6',
                        background: isPremium ? 'linear-gradient(90deg,#7c3aed,#06b6d4)' : '#1f2937',
                      };
                      return <div style={badgeStyle}>{sub || 'N/A'}</div>;
                    })()}
                  </div>
                </div>
            </div>

            {/* Gym Activity */}
            <div className="card profile-section" style={{ width: '100%', marginBottom: 16 }}>
              <h2>Gym Activity</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginTop: 8 }}>
                  {/* Visits per Week */}
                  <div className="card" style={{ padding: 12, boxShadow: '0 1px 0 rgba(255,255,255,0.02)' }}>
                    <div className="text-sm muted">Visits per Week</div>
                    <div className="text-xl font-semibold mt-2">{userData.visit_per_week ? `${userData.visit_per_week} visits` : '–'}</div>
                    <div className="text-xs muted mt-1">per week</div>
                  </div>

                  {/* Avg Session Time */}
                  <div className="card" style={{ padding: 12, boxShadow: '0 1px 0 rgba(255,255,255,0.02)' }}>
                    <div className="text-sm muted">Average Time in Gym</div>
                    <div className="text-xl font-semibold mt-2">{userData.avg_time_in_gym ? `${userData.avg_time_in_gym} min` : (userData.avg_time_check_in ? `${userData.avg_time_check_in}` : '–')}</div>
                    <div className="text-xs muted mt-1">avg session</div>
                  </div>

                  {/* Check-in Time */}
                  <div className="card" style={{ padding: 12, boxShadow: '0 1px 0 rgba(255,255,255,0.02)' }}>
                    <div className="text-sm muted">Check-in Time</div>
                    <div className="text-xl font-semibold mt-2">{userData.avg_time_check_in || '–'}</div>
                    <div className="text-xs muted mt-1">usually</div>
                  </div>

                  {/* Check-out Time */}
                  <div className="card" style={{ padding: 12, boxShadow: '0 1px 0 rgba(255,255,255,0.02)' }}>
                    <div className="text-sm muted">Check-out Time</div>
                    <div className="text-xl font-semibold mt-2">{userData.avg_time_check_out || '–'}</div>
                    <div className="text-xs muted mt-1">usually</div>
                  </div>
                </div>
            </div>

            {/* Services */}
            <div className="card profile-section" style={{ width: '100%', marginBottom: 16 }}>
              <h2>Services</h2>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Chip: Drink Subscription */}
                  {(() => {
                    const val = userData.drink_abo || userData.drink || false;
                    const yes = Boolean(val) && String(val).toLowerCase() !== 'no' && String(val).toLowerCase() !== '0';
                    const chipStyle = {
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: 9999,
                      background: yes ? 'linear-gradient(90deg,#083344,#0ea5a4)' : '#1f2937',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 13,
                    };
                    return (
                      <div style={chipStyle}>
                        <span style={{ fontSize: 14 }}>{yes ? '✅' : '✕'}</span>
                        <span>Drink Subscription</span>
                        <span style={{ marginLeft: 8, opacity: 0.9, fontWeight: 500 }}>{yes ? 'Yes' : 'No'}</span>
                      </div>
                    );
                  })()}

                  {/* Chip: Personal Training */}
                  {(() => {
                    const val = userData.personal_training || userData.name_personal_trainer;
                    const yes = Boolean(val) && String(val).toLowerCase() !== 'no' && String(val).toLowerCase() !== '';
                    const chipStyle = {
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: 9999,
                      background: yes ? 'linear-gradient(90deg,#065f46,#10b981)' : '#1f2937',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 13,
                    };
                    return (
                      <div style={chipStyle}>
                        <span style={{ fontSize: 14 }}>{yes ? '✓' : '✕'}</span>
                        <span>Personal Training</span>
                        <span style={{ marginLeft: 8, opacity: 0.9, fontWeight: 500 }}>{yes ? 'Yes' : 'No'}</span>
                      </div>
                    );
                  })()}

                  {/* Chip: Sauna Access */}
                  {(() => {
                    const val = userData.uses_sauna || userData.sauna || false;
                    const yes = Boolean(val) && String(val).toLowerCase() !== 'no' && String(val).toLowerCase() !== '0';
                    const chipStyle = {
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: 9999,
                      background: yes ? 'linear-gradient(90deg,#0b5277,#06b6d4)' : '#1f2937',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 13,
                    };
                    return (
                      <div style={chipStyle}>
                        <span style={{ fontSize: 14 }}>{yes ? '✓' : '✕'}</span>
                        <span>Sauna Access</span>
                        <span style={{ marginLeft: 8, opacity: 0.9, fontWeight: 500 }}>{yes ? 'Yes' : 'No'}</span>
                      </div>
                    );
                  })()}
                </div>
            </div>

            {/* Weekly Schedule */}
            <div className="card profile-section" style={{ width: '100%', marginBottom: 16 }}>
              <h2>Weekly Schedule</h2>
                <div style={{ marginTop: 8, overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(100px, 1fr))', gap: 8, minWidth: 700 }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                      const attends = Boolean(userData[day]);
                      const tileStyle = {
                        height: 96,
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: attends ? 'linear-gradient(180deg,#075985,#06b6d4)' : '#0b1220',
                        color: attends ? '#fff' : '#9ca3af',
                      };
                      return (
                        <div key={day} style={tileStyle}>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{attends ? '✓' : '✕'}</div>
                          <div style={{ marginTop: 6, fontSize: 14 }}>{day}</div>
                          {!attends && <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>Off</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
            </div>

            {/* Favorite Group Lessons */}
            {userData.has_fav_group_lesson && (
              <div className="card profile-section" style={{ width: '100%', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ marginBottom: 6 }}>Favorite Group Lessons</h2>
                    <div className="muted" style={{ fontSize: 13 }}>Top classes this member enjoys</div>
                  </div>

                  <div>
                    <button style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'var(--muted)',
                      padding: '6px 10px',
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}>View similar classes</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {[
                    'Group_Lesson_Kickboxen',
                    'Group_Lesson_BodyPump',
                    'Group_Lesson_Zumba',
                    'Group_Lesson_XCore',
                    'Group_Lesson_Running',
                    'Group_Lesson_Yoga',
                    'Group_Lesson_LesMiles',
                    'Group_Lesson_Pilates',
                    'Group_Lesson_HIT',
                    'Group_Lesson_Spinning',
                    'Group_Lesson_BodyBalance',
                  ].map((lesson) => (
                    userData[lesson] && (
                      <div key={lesson} style={{
                        padding: '6px 12px',
                        borderRadius: 9999,
                        background: 'rgba(255,255,255,0.03)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 13,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        {lesson.replace('Group_Lesson_', '')}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Favorite Drinks */}
            {userData.has_fav_drink && (
              <div className="card profile-section" style={{ width: '100%', marginBottom: 16 }}>
                <h2>Favorite Drinks</h2>
                <div className="drinks-list">
                  {[
                    { key: 'fav_drink_berryboost', label: 'Berry Boost' },
                    { key: 'fav_drink_lemon', label: 'Lemon' },
                    { key: 'fav_drink_passion_fruit', label: 'Passion Fruit' },
                    { key: 'fav_drink_coconut_pineapple', label: 'Coconut Pineapple' },
                    { key: 'fav_drink_orange', label: 'Orange' },
                    { key: 'fav_drink_black_currant', label: 'Black Currant' },
                  ].map((drink) => (
                    userData[drink.key] && (
                      <span key={drink.key} className="drink-badge">
                        {drink.label}
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - BMI Insights widget (refactored) */}
          <div>
            <div
              className="card bmi-insights-card"
              style={{
                padding: 16,
                display: 'flex',
                flexDirection: 'row',
                gap: 16,
                minWidth: 340,
                maxWidth: 380,
                alignSelf: 'flex-start',
              }}
            >
              {/* LEFT COLUMN: height + weight tiles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 110 }}>
                <div
                  style={{
                    background: '#020617',
                    borderRadius: 12,
                    padding: '10px 12px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Height</div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>
                    {healthMetrics.heightCm != null ? `${healthMetrics.heightCm} cm` : '--'}
                  </div>
                </div>

                <div
                  style={{
                    background: '#020617',
                    borderRadius: 12,
                    padding: '10px 12px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Weight</div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>
                    {healthMetrics.weightKg != null ? `${healthMetrics.weightKg} kg` : '--'}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: BMI card */}
              <div
                style={{
                  flex: 1,
                  background: '#020617',
                  borderRadius: 12,
                  padding: '10px 14px',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 12, color: '#9ca3af', letterSpacing: 0.5 }}>Body Mass Index (BMI)</div>

                {/* BMI value + status */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>
                    {healthMetrics.bmi != null ? (Number.isFinite(Number(healthMetrics.bmi)) ? Number(healthMetrics.bmi).toFixed(1) : '--') : '--'}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 9999,
                      backgroundColor:
                        healthMetrics.bmi == null
                          ? 'rgba(148, 163, 184, 0.15)'
                          : healthMetrics.bmi < 18.5
                          ? 'rgba(56, 189, 248, 0.2)'
                          : healthMetrics.bmi < 25
                          ? 'rgba(34, 197, 94, 0.2)'
                          : healthMetrics.bmi < 30
                          ? 'rgba(234, 179, 8, 0.25)'
                          : 'rgba(248, 113, 113, 0.25)',
                      color: '#e5e7eb',
                    }}
                  >
                    {healthMetrics.bmi == null
                      ? 'No BMI data'
                      : healthMetrics.bmi < 18.5
                      ? 'Underweight'
                      : healthMetrics.bmi < 25
                      ? 'Healthy'
                      : healthMetrics.bmi < 30
                      ? 'Overweight'
                      : 'Obese'}
                  </div>
                </div>

                {/* BMI scale bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div
                    style={{
                      position: 'relative',
                      height: 10,
                      borderRadius: 9999,
                      background: 'linear-gradient(90deg, #38bdf8 0%, #22c55e 30%, #eab308 65%, #f97373 100%)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Indicator (only if bmi is present) */}
                    {healthMetrics.bmi != null && Number.isFinite(Number(healthMetrics.bmi)) && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -2,
                          width: 2,
                          height: 14,
                          backgroundColor: '#e5e7eb',
                          left: `${Math.min(100, Math.max(0, ((Number(healthMetrics.bmi) - 15) / (40 - 15)) * 100))}%`,
                        }}
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af' }}>
                    <span>Underweight</span>
                    <span>Healthy</span>
                    <span>Overweight</span>
                    <span>Obese</span>
                  </div>
                </div>

                {/* Note about source of BMI */}
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, lineHeight: 1.4 }}>
                  BMI value is read from the dataset (<code>bmi</code> column). It is not
                  recalculated from height/weight.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
