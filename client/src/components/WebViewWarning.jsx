"use client";

import React, { useState, useEffect } from 'react';
import { detectWebView, getRecommendedBrowsers } from '../utils/webViewDetector';

const WebViewWarning = ({ onDismiss }) => {
  const [webViewInfo, setWebViewInfo] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const detection = detectWebView();
    if (detection.isWebView) {
      setWebViewInfo(detection);
      setShowWarning(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowWarning(false);
    if (onDismiss) onDismiss();
  };

  const copyCurrentUrl = () => {
    const targetUrl = 'https://vibegenerator.vercel.app/';
    navigator.clipboard.writeText(targetUrl);
    alert('Link copied! Paste it in your preferred browser.');
  };

  const openInBrowser = (browserUrl) => {
    const targetUrl = 'https://vibegenerator.vercel.app/';
    
    // Try to open in specific browser using window.open
    if (browserUrl.includes('googlechrome://')) {
      // Try Chrome
      try {
        window.open(`googlechrome://navigate?url=${encodeURIComponent(targetUrl)}`, '_blank');
        // Fallback: try to open in new tab
        setTimeout(() => {
          window.open(targetUrl, '_blank');
        }, 500);
      } catch (error) {
        // Final fallback: copy link
        navigator.clipboard.writeText(targetUrl);
        alert('Chrome not available. Link copied! Paste it in Chrome.');
      }
    } else if (browserUrl.includes('x-web-search://')) {
      // Try Safari
      try {
        window.open(`x-web-search://?${encodeURIComponent(targetUrl)}`, '_blank');
        setTimeout(() => {
          window.open(targetUrl, '_blank');
        }, 500);
      } catch (error) {
        navigator.clipboard.writeText(targetUrl);
        alert('Safari not available. Link copied! Paste it in Safari.');
      }
    } else if (browserUrl.includes('firefox://')) {
      // Try Firefox
      try {
        window.open(`firefox://open-url?url=${encodeURIComponent(targetUrl)}`, '_blank');
        setTimeout(() => {
          window.open(targetUrl, '_blank');
        }, 500);
      } catch (error) {
        navigator.clipboard.writeText(targetUrl);
        alert('Firefox not available. Link copied! Paste it in Firefox.');
      }
    } else if (browserUrl.includes('samsungbrowser://')) {
      // Try Samsung Internet
      try {
        window.open(`samsungbrowser://navigate?url=${encodeURIComponent(targetUrl)}`, '_blank');
        setTimeout(() => {
          window.open(targetUrl, '_blank');
        }, 500);
      } catch (error) {
        navigator.clipboard.writeText(targetUrl);
        alert('Samsung Internet not available. Link copied! Paste it in Samsung Internet.');
      }
    } else {
      // For desktop or unknown browsers, open in new tab
      window.open(targetUrl, '_blank');
    }
  };

  if (!showWarning || !webViewInfo) return null;

  const recommendedBrowsers = getRecommendedBrowsers(webViewInfo.platform);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        border: '2px solid #1db954'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
          <h2 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '24px' }}>
            Switch to Browser
          </h2>
          <p style={{ color: '#b3b3b3', margin: 0, fontSize: '16px' }}>
            You're using {webViewInfo.detectedApp}'s built-in browser
          </p>
        </div>


        {/* Recommended Browsers */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#1db954', margin: '0 0 16px 0', fontSize: '18px' }}>
            Recommended Browsers:
          </h3>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {recommendedBrowsers.map((browser, index) => (
              <button
                key={index}
                onClick={() => openInBrowser(browser.url)}
                style={{
                  backgroundColor: '#1db954',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
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
                {browser.name}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleDismiss}
            style={{
              backgroundColor: '#666',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              flex: 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#777';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#666';
            }}
          >
            Continue Here (not recommended)
          </button>
          <button
            onClick={copyCurrentUrl}
            style={{
              backgroundColor: '#1db954',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              flex: 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1ed760';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#1db954';
            }}
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebViewWarning;
