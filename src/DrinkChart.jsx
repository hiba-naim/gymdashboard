import { useState, useEffect } from 'react';
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

const DrinkChart = ({ data }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (!data || data.length === 0) return;

    const drinkCounts = {
      'Berry Boost': 0,
      'Lemon': 0,
      'Passion Fruit': 0,
      'Coconut Pineapple': 0,
      'Orange': 0,
      'Black Currant': 0
    };

    data.forEach(member => {
      const check = (v) => v === 1 || v === '1' || v === true || v === 'true';
      if (check(member.fav_drink_berryboost)) drinkCounts['Berry Boost']++;
      if (check(member.fav_drink_lemon)) drinkCounts['Lemon']++;
      if (check(member.fav_drink_passion_fruit)) drinkCounts['Passion Fruit']++;
      if (check(member.fav_drink_coconut_pineapple)) drinkCounts['Coconut Pineapple']++;
      if (check(member.fav_drink_orange)) drinkCounts['Orange']++;
      if (check(member.fav_drink_black_currant)) drinkCounts['Black Currant']++;
    });

    setChartData({
      labels: Object.keys(drinkCounts),
      datasets: [
        {
          label: 'Favorite Drinks Distribution',
          data: Object.values(drinkCounts),
          backgroundColor: [
            'rgba(123, 108, 255, 0.8)', // Purple
            'rgba(239, 131, 84, 0.8)',  // Orange
            'rgba(131, 214, 164, 0.8)', // Green
            'rgba(255, 184, 107, 0.8)', // Light Orange
            'rgba(255, 159, 64, 0.8)',  // Orange
            'rgba(153, 102, 255, 0.8)', // Purple
          ],
          borderColor: [
            'rgba(123, 108, 255, 1)',
            'rgba(239, 131, 84, 1)',
            'rgba(131, 214, 164, 1)',
            'rgba(255, 184, 107, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    });
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Drink Preferences Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="chart-wrapper" style={{ height: 360 }}>
      <div className="chart-container" style={{ height: '100%' }}>
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
};

export default DrinkChart;
