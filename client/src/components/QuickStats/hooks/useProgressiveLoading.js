import { useState, useCallback } from 'react';

/**
 * useProgressiveLoading Hook
 * 
 * Manages loading states for individual QuickStats components
 * Allows components to show up progressively as their data becomes ready
 * 
 * BENEFITS:
 * ✅ Centralized loading state management
 * ✅ Progressive rendering - components appear as ready
 * ✅ Performance optimization - only render what's ready
 * ✅ Reusable across different components
 */
export const useProgressiveLoading = () => {
  const [loadingStates, setLoadingStates] = useState({
    basicStats: false,      // Top artist/song
    genres: false,          // Genres
    albumsDecades: false,   // Top albums and decades
    popularity: false,      // Average popularity
    yearAnalysis: false,    // Year analysis
    trackPopularity: false, // Track popularity
    listeningEvolution: false, // Listening evolution
    timeOfDay: false,      // Time of day
    listenerType: false    // Listener type
  });

  const setLoadingState = useCallback((key, value) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const shouldShowCard = useCallback((cardType) => {
    return loadingStates[cardType] || false;
  }, [loadingStates]);

  const setMultipleLoadingStates = useCallback((states) => {
    setLoadingStates(prev => ({
      ...prev,
      ...states
    }));
  }, []);

  const resetLoadingStates = useCallback(() => {
    setLoadingStates({
      basicStats: false,
      genres: false,
      albumsDecades: false,
      popularity: false,
      yearAnalysis: false,
      trackPopularity: false,
      listeningEvolution: false,
      timeOfDay: false,
      listenerType: false
    });
  }, []);

  return {
    loadingStates,
    setLoadingState,
    setMultipleLoadingStates,
    resetLoadingStates,
    shouldShowCard
  };
};
