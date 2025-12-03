
import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import LayoutDashboard from '../layouts/LayoutDashboard.jsx';
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar as ReBar,
  XAxis as ReXAxis,
  YAxis as ReYAxis,
  CartesianGrid as ReCartesianGrid,
  Tooltip as ReTooltip,
  Legend as ReLegend,
} from 'recharts';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// ---------- Helper: PT usage by visits per week ----------
function getPtUsageByVisitsData(gymMembershipData) {
  const buckets = {};

  gymMembershipData.forEach((row) => {
    const visits = Number(row.visit_per_week);
    if (!Number.isFinite(visits) || visits <= 0) return;

    const rawTrainer = (row.name_personal_trainer ?? '')
      .toString()
      .toLowerCase()
      .trim();
    const hasPt = rawTrainer !== '' && rawTrainer !== 'no pt';

    if (!buckets[visits]) {
      buckets[visits] = { visits, hasPt: 0, noPt: 0, total: 0 };
    }

    if (hasPt) {
      buckets[visits].hasPt += 1;
    } else {
      buckets[visits].noPt += 1;
    }
    buckets[visits].total += 1;
  });

  return Object.values(buckets)
    .map((b) => {
      const total = b.total || 1;
      return {
        visits: b.visits,
        hasPt: (b.hasPt / total) * 100,
        noPt: (b.noPt / total) * 100,
      };
    })
    .sort((a, b) => a.visits - b.visits);
}

export default function TrainersPage() {
  const [gymRows, setGymRows] = useState([]);
  const [trainerStats, setTrainerStats] = useState({
    membersByTrainer: {},
    membershipTypeByTrainer: {},
    trainerWorkload: {},
  });

  // ---------- Load CSV and compute trainer stats ----------
  useEffect(() => {
    fetch('/gym_membership.csv')
      .then((response) => response.text())
      .then((csv) => {
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim());

        const membersByTrainer = {};
        const membershipTypeByTrainer = {};
        const trainerWorkload = {
          'Morning (8-12)': {},
          'Afternoon (12-16)': {},
          'Evening (16-20)': {},
          'Night (20-24)': {},
        };

        const rows = lines
          .slice(1)
          .map((line) => {
            if (!line.trim()) return null;
            const values = line.split(',');
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = (values[i] || '').trim();
            });
            return obj;
          })
          .filter(Boolean);

        rows.forEach((values) => {
          const trainer = values['name_personal_trainer']?.trim();
          const membershipType = values['abonoment_type']?.trim();
          const checkInTime = values['avg_time_check_in']?.trim();

          if (trainer && trainer !== 'No PT') {
            membersByTrainer[trainer] = (membersByTrainer[trainer] || 0) + 1;

            if (!membershipTypeByTrainer[trainer]) {
              membershipTypeByTrainer[trainer] = {};
            }
            membershipTypeByTrainer[trainer][membershipType] =
              (membershipTypeByTrainer[trainer][membershipType] || 0) + 1;

            if (checkInTime) {
              const hour = parseInt(checkInTime.split(':')[0], 10);
              let timeSlot = '';
              if (hour >= 8 && hour < 12) timeSlot = 'Morning (8-12)';
              else if (hour >= 12 && hour < 16) timeSlot = 'Afternoon (12-16)';
              else if (hour >= 16 && hour < 20) timeSlot = 'Evening (16-20)';
              else if (hour >= 20) timeSlot = 'Night (20-24)';

              if (timeSlot) {
                trainerWorkload[timeSlot][trainer] =
                  (trainerWorkload[timeSlot][trainer] || 0) + 1;
              }
            }
          }
        });

        setTrainerStats({ membersByTrainer, membershipTypeByTrainer, trainerWorkload });
        setGymRows(rows);
      });
  }, []);

  // ---------- ChartJS: Members per Trainer ----------
  const barChartData = {
    labels: Object.keys(trainerStats.membersByTrainer),
    datasets: [
      {
        label: 'Number of Members',
        data: Object.values(trainerStats.membersByTrainer),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 8,
        right: 12,
        bottom: 12,
        left: 12,
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#cbd5f5' },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: { color: '#cbd5f5' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#cbd5f5' },
      },
    },
  };

  // ---------- ChartJS: Trainer workload (stacked) ----------
  const workloadData = {
    labels: Object.keys(trainerStats.membersByTrainer),
    datasets: Object.entries(trainerStats.trainerWorkload).map(
      ([timeSlot, trainers], index) => ({
        label: timeSlot,
        data: Object.keys(trainerStats.membersByTrainer).map(
          (trainer) => trainers[trainer] || 0
        ),
        backgroundColor: [
          'rgba(96, 165, 250, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(37, 99, 235, 0.8)',
          'rgba(29, 78, 216, 0.8)',
        ][index],
        borderColor: [
          'rgba(96, 165, 250, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(37, 99, 235, 1)',
          'rgba(29, 78, 216, 1)',
        ][index],
        borderWidth: 1,
        borderRadius: 3,
      })
    ),
  };

  const workloadOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 8,
        right: 12,
        bottom: 12,
        left: 12,
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#cbd5f5' },
      },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: { color: '#cbd5f5' },
      },
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#cbd5f5' },
      },
    },
  };

  // ---------- Recharts: PT usage stacked by visits-per-week ----------
  const ptUsageData = getPtUsageByVisitsData(gymRows || []);

  // ---------- Layout ----------
  return (
  <LayoutDashboard
    header={
      <div>
        <h1>Trainer Analytics</h1>
        <p className="muted">View trainer statistics and performance</p>
      </div>
    }
    filters={null}
    // TOP: stacked full-width chart panels (each chart uses full horizontal width)
    stats={
      <div style={{ width: '100%' }}>

        {/* Members per Trainer — full width */}
        <div className="card p-4" style={{ width: '100%' }}>
          <h4 className="mb-3">Members per Trainer</h4>
          <div style={{ height: 320, width: '100%' }}>
            <Bar data={barChartData} options={barOptions} />
          </div>
        </div>

        {/* PT Usage by Visits per Week — full width */}
        <div className="card p-4" style={{ width: '100%', marginTop: 16 }}>
          <h4 className="mb-3">PT Usage by Visits per Week</h4>
          <div className="text-sm mb-2 text-muted-foreground">
            % of members with a personal trainer for each visits-per-week group
          </div>
          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={ptUsageData}>
                <ReCartesianGrid strokeDasharray="3 3" vertical={false} />
                <ReXAxis dataKey="visits" tick={{ fill: '#cbd5f5' }} />
                <ReYAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: '#cbd5f5' }}
                />
                <ReTooltip
                  formatter={(value, name) => [
                    `${Number(value).toFixed(0)}%`,
                    name === 'hasPt' ? 'Has PT' : 'No PT',
                  ]}
                  labelFormatter={(label) => `Visits per week: ${label}`}
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1e293b',
                  }}
                />
                <ReLegend
                  formatter={(value) => (value === 'hasPt' ? 'Has PT' : 'No PT')}
                />
                <ReBar
                  dataKey="hasPt"
                  name="Has PT"
                  stackId="pt"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <ReBar
                  dataKey="noPt"
                  name="No PT"
                  stackId="pt"
                  fill="#1e293b"
                  radius={[0, 0, 4, 4]}
                />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    }

    // BOTTOM: full-width workload chart (unchanged)
    chart={
      <div className="card p-4">
        <h4 className="mb-3">Trainer Workload by Time of Day</h4>
        <div style={{ height: 400 }}>
          <Bar data={workloadData} options={workloadOptions} />
        </div>
      </div>
    }
    table={null}
  />
);
}