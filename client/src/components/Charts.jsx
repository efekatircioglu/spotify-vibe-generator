import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Style Objects for Inline CSS ---
const styles = {
    modalBackdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        fontFamily: 'sans-serif',
    },
    modalContainer: {
        backgroundColor: '#1c1c2e', 
        border: '1px solid #3a3a5a',
        borderRadius: '18px',
        boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
        width: '100%',
        maxWidth: '90vw',
        minWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        padding: '40px 36px 32px 36px',
        textAlign: 'center',
        position: 'relative',
    },
    modalTitle: {
        fontSize: '1.5rem',
        color: '#FFFFFF',
        marginBottom: '18px',
        fontWeight: 'bold',
    },
    modalCloseButton: {
        color: '#9CA3AF',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        position: 'absolute',
        top: '20px',
        right: '20px',
    },
    modalBody: {
        flexGrow: 1,
        overflowY: 'auto',
        paddingRight: '0.5rem',
    },
    chartWrapper: {
        width: '100%',
        overflowX: 'auto',
        backgroundColor: '#1c1c2e', 
        borderRadius: '0.5rem',
        padding: '1rem 0',
    },
    tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.8)',
        border: '1px solid #4B5563',
        borderRadius: '0.5rem',
        color: '#F9FAFB'
    },
    axisLine: {
        stroke: '#9CA3AF',
    },
    axisTick: {
        fontSize: 14,
        fill: '#FFFFFF',
    },
    gridLine: {
        stroke: '#3a3a5a',
        strokeDasharray: '3 3',
    },
};

// --- Reusable Modal Component with Inline CSS ---
export const StyledModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.modalBackdrop}>
            <div style={styles.modalContainer}>
                <h2 style={styles.modalTitle}>{title}</h2>
                <button onClick={onClose} style={styles.modalCloseButton}>
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '2rem', width: '2rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div style={styles.modalBody}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Reusable Chart Component with Inline CSS ---
export const StyledAnalysisChart = ({ data, xAxisKey, yAxisLabel }) => {
    const chartWidth = Math.max(data.length * 120, 800);

    return (
        <div style={styles.chartWrapper}>
            <div style={{ width: chartWidth, height: '600px' }}>
                <ResponsiveContainer width="100%" height="100%" padding="no-gap">
                    <AreaChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 30, bottom: 100 }} // increased left margin
                    >
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={styles.gridLine.stroke} />
                        <XAxis 
                            dataKey={xAxisKey} 
                            stroke={styles.axisLine.stroke} 
                            tick={styles.axisTick}
                            dy={30}
                            allowDuplicatedCategory={false}
                            interval={0}
                            padding={{ left: 30, right: 30 }}
                        />
                        <YAxis 
                            stroke={styles.axisLine.stroke} 
                            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: styles.axisLine.stroke }}
                            scale="linear"
                            domain={[0, 'auto']}
                            allowDataOverflow={true}
                            tickFormatter={(tick) => tick.toLocaleString()}
                            padding={{ bottom: 20 }}
                        />
                        <Tooltip
                            contentStyle={styles.tooltip}
                            cursor={{ stroke: '#8884d8', strokeWidth: 2, strokeDasharray: '3 3' }}
                        />
                        <Area type="monotone" dataKey="Number of Songs" stroke="#8884d8" fillOpacity={1} fill="url(#chartGradient)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};