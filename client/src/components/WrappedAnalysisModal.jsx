import React, { useEffect, useState, useRef } from 'react';
import { fetchTrackMetrics } from '../utils/fetchTrackMetrics';
import { lookupTrackMBID, getTrackISRC, setTrackISRC, setTrackMBID, getTrackMBID } from '../utils/spotifyIdToMBID';
import styles from './WrappedAnalysisModal.module.css'; // Import the CSS module
import WrappedResultsModal from './WrappedResultsModal';
import { getApiBaseUrl } from '../config/api';

// Mobile detection hook
const useIsMobile = (breakpoint = 760) => {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
};

export default function WrappedAnalysisModal({ open, onClose, tracks }) {
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [stepDetails, setStepDetails] = useState('');
  const [expandedStatuses, setExpandedStatuses] = useState(new Set());
  const isMobile = useIsMobile(760);
  
  // Add ref for cancellation
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!open || !tracks || tracks.length === 0) return;

    // Create new AbortController for this analysis session
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const analyzeTracks = async () => {
      setLoading(true);
      setResults(null);
      setShowResults(false);
      
      // Track all API calls made in the entire process
      let totalApiCalls = 0;
      let spotifyApiCalls = 0;
      let musicbrainzApiCalls = 0;
      let acousticbrainzApiCalls = 0;
      
      // Check if modal was closed before starting
      if (signal.aborted) return;
      
      // Step 1: Explain the process and filter unique tracks
      setCurrentStep('Initializing Analysis');
      setStepDetails('Filtering out duplicate tracks and preparing for analysis...');
      
      // Filter out duplicate tracks based on Spotify track ID
      const uniqueTracks = [];
      const seenTrackIds = new Set();
      
      tracks.forEach(track => {
        if (track.id && !seenTrackIds.has(track.id)) {
          seenTrackIds.add(track.id);
          uniqueTracks.push(track);
        } else if (!track.id) {
          // If no Spotify ID, use name+artist as fallback for uniqueness
          const trackKey = `${track.name}-${track.artist || (track.artists ? track.artists.map(a => a.name).join(", ") : '')}`;
          if (!seenTrackIds.has(trackKey)) {
            seenTrackIds.add(trackKey);
            uniqueTracks.push(track);
          }
        }
      });
      
      console.log(`Original tracks: ${tracks.length}, Unique tracks: ${uniqueTracks.length}`);
      if (tracks.length > uniqueTracks.length) {
        console.log(`Skipped ${tracks.length - uniqueTracks.length} duplicate tracks`);
      }
      
      setProgress({ done: 0, total: uniqueTracks.length });

      let initialStatuses = uniqueTracks.map(track => ({
        name: track.name,
        artist: track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : ''),
        status: 'Queued',
        details: 'Waiting to start analysis...'
      }));
      setStatuses(initialStatuses);

      // Step 2: Sequential MBID lookup - get ALL MBIDs before proceeding
      setCurrentStep('MBID Lookup Phase');
      setStepDetails('Looking up MusicBrainz IDs (MBIDs) for each track. This is required to fetch acoustic analysis data.');
      
      const tracksWithMbids = [];
      
      // Process tracks sequentially to get all MBIDs
      for (let i = 0; i < uniqueTracks.length; i++) {
        // Check if modal was closed
        if (signal.aborted) {
          console.log('Analysis cancelled during MBID lookup phase');
          return;
        }

        const track = uniqueTracks[i];
        const newStatuses = [...initialStatuses];
        
        newStatuses[i].status = 'Checking cache...';
        newStatuses[i].details = 'Looking for cached MBID...';
        setStatuses(newStatuses);

        let mbid = getTrackMBID(track.id);
        let mbidWasCached = !!mbid && mbid !== 'Not Found';
        
        if (!mbidWasCached) {
          newStatuses[i].status = 'Fetching MBID...';
          newStatuses[i].details = 'MBID not in cache, fetching from MusicBrainz...';
          setStatuses([...newStatuses]);
          
          mbid = await lookupTrackMBID(track.id);
          if (mbid) {
            let isrc = getTrackISRC(track.id);
            if (!isrc || isrc === 'Not found') {
              newStatuses[i].details = 'MBID found! Now fetching ISRC from Spotify...';
              setStatuses([...newStatuses]);
              
              try {
                const isrcRes = await fetch(`${getApiBaseUrl()}/track-isrc/${track.id}`, {
          credentials: 'include'
        });
                if (isrcRes.ok) {
                  const isrcData = await isrcRes.json();
                  isrc = isrcData.isrc || 'Not found';
                  setTrackISRC(track.id, isrc);
                }
              } catch {}
            }
            setTrackMBID(track.id, mbid);
          }
        }

        if (mbid) {
          newStatuses[i].status = 'MBID Found';
          newStatuses[i].details = mbidWasCached ? 'MBID found in cache' : 'MBID successfully fetched';
          setStatuses([...newStatuses]);
          tracksWithMbids.push({ ...track, mbid });
        } else {
          newStatuses[i].status = 'Skipped (no MBID)';
          newStatuses[i].details = 'No MBID available';
          setStatuses([...newStatuses]);
          tracksWithMbids.push({ ...track, mbid: null });
        }
        
        // Update progress for MBID phase
        const mbidProgress = i + 1;
        setProgress({ done: mbidProgress, total: uniqueTracks.length });
        
        // Wait between tracks (except for the last one)
        if (i < uniqueTracks.length - 1) {
          setCurrentStep('MBID Lookup Phase');
          setStepDetails(`MBID search (${mbidProgress}/${uniqueTracks.length} complete)`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Check if modal was closed after MBID lookup
      if (signal.aborted) {
        console.log('Analysis cancelled after MBID lookup phase');
        return;
      }
      
      // Log summary of MBID lookup results
      const successfulMbids = tracksWithMbids.filter(t => t.mbid).length;
      const failedMbids = tracksWithMbids.filter(t => !t.mbid).length;
      console.log(`MBID Lookup Complete: ${successfulMbids} successful, ${failedMbids} failed`);
      
      setCurrentStep('MBID Lookup Complete');
      setStepDetails(`MBID lookup finished! Found ${successfulMbids} MBIDs, ${failedMbids} tracks skipped. Proceeding to analysis phase...`);
      
      // Wait a moment before starting analysis
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: MBID lookup phase - check cache for ALL songs simultaneously, then fetch missing ones
      setCurrentStep('MBID Lookup Phase');
      setStepDetails(`Checking cache for existing MBIDs...`);
      
      // STEP 3a: Quick cache check for ALL songs simultaneously (O(n) but very fast)
      const tracksWithCachedMbids = [];
      const tracksNeedingMbids = [];
      const uncachedTrackIds = [];
      
      for (let i = 0; i < tracksWithMbids.length; i++) {
        const track = tracksWithMbids[i];
        const cachedMbid = getTrackMBID(track.id);
        
        if (cachedMbid && cachedMbid !== 'Not Found') {
          // Update track with cached MBID
          track.mbid = cachedMbid;
          tracksWithCachedMbids.push({ track, index: i });
        } else {
          tracksNeedingMbids.push({ track, index: i });
          uncachedTrackIds.push(track.id);
        }
      }
      
      console.log(`[Wrapped Analysis] Cache check: ${tracksWithCachedMbids.length}/${tracksWithMbids.length} tracks found in cache (${((tracksWithCachedMbids.length / tracksWithMbids.length) * 100).toFixed(1)}% hit rate)`);
      
      // STEP 3b: If we have uncached tracks, send ALL of them to backend in ONE request
      if (uncachedTrackIds.length > 0) {
        setStepDetails(`Fetching MBIDs for ${uncachedTrackIds.length} uncached tracks...`);
        
        try {
          // Send ALL uncached track IDs in a single request (backend will handle batching)
          const mbidRes = await fetch(`${getApiBaseUrl()}/batch-isrc-mbid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackIds: uncachedTrackIds }),
            signal: signal,
            credentials: 'include'
          });
          
          if (mbidRes.ok) {
            const mbidData = await mbidRes.json();
            console.log(`[Wrapped Analysis] MBID lookup: ${mbidData.tracksWithMbids.length}/${uncachedTrackIds.length} tracks found (${((mbidData.tracksWithMbids.length/uncachedTrackIds.length)*100).toFixed(1)}% success rate)`);
            
            // Track API calls from MBID lookup
            if (mbidData.summary && mbidData.summary.apiCalls) {
              spotifyApiCalls += mbidData.summary.apiCalls.spotify;
              musicbrainzApiCalls += mbidData.summary.apiCalls.musicbrainz;
              totalApiCalls += mbidData.summary.apiCalls.total;
            }
            
            // Update tracks with MBIDs and cache them
            mbidData.tracksWithMbids.forEach(trackWithMbid => {
              const trackItem = tracksNeedingMbids.find(item => item.track.id === trackWithMbid.id);
              if (trackItem) {
                trackItem.track.mbid = trackWithMbid.mbid;
                // Cache the MBID
                setTrackMBID(trackWithMbid.id, trackWithMbid.mbid);
                // Cache the ISRC if available
                if (trackWithMbid.isrc) {
                  setTrackISRC(trackWithMbid.id, trackWithMbid.isrc);
                }
              }
            });
            
            // Update progress
            setProgress({ done: tracksWithMbids.length, total: tracksWithMbids.length });
            
          } else {
            console.error(`[Wrapped Analysis] MBID lookup failed:`, mbidRes.status);
          }
          
    } catch (error) {
          if (error.name === 'AbortError') {
            console.log('MBID lookup request was aborted');
            return;
          }
          console.error(`[Wrapped Analysis] MBID lookup error:`, error);
        }
      }
      
      // Now all tracks should have MBIDs (either from cache or fresh lookup)
      const tracksWithMbidsFinal = tracksWithMbids.filter(track => track.mbid && track.mbid !== 'Not Found');
      const tracksWithoutMbids = tracksWithMbids.filter(track => !track.mbid || track.mbid === 'Not Found');
      
      // Step 4: Analysis phase - now with all MBIDs
      setCurrentStep('Analysis Phase');
      setStepDetails(`Starting acoustic analysis for ${tracksWithMbidsFinal.length} tracks with MBIDs. This involves fetching high-level and low-level acoustic features from AcousticBrainz.`);
      
      // Reset progress for analysis phase
      let done = 0;
      const total = tracksWithMbidsFinal.length;
      setProgress({ done, total });
      
      // Create final statuses array that matches the filtered tracks exactly
      let finalStatuses = tracksWithMbidsFinal.map(track => ({
        name: track.name,
        artist: track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : ''),
        status: 'Queued for Analysis...',
        details: 'Waiting for analysis...',
        trackId: track.id // Add track ID for reference
      }));
      setStatuses(finalStatuses);

      // Step 5: Batch analysis - send ALL tracks in a single request
      const analysisResults = [];
      
      // Prepare tracks needing analysis (no caching for high-level/low-level data)
      const tracksNeedingAnalysis = tracksWithMbidsFinal.map((track, index) => ({ track, index }));
      
      // Add tracks without MBIDs to results
      tracksWithoutMbids.forEach(track => {
        analysisResults.push({ track, highLevel: null, lowLevel: null, success: false, reason: 'No MBID' });
      });
      
      // If we have tracks that need analysis, send them ALL in one request
      if (tracksNeedingAnalysis.length > 0) {
        setCurrentStep('Analysis Phase');
        setStepDetails(`Sending ${tracksNeedingAnalysis.length} tracks for analysis...`);
        
        // Update all tracks to show they're being processed
        for (let i = 0; i < tracksNeedingAnalysis.length; i++) {
          const { index } = tracksNeedingAnalysis[i];
          finalStatuses[index].status = 'Processing...';
          finalStatuses[index].details = 'Analysis in progress...';
          setStatuses([...finalStatuses]);
        }
        
        try {
          // Send ALL tracks needing analysis in a single request
          const analysisRes = await fetch(`${getApiBaseUrl()}/wrapped-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tracks: tracksNeedingAnalysis.map(t => t.track) }),
            signal: signal,
            credentials: 'include'
          });

          if (analysisRes.ok) {
            const analysisData = await analysisRes.json();
            
            // Check if analysis was cancelled by user
            if (analysisData.error === 'Analysis stopped by user') {
              console.log('[Wrapped Analysis] Analysis was cancelled by user on server');
              setStepDetails('Analysis was cancelled by user');
              setLoading(false);
              return;
            }
            
            // Process results for each track with real-time UI updates
            for (let i = 0; i < tracksNeedingAnalysis.length; i++) {
              const { track, index } = tracksNeedingAnalysis[i];
              
              const result = analysisData.results.find(r => r.track.id === track.id);
              
              // Update step details to show current progress
              setStepDetails(`Processing results: ${i + 1}/${tracksNeedingAnalysis.length} tracks completed`);
              
              // Update status immediately for this track
              if (result && result.success) {
                // No caching for high-level/low-level analysis data
                
                finalStatuses[index].status = 'Done';
                finalStatuses[index].details = 'Analysis completed successfully';
                const successfulResult = {
                  track,
                  highLevel: result.highLevel,
                  lowLevel: result.lowLevel,
                  success: true
                };
                analysisResults.push(successfulResult);
              } else {
                finalStatuses[index].status = 'Skipped (no analysis data)';
                finalStatuses[index].details = 'Analysis Request Failed';
                const failedResult = {
                  track,
                  highLevel: null,
                  lowLevel: null,
                  success: false,
                  reason: result?.error || 'Analysis failed'
                };
                analysisResults.push(failedResult);
              }
              
              // Update progress and UI immediately for each track
              done++;
              setProgress({ done, total });
              
              // Update statuses array and trigger UI refresh
              setStatuses([...finalStatuses]);
              
              // Small delay to make the updates visible to user
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          } else {
            // Handle server error for all tracks
            for (let i = 0; i < tracksNeedingAnalysis.length; i++) {
              const { track, index } = tracksNeedingAnalysis[i];
              finalStatuses[index].status = 'Skipped (API error)';
              finalStatuses[index].details = 'Analysis Request Failed';
              analysisResults.push({
                track,
                highLevel: null,
                lowLevel: null,
                success: false,
                reason: 'Server error'
              });
              done++;
              setStatuses([...finalStatuses]);
              setProgress({ done, total });
            }
          }
    } catch (error) {
          // Check if this is an abort error
          if (error.name === 'AbortError') {
            console.log('Analysis request was aborted');
            return;
          }
          
          // Handle network error for all tracks
          for (let i = 0; i < tracksNeedingAnalysis.length; i++) {
            const { track, index } = tracksNeedingAnalysis[i];
            finalStatuses[index].status = 'Skipped (network error)';
            finalStatuses[index].details = 'Analysis Request Failed';
            analysisResults.push({
              track,
              highLevel: null,
              lowLevel: null,
              success: false,
              reason: `Network error: ${error.message}`
            });
            done++;
            setStatuses([...finalStatuses]);
            setProgress({ done, total });
          }
        }
      }

      // Check if modal was closed before retry phase
      if (signal.aborted) {
        console.log('Analysis cancelled before retry phase');
        return;
      }

      // Step 5: Batch retry for tracks that failed analysis (only once)
      const failedTracks = analysisResults.filter(r => r.mbid && !r.success);
      if (failedTracks.length > 0) {
        setCurrentStep('Retry Phase');
        setStepDetails(`Retrying analysis for ${failedTracks.length} tracks that failed initially using batch processing...`);
        
        try {
          // Send ALL failed tracks in a single batch retry request
          const analysisRes = await fetch(`${getApiBaseUrl()}/wrapped-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tracks: failedTracks.map(f => f.track) }),
            signal: signal,
            credentials: 'include'
          });

                  if (analysisRes.ok) {
          const analysisData = await analysisRes.json();
            
            // Check if analysis was cancelled by user
            if (analysisData.error === 'Analysis stopped by user') {
              console.log('[Wrapped Analysis] Retry analysis was cancelled by user on server');
              setStepDetails('Retry analysis was cancelled by user');
              setLoading(false);
              return;
            }
            
            // Process retry results for each failed track with real-time updates
            for (let i = 0; i < failedTracks.length; i++) {
              const failedTrack = failedTracks[i];
              const trackIndex = tracksWithMbids.findIndex(t => t.id === failedTrack.track.id);
              
              if (trackIndex === -1) continue;
              
              // Update step details to show retry progress
              setStepDetails(`Processing retry results: ${i + 1}/${failedTracks.length} tracks completed`);
              
              const result = analysisData.results.find(r => r.track.id === failedTrack.track.id);
              
              if (result && result.success) {
                // No caching for high-level/low-level analysis data
                
                finalStatuses[trackIndex].status = 'Done (retry success)';
                finalStatuses[trackIndex].details = 'Analysis completed successfully on retry';
                
                // Update the result
                const resultIndex = analysisResults.findIndex(r => r.track.id === failedTrack.track.id);
                if (resultIndex !== -1) {
                  analysisResults[resultIndex] = {
                    track: failedTrack.track,
                    highLevel: result.highLevel,
                    lowLevel: result.lowLevel,
                    success: true,
                    fromRetry: true
                  };
                }
              } else {
                finalStatuses[trackIndex].status = 'Skipped (retry failed)';
                finalStatuses[trackIndex].details = 'Analysis Request Failed on retry';
              }
              
              // Update statuses and trigger UI refresh
              setStatuses([...finalStatuses]);
              
              // Small delay to make the updates visible to user
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          } else {
            // Handle server error for all retry tracks
            for (let i = 0; i < failedTracks.length; i++) {
              const failedTrack = failedTracks[i];
              const trackIndex = tracksWithMbids.findIndex(t => t.id === failedTrack.track.id);
              
              if (trackIndex !== -1) {
                finalStatuses[trackIndex].status = 'Skipped (retry failed)';
                finalStatuses[trackIndex].details = 'Analysis Request Failed on retry';
                setStatuses([...finalStatuses]);
              }
            }
          }
    } catch (error) {
          // Check if this is an abort error
          if (error.name === 'AbortError') {
            console.log('Retry analysis request was aborted');
            return;
          }
          
          // Handle network error for all retry tracks
          for (let i = 0; i < failedTracks.length; i++) {
            const failedTrack = failedTracks[i];
            const trackIndex = tracksWithMbids.findIndex(t => t.id === failedTrack.track.id);
            
            if (trackIndex !== -1) {
              finalStatuses[trackIndex].status = 'Skipped (retry failed)';
              finalStatuses[trackIndex].details = 'Analysis Request Failed on retry';
              setStatuses([...finalStatuses]);
            }
          }
        }
      }

      // Final step: Complete
      setCurrentStep('Analysis Complete');
      setStepDetails(`Analysis finished! Successfully analyzed ${analysisResults.filter(r => r.success).length}/${total} tracks.`);
      
      const successfulCount = analysisResults.filter(r => r.success).length;
      const failedCount = analysisResults.filter(r => !r.success).length;
      
      // Calculate AcousticBrainz API calls (estimate based on batch size)
      const estimatedBatches = Math.ceil(tracksNeedingAnalysis.length / 25); // Assuming 25 MBIDs per batch
      acousticbrainzApiCalls = estimatedBatches * 2; // high-level + low-level for each batch
      totalApiCalls += acousticbrainzApiCalls;
      
      console.log(`[Wrapped Analysis] ===== ANALYSIS COMPLETE =====`);
      console.log(`[Wrapped Analysis] Total tracks: ${analysisResults.length}`);
      console.log(`[Wrapped Analysis] Successfully analyzed: ${successfulCount}/${analysisResults.length} (${((successfulCount/analysisResults.length)*100).toFixed(1)}%)`);
      console.log(`[Wrapped Analysis] Failed analysis: ${failedCount}/${analysisResults.length} (${((failedCount/analysisResults.length)*100).toFixed(1)}%)`);
      console.log(`[Wrapped Analysis] API Calls Breakdown:`);
      console.log(`[Wrapped Analysis]   • Spotify API: ${spotifyApiCalls} (ISRC fetching)`);
      console.log(`[Wrapped Analysis]   • MusicBrainz API: ${musicbrainzApiCalls} (MBID lookup)`);
      console.log(`[Wrapped Analysis]   • AcousticBrainz API: ${acousticbrainzApiCalls} (high-level + low-level analysis)`);
      console.log(`[Wrapped Analysis] Total API calls: ${spotifyApiCalls + musicbrainzApiCalls + acousticbrainzApiCalls}`);
      console.log(`[Wrapped Analysis] ==========================================`);
      
      setResults(analysisResults);
      setLoading(false);
      
      // Don't automatically show results - let user click button
      // setShowResults(true);
    };

    analyzeTracks();

    // Cleanup function to abort ongoing requests when modal is closed
    return () => {
      if (abortControllerRef.current) {
        console.log('Aborting ongoing analysis requests');
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [open, tracks]);

  // Additional cleanup when modal is closed
  useEffect(() => {
    if (!open && abortControllerRef.current) {
      console.log('Modal closed, aborting ongoing requests');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, [open]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (open) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Prevent scrolling by setting body to fixed position
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore scrolling when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  // Handle modal close with cleanup
  const handleClose = () => {
    if (abortControllerRef.current) {
      console.log('User stopped analyzing - aborting all requests');
      abortControllerRef.current.abort();
      abortControllerRef.current.current = null;
    }
    
    // Signal server to stop processing if analysis is in progress
    if (loading && currentStep === 'Analysis Phase') {
      console.log('Signaling server to stop AcousticBrainz analysis...');
      fetch(`${getApiBaseUrl()}/stop-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stop: true }),
        credentials: 'include'
      }).catch(() => {}); // Ignore errors if server is busy
    }
    
    setLoading(false);
    onClose();
  };

  if (!open) return null;

  const getStatusClass = (status) => {
    switch (status) {
      case 'Done':
      case 'Done (retry success)':
        return styles.statusDone;
      case 'Skipped (no MBID)':
      case 'Skipped (no analysis data)':
      case 'Skipped (API error)':
      case 'Skipped (network error)':
      case 'Skipped (retry failed)':
        return styles.statusError ? styles.statusError : styles.statusSkipped;
      case 'Fetching Analysis...':
      case 'Retrying Analysis...':
        return styles.statusFetching;
      default: return styles.statusDefault;
    }
  };

  const toggleStatusExpansion = (trackIndex) => {
    const newExpanded = new Set(expandedStatuses);
    if (newExpanded.has(trackIndex)) {
      newExpanded.delete(trackIndex);
    } else {
      newExpanded.add(trackIndex);
      // Auto-hide after 2 seconds
      setTimeout(() => {
        setExpandedStatuses(prev => {
          const updated = new Set(prev);
          updated.delete(trackIndex);
          return updated;
        });
      }, 2000);
    }
    setExpandedStatuses(newExpanded);
  };

  // Calculate number of successfully analyzed tracks
  const numDone = statuses.filter(s => s.status.includes('Done')).length;
  const totalTracks = statuses.length;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div onClick={e => e.stopPropagation()} className={styles.modalContent} style={{
        width: isMobile ? '95vw' : '75vw',
        maxWidth: isMobile ? '95vw' : '75vw',
        minWidth: isMobile ? 'auto' : '75vw',
        height: isMobile ? 'auto' : 'auto',
        maxHeight: isMobile ? '95vh' : '95vh',
        margin: isMobile ? '20px auto' : '20px auto',
        borderRadius: isMobile ? '12px' : '0',
      }}>
        <div className={styles.modalHeader} style={{ backgroundColor: '#1a1b1e' }}>
          <h2 className={styles.modalTitle}>Your Songs Wrapped</h2>
          <button onClick={handleClose} className={styles.closeButton}>&times;</button>
        </div>

        <div className={styles.modalBody} style={{ 
          overflowY: 'auto',
          maxHeight: isMobile ? '70vh' : 'calc(100vh - 80px)',
          height: isMobile ? '70vh' : 'calc(100vh - 80px)',
          padding: isMobile ? '20px' : '32px',
          paddingBottom: isMobile ? '20px' : '48px',
          boxSizing: 'border-box',
          backgroundColor: '#1a1b1e',
        }}>
          {!showResults && (
            <>
              {/* Current Step Display */}
              {loading && (
  <div style={{ 
                  background: 'rgba(28, 185, 85, 0.1)', 
                  border: '1px solid rgba(28, 185, 85, 0.3)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    textAlign: 'center'
  }}>
    <div style={{ 
      fontWeight: 700, 
                    color: '#1cb955', 
      fontSize: isMobile ? 16 : 18,
      marginBottom: 8
    }}>
      {currentStep}
    </div>
    <div style={{ 
                    color: '#16a34a', 
      fontSize: isMobile ? 14 : 16,
      lineHeight: 1.4
    }}>
      {stepDetails}
    </div>
      </div>
    )}

              {!loading && numDone > 0 && (
  <button
    style={{ 
      marginBottom: 24, 
                      background: '#1cb955', 
      color: '#fff', 
      fontWeight: 700, 
      fontSize: isMobile ? 16 : 18, 
      border: 'none', 
      borderRadius: 8, 
      padding: isMobile ? '10px 24px' : '12px 32px', 
      cursor: 'pointer', 
      boxShadow: '0 4px 24px #000a', 
      transition: 'background 0.18s',
      width: isMobile ? '100%' : 'auto'
    }}
                    onClick={() => setShowResults(true)}
  >
    View Wrapped Results
  </button>
              )}
              
              {/* No separate close button needed - the main button handles all cases */}
              
              {loading ? (
                <div className={styles.progressText} style={{ fontSize: isMobile ? 14 : 16, color: '#1cb955' }}>
                  Processing tracks... {progress.done} / {progress.total}
                </div>
              ) : (
                <div className={styles.progressText} style={{ fontSize: isMobile ? 14 : 16, color: '#1cb955' }}>
                  {numDone === 0 ? 'No songs analyzed successfully.' : `${numDone} songs have been analyzed successfully`}
                </div>
              )}
                              <div className={styles.progressBarContainer}>
                  <div className={styles.progressBar} style={{ 
                    width: loading ? `${progress.total ? (progress.done / progress.total) * 100 : 0}%` : '100%',
                    background: 'linear-gradient(90deg, #1cb955 0%, #16a34a 100%)'
                  }} />
                </div>
              
              {/* Status display - mobile vs desktop layout */}
              {isMobile ? (
                // Mobile layout - card-based design similar to NewTrackTable
                <div style={{ marginTop: 24 }}>
    <div style={{
                    fontWeight: 900, 
                    color: '#fff', 
                    marginBottom: 16, 
                    fontSize: '1.1rem', 
                    letterSpacing: 0.5,
                    textAlign: 'center'
                  }}>
                    Analysis Status ({statuses.length} unique tracks)
                    {tracks.length > statuses.length && (
                      <div style={{ fontSize: '0.8em', color: '#9ca3af', marginTop: 4, fontWeight: 400 }}>
                        {tracks.length - statuses.length} duplicates skipped
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    height: isMobile ? '50vh' : 'auto',
                    maxHeight: isMobile ? '50vh' : 'none',
                    overflowY: isMobile ? 'auto' : 'visible',
                    padding: '0 4px',
                    WebkitOverflowScrolling: 'touch',
                    minHeight: isMobile ? '200px' : 'auto'
                  }}>
                    {statuses.map((s, i) => {
                      // Find the correct track object using trackId or fallback to index
                      const track = s.trackId ? tracks.find(t => t.id === s.trackId) : tracks[i] || {};
                      // Album name
                      let album = track.album?.name || track.album || '--';
                      // Year
                      let year = track.release_year || (track.album?.release_date ? track.album.release_date.split('-')[0] : '');
                      if (!year) year = '--';
                      // Duration (ms to mm:ss)
                      let duration = track.duration_ms || track.duration || null;
                      if (duration) {
                        const mins = Math.floor(duration / 60000);
                        const secs = Math.floor((duration % 60000) / 1000).toString().padStart(2, '0');
                        duration = `${mins}:${secs}`;
                      } else {
                        duration = '--';
                      }
                      // Image
                      let img = track.album_image || track.album?.images?.[0]?.url || track.images?.[0]?.url || track.cover || null;
                      
                      // Status styling and text formatting for mobile
                      let statusStyle = {};
                      let statusText = s.status;
                      let isClickable = false;
                      
                      // For mobile, show simplified status that can be clicked for details
                      if (s.status.includes('Skipped')) {
                        statusStyle = {
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          cursor: 'pointer'
                        };
                        statusText = 'Failed';
                        isClickable = true;
                      } else if (s.status.includes('Done')) {
                        statusStyle = {
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#22c55e',
                          border: '1px solid rgba(34, 197, 94, 0.4)',
                          cursor: 'pointer'
                        };
                        statusText = 'Done';
                        isClickable = true;
                      } else if (s.status.includes('Fetching') || s.status.includes('Checking') || s.status.includes('Retrying')) {
                        statusStyle = {
                          background: 'rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.4)'
                        };
                      } else {
                        statusStyle = {
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.4)'
                        };
                      }
                      
                      return (
                        <div key={i} style={{
                          background: i % 2 === 0 ? 'rgba(32,32,32,0.92)' : 'rgba(24,24,24,0.92)',
      borderRadius: 14,
      padding: 14,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 2px 8px #0002',
      position: 'relative',
    }}>
                          {/* 1st Column: Cover Art */}
      <div>
        {img ? (
                              <img src={img} alt={album} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', background: '#232323' }} />
        ) : (
          <div style={{
                                width: 48, height: 48, borderRadius: '50%', 
                                background: ['#e57373','#64b5f6','#81c784','#ffd54f','#ba68c8','#4db6ac','#ffb74d','#a1887f'][i % 8],
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                fontWeight: 900, fontSize: 22, color: '#fff', textTransform: 'uppercase', 
            boxShadow: '0 2px 8px #0004',
                              }}>{s.name ? s.name[0] : '?'}</div>
        )}
      </div>
      
                          {/* 2nd Column: Song Info */}
      <div style={{ minWidth: 0 }}>
        <div style={{ 
                              fontWeight: 700, color: '#fff', fontSize: 14, 
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                            }}>
                              {s.name}
        </div>
        <div style={{ 
                              color: '#d1d5db', fontSize: 13, 
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                            }}>
                              {s.artist}
        </div>
        <div style={{
          color: '#b3b3b3',
          fontSize: 12,
          maxWidth: 120,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {album}
        </div>
        <div style={{ color: '#b3b3b3', fontSize: 11 }}>
          {year} • {duration}
        </div>
      </div>
      
                          {/* 3rd Column: Status and Track Number */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4
      }}>
        <div 
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            textAlign: 'center',
            minWidth: 70,
            ...statusStyle
          }}
                              onClick={isClickable ? () => toggleStatusExpansion(i) : undefined}
        >
          {statusText}
        </div>
        <div style={{
          fontSize: 10,
          color: '#b3b3b3',
          fontWeight: 600
        }}>
                              #{i + 1}
        </div>
        
                            {/* Expanded details when status is clicked */}
                            {isClickable && expandedStatuses.has(i) && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 8,
            padding: 12,
            marginTop: 8,
            minWidth: 200,
            zIndex: 10,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 8
            }}>
                                  {s.status}
            </div>
            <div style={{
              color: '#9ca3af',
              fontSize: 11,
              lineHeight: 1.4
            }}>
                                  {s.details}
            </div>
          </div>
        )}
      </div>
    </div>
  );
                    })}
                  </div>
                </div>
              ) : (
                // Desktop layout - card-based design (same as mobile)
                <div style={{ marginTop: 24 }}>
                  <div style={{ 
                    fontWeight: 900, 
                    color: '#fff', 
                    marginBottom: 16, 
                    fontSize: '1.1rem', 
                    letterSpacing: 0.5,
                    textAlign: 'center'
                  }}>
                    Analysis Status ({statuses.length} unique tracks)
                    {tracks.length > statuses.length && (
                      <div style={{ fontSize: '0.8em', color: '#9ca3af', marginTop: 4, fontWeight: 400 }}>
                        {tracks.length - statuses.length} duplicates skipped
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    padding: '0 4px',
                    WebkitOverflowScrolling: 'touch'
                  }}>
        {statuses.map((s, i) => {
          // Find the correct track object using trackId or fallback to index
          const track = s.trackId ? tracks.find(t => t.id === s.trackId) : tracks[i] || {};
          // Album name
          let album = track.album?.name || track.album || '--';
          // Year
          let year = track.release_year || (track.album?.release_date ? track.album.release_date.split('-')[0] : '');
          if (!year) year = '--';
          // Duration (ms to mm:ss)
          let duration = track.duration_ms || track.duration || null;
          if (duration) {
            const mins = Math.floor(duration / 60000);
            const secs = Math.floor((duration % 60000) / 1000).toString().padStart(2, '0');
            duration = `${mins}:${secs}`;
          } else {
            duration = '--';
          }
          // Image
          let img = track.album_image || track.album?.images?.[0]?.url || track.images?.[0]?.url || track.cover || null;
                      
                      // Status styling and text formatting
                      let statusStyle = {};
                      let statusText = s.status;
                      let isClickable = false;
                      
                      if (s.status.includes('Skipped')) {
                        statusStyle = {
      background: 'rgba(239, 68, 68, 0.2)',
      color: '#f87171',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      cursor: 'pointer'
    };
                        statusText = 'Failed';
                        isClickable = true;
                      } else if (s.status.includes('Done')) {
                        statusStyle = {
      background: 'rgba(34, 197, 94, 0.2)',
      color: '#22c55e',
      border: '1px solid rgba(34, 197, 94, 0.4)',
      cursor: 'pointer'
    };
                        statusText = 'Done';
                        isClickable = true;
                      } else if (s.status.includes('Fetching') || s.status.includes('Checking') || s.status.includes('Retrying')) {
                        statusStyle = {
      background: 'rgba(56, 189, 248, 0.2)',
      color: '#38bdf8',
      border: '1px solid rgba(56, 189, 248, 0.4)'
    };
  } else {
                        statusStyle = {
      background: 'rgba(245, 158, 11, 0.2)',
      color: '#f59e0b',
      border: '1px solid rgba(245, 158, 11, 0.4)'
    };
  }
                      
                      return (
                        <div key={i} style={{
                          background: i % 2 === 0 ? 'rgba(32,32,32,0.92)' : 'rgba(24,24,24,0.92)',
                          borderRadius: 14,
                          padding: 14,
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto',
                          alignItems: 'center',
                          gap: 12,
                          boxShadow: '0 2px 8px #0002',
                          position: 'relative',
                        }}>
                          {/* 1st Column: Cover Art */}
                          <div>
                            {img ? (
                              <img src={img} alt={album} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', background: '#232323' }} />
                            ) : (
                              <div style={{
                                width: 48, height: 48, borderRadius: '50%', 
                                background: ['#e57373','#64b5f6','#81c784','#ffd54f','#ba68c8','#4db6ac','#ffb74d','#a1887f'][i % 8],
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                fontWeight: 900, fontSize: 22, color: '#fff', textTransform: 'uppercase', 
                                boxShadow: '0 2px 8px #0004',
                              }}>{s.name ? s.name[0] : '?'}</div>
                            )}
                          </div>
                          
                          {/* 2nd Column: Song Info */}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: 700, color: '#fff', fontSize: 14, 
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                            }}>
                              {s.name}
                            </div>
                            <div style={{ 
                              color: '#d1d5db', fontSize: 13, 
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                            }}>
                              {s.artist}
                            </div>
                            <div style={{
                              color: '#b3b3b3',
                              fontSize: 12,
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {album}
                            </div>
                            <div style={{ color: '#b3b3b3', fontSize: 11 }}>
                              {year} • {duration}
                            </div>
                          </div>
                          
                          {/* 3rd Column: Status and Track Number */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 4
                          }}>
                            <div 
        style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 700,
                                textAlign: 'center',
                                minWidth: 70,
                                ...statusStyle
                              }}
                              onClick={isClickable ? () => toggleStatusExpansion(i) : undefined}
                            >
                              {statusText}
                            </div>
                            <div style={{
                              fontSize: 10,
                              color: '#b3b3b3',
                              fontWeight: 600
                            }}>
                              #{i + 1}
        </div>

                            {/* Expanded details when status is clicked */}
                            {isClickable && expandedStatuses.has(i) && (
                              <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                background: 'rgba(0, 0, 0, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: 8,
                                padding: 12,
                                marginTop: 8,
                                minWidth: 200,
                                zIndex: 10,
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)'
                              }}>
                                <div style={{
                                  color: '#fff',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  marginBottom: 8
                                }}>
                                  {s.status}
                                </div>
                                <div style={{
                                  color: '#9ca3af',
                                  fontSize: 11,
                                  lineHeight: 1.4
                                }}>
                                  {s.details}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {showResults && results && !loading && (
            <WrappedResultsModal
              open={showResults}
              onClose={onClose}
              results={results}
              tracks={tracks}
            />
          )}
        </div>
      </div>
    </div>
  );
}