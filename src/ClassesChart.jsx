import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ClassesChart = ({ data }) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    if (!data) return;

    const classKeys = [
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
      'Group_Lesson_BodyBalance'
    ];

    const labels = [
      'Kickboxen',
      'BodyPump',
      'Zumba',
      'XCore',
      'Running',
      'Yoga',
      'LesMiles',
      'Pilates',
      'HIT',
      'Spinning',
      'BodyBalance'
    ];

    const counts = classKeys.map((key) =>
      data.reduce((acc, row) => {
        const v = row[key];
        if (v === 1 || v === '1' || v === true || v === 'true') return acc + 1;
        return acc;
      }, 0)
    );

    setChartData({
      labels,
      datasets: [
        {
          label: 'Favorite Class Choices',
          data: counts,
          backgroundColor: labels.map((_, i) => {
            const palette = [
              'rgba(123,108,255,0.85)',
              'rgba(239,131,84,0.85)',
              'rgba(131,214,164,0.85)',
              'rgba(255,184,107,0.85)',
              'rgba(255,159,64,0.85)',
              'rgba(153,102,255,0.85)'
            ];
            return palette[i % palette.length];
          }),
          borderColor: labels.map((_, i) => {
            const palette = [
              'rgba(123,108,255,1)',
              'rgba(239,131,84,1)',
              'rgba(131,214,164,1)',
              'rgba(255,184,107,1)',
              'rgba(255,159,64,1)',
              'rgba(153,102,255,1)'
            ];
            return palette[i % palette.length];
          }),
          borderWidth: 1
        }
      ]
    });
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Class Preferences Distribution' }
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };

  return (
    <div className="card" style={{ height: 360 }}>
      <div style={{ padding: '18px', height: '100%' }}>
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
};

export default ClassesChart;
