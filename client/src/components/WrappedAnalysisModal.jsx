import React, { useEffect, useState, useRef } from 'react';
import { fetchTrackMetrics } from '../utils/fetchTrackMetrics';
import { lookupTrackMBID, getTrackISRC, setTrackISRC, setTrackMBID, getTrackMBID, getTrackAnalysis, setTrackAnalysis, hasValidAnalysis } from '../utils/trackAnalysisCache';
import styles from './WrappedAnalysisModal.module.css'; // Import the CSS module
import WrappedResultsModal from './WrappedResultsModal';

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
                const isrcRes = await fetch(`http://127.0.0.1:8000/track-isrc/${track.id}`);
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
          setStepDetails(`Waiting 50ms before next MBID lookup... (${mbidProgress}/${uniqueTracks.length} complete)`);
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

      // Step 3: Analysis phase with detailed explanations
      const tracksToFetch = tracksWithMbids.filter(t => t.mbid);
      setCurrentStep('Analysis Phase');
      setStepDetails(`Starting acoustic analysis for ${tracksToFetch.length} tracks with MBIDs. This involves fetching high-level and low-level acoustic features from AcousticBrainz.`);
      
      // Reset progress for analysis phase
      let done = 0;
      const total = tracksWithMbids.length;
      setProgress({ done, total });
      
      let finalStatuses = tracksWithMbids.map(track => ({
        name: track.name,
        artist: track.artist || (track.artists ? (Array.isArray(track.artists) ? track.artists.map(a => a.name).join(", ") : track.artists) : ''),
        status: track.mbid ? 'Checking Analysis Cache...' : 'Skipped (no MBID)',
        details: track.mbid ? 'Looking for cached analysis data...' : 'No MBID available'
      }));
      setStatuses(finalStatuses);

      // Step 4: Sequential analysis with wait times and retry logic
      const analysisResults = [];
      
      for (let i = 0; i < tracksWithMbids.length; i++) {
        // Check if modal was closed
        if (signal.aborted) {
          console.log('Analysis cancelled during analysis phase');
          return;
        }

        const track = tracksWithMbids[i];
        
        if (!track.mbid) {
          analysisResults.push({ track, highLevel: null, lowLevel: null, success: false, reason: 'No MBID' });
          continue;
        }

        // Check if we have cached analysis - NO WAIT TIME when using cache
        const cachedAnalysis = getTrackAnalysis(track.id);
        if (hasValidAnalysis(track.id)) {
          finalStatuses[i].status = 'Done (from cache)';
          finalStatuses[i].details = 'Analysis data found in cache';
          setStatuses([...finalStatuses]);
          analysisResults.push({
            track,
            highLevel: cachedAnalysis.highLevel,
            lowLevel: cachedAnalysis.lowLevel,
            success: true,
            fromCache: true
          });
          done++;
          setProgress({ done, total });
          continue;
        }

        // Update status to show we're fetching analysis
        finalStatuses[i].status = 'Fetching Analysis...';
        finalStatuses[i].details = 'Making API calls to AcousticBrainz (high-level + low-level)';
        setStatuses([...finalStatuses]);

        try {
          // Use the new server endpoint for analysis
          const analysisRes = await fetch('http://127.0.0.1:8000/wrapped-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tracks: [track] }),
            signal: signal // Add abort signal
          });

          if (analysisRes.ok) {
            const analysisData = await analysisRes.json();
            const result = analysisData.results[0];
            
            if (result.success) {
              // Cache the successful analysis
              setTrackAnalysis(track.id, {
                highLevel: result.highLevel,
                lowLevel: result.lowLevel,
                timestamp: Date.now()
              });
              
              finalStatuses[i].status = 'Done';
              finalStatuses[i].details = 'Analysis completed successfully';
              analysisResults.push({
                track,
                highLevel: result.highLevel,
                lowLevel: result.lowLevel,
                success: true
              });
            } else {
              finalStatuses[i].status = 'Skipped (no analysis data)';
              finalStatuses[i].details = 'Analysis Request Failed';
              analysisResults.push({
                track,
                highLevel: null,
                lowLevel: null,
                success: false,
                reason: result.error || 'Analysis failed'
              });
            }
          } else {
            finalStatuses[i].status = 'Skipped (API error)';
            finalStatuses[i].details = 'Analysis Request Failed';
            analysisResults.push({
              track,
              highLevel: null,
              lowLevel: null,
              success: false,
              reason: 'Server error'
            });
          }
        } catch (error) {
          // Check if this is an abort error
          if (error.name === 'AbortError') {
            console.log('Analysis request was aborted');
            return;
          }
          
          finalStatuses[i].status = 'Skipped (network error)';
          finalStatuses[i].details = 'Analysis Request Failed';
          analysisResults.push({
            track,
            highLevel: null,
            lowLevel: null,
            success: false,
            reason: `Network error: ${error.message}`
          });
        }

        done++;
        setStatuses([...finalStatuses]);
        setProgress({ done, total });

        // No client-side wait times - server handles all timing
        if (i < tracksWithMbids.length - 1) {
          setCurrentStep('Analysis Phase');
          setStepDetails(`Processing next track... (${i + 1}/${tracksWithMbids.length} complete)`);
        }
      }

      // Check if modal was closed before retry phase
      if (signal.aborted) {
        console.log('Analysis cancelled before retry phase');
        return;
      }

      // Step 5: Simple retry for tracks that failed analysis (only once, same wait time)
      const failedTracks = analysisResults.filter(r => r.mbid && !r.success);
      if (failedTracks.length > 0) {
        setCurrentStep('Retry Phase');
        setStepDetails(`Retrying analysis for ${failedTracks.length} tracks that failed initially. This helps catch tracks that may have been temporarily unavailable.`);
        
        for (let i = 0; i < failedTracks.length; i++) {
          // Check if modal was closed
          if (signal.aborted) {
            console.log('Analysis cancelled during retry phase');
            return;
          }

          const failedTrack = failedTracks[i];
          const trackIndex = tracksWithMbids.findIndex(t => t.id === failedTrack.track.id);
          
          if (trackIndex === -1) continue;
          
          finalStatuses[trackIndex].status = 'Retrying Analysis...';
          finalStatuses[trackIndex].details = 'Retrying analysis once with same wait time...';
          setStatuses([...finalStatuses]);
          
          try {
            // Simple retry with same wait time as regular API calls
            setStepDetails(`Retrying analysis for track ${i + 1}/${failedTracks.length}...`);
            
            const analysisRes = await fetch('http://127.0.0.1:8000/wrapped-analysis', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tracks: [failedTrack.track] }),
              signal: signal // Add abort signal
            });

            if (analysisRes.ok) {
              const analysisData = await analysisRes.json();
              const result = analysisData.results[0];
              
              if (result.success) {
                // Cache the successful analysis
                setTrackAnalysis(failedTrack.track.id, {
                  highLevel: result.highLevel,
                  lowLevel: result.lowLevel,
                  timestamp: Date.now()
                });
                
                finalStatuses[trackIndex].status = 'Done (retry success)';
                finalStatuses[trackIndex].details = 'Analysis completed successfully';
                
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
                finalStatuses[trackIndex].details = 'Analysis Request Failed';
              }
            } else {
              finalStatuses[trackIndex].status = 'Skipped (retry failed)';
              finalStatuses[trackIndex].details = 'Analysis Request Failed';
            }
          } catch (error) {
            // Check if this is an abort error
            if (error.name === 'AbortError') {
              console.log('Retry analysis request was aborted');
              return;
            }
            
            finalStatuses[trackIndex].status = 'Skipped (retry failed)';
            finalStatuses[trackIndex].details = 'Analysis Request Failed';
          }
          
          setStatuses([...finalStatuses]);
        }
      }

      // Final step: Complete
      setCurrentStep('Analysis Complete');
      setStepDetails(`Analysis finished! Successfully analyzed ${analysisResults.filter(r => r.success).length}/${total} tracks.`);
      
      setResults(analysisResults);
      setLoading(false);
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

  if (!open) return null;

  const getStatusClass = (status) => {
    switch (status) {
      case 'Done':
      case 'Done (from cache)':
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Your Songs Wrapped</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>

        <div className={styles.modalBody} style={{ 
          overflowY: isMobile ? 'auto' : 'visible',
          maxHeight: isMobile ? '70vh' : 'none',
          padding: isMobile ? '20px' : '24px',
          height: isMobile ? '70vh' : 'auto'
        }}>
          {!showResults && (
            <>
              {/* Current Step Display */}
              {loading && (
                <div style={{ 
                  background: 'rgba(56, 189, 248, 0.1)', 
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 20,
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontWeight: 700, 
                    color: '#38bdf8', 
                    fontSize: isMobile ? 16 : 18,
                    marginBottom: 8
                  }}>
                    {currentStep}
                  </div>
                  <div style={{ 
                    color: '#94a3b8', 
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
                    background: '#38bdf8', 
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
              
              {/* Close button when no songs analyzed successfully */}
              {!loading && numDone === 0 && (
                <button
                  style={{ 
                    marginBottom: 24, 
                    background: '#6b7280', 
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
                  onClick={onClose}
                >
                  Close
                </button>
              )}
              
              {loading ? (
                <div className={styles.progressText} style={{ fontSize: isMobile ? 14 : 16 }}>
                  Processing tracks... {progress.done} / {progress.total}
                </div>
              ) : (
                <div className={styles.progressText} style={{ fontSize: isMobile ? 14 : 16 }}>
                  {numDone === 0 ? 'No songs analyzed successfully.' : `${numDone} songs have been analyzed successfully`}
                </div>
              )}
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBar} style={{ width: loading ? `${progress.total ? (progress.done / progress.total) * 100 : 0}%` : '100%' }} />
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
                      // Try to find the original track object for extra info
                      const track = tracks[i] || {};
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
                // Desktop layout - original table design
                <div style={{ 
                  marginTop: 24,
                  maxHeight: '60vh', // Limit height to prevent overflow
                  overflowY: 'auto', // Enable vertical scrolling
                  overflowX: 'auto', // Enable horizontal scrolling if needed
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  padding: '8px 0'
                }}>
                  <table className={styles.statusTable}>
                    <thead>
                      <tr>
                        <th className={styles.tableHeader}>#</th>
                        <th className={styles.tableHeader}>Cover</th>
                        <th className={styles.tableHeader}>Song</th>
                        <th className={styles.tableHeader}>Artist</th>
                        <th className={styles.tableHeader}>Album</th>
                        <th className={styles.tableHeader}>Year</th>
                        <th className={styles.tableHeader}>Duration</th>
                        <th className={`${styles.tableHeader} ${styles.statusCell}`}>Status</th>
                        <th className={styles.tableHeader}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statuses.map((s, i) => {
                        // Try to find the original track object for extra info
                        const track = tracks[i] || {};
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
                        let statusCell;
                        if (s.status.includes('Skipped')) {
                          // On desktop, show "Failed" - explanation is in Details column
                          statusCell = (
                            <span className={styles.statusError}>
                              Failed
                            </span>
                          );
                        } else if (s.status.includes('Done')) {
                          // On desktop, show "Done" - explanation is in Details column
                          statusCell = (
                            <span className={styles.statusDone}>
                              Done
                            </span>
                          );
                        } else {
                          statusCell = <span className={getStatusClass(s.status)}>{s.status}</span>;
                        }
                        return (
                          <tr key={i} className={i === statuses.length - 1 ? '' : styles.tableRow}>
                            <td className={styles.tableCell}>{i + 1}</td>
                            <td className={styles.tableCell}>
                              {img ? <img src={img} alt="cover" style={{ 
                                width: isMobile ? 36 : 48, 
                                height: isMobile ? 36 : 48, 
                                borderRadius: 6, 
                                objectFit: 'cover', 
                                boxShadow: '0 2px 8px #0004' 
                              }} /> : '--'}
                            </td>
                            <td className={styles.tableCell}>{s.name}</td>
                            <td className={`${styles.tableCell} ${styles.artistCell}`}>{s.artist}</td>
                            <td className={styles.tableCell}>{album}</td>
                            <td className={styles.tableCell}>{year}</td>
                            <td className={styles.tableCell}>{duration}</td>
                            <td className={`${styles.tableCell} ${styles.statusCell}`}>{statusCell}</td>
                            <td className={styles.tableCell} style={{ 
                              fontSize: 12, 
                              color: '#9ca3af', 
                              fontStyle: 'italic',
                              maxWidth: 200,
                              wordWrap: 'break-word'
                            }}>
                              {s.details}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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