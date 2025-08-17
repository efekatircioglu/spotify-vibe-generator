import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function GenreBasedAnalysisModal({ open, onClose, songInfo, artistGenre }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open && songInfo && artistGenre) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [open, songInfo, artistGenre]);

  if (!isVisible) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'rgba(20,20,20,0.88)', 
        zIndex: 1000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }} 
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxHeight: '90vh', 
          width: '90vw', 
          maxWidth: '800px',
          overflowY: 'auto', 
          scrollbarWidth: 'thin', 
          scrollbarColor: '#444 #232323', 
          background: '#18181b', 
          borderRadius: 24, 
          boxShadow: '0 8px 48px #000b', 
          position: 'relative',
          padding: '32px'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 
            className="gradient-text"
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '8px',
              lineHeight: 1.2,
              background: 'linear-gradient(90deg, #60a5fa, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {songInfo.name}
          </h1>
          <div style={{ color: '#d1d5db', fontSize: '16px', fontWeight: 400 }}>
            {songInfo.artists ? songInfo.artists.map(a => a.name).join(', ') : songInfo.artist} — {songInfo.album?.name || 'Unknown Album'}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 400, fontStyle: 'italic', marginTop: '8px' }}>
            {artistGenre}
          </div>
        </div>

        {/* Info Box */}
        <div style={{ 
          background: '#232b39', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '24px',
          border: '1px solid #374151'
        }}>
          <div style={{ color: '#60a5fa', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            ℹ️ Genre-Based Analysis Available
          </div>
          <div style={{ color: '#d1d5db', fontSize: '14px', lineHeight: 1.5 }}>
            While we couldn't find a MusicBrainz ID for this track, we can provide analysis based on the artist's genre classification from Spotify. This gives you insights into the typical characteristics of music in this genre.
          </div>
        </div>

        {/* Genre Analysis Table */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            color: '#ffffff', 
            fontSize: '18px', 
            fontWeight: 600, 
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Genre Characteristics: {artistGenre}
          </h3>
          
          <div style={{ 
            background: '#232b39', 
            borderRadius: '12px', 
            overflow: 'hidden',
            border: '1px solid #374151'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1f2937' }}>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'left', 
                    color: '#ffffff', 
                    fontWeight: 600,
                    borderBottom: '1px solid #374151'
                  }}>
                    Characteristic
                  </th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'left', 
                    color: '#ffffff', 
                    fontWeight: 600,
                    borderBottom: '1px solid #374151'
                  }}>
                    Typical Range
                  </th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'left', 
                    color: '#ffffff', 
                    fontWeight: 600,
                    borderBottom: '1px solid #374151'
                  }}>
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  <td style={{ padding: '16px', color: '#d1d5db', fontWeight: 500 }}>Energy Level</td>
                  <td style={{ padding: '16px', color: '#60a5fa' }}>Medium-High</td>
                  <td style={{ padding: '16px', color: '#9ca3af' }}>
                    {artistGenre === 'rock' || artistGenre === 'metal' ? 'High energy with driving rhythms' :
                     artistGenre === 'pop' ? 'Dynamic energy with catchy hooks' :
                     artistGenre === 'jazz' ? 'Varied energy with improvisational elements' :
                     artistGenre === 'classical' ? 'Controlled energy with structured dynamics' :
                     artistGenre === 'electronic' ? 'Consistent energy with electronic beats' :
                     artistGenre === 'hip hop' ? 'Rhythmic energy with strong beats' :
                     'Balanced energy typical of this genre'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  <td style={{ padding: '16px', color: '#d1d5db', fontWeight: 500 }}>Tempo</td>
                  <td style={{ padding: '16px', color: '#60a5fa' }}>
                    {artistGenre === 'rock' ? '120-140 BPM' :
                     artistGenre === 'pop' ? '100-130 BPM' :
                     artistGenre === 'jazz' ? '80-160 BPM' :
                     artistGenre === 'classical' ? '60-180 BPM' :
                     artistGenre === 'electronic' ? '120-140 BPM' :
                     artistGenre === 'hip hop' ? '80-100 BPM' :
                     'Variable tempo range'}
                  </td>
                  <td style={{ padding: '16px', color: '#9ca3af' }}>
                    {artistGenre === 'rock' ? 'Moderate to fast tempo with driving beats' :
                     artistGenre === 'pop' ? 'Danceable tempo with catchy rhythms' :
                     artistGenre === 'jazz' ? 'Wide tempo range for expression' :
                     artistGenre === 'classical' ? 'Diverse tempo for emotional impact' :
                     artistGenre === 'electronic' ? 'Consistent dance tempo' :
                     artistGenre === 'hip hop' ? 'Slower tempo for lyrical delivery' :
                     'Tempo varies based on mood and style'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  <td style={{ padding: '16px', color: '#d1d5db', fontWeight: 500 }}>Instrumentation</td>
                  <td style={{ padding: '16px', color: '#60a5fa' }}>
                    {artistGenre === 'rock' ? 'Electric guitars, drums, bass' :
                     artistGenre === 'pop' ? 'Synths, drums, vocals' :
                     artistGenre === 'jazz' ? 'Sax, piano, drums, bass' :
                     artistGenre === 'classical' ? 'Orchestral instruments' :
                     artistGenre === 'electronic' ? 'Synthesizers, drum machines' :
                     artistGenre === 'hip hop' ? 'Beats, samples, vocals' :
                     'Genre-typical instruments'}
                  </td>
                  <td style={{ padding: '16px', color: '#9ca3af' }}>
                    {artistGenre === 'rock' ? 'Powerful electric sound with strong rhythm section' :
                     artistGenre === 'pop' ? 'Modern production with electronic elements' :
                     artistGenre === 'jazz' ? 'Acoustic instruments with improvisation' :
                     artistGenre === 'classical' ? 'Traditional orchestral arrangements' :
                     artistGenre === 'electronic' ? 'Digital and synthesized sounds' :
                     artistGenre === 'hip hop' ? 'Rhythm-focused with vocal delivery' :
                     'Characteristic instrumentation for this style'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  <td style={{ padding: '16px', color: '#d1d5db', fontWeight: 500 }}>Mood</td>
                  <td style={{ padding: '16px', color: '#60a5fa' }}>
                    {artistGenre === 'rock' ? 'Energetic, powerful' :
                     artistGenre === 'pop' ? 'Upbeat, catchy' :
                     artistGenre === 'jazz' ? 'Sophisticated, relaxed' :
                     artistGenre === 'classical' ? 'Emotional, dramatic' :
                     artistGenre === 'electronic' ? 'Hypnotic, energetic' :
                     artistGenre === 'hip hop' ? 'Confident, rhythmic' :
                     'Genre-typical mood'}
                  </td>
                  <td style={{ padding: '16px', color: '#9ca3af' }}>
                    {artistGenre === 'rock' ? 'High energy with rebellious spirit' :
                     artistGenre === 'pop' ? 'Positive and accessible emotions' :
                     artistGenre === 'jazz' ? 'Complex emotions with artistic depth' :
                     artistGenre === 'classical' ? 'Rich emotional palette' :
                     artistGenre === 'electronic' ? 'Hypnotic and dance-oriented' :
                     artistGenre === 'hip hop' ? 'Strong and confident expression' :
                     'Emotional characteristics typical of this genre'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '16px', color: '#d1d5db', fontWeight: 500 }}>Complexity</td>
                  <td style={{ padding: '16px', color: '#60a5fa' }}>
                    {artistGenre === 'rock' ? 'Medium' :
                     artistGenre === 'pop' ? 'Low-Medium' :
                     artistGenre === 'jazz' ? 'High' :
                     artistGenre === 'classical' ? 'Very High' :
                     artistGenre === 'electronic' ? 'Medium-High' :
                     artistGenre === 'hip hop' ? 'Medium' :
                     'Variable complexity'}
                  </td>
                  <td style={{ padding: '16px', color: '#9ca3af' }}>
                    {artistGenre === 'rock' ? 'Balanced complexity with memorable structures' :
                     artistGenre === 'pop' ? 'Accessible complexity for wide appeal' :
                     artistGenre === 'jazz' ? 'High complexity with improvisation' :
                     artistGenre === 'classical' ? 'Maximum complexity and sophistication' :
                     artistGenre === 'electronic' ? 'Technical complexity in production' :
                     artistGenre === 'hip hop' ? 'Rhythmic complexity with lyrical depth' :
                     'Complexity level typical of this genre'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: '#374151',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#4b5563'}
            onMouseOut={(e) => e.target.style.background = '#374151'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

GenreBasedAnalysisModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  songInfo: PropTypes.object,
  artistGenre: PropTypes.string
};
