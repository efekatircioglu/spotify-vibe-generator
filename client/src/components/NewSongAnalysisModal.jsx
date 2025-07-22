import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AudioAnalysisInterface from './AudioAnalysisInterface';

export default function NewSongAnalysisModal({ open, onClose, songInfo }) {
  const [mbid, setMbid] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && songInfo) {
      setLoading(true);
      // Mock fetching mbid for now
      // In a real scenario, you would fetch this from an API
      const fetchMbid = async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        // This is a placeholder. You'll need to implement actual MBID fetching.
        const mockMbid = 'some-mock-mbid'; 
        setMbid(mockMbid);
        setLoading(false);
      };

      fetchMbid();
    }
  }, [open, songInfo]);

  if (!open) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(20,20,20,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', width: '90vw', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#444 #232323', background: '#18181b', borderRadius: 24, boxShadow: '0 8px 48px #000b', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 1001 }}>×</button>
        {loading ? (
          <div style={{ color: 'white', textAlign: 'center', padding: '50px' }}>Loading Analysis...</div>
        ) : (
          <AudioAnalysisInterface mbid={mbid} />
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
