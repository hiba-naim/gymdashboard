import React from 'react';
import "../styles/checkin_ring.css";

function parseTimeToMinutes(t) {
  if (!t) return null;
  const m = String(t).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  return h * 60 + mm;
}

function getSessionLabelFromTime(t) {
  const mins = parseTimeToMinutes(t);
  if (mins == null) return 'Session';
  const h = Math.floor(mins / 60);
  if (h < 8) return 'Early Session';
  if (h < 12) return 'Morning Session';
  if (h < 16) return 'Afternoon Session';
  if (h < 20) return 'Evening Session';
  return 'Night Session';
}

export default function CheckInOutRing({ checkInTime, checkOutTime, sessionLabel }) {
  const inMins = parseTimeToMinutes(checkInTime);
  const outMins = parseTimeToMinutes(checkOutTime);
  const duration = (inMins != null && outMins != null && outMins > inMins)
    ? (outMins - inMins)
    : null;

  // Cap at 3 hours for ring progress visual
  const maxDuration = 180; // minutes
  const pct = duration != null ? Math.max(0, Math.min(100, Math.round((duration / maxDuration) * 100))) : 0;

  const size = 360; // enlarged SVG viewport
  const stroke = 20; // thicker ring (~+20%)
  const r = (size / 2) - (stroke / 2);
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);

  const label = sessionLabel || getSessionLabelFromTime(checkInTime);

  return (
    <div
      className="card"
      style={{
        borderRadius: 24,
        padding: 20,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))',
        boxShadow: '0 10px 24px rgba(3, 6, 12, 0.45)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>Check-in</div>
        <div style={{ color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>Check-out</div>
      </div>

      <div style={{ display: 'grid', placeItems: 'center' }}>
        <div className="circle-container">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>

            {/* background circle */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0f172a" strokeWidth={stroke} />

            {/* progress ring */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 600ms ease' }}
            />
          </svg>

          {/* overlay text centered inside the circle, above the arc */}
          <div className="circle-inner">
            <div className="time-range" style={{ lineHeight: 1, textAlign: 'center', maxWidth: '70%', margin: '0 auto' }}>
              <span>{checkInTime || '--'}</span>
              <span style={{ opacity: 0.85 }}>→</span>
              <span>{checkOutTime || '--'}</span>
            </div>
            <div className="session-label" style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{label}</div>
          </div>
        </div>
      </div>

      {/* bottom icons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {/* clock icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="#93c5fd" strokeWidth="1.6" />
          <path d="M12 7v5l3 2" stroke="#93c5fd" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {/* finish flag icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 20V5m0 0h9a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H6m0-4v4" stroke="#a78bfa" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
