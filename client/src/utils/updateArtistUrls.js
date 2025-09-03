// Quick script to update all remaining hardcoded URLs in the artist page
// Run this in your browser console on the artist page

function updateArtistPageUrls() {
  // Get all script elements
  const scripts = document.querySelectorAll('script');
  
  scripts.forEach(script => {
    if (script.textContent) {
      let updated = script.textContent
        .replace(/http:\/\/127\.0\.0\.1:8000/g, 'https://api.vibegenerator.me')
        .replace(/http:\/\/localhost:8000/g, 'https://api.vibegenerator.me');
      
      if (updated !== script.textContent) {
        script.textContent = updated;
        console.log('Updated script:', script);
      }
    }
  });
  
  console.log('Artist page URLs updated!');
}

// Run the update
updateArtistPageUrls();
