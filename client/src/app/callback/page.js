'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiBaseUrl } from '../../config/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      router.push('/?error=auth_failed');
      return;
    }

    if (!code) {
      console.error('No authorization code received');
      router.push('/?error=no_code');
      return;
    }

    // Exchange code for token with your backend
    const exchangeCodeForToken = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/exchange-token/${code}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          // Redirect based on state parameter
          if (state === 'analytics') {
            router.push('/dashboard');
          } else if (state === 'concerts') {
            router.push('/concerts');
          } else {
            // Default to dashboard
            router.push('/dashboard');
          }
        } else {
          console.error('Token exchange failed');
          router.push('/?error=token_exchange_failed');
        }
      } catch (error) {
        console.error('Error exchanging code for token:', error);
        router.push('/?error=network_error');
      }
    };

    exchangeCodeForToken();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Connecting to Spotify...</h2>
        <p className="text-gray-400">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
          <p className="text-gray-400">Please wait...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
