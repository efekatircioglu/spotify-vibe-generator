'use client';
import React, { useEffect, useState } from 'react';
import UserProfile from '../../components/UserProfile';
import { useRouter } from 'next/navigation';

export default function UsernamePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('http://127.0.0.1:8000/me')
      .then((res) => {
        if (!res.ok) throw new Error('User not logged in');
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('http://127.0.0.1:8000/logout');
    setUser(null);
    window.location.href = '/';
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in.</div>;

  return (
    <main style={{ position: 'relative' }}>
      <button
        onClick={() => router.push('/')}
        style={{
          position: 'fixed',
          top: 24,
          left: 24,
          zIndex: 100,
          background: 'linear-gradient(90deg, #1db954 60%, #00ffff 100%)',
          color: '#181818',
          fontWeight: 700,
          fontSize: '1.1rem',
          padding: '10px 28px',
          borderRadius: '50px',
          border: 'none',
          boxShadow: '0 4px 16px #1db95433',
          cursor: 'pointer',
          transition: 'background 0.2s, box-shadow 0.2s',
        }}
      >
        ← Back
      </button>
      <UserProfile user={user} onLogout={handleLogout} showSubtitle={false}>
        {/* Add more profile details here in the future */}
      </UserProfile>
    </main>
  );
} 