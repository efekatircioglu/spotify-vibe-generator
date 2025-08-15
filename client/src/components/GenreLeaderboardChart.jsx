import React, { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function GenreLeaderboardChart({ genres, title, timeRange }) {
  const chartRef = useRef(null);
  const yAxisLabelsRef = useRef(null);

  // Handle cases where genres might be undefined, null, or empty
  if (!genres || typeof genres !== 'object' || Object.keys(genres).length === 0) {
    return (
      <div style={{
        background: '#1e1e1e',
        borderRadius: 18,
        padding: 'clamp(20px, 3vw, 32px)',
        margin: 'clamp(20px, 3vw, 32px) auto',
        maxWidth: 'clamp(95vw, 98vw, 98vw)',
        width: 'clamp(95vw, 98vw, 98vw)',
        boxShadow: '0 4px 32px #0003',
        position: 'relative',
        textAlign: 'center',
        color: '#a0a0a0'
      }}>
        <div style={{
          fontSize: 'clamp(1.35rem, 2.5vw, 2.2rem)',
          fontWeight: 700,
          color: '#f3f3f3',
          letterSpacing: 1,
          textShadow: '0 2px 8px #0008',
          marginBottom: 24
        }}>
          {title}
        </div>
        <p>No genre data available for this time period.</p>
      </div>
    );
  }

  // Sort genres by count (descending)
  const sortedGenres = Object.entries(genres)
    .sort(([,a], [,b]) => b - a);

  // Calculate dynamic width based on number of genres
  const spacePerGenre = 120; // pixels per genre, increased for more spacing
  const totalGenres = sortedGenres.length;
  const chartWidth = totalGenres * spacePerGenre;

  const chartData = {
    labels: sortedGenres.map(([genre]) => genre),
    datasets: [
      {
        label: 'Number of Artists',
        data: sortedGenres.map(([, count]) => count),
        borderColor: '#22ca7b',
        backgroundColor: 'rgba(34, 202, 123, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#22ca7b',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#1db954',
        pointRadius: 5,
        pointHoverRadius: 8,
        borderWidth: 3,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: false 
      },
      title: { 
        display: false
      },
      tooltip: {
        backgroundColor: '#000000',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#22ca7b',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        padding: 10,
        callbacks: {
          label: function(context) {
            return `Number of Artists: ${context.parsed.y || 0}`;
          },
          title: function(context) {
            const title = context[0].label;
            return title ? title.charAt(0).toUpperCase() + title.slice(1) : '';
          }
        }
      }
    },
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 20,
        bottom: 20
      }
    },
    scales: {
      x: {
        title: { 
          display: false
        },
        ticks: { 
          color: '#a0a0a0',
          maxRotation: 0,
          minRotation: 0,
          autoSkip: false,
          padding: 10,
          font: {
            size: 12,
            weight: '500'
          }
        },
        grid: { 
          display: false
        }
      },
              y: { 
          title: { 
            display: false
          },
          ticks: { 
            display: false, // Hide default labels since we'll render them externally
            beginAtZero: true,
            stepSize: 1
          },
          grid: { 
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          min: 0, // Ensure y-axis starts at 0
          border: {
            display: false
          }
        }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        hoverBorderWidth: 3,
        radius: 5
      }
    }
  };

  // Custom plugin to render Y-axis labels externally
  const yAxisLabelsPlugin = {
    id: 'yAxisLabelsPlugin',
    afterDraw: (chart) => {
      const yAxis = chart.scales.y;
      const yAxisLabelsContainer = yAxisLabelsRef.current;
      
      if (!yAxisLabelsContainer) return;

      // Clear previous labels
      yAxisLabelsContainer.innerHTML = '';
      
      // For each tick, create a label and position it
      yAxis.ticks.forEach((tick, index) => {
        const pixelY = yAxis.getPixelForTick(index);
        const labelDiv = document.createElement('div');
        labelDiv.style.cssText = `
          position: absolute;
          left: 2px;
          top: ${pixelY}px;
          transform: translateY(-50%);
          color: #a0a0c0;
          font-size: 12px;
          font-weight: 'bold';
          z-index: 10;
          pointer-events: none;
        `;
        labelDiv.innerText = tick.label;
        yAxisLabelsContainer.appendChild(labelDiv);
      });
    }
  };

  // Add the plugin to options
  options.plugins = {
    ...options.plugins,
    yAxisLabelsPlugin
  };

  return (
    <div className="genre-chart-container" style={{
      background: '#1e1e1e',
      borderRadius: 18,
      padding: 'clamp(20px, 3vw, 32px)',
      margin: 'clamp(20px, 3vw, 32px) auto',
      maxWidth: 'min(95vw, 1200px)',
      width: 'min(95vw, 1200px)',
      boxShadow: '0 4px 32px #0003',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div className="genre-chart-title" style={{
        fontSize: 'clamp(1.35rem, 2.5vw, 2.2rem)',
        fontWeight: 700,
        color: '#f3f3f3',
        letterSpacing: 1,
        textShadow: '0 2px 8px #0008',
        marginBottom: 24,
        textAlign: 'center'
      }}>
        {title}
      </div>
      
      {/* New structure for sticky Y-axis */}
      <div style={{ 
        position: 'relative', 
        width: '100%',
        display: 'flex',
        justifyContent: 'center'
      }}>
        {/* Inner container that centers the Y-axis and chart */}
        <div style={{
          display: 'flex',
          position: 'relative',
          maxWidth: '100%'
        }}>
          {/* Y-Axis Container (Stays Fixed) */}
          <div style={{ 
            width: '60px', 
            flexShrink: 0, 
            position: 'relative',
            zIndex: 2
          }}>
            {/* Left side - Number of Artists text */}
            <div style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%) rotate(180deg)',
              writingMode: 'vertical-rl',
              transformOrigin: 'center',
              color: '#c0c0c0',
              fontSize: '12px',
              fontWeight: 'bold',
              lineHeight: '1.2'
            }}>
              Number of Artists
            </div>
            {/* This div will be populated with labels by our custom plugin */}
            <div 
              ref={yAxisLabelsRef}
              style={{ 
                height: 'clamp(400px, 60vh, 700px)', 
                position: 'relative' 
              }}
            />
          </div>

          {/* Chart container with horizontal scrolling */}
          <div style={{
            height: 'clamp(400px, 60vh, 700px)',
            position: 'relative',
            overflowX: 'auto',
            overflowY: 'hidden',
            minWidth: 0
          }}>
            <div style={{
              width: `${chartWidth}px`,
              height: '100%',
              position: 'relative'
            }}>
              <Line 
                ref={chartRef}
                data={chartData} 
                options={options}
                plugins={[yAxisLabelsPlugin]}
              />
            </div>
          </div>

          {/* Right side Y-axis numbers container */}
          <div style={{ 
            width: '40px', 
            flexShrink: 0, 
            position: 'relative',
            zIndex: 2
          }}>
            {/* Right side - Number of Artists text */}
            <div style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              writingMode: 'vertical-rl',
              transformOrigin: 'center',
              color: '#c0c0c0',
              fontSize: '12px',
              fontWeight: 'bold',
              lineHeight: '1.2'
            }}>
              Number of Artists
            </div>
            <div 
              ref={yAxisLabelsRef}
              style={{ 
                height: 'clamp(400px, 60vh, 700px)', 
                position: 'relative' 
              }}
            />
          </div>
        </div>
      </div>
        
      {/* Hide scrollbar for cleaner look */}
      <style jsx>{`
        .genre-chart-container ::-webkit-scrollbar {
          display: none;
        }
        .genre-chart-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Genre stats summary */}
      <div className="genre-stats-container" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: 20,
        padding: '16px 20px',
        background: 'rgba(34, 202, 123, 0.1)',
        borderRadius: 12,
        border: '1px solid rgba(34, 202, 123, 0.2)'
      }}>
        <div className="genre-stats-row" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>
            <strong style={{ color: '#e5e5e5' }}>Total Genres:</strong> {Object.keys(genres).length}
          </div>
          <div style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>
            <strong style={{ color: '#e5e5e5' }}>Top Genre:</strong> {sortedGenres[0]?.[0] || 'N/A'} ({sortedGenres[0]?.[1] || 0} artists)
          </div>
        </div>
        <div style={{ 
          color: '#a0a0a0', 
          fontSize: '0.9rem',
          textAlign: 'center',
          paddingTop: '8px',
          borderTop: '1px solid rgba(34, 202, 123, 0.2)'
        }}>
          <strong style={{ color: '#e5e5e5' }}>Time Range:</strong> {timeRange}
        </div>
      </div>
    </div>
  );
}
