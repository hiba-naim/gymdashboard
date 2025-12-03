import { useState, useEffect, useMemo } from 'react';
import DrinkChart from '../DrinkChart';
import Papa from 'papaparse';
import LayoutDashboard from '../layouts/LayoutDashboard';

const DrinksPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state for subscription filter (abonoment_type)
  const [subscriptionFilter, setSubscriptionFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/gym_membership.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data || []);
            setLoading(false);
          },
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(String(err || 'Fetch error'));
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const subscriptionOptions = useMemo(() => {
    const setOpts = new Set();
    data.forEach((r) => {
      const v = r?.abonoment_type ?? r?.abonnement_type ?? r?.abonement_type;
      if (v !== undefined && v !== null && v !== '') setOpts.add(String(v));
    });
    return ['All', ...Array.from(setOpts)];
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data || !data.length) return [];
    if (!subscriptionFilter || subscriptionFilter === 'All') return data;
    return data.filter((r) => String(r?.abonoment_type ?? r?.abonnement_type ?? r?.abonement_type) === String(subscriptionFilter));
  }, [data, subscriptionFilter]);

  if (loading) {
    return <LayoutDashboard header={<div>Loading...</div>} />;
  }

  const subscribersCount = filteredData.filter(member => String(member.drink_abo) === '1').length;
  const totalMembers = filteredData.length || 1; // avoid division by zero
  const subscriptionPercentage = ((subscribersCount / totalMembers) * 100).toFixed(1);

  const header = (
    <div>
      <h1>Drinks Analytics</h1>
      <span className="muted">Analyze drink preferences and subscriptions</span>
    </div>
  );

  // Put the subscribers stat and the subscription-type filter in the `filters` slot
  const filters = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="badge">🥤</div>
        <div>
          <h3 style={{ margin: 0 }}>Drink Subscribers</h3>
          <div className="meta-line">
            <span>{subscribersCount} members</span>
            <span>{subscriptionPercentage}%</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label style={{ fontSize: 12, color: '#666' }}>Show by subscription</label>
        <select value={subscriptionFilter} onChange={(e) => setSubscriptionFilter(e.target.value)}>
          {subscriptionOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const chart = <DrinkChart data={filteredData} />;

  return (
    <LayoutDashboard
      header={header}
      filters={filters}
      stats={null}
      chart={chart}
    />
  );
};

export default DrinksPage;