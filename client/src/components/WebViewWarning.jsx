"use client";

import React, { useState, useEffect } from 'react';
import { detectWebView, getRecommendedBrowsers } from '../utils/webViewDetector';

const WebViewWarning = ({ onDismiss }) => {
  const [webViewInfo, setWebViewInfo] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => {
      setLinkCopied(false);
    }, 3000);
  };

  const openInBrowser = (browserUrlScheme) => {
    const currentUrl = window.location.href;
    const urlWithoutProtocol = currentUrl.replace(/^(https?:\/\/)/, '');
    window.location.href = browserUrlScheme + urlWithoutProtocol;
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
        border: '2px solid #4285F4' // Google Blue border
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '24px' }}>
            Switch to Browser
          </h2>
          <p style={{ color: '#b3b3b3', margin: 0, fontSize: '16px' }}>
            For a better experience, please open in a dedicated browser.
          </p>
        </div>

        {/* --- MODIFIED BUTTON SECTION --- */}
        <div style={{ marginBottom: '24px' }}>
          {recommendedBrowsers.map((browser, index) => (
            <button
              key={index}
              onClick={() => openInBrowser(browser.url)}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#000000',
                border: '1px solid #dadce0',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                width: '100%'
              }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = '#f8f9fa'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = '#FFFFFF'; }}
            >
              {browser.name}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={copyCurrentUrl}
            style={{
              backgroundColor: linkCopied ? '#34A853' : 'transparent', // Google Green
              color: linkCopied ? '#fff' : '#4285F4', // Google Blue
              border: `2px solid ${linkCopied ? '#34A853' : '#4285F4'}`,
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: '100%'
            }}
          >
            {linkCopied ? 'Link Copied!' : 'Or Copy Link'}
          </button>
        </div>

        <div>
          <button
            onClick={handleDismiss}
            style={{
              backgroundColor: 'transparent',
              color: '#999',
              border: 'none',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              width: '100%',
              textDecoration: 'underline'
            }}
          >
            Continue here (not recommended)
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebViewWarning;