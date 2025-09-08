// WebView Detection Utility
export function detectWebView() {
  const userAgent = navigator.userAgent.toLowerCase();
  const webViewPatterns = [/snapchat/i, /linkedin/i];
  const isWebView = webViewPatterns.some(pattern => pattern.test(userAgent));
  
  return {
    isWebView,
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

export function getRecommendedBrowsers(platform) {
  switch (platform) {
    case 'iOS':
    case 'Android':
      return [
        { name: 'Open in Chrome', url: 'googlechrome://' },
      ];
    default:
      return []; // Return empty for desktop, as the warning won't show
  }
}