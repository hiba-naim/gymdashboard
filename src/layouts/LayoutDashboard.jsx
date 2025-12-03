import { Link, useLocation } from 'react-router-dom';

export default function LayoutDashboard({ header, overview, filters, stats, chart, table }) {
  const location = useLocation();
  
  return (
    <div className="app">
      <aside className="sidebar card">
        <div className="brand">
          <div className="brand-mark">🏋️</div>
          <div><span className="brand-top">Gym Manager</span></div>
        </div>
        <nav className="nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <span>📊</span> Dashboard
          </Link>
          <Link to="/members" className={`nav-link ${location.pathname === '/members' ? 'active' : ''}`}>
            <span>🧍</span> Members
          </Link>
          <Link to="/trainers" className={`nav-link ${location.pathname === '/trainers' ? 'active' : ''}`}>
            <span>💪</span> Trainers
          </Link>
          <Link to="/drinks" className={`nav-link ${location.pathname === '/drinks' ? 'active' : ''}`}>
            <span>🥗</span> Drinks
          </Link>
          <Link to="/classes" className={`nav-link ${location.pathname === '/classes' ? 'active' : ''}`}>
            <span>🧘</span> Classes
          </Link>
        </nav>
      </aside>

      {/* Main (verbatim Phase-0 wrappers) */}
      <main className="main">
        {/* Topbar (title left only) */}
        <header className="topbar">
          <div className="topbar-left">{header}</div>
        </header>

          {/* Overview row (KPIs) */}
          {overview ? <section className="overview-row">{overview}</section> : null}

        {/* Use the same grid feel; Phase-0 used `.row.three` */}
        {stats ? (
          <section className="row three">
            <article className="card pill" style={{ gridColumn: "span 1" }}>{stats}</article>
            <article className="card pill" style={{ gridColumn: "span 2" }}>{chart}</article>
          </section>
        ) : (
          // Only render the full-width chart row when a chart is provided.
          chart ? (
            <section className="row three">
              <article className="card pill" style={{ gridColumn: "1 / -1" }}>{chart}</article>
            </section>
          ) : null
        )}

        {table ? (
          <section className="card" style={{ overflowX: "auto" }}>
            <h3>All Members</h3>
            {table}
          </section>
        ) : null}
      </main>
    </div>
  );
}
