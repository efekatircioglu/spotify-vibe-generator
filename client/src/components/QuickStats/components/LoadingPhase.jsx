import React from 'react';

const LoadingPhase = ({ isMobile }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px 16px',
      margin: '32px auto',
      maxWidth: '1200px',
      width: '95%',
      minHeight: '200px'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Simple green spinner */}
        <div style={{
          width: 48, 
          height: 48, 
          border: '6px solid #1db954', 
          borderTop: '6px solid #232323', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite'
        }} />
        
        {/* Loading text */}
        <div style={{
          color: '#b3b3b3',
          fontSize: '1rem',
          textAlign: 'center'
        }}>
          Loading your music insights...
        </div>
        
        <style>{`
          @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }
        `}</style>
      </div>
    </div>
  );
};

export default LoadingPhase;
