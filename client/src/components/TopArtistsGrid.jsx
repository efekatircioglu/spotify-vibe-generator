import React from 'react';
import { useRouter } from 'next/navigation';

/**
 * TopArtistsGrid component
 * @param {{ artists: Array<{ name: string, image?: string, id?: string }>, title?: string }} props
 */
export default function TopArtistsGrid({ artists = [], title = 'Top Artists' }) {
  const router = useRouter();

  if (!artists || artists.length === 0) return null;

  // Split artists into rows of 5
  const rows = [];
  for (let i = 0; i < artists.length; i += 5) {
    rows.push(artists.slice(i, i + 5));
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-10 mb-12">
      <div className="text-2xl font-bold text-center mb-6 text-white tracking-wide">{title}</div>
      <div className="flex flex-col gap-6">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex flex-row justify-center gap-6">
            {row.map((artist, idx) => (
              <div
                key={artist.id || artist.name || idx}
                className="flex flex-col items-center bg-gray-800 rounded-xl shadow-md p-4 w-40 h-48 cursor-pointer hover:bg-indigo-700 transition-colors border border-gray-700 hover:scale-105"
                onClick={() => router.push(`/artist?name=${encodeURIComponent(artist.name)}`)}
              >
                {artist.image || artist.images?.[0]?.url ? (
                  <img
                    src={artist.image || artist.images?.[0]?.url}
                    alt={artist.name}
                    className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-indigo-400 shadow"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center mb-3 text-3xl text-gray-300 border-2 border-gray-500">
                    {artist.name?.[0] || '?'}
                  </div>
                )}
                <div className="text-lg font-semibold text-white text-center truncate w-full" title={artist.name}>
                  {artist.name}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
} 