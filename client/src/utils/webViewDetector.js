// WebView Detection Utility
export function detectWebView() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Only detect Snapchat and LinkedIn WebView patterns
  const webViewPatterns = [
    /snapchat/i,
    /linkedin/i,
  ];
  
  // Check for WebView patterns
  const isWebView = webViewPatterns.some(pattern => pattern.test(userAgent));
  
  return {
    isWebView: isWebView,
    userAgent,
    detectedApp: getDetectedApp(userAgent),
    platform: getPlatform(userAgent)
  };
}

function getDetectedApp(userAgent) {
  if (/snapchat/i.test(userAgent)) return 'Snapchat';
  if (/linkedin/i.test(userAgent)) return 'LinkedIn';
  
  return 'Unknown App';
}

function getPlatform(userAgent) {
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  if (/android/i.test(userAgent)) return 'Android';
  return 'Desktop';
}

// Get browser recommendations based on platform
export function getRecommendedBrowsers(platform) {
  switch (platform) {
    case 'iOS':
      return [
        // Safari doesn't use the function, so its properties don't matter as much
        { name: 'Safari', url: 'N/A', needsParam: null }, 
        
        // Chrome wants the URL appended directly
        { name: 'Chrome', url: 'googlechrome://', needsParam: false }, 
        
        // Google needs the URL as a parameter
        { name: 'Google', url: 'google://navigate?url=', needsParam: true }, 
      ];
    case 'Android':
      return [
        { name: 'Chrome', url: 'googlechrome://', needsParam: false },
        { name: 'Samsung Internet', url: 'samsungbrowser://', needsParam: false }
      ];
    default:
      // Desktop links are standard HTTP links, not deep links
      return [
        { name: 'Chrome', url: 'https://www.google.com/chrome/', needsParam: false },
        { name: 'Safari', url: 'https://www.apple.com/safari/', needsParam: false }
      ];
  }
}