import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import LayoutDashboard from '../layouts/LayoutDashboard';
import ClassesChart from '../ClassesChart';

const ClassesPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membershipFilter, setMembershipFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/gym_membership.csv');
        const text = await res.text();
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            setData(results.data);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LayoutDashboard header={<div>Loading...</div>} />;

  const membershipTypes = Array.from(new Set(data.map(d => d.abonoment_type).filter(Boolean)));

  const filteredData = membershipFilter === 'All' ? data : data.filter(d => d.abonoment_type === membershipFilter);

  const attendeesCount = filteredData.filter(m => m.has_fav_group_lesson === '1' || m.has_fav_group_lesson === 'True' || m.has_fav_group_lesson === 'Yes').length;
  const total = filteredData.length || 1;
  const pct = ((attendeesCount / total) * 100).toFixed(1);

  const header = (
    <div>
      <h1>Classes Analytics</h1>
      <span className="muted">Explore favorite group classes and filter by membership</span>
    </div>
  );

  const stats = (
    <div className="row">
      <div className="badge">🧘</div>
      <div>
        <h3>Members with favorite class</h3>
        <div className="meta-line">
          <span>{attendeesCount} members</span>
          <span>{pct}%</span>
        </div>
      </div>
    </div>
  );

  // chart area will include a simple select to filter membership
  const chart = (
    <div className="row" style={{ gap: 20 }}>
      <div style={{ minWidth: 220 }} className="card">
        <div style={{ padding: 12 }}>
          <label style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>Filter by membership</label>
          <select value={membershipFilter} onChange={e => setMembershipFilter(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 8 }}>
            <option value="All">All</option>
            {membershipTypes.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <ClassesChart data={filteredData} />
      </div>
    </div>
  );

  return (
    <LayoutDashboard header={header} stats={stats} chart={chart} />
  );
};

export default ClassesPage;
