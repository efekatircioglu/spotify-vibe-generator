// Script to update all QuickStats components with the centralized API configuration
// This will update all the ticketmaster search URLs in QuickStats components

const quickStatsComponents = [
  'client/src/components/QuickStats/components/TopGenresCard.jsx',
  'client/src/components/QuickStats/components/TrackPopularityCard.jsx',
  'client/src/components/QuickStats/components/TopArtistCard.jsx',
  'client/src/components/QuickStats/components/TopAlbumsCard.jsx',
  'client/src/components/QuickStats/components/ListeningEvolutionCard.jsx',
  'client/src/components/QuickStats/components/TimeOfDayCard.jsx',
  'client/src/components/QuickStats/components/TopSongCard.jsx'
];

// Update each component
quickStatsComponents.forEach(componentPath => {
  console.log(`Updating ${componentPath}...`);
  
  // Add import
  // Add getApiBaseUrl import at the top
  
  // Update the ticketmaster fetch call
  // Replace: fetch(`http://127.0.0.1:8000/ticketmaster/search-artist?artistName=${encodeURIComponent(artistName)}`)
  // With: fetch(`${getApiBaseUrl()}/ticketmaster/search-artist?artistName=${encodeURIComponent(artistName)}`, { credentials: 'include' })
});
