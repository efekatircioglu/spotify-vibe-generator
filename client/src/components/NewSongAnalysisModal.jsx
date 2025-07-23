import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AudioAnalysisInterface from './AudioAnalysisInterface';
import { lookupTrackMBID } from '../utils/trackAnalysisCache';

export default function NewSongAnalysisModal({ open, onClose, songInfo }) {
  const [mbid, setMbid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && songInfo) {
      setLoading(true);
      setError(null);
      const fetchMbid = async () => {
        try {
          const realMbid = await lookupTrackMBID(songInfo.id);
          if (realMbid) {
            setMbid(realMbid);
            setError(null);
          } else {
            setMbid(null);
            setError('Could not find MusicBrainz ID for this track.');
          }
        } catch (e) {
          setMbid(null);
          setError('Error fetching MBID.');
        } finally {
        setLoading(false);
        }
      };
      fetchMbid();
    } else {
      setMbid(null);
      setLoading(false);
      setError(null);
    }
  }, [open, songInfo]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(20,20,20,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', width: '90vw', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#444 #232323', background: '#18181b', borderRadius: 24, boxShadow: '0 8px 48px #000b', position: 'relative' }}>
        {loading ? (
          <div style={{ color: 'white', textAlign: 'center', padding: '50px' }}>Loading Analysis...</div>
        ) : error ? (
          <div style={{ color: '#f87171', textAlign: 'center', padding: '50px' }}>{error}</div>
        ) : mbid ? (
          <AudioAnalysisInterface mbid={mbid} onClose={onClose} />
        ) : (
          <div style={{ color: '#f87171', textAlign: 'center', padding: '50px' }}>No analysis available for this track.</div>
        )}
      </div>
    </div>
  );
}

NewSongAnalysisModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  songInfo: PropTypes.object,
};
