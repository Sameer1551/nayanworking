import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ChartDemo: React.FC = () => {
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Purchases',
        data: [12, 19, 3, 5, 2],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Sales',
        data: [15, 25, 8, 12, 7],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  };

  const pieData = {
    labels: ['Spectacles', 'Contact Lenses', 'Frames', 'Sunglasses'],
    datasets: [
      {
        data: [35, 25, 25, 15],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Chart Demo</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Bar Chart</h2>
          <Bar data={barData} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Pie Chart</h2>
          <Pie data={pieData} />
        </div>
      </div>
    </div>
  );
};

export default ChartDemo;
