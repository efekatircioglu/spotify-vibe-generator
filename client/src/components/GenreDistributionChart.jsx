import React from 'react';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import styles from '../app/page.module.css';

export default function GenreDistributionChart({ genres }) {
  return (
    <div className={styles.songsTableWrapper}>
      <div className={styles.songsTableTitle}>Genre Distribution</div>
      <div style={{ margin: '32px 0', background: '#222', borderRadius: 8, padding: 24, minWidth: 900, overflowX: 'auto' }}>
        <Bar
          data={{
            labels: Object.keys(genres || {}),
            datasets: [
              {
                label: '',
                data: Object.values(genres || {}),
                backgroundColor: '#1db954',
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: false },
              tooltip: { enabled: false },
            },
            scales: {
              x: {
                title: { display: false },
                ticks: { color: '#fff', maxRotation: 45, minRotation: 45, autoSkip: false },
                grid: { display: false },
              },
              y: {
                display: false,
                beginAtZero: true,
                ticks: { display: false },
                grid: { display: false },
              }
            }
          }}
          height={300}
          width={1200}
        />
      </div>
    </div>
  );
} 