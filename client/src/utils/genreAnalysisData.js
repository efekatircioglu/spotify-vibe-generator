// Direct mapping: Genre -> Properties
export const genreData = {
  'alt-rock': {
    energy: 'medium',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['angsty', 'introspective', 'melancholic', 'rebellious'],
    danceability: 'low-to-mid',
  },
  alternative: {
    energy: 'medium',
    tempo: 'low-to-mid',
    focus: 'balanced',
    mood: ['introspective', 'eclectic', 'experimental', 'melancholic'],
    danceability: 'low',
  },
  'black-metal': {
    energy: 'high',
    tempo: 'high',
    focus: 'balanced',
    mood: ['dark', 'aggressive', 'atmospheric', 'misanthropic'],
    danceability: 'low',
  },
  'death-metal': {
    energy: 'high',
    tempo: 'high',
    focus: 'balanced',
    mood: ['aggressive', 'dark', 'brutal', 'menacing'],
    danceability: 'low',
  },
  emo: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'towards vocal',
    mood: ['melancholic', 'angsty', 'introspective', 'emotional'],
    danceability: 'low-to-mid',
  },
  garage: {
    energy: 'mid-to-high',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['raw', 'energetic', 'rebellious', 'gritty'],
    danceability: 'medium',
  },
  goth: {
    energy: 'low-to-mid',
    tempo: 'low-to-mid',
    focus: 'balanced',
    mood: ['dark', 'melancholic', 'somber', 'introspective'],
    danceability: 'low-to-mid',
  },
  grindcore: {
    energy: 'high',
    tempo: 'high',
    focus: 'balanced',
    mood: ['aggressive', 'chaotic', 'abrasive', 'extreme'],
    danceability: 'low',
  },
  grunge: {
    energy: 'mid-to-high',
    tempo: 'low-to-mid',
    focus: 'balanced',
    mood: ['angsty', 'apathetic', 'dark', 'melancholic'],
    danceability: 'low-to-mid',
  },
  'hard-rock': {
    energy: 'high',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['energetic', 'rebellious', 'aggressive', 'anthemic'],
    danceability: 'medium',
  },
  hardcore: {
    energy: 'high',
    tempo: 'high',
    focus: 'balanced',
    mood: ['aggressive', 'angry', 'confrontational', 'political'],
    danceability: 'low',
  },
  'heavy-metal': {
    energy: 'high',
    tempo: 'medium',
    focus: 'towards instrumental',
    mood: ['aggressive', 'powerful', 'dark', 'epic'],
    danceability: 'low-to-mid',
  },
  metal: {
    energy: 'high',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['aggressive', 'powerful', 'dark', 'diverse'],
    danceability: 'low-to-mid',
  },
  'metal-misc': {
    energy: 'variable',
    tempo: 'variable',
    focus: 'variable',
    mood: ['variable'],
    danceability: 'variable',
  },
  metalcore: {
    energy: 'high',
    tempo: 'high',
    focus: 'balanced',
    mood: ['aggressive', 'emotional', 'chaotic'],
    danceability: 'low',
  },
  punk: {
    energy: 'high',
    tempo: 'mid-to-high',
    focus: 'balanced',
    mood: ['rebellious', 'angry', 'energetic', 'anti-establishment'],
    danceability: 'medium',
  },
  'punk-rock': {
    energy: 'high',
    tempo: 'mid-to-high',
    focus: 'balanced',
    mood: ['rebellious', 'energetic', 'raw', 'catchy'],
    danceability: 'medium',
  },
  'psych-rock': {
    energy: 'medium',
    tempo: 'low-to-mid',
    focus: 'towards instrumental',
    mood: ['psychedelic', 'experimental', 'dreamy', 'hypnotic'],
    danceability: 'low',
  },
  rock: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['diverse', 'energetic', 'rebellious', 'melodic'],
    danceability: 'medium',
  },
  'rock-n-roll': {
    energy: 'mid-to-high',
    tempo: 'mid-to-high',
    focus: 'balanced',
    mood: ['energetic', 'fun', 'rebellious', 'upbeat'],
    danceability: 'high',
  },
  rockabilly: {
    energy: 'high',
    tempo: 'high',
    focus: 'balanced',
    mood: ['energetic', 'raw', 'rhythmic', 'upbeat'],
    danceability: 'high',
  },
  ambient: {
    energy: 'low',
    tempo: 'low',
    focus: 'towards instrumental',
    mood: ['calm', 'atmospheric', 'introspective', 'meditative'],
    danceability: 'low',
  },
  breakbeat: {
    energy: 'mid-to-high',
    tempo: 'medium',
    focus: 'towards instrumental',
    mood: ['energetic', 'rhythmic', 'funky', 'urban'],
    danceability: 'high',
  },
  'chicago-house': {
    energy: 'medium',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['soulful', 'hypnotic', 'uplifting', 'energetic'],
    danceability: 'high',
  },
  chill: {
    energy: 'low',
    tempo: 'low',
    focus: 'balanced',
    mood: ['relaxed', 'calm', 'mellow', 'introspective'],
    danceability: 'low-to-mid',
  },
  club: {
    energy: 'mid-to-high',
    tempo: 'medium',
    focus: 'towards instrumental',
    mood: ['energetic', 'upbeat', 'rhythmic', 'euphoric'],
    danceability: 'high',
  },
  dance: {
    energy: 'mid-to-high',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['upbeat', 'fun', 'energetic', 'catchy'],
    danceability: 'high',
  },
  'deep-house': {
    energy: 'low-to-mid',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['soulful', 'melodic', 'smooth', 'hypnotic'],
    danceability: 'high',
  },
  'detroit-techno': {
    energy: 'mid-to-high',
    tempo: 'mid-to-high',
    focus: 'towards instrumental',
    mood: ['futuristic', 'industrial', 'hypnotic', 'mechanical'],
    danceability: 'high',
  },
  'drum-and-bass': {
    energy: 'high',
    tempo: 'high',
    focus: 'towards instrumental',
    mood: ['energetic', 'aggressive', 'urban', 'futuristic'],
    danceability: 'high',
  },
  dub: {
    energy: 'low',
    tempo: 'low',
    focus: 'towards instrumental',
    mood: ['relaxed', 'hypnotic', 'psychedelic', 'meditative'],
    danceability: 'medium',
  },
  dubstep: {
    energy: 'mid-to-high',
    tempo: 'mid-to-high',
    focus: 'towards instrumental',
    mood: ['dark', 'aggressive', 'energetic', 'heavy'],
    danceability: 'medium',
  },
  edm: {
    energy: 'high',
    tempo: 'medium',
    focus: 'towards instrumental',
    mood: ['euphoric', 'energetic', 'anthemic', 'uplifting'],
    danceability: 'high',
  },
  electro: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'towards instrumental',
    mood: ['robotic', 'futuristic', 'funky', 'urban'],
    danceability: 'high',
  },
  electronic: {
    energy: 'variable',
    tempo: 'variable',
    focus: 'towards instrumental',
    mood: ['diverse', 'experimental', 'atmospheric', 'synthetic'],
    danceability: 'variable',
  },
  hardstyle: {
    energy: 'high',
    tempo: 'high',
    focus: 'towards instrumental',
    mood: ['energetic', 'aggressive', 'euphoric', 'anthemic'],
    danceability: 'high',
  },
  house: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['uplifting', 'soulful', 'energetic', 'groovy'],
    danceability: 'high',
  },
  idm: {
    energy: 'low-to-mid',
    tempo: 'variable',
    focus: 'towards instrumental',
    mood: ['experimental', 'cerebral', 'abstract', 'complex'],
    danceability: 'low',
  },
  'minimal-techno': {
    energy: 'low-to-mid',
    tempo: 'medium',
    focus: 'towards instrumental',
    mood: ['hypnotic', 'subtle', 'repetitive', 'atmospheric'],
    danceability: 'high',
  },
  'post-dubstep': {
    energy: 'low-to-mid',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['introspective', 'atmospheric', 'melancholic', 'experimental'],
    danceability: 'low-to-mid',
  },
  'progressive-house': {
    energy: 'medium',
    tempo: 'medium',
    focus: 'towards instrumental',
    mood: ['euphoric', 'melodic', 'hypnotic', 'journey-like'],
    danceability: 'high',
  },
  techno: {
    energy: 'mid-to-high',
    tempo: 'mid-to-high',
    focus: 'towards instrumental',
    mood: ['hypnotic', 'driving', 'dark', 'industrial'],
    danceability: 'high',
  },
  trance: {
    energy: 'high',
    tempo: 'mid-to-high',
    focus: 'towards instrumental',
    mood: ['euphoric', 'uplifting', 'melodic', 'hypnotic'],
    danceability: 'high',
  },
  'trip-hop': {
    energy: 'low',
    tempo: 'low',
    focus: 'balanced',
    mood: ['dark', 'melancholic', 'atmospheric', 'sensual'],
    danceability: 'low',
  },
  funk: {
    energy: 'mid-to-high',
    tempo: 'low-to-mid',
    focus: 'balanced',
    mood: ['energetic', 'groovy', 'danceable', 'sexy'],
    danceability: 'high',
  },
  groove: {
    energy: 'medium',
    tempo: 'low-to-mid',
    focus: 'balanced',
    mood: ['rhythmic', 'soulful', 'relaxed', 'danceable'],
    danceability: 'high',
  },
  'hip-hop': {
    energy: 'medium',
    tempo: 'low-to-mid',
    focus: 'towards vocal',
    mood: ['diverse', 'confident', 'rhythmic', 'urban'],
    danceability: 'medium',
  },
  'r-n-b': {
    energy: 'low-to-mid',
    tempo: 'low-to-mid',
    focus: 'towards vocal',
    mood: ['smooth', 'romantic', 'soulful', 'sensual'],
    danceability: 'medium',
  },
  soul: {
    energy: 'medium',
    tempo: 'low-to-mid',
    focus: 'towards vocal',
    mood: ['soulful', 'emotional', 'passionate', 'uplifting'],
    danceability: 'medium',
  },
  acoustic: {
    energy: 'low',
    tempo: 'low-to-mid',
    focus: 'balanced',
    mood: ['calm', 'intimate', 'organic', 'mellow'],
    danceability: 'low',
  },
  bluegrass: {
    energy: 'high',
    tempo: 'high',
    focus: 'towards instrumental',
    mood: ['energetic', 'joyful', 'virtuosic', 'rustic'],
    danceability: 'high',
  },
  blues: {
    energy: 'low-to-mid',
    tempo: 'low',
    focus: 'balanced',
    mood: ['melancholic', 'soulful', 'raw', 'cathartic'],
    danceability: 'low-to-mid',
  },
  country: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'towards vocal',
    mood: ['nostalgic', 'heartfelt', 'storytelling', 'sincere'],
    danceability: 'medium',
  },
  folk: {
    energy: 'low',
    tempo: 'low-to-mid',
    focus: 'towards vocal',
    mood: ['storytelling', 'sincere', 'traditional', 'reflective'],
    danceability: 'low',
  },
  'honky-tonk': {
    energy: 'medium',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['rowdy', 'melancholic', 'heartbroken', 'lively'],
    danceability: 'high',
  },
  'singer-songwriter': {
    energy: 'low',
    tempo: 'low-to-mid',
    focus: 'towards vocal',
    mood: ['introspective', 'personal', 'sincere', 'melancholic'],
    danceability: 'low',
  },
  songwriter: {
    energy: 'low',
    tempo: 'low-to-mid',
    focus: 'towards vocal',
    mood: ['introspective', 'lyrical', 'sincere', 'emotional'],
    danceability: 'low',
  },
  afrobeat: {
    energy: 'high',
    tempo: 'medium',
    focus: 'towards instrumental',
    mood: ['energetic', 'political', 'hypnotic', 'complex'],
    danceability: 'high',
  },
  'bossa nova': {
    energy: 'low',
    tempo: 'low-to-mid',
    focus: 'balanced',
    mood: ['relaxed', 'smooth', 'intimate', 'melancholic'],
    danceability: 'low-to-mid',
  },
  brazil: {
    energy: 'variable',
    tempo: 'variable',
    focus: 'balanced',
    mood: ['vibrant', 'rhythmic', 'diverse', 'joyful'],
    danceability: 'high',
  },
  british: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['diverse', 'melodic', 'rebellious', 'traditional'],
    danceability: 'medium',
  },
  cantopop: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'towards vocal',
    mood: ['melodic', 'romantic', 'sentimental', 'dramatic'],
    danceability: 'low-to-mid',
  },
  dancehall: {
    energy: 'mid-to-high',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['energetic', 'raw', 'rhythmic', 'confrontational'],
    danceability: 'high',
  },
  forro: {
    energy: 'mid-to-high',
    tempo: 'mid-to-high',
    focus: 'balanced',
    mood: ['joyful', 'lively', 'festive', 'nostalgic'],
    danceability: 'high',
  },
  french: {
    energy: 'low-to-mid',
    tempo: 'low-to-mid',
    focus: 'towards vocal',
    mood: ['romantic', 'elegant', 'melancholic', 'poetic'],
    danceability: 'low',
  },
  german: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['diverse', 'upbeat', 'melodic', 'sentimental'],
    danceability: 'medium',
  },
  reggae: {
    energy: 'low-to-mid',
    tempo: 'low-to-mid',
    focus: 'balanced',
    mood: ['relaxed', 'soulful', 'spiritual', 'political'],
    danceability: 'high',
  },
  reggaeton: {
    energy: 'mid-to-high',
    tempo: 'low-to-mid',
    focus: 'balanced',
    mood: ['energetic', 'sensual', 'rhythmic', 'party-oriented'],
    danceability: 'high',
  },
  salsa: {
    energy: 'high',
    tempo: 'high',
    focus: 'balanced',
    mood: ['energetic', 'festive', 'passionate', 'rhythmic'],
    danceability: 'high',
  },
  samba: {
    energy: 'high',
    tempo: 'high',
    focus: 'balanced',
    mood: ['joyful', 'energetic', 'festive', 'celebratory'],
    danceability: 'high',
  },
  spanish: {
    energy: 'medium',
    tempo: 'variable',
    focus: 'balanced',
    mood: ['passionate', 'dramatic', 'rhythmic', 'melancholic'],
    danceability: 'medium',
  },
  tango: {
    energy: 'medium',
    tempo: 'low-to-mid',
    focus: 'balanced',
    mood: ['passionate', 'dramatic', 'melancholic', 'intense'],
    danceability: 'high',
  },
  turkish: {
    energy: 'variable',
    tempo: 'variable',
    focus: 'balanced',
    mood: ['diverse', 'melodic', 'rhythmic', 'melancholic'],
    danceability: 'medium',
  },
  anime: {
    energy: 'high',
    tempo: 'high',
    focus: 'balanced',
    mood: ['energetic', 'dramatic', 'uplifting', 'emotional'],
    danceability: 'low-to-mid',
  },
  children: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'towards vocal',
    mood: ['happy', 'playful', 'simple', 'educational'],
    danceability: 'high',
  },
  classical: {
    energy: 'variable',
    tempo: 'variable',
    focus: 'towards instrumental',
    mood: ['diverse', 'complex', 'emotional', 'formal'],
    danceability: 'low',
  },
  comedy: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'towards vocal',
    mood: ['humorous', 'playful', 'satirical', 'lighthearted'],
    danceability: 'low-to-mid',
  },
  disney: {
    energy: 'medium',
    tempo: 'variable',
    focus: 'towards vocal',
    mood: ['magical', 'uplifting', 'nostalgic', 'emotional'],
    danceability: 'low-to-mid',
  },
  happy: {
    energy: 'mid-to-high',
    tempo: 'mid-to-high',
    focus: 'balanced',
    mood: ['joyful', 'uplifting', 'positive', 'energetic'],
    danceability: 'high',
  },
  holidays: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'towards vocal',
    mood: ['festive', 'nostalgic', 'joyful', 'sentimental'],
    danceability: 'low-to-mid',
  },
  indie: {
    energy: 'low-to-mid',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['introspective', 'melancholic', 'authentic', 'lo-fi'],
    danceability: 'low-to-mid',
  },
  'indie-pop': {
    energy: 'medium',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['catchy', 'quirky', 'bittersweet', 'upbeat'],
    danceability: 'medium',
  },
  'j-dance': {
    energy: 'high',
    tempo: 'high',
    focus: 'balanced',
    mood: ['energetic', 'euphoric', 'upbeat', 'synthetic'],
    danceability: 'high',
  },
  'j-idol': {
    energy: 'high',
    tempo: 'high',
    focus: 'towards vocal',
    mood: ['cute', 'energetic', 'happy', 'polished'],
    danceability: 'high',
  },
  'j-pop': {
    energy: 'mid-to-high',
    tempo: 'mid-to-high',
    focus: 'balanced',
    mood: ['energetic', 'melodic', 'upbeat', 'polished'],
    danceability: 'medium',
  },
  'j-rock': {
    energy: 'high',
    tempo: 'high',
    focus: 'balanced',
    mood: ['energetic', 'melodic', 'dramatic', 'aggressive'],
    danceability: 'low-to-mid',
  },
  jazz: {
    energy: 'variable',
    tempo: 'variable',
    focus: 'towards instrumental',
    mood: ['diverse', 'sophisticated', 'improvisational', 'soulful'],
    danceability: 'low-to-mid',
  },
  'k-pop': {
    energy: 'high',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['energetic', 'polished', 'catchy', 'upbeat'],
    danceability: 'high',
  },
  latin: {
    energy: 'high',
    tempo: 'mid-to-high',
    focus: 'balanced',
    mood: ['rhythmic', 'passionate', 'festive', 'energetic'],
    danceability: 'high',
  },
  latino: {
    energy: 'high',
    tempo: 'mid-to-high',
    focus: 'balanced',
    mood: ['rhythmic', 'passionate', 'energetic', 'festive'],
    danceability: 'high',
  },
  movies: {
    energy: 'variable',
    tempo: 'variable',
    focus: 'towards instrumental',
    mood: ['diverse', 'epic', 'emotional', 'dramatic'],
    danceability: 'low',
  },
  'new-age': {
    energy: 'low',
    tempo: 'low',
    focus: 'towards instrumental',
    mood: ['calm', 'meditative', 'spiritual', 'relaxing'],
    danceability: 'low',
  },
  opera: {
    energy: 'high',
    tempo: 'variable',
    focus: 'towards vocal',
    mood: ['dramatic', 'emotional', 'grand', 'tragic'],
    danceability: 'low',
  },
  party: {
    energy: 'high',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['fun', 'energetic', 'upbeat', 'social'],
    danceability: 'high',
  },
  piano: {
    energy: 'variable',
    tempo: 'variable',
    focus: 'towards instrumental',
    mood: ['diverse', 'emotional', 'intimate', 'melodic'],
    danceability: 'low',
  },
  pop: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'towards vocal',
    mood: ['catchy', 'upbeat', 'melodic', 'polished'],
    danceability: 'high',
  },
  'pop-film': {
    energy: 'medium',
    tempo: 'variable',
    focus: 'towards vocal',
    mood: ['emotional', 'uplifting', 'dramatic', 'anthemic'],
    danceability: 'low',
  },
  'power-pop': {
    energy: 'high',
    tempo: 'mid-to-high',
    focus: 'balanced',
    mood: ['energetic', 'catchy', 'melodic', 'upbeat'],
    danceability: 'high',
  },
  sad: {
    energy: 'low',
    tempo: 'low',
    focus: 'towards vocal',
    mood: ['melancholic', 'somber', 'introspective', 'heartbreaking'],
    danceability: 'low',
  },
  'show-tunes': {
    energy: 'medium',
    tempo: 'variable',
    focus: 'towards vocal',
    mood: ['theatrical', 'dramatic', 'emotional', 'storytelling'],
    danceability: 'low-to-mid',
  },
  sleep: {
    energy: 'low',
    tempo: 'low',
    focus: 'towards instrumental',
    mood: ['calm', 'soothing', 'peaceful', 'relaxing'],
    danceability: 'low',
  },
  soundtracks: {
    energy: 'variable',
    tempo: 'variable',
    focus: 'towards instrumental',
    mood: ['diverse', 'atmospheric', 'narrative', 'emotional'],
    danceability: 'low',
  },
  summer: {
    energy: 'mid-to-high',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['happy', 'carefree', 'upbeat', 'relaxed'],
    danceability: 'high',
  },
  swedish: {
    energy: 'medium',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['melodic', 'polished', 'catchy', 'euphoric'],
    danceability: 'high',
  },
  'synth-pop': {
    energy: 'medium',
    tempo: 'medium',
    focus: 'balanced',
    mood: ['melodic', 'nostalgic', 'synthetic', 'rhythmic'],
    danceability: 'high',
  },
};

// Helper function to get genre data with fallback
export const getGenreData = (genreName) => {
  if (!genreName) return null;
  
  // Try exact match first
  const exactMatch = genreData[genreName.toLowerCase()];
  if (exactMatch) return exactMatch;
  
  // Try partial matches
  const partialMatches = Object.keys(genreData).filter(key => 
    key.includes(genreName.toLowerCase()) || genreName.toLowerCase().includes(key)
  );
  
  if (partialMatches.length > 0) {
    return genreData[partialMatches[0]];
  }
  
  return null;
};

// Helper function to format energy level
export const formatEnergyLevel = (energy) => {
  switch (energy) {
    case 'low': return 'Low';
    case 'low-to-mid': return 'Low-Medium';
    case 'medium': return 'Medium';
    case 'mid-to-high': return 'Medium-High';
    case 'high': return 'High';
    case 'variable': return 'Variable';
    default: return 'Medium';
  }
};

// Helper function to format tempo
export const formatTempo = (tempo) => {
  switch (tempo) {
    case 'low': return 'Slow (60-80 BPM)';
    case 'low-to-mid': return 'Slow-Medium (80-100 BPM)';
    case 'medium': return 'Medium (100-120 BPM)';
    case 'mid-to-high': return 'Medium-Fast (120-140 BPM)';
    case 'high': return 'Fast (140+ BPM)';
    case 'variable': return 'Variable tempo range';
    default: return 'Variable tempo range';
  }
};

// Helper function to format focus
export const formatFocus = (focus) => {
  switch (focus) {
    case 'balanced': return 'Balanced';
    case 'towards instrumental': return 'Instrumental-focused';
    case 'towards vocal': return 'Vocal-focused';
    case 'variable': return 'Variable focus';
    default: return 'Balanced';
  }
};

// Helper function to format danceability
export const formatDanceability = (danceability) => {
  switch (danceability) {
    case 'low': return 'Low';
    case 'low-to-mid': return 'Low-Medium';
    case 'medium': return 'Medium';
    case 'high': return 'High';
    case 'variable': return 'Variable';
    default: return 'Medium';
  }
};
