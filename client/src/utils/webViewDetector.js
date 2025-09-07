// WebView Detection Utility
export function detectWebView() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Common WebView patterns
  const webViewPatterns = [
    // Social Media Apps
    /snapchat/i,
    /instagram/i,
    /facebook/i,
    /twitter/i,
    /tiktok/i,
    /linkedin/i,
    /pinterest/i,
    
    // Messaging Apps
    /whatsapp/i,
    /telegram/i,
    /discord/i,
    /slack/i,
    
    // Other Apps
    /line/i,
    /wechat/i,
    /reddit/i,
    /youtube/i,
    
    // Generic WebView indicators
    /wv\)/i, // Android WebView
    /version\/.*safari/i, // iOS WebView (but not regular Safari)
  ];
  
  // Check for WebView patterns
  const isWebView = webViewPatterns.some(pattern => pattern.test(userAgent));
  
  // Additional checks for iOS WebView
  const isIOSWebView = /iphone|ipad|ipod/i.test(userAgent) && 
                      /version\/.*safari/i.test(userAgent) && 
                      !/crios|fxios/i.test(userAgent); // Exclude Chrome and Firefox
  
  // Additional checks for Android WebView
  const isAndroidWebView = /android/i.test(userAgent) && 
                          /wv\)/i.test(userAgent);
  
  return {
    isWebView: isWebView || isIOSWebView || isAndroidWebView,
    userAgent,
    detectedApp: getDetectedApp(userAgent),
    platform: getPlatform(userAgent)
  };
}

function getDetectedApp(userAgent) {
  if (/snapchat/i.test(userAgent)) return 'Snapchat';
  if (/instagram/i.test(userAgent)) return 'Instagram';
  if (/facebook/i.test(userAgent)) return 'Facebook';
  if (/twitter/i.test(userAgent)) return 'Twitter';
  if (/tiktok/i.test(userAgent)) return 'TikTok';
  if (/whatsapp/i.test(userAgent)) return 'WhatsApp';
  if (/telegram/i.test(userAgent)) return 'Telegram';
  if (/discord/i.test(userAgent)) return 'Discord';
  if (/youtube/i.test(userAgent)) return 'YouTube';
  if (/linkedin/i.test(userAgent)) return 'LinkedIn';
  if (/pinterest/i.test(userAgent)) return 'Pinterest';
  if (/reddit/i.test(userAgent)) return 'Reddit';
  
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
        { name: 'Safari', icon: '🦁', url: 'safari://' },
        { name: 'Chrome', icon: '🌐', url: 'googlechrome://' },
        { name: 'Firefox', icon: '🦊', url: 'firefox://' }
      ];
    case 'Android':
      return [
        { name: 'Chrome', icon: '🌐', url: 'googlechrome://' },
        { name: 'Firefox', icon: '🦊', url: 'firefox://' },
        { name: 'Samsung Internet', icon: '📱', url: 'samsungbrowser://' }
      ];
    default:
      return [
        { name: 'Chrome', icon: '🌐', url: 'https://www.google.com/chrome/' },
        { name: 'Firefox', icon: '🦊', url: 'https://www.mozilla.org/firefox/' },
        { name: 'Safari', icon: '🦁', url: 'https://www.apple.com/safari/' }
      ];
  }
}
