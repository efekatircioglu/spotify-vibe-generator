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
        { name: 'Safari', icon: '', url: 'N/A' }, // URL is handled by the component
        { name: 'Chrome', icon: '', url: 'googlechrome://' },
        { name: 'Google', icon: '', url: 'google://' },
      ];
    case 'Android':
      return [
        { name: 'Chrome', icon: '', url: 'googlechrome://' },
        { name: 'Samsung Internet', icon: '', url: 'samsungbrowser://' }
      ];
    default:
      return [
        { name: 'Chrome', icon: '', url: 'https://www.google.com/chrome/' },
        { name: 'Safari', icon: '', url: 'https://www.apple.com/safari/' }
      ];
  }
}