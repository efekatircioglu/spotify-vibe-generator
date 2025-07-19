import React, { useState, useEffect } from 'react';

/**
 * A UI component to manually find a song's MBID by its title and artist name.
 * This is used as a fallback when automatic lookups fail.
 * @param {{ initialSongName: string, initialArtistName: string, onMbidFound: (mbid: string) => void, onCancel: () => void }} props
 */
export default function MbidFallbackSearch({ initialSongName, initialArtistName, onMbidFound, onCancel }) {
  // State to manage the form inputs, pre-filled with the track's info
  const [songName, setSongName] = useState(initialSongName);
  const [artistName, setArtistName] = useState(initialArtistName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Call the new backend endpoint
      const res = await fetch(`http://127.0.0.1:8000/mbid-by-name?songName=${encodeURIComponent(songName)}&artistName=${encodeURIComponent(artistName)}`);
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'No match found.');
      }

      const data = await res.json();
      // If successful, call the onMbidFound callback to notify the parent page
      onMbidFound(data.mbid);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-4 space-y-4 rounded-lg">
      <p className="text-center text-gray-400">
        We couldn't automatically find this track on MusicBrainz. Please confirm the details below or correct them to try again.
      </p>

      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="song-name" className="block text-sm font-medium text-gray-300">Song Name</label>
          <input
            type="text"
            id="song-name"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label htmlFor="artist-name" className="block text-sm font-medium text-gray-300">Artist Name</label>
          <input
            type="text"
            id="artist-name"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required
          />
        </div>
        <div className="flex gap-4">
            <button
                type="button"
                onClick={onCancel}
                className="w-full flex justify-center py-3 px-4 border border-gray-500 rounded-md shadow-sm text-base font-medium text-white bg-gray-600 hover:bg-gray-700 transition-colors"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Searching...' : 'Search'}
            </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 rounded-lg text-center">
          <p className="font-semibold text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}