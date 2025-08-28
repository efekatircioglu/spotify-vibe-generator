'use client';

import React from 'react';
import ScrollingText from '@/components/ScrollingText';
import FeatureCard from '@/components/FeatureCard';
import { SparklesCore } from '@/components/ui/sparkles';

const Index = () => {
  const scrollingTexts = [
    "DISCOVER YOUR MUSIC DNA",
    "FIND YOUR NEXT CONCERT",
    "ANALYZE YOUR TASTE",
    "EXPLORE YOUR ARTISTS",
    "LIVE THE MUSIC"
  ];

  const handleAnalyticsSignIn = () => {
    // Redirect to Spotify OAuth login, then to analytics dashboard
    window.location.href = 'http://127.0.0.1:8000/login?destination=analytics';
  };

  const handleConcertSignIn = () => {
    // Redirect to Spotify OAuth login, then to concert finder
    window.location.href = 'http://127.0.0.1:8000/login?destination=concerts';
  };

  return (
    <div className="min-h-screen relative">
      {/* Sparkles Background */}
      <div className="fixed inset-0 w-full h-full">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
          speed={0.8}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 z-10">
        <div className="text-center mb-16 animate-scale-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text relative z-20" style={{ fontFamily: 'var(--font-kalam), "Caveat", "Patrick Hand", "Indie Flower", cursive' }}>
            Vibe Generator
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed relative z-20">
            Unlock the hidden insights in your music taste and discover concerts 
            tailored perfectly to your listening habits
          </p>
        </div>

        {/* Auto-scrolling 3D Text */}
        <div className="w-full mb-16 relative z-20">
          <ScrollingText texts={scrollingTexts} className="py-8" />
        </div>

        {/* Visual explanation with floating elements */}
        <div className="text-center mb-16 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="poster-element" style={{ animationDelay: '0s' }}>
              <div className="poster-card-3d p-8 rounded-3xl bg-black/20 backdrop-blur-sm border border-white/10">
                <div className="text-5xl mb-6 poster-glow flex justify-center">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-primary">Connect</h3>
                <p className="text-muted-foreground text-lg">Link your Spotify account</p>
                <div className="mt-4 h-1 w-full bg-gradient-to-r from-primary/30 to-transparent rounded-full" />
              </div>
            </div>
            <div className="poster-element" style={{ animationDelay: '1s' }}>
              <div className="poster-card-3d p-8 rounded-3xl bg-black/20 backdrop-blur-sm border border-white/10">
                <div className="text-5xl mb-6 poster-glow flex justify-center">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-secondary">Analyze</h3>
                <p className="text-muted-foreground text-lg">Deep dive into your music</p>
                <div className="mt-4 h-1 w-full bg-gradient-to-r from-secondary/30 to-transparent rounded-full" />
              </div>
            </div>
            <div className="poster-element" style={{ animationDelay: '2s' }}>
              <div className="poster-card-3d p-8 rounded-3xl bg-black/20 backdrop-blur-sm border border-white/10">
                <div className="text-5xl mb-6 poster-glow flex justify-center">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-accent">Discover</h3>
                <p className="text-muted-foreground text-lg">Find amazing concerts</p>
                <div className="mt-4 h-1 w-full bg-gradient-to-r from-accent/30 to-transparent rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text" style={{ fontFamily: 'var(--font-kalam), "Caveat", "Patrick Hand", "Indie Flower", cursive' }}>
              Choose Your Journey
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Two powerful experiences, one incredible insight into your musical world
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <FeatureCard
              title="Music Analytics"
              description="Dive deep into your listening history with comprehensive analytics that reveal your musical DNA."
              features={[
                "Analyze last year, 6 months, and monthly top 50 songs/artists/genres",
                "Explore artist collaborators, albums, and background stories",
                "Discover song samples, interpolations, and remixes",
                "In-depth genre analysis and niche data insights",
                "Generate custom wrapped for playlists and favorite artists",
                "View most common genres across your Spotify playlists"
              ]}
              image="/analytics-hero.jpg"
              buttonText="Analyze My Music with Spotify"
              buttonVariant="primary"
              onAction={handleAnalyticsSignIn}
            />

            <FeatureCard
              title="Concert Finder"
              description="Discover live music events perfectly matched to your taste, featuring your most-listened artists."
              features={[
                "Personalized concerts for your top 150 unique artists",
                "Unlimited worldwide concert discovery",
                "Filter by cities, countries, and specific artists",
                "Simple, intuitive interface for easy browsing",
                "Direct integration with Ticketmaster for instant purchases"
              ]}
              image="/concert-hero.jpg"
              buttonText="Find My Perfect Concerts"
              buttonVariant="secondary"
              onAction={handleConcertSignIn}
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto animate-fade-in-up">
          <h3 className="text-3xl md:text-4xl font-bold mb-6 gradient-text" style={{ fontFamily: 'var(--font-kalam), "Caveat", "Patrick Hand", "Indie Flower", cursive' }}>
            Ready to Enhance Your Spotify Experience?
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            Connect with Spotify and unlock a whole new dimension of music discovery
          </p>
          <div className="text-sm text-muted-foreground/70">
            🔒 Your data is secure and never stored permanently
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
