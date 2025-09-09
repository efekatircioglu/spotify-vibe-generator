"use client";

import React from 'react';

const NotPermittedPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
        padding: '40px',
        backgroundColor: '#1a1a1a',
        borderRadius: '16px',
        border: '2px solid #ff4444',
        boxShadow: '0 8px 32px rgba(255, 68, 68, 0.1)'
      }}>
        {/* Error Icon */}
        <div style={{
          fontSize: '64px',
          marginBottom: '24px',
          color: '#ff4444'
        }}>
          ⚠️
        </div>

        {/* Main Message */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          margin: '0 0 16px 0',
          color: '#fff'
        }}>
          Access Denied
        </h1>

        <p style={{
          fontSize: '18px',
          color: '#b3b3b3',
          margin: '0 0 24px 0',
          lineHeight: '1.5'
        }}>
          You are not permitted to use this application.
        </p>


        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => window.location.href = 'https://vibegenerator.vercel.app'}
            style={{
              backgroundColor: '#1db954',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1ed760';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#1db954';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Go to Homepage
          </button>

          <button
            onClick={() => window.history.back()}
            style={{
              backgroundColor: 'transparent',
              color: '#1db954',
              border: '2px solid #1db954',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1db954';
              e.target.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#1db954';
            }}
          >
            Go Back
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          paddingTop: '20px',
          borderTop: '1px solid #333',
          fontSize: '12px',
          color: '#666'
        }}>
          <p style={{ margin: '0' }}>
            Please contact support for becoming a premium user.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotPermittedPage;
