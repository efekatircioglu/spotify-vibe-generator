// Utility function to replace all hardcoded API URLs with the centralized configuration
// This should be run in the browser console to update all remaining hardcoded URLs

function updateHardcodedUrls() {
  // Get all script tags
  const scripts = document.querySelectorAll('script');
  
  scripts.forEach(script => {
    if (script.textContent) {
      // Replace all hardcoded URLs
      let updatedContent = script.textContent
        .replace(/http:\/\/127\.0\.0\.1:8000/g, 'https://api.vibegenerator.me')
        .replace(/http:\/\/localhost:8000/g, 'https://api.vibegenerator.me');
      
      if (updatedContent !== script.textContent) {
        console.log('Updated script content:', script);
        script.textContent = updatedContent;
      }
    }
  });
  
  console.log('Hardcoded URLs updated!');
}

// Run the update
updateHardcodedUrls();
