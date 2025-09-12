// Add this test endpoint to your server/src/index.js
// This will help us test the error handling

app.get('/test-error', (req, res) => {
  console.log('Testing error redirect...');
  
  // Determine redirect URL based on origin
  const origin = req.headers.origin || req.headers.referer || 'https://vibegenerator.vercel.app';
  let redirectUrl;
  
  if (origin.includes('localhost:3000')) {
    redirectUrl = 'http://localhost:3000';
  } else if (origin.includes('localhost:3001')) {
    redirectUrl = 'http://localhost:3001';
  } else {
    redirectUrl = 'https://vibegenerator.vercel.app';
  }
  
  console.log('Redirecting to:', `${redirectUrl}/not-permitted`);
  res.redirect(`${redirectUrl}/not-permitted`);
});


