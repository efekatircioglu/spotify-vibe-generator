'use client';

import React from 'react';
import ScrollingText from '@/components/ScrollingText';
import FeatureCard from '@/components/FeatureCard';
import { SparklesCore } from '@/components/ui/sparkles';
import { Typewriter } from '@/components/ui/typewriter-text';
import { LOGIN_URL } from '../config/api';

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
    window.location.href = `${LOGIN_URL}?destination=analytics`;
  };

  const handleConcertSignIn = () => {
    // Redirect to Spotify OAuth login, then to concert finder
    window.location.href = `${LOGIN_URL}?destination=concerts`;
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
      <main>
        <header className="relative min-h-screen flex flex-col justify-center items-center px-4 z-10">
          <div className="text-center mb-16 animate-scale-in" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text relative z-20 mt-24 md:mt-0" style={{ 
              fontFamily: 'inherit',
              background: 'linear-gradient(135deg, hsl(141 73% 42%), hsl(280 100% 70%))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px hsl(141 73% 42% / 0.5))'
            }}>
              Vibe Generator
            </h1>
            <div className="mb-8">
              <Typewriter
                text={[
                  "Unlock the hidden insights in your music taste",
                  "Discover concerts tailored to your listening habits", 
                  "Analyze your musical DNA with precision",
                  "Connect your Spotify and explore your vibe"
                ]}
                speed={80}
                loop={true}
                className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed relative z-20 block"
              />
            </div>
          </div>

          {/* Auto-scrolling 3D Text */}
          <section className="w-full mb-16 relative z-20" aria-label="Scrolling features">
            <ScrollingText texts={scrollingTexts} className="py-8" />
          </section>

          {/* Feature Cards Section */}
          <section className="text-center mb-16 relative z-20" aria-labelledby="feature-cards-heading">
            <h2 id="feature-cards-heading" className="sr-only">Feature Cards</h2>
            {/* Desktop Layout - 3 columns */}
            <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="mobile-card-reveal poster-element" style={{ animationDelay: '0s' }}>
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
              <div className="mobile-card-reveal poster-element" style={{ animationDelay: '1s' }}>
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
              <div className="mobile-card-reveal poster-element" style={{ animationDelay: '2s' }}>
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

            {/* Mobile Layout - Staggered single column */}
            <div className="md:hidden space-y-6 max-w-sm mx-auto">
              <div className="mobile-card-reveal">
                <div className="poster-card-3d p-6 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10">
                  <div className="text-4xl mb-4 poster-glow flex justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13"></path>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-primary">Connect</h3>
                  <p className="text-muted-foreground text-base">Link your Spotify account</p>
                  <div className="mt-3 h-1 w-full bg-gradient-to-r from-primary/30 to-transparent rounded-full" />
                </div>
              </div>
              
              <div className="mobile-card-reveal">
                <div className="poster-card-3d p-6 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10">
                  <div className="text-4xl mb-4 poster-glow flex justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"></line>
                      <line x1="12" y1="20" x2="12" y2="4"></line>
                      <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-secondary">Analyze</h3>
                  <p className="text-muted-foreground text-base">Deep dive into your music</p>
                  <div className="mt-3 h-1 w-full bg-gradient-to-r from-secondary/30 to-transparent rounded-full" />
                </div>
              </div>
              
              <div className="mobile-card-reveal">
                <div className="poster-card-3d p-6 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10">
                  <div className="text-4xl mb-4 poster-glow flex justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-accent">Discover</h3>
                  <p className="text-muted-foreground text-base">Find amazing concerts</p>
                  <div className="mt-3 h-1 w-full bg-gradient-to-r from-accent/30 to-transparent rounded-full" />
                </div>
              </div>
            </div>
          </section>
        </header>

        {/* Features Section */}
        <section className="py-20 px-4 relative z-10" aria-labelledby="features-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 id="features-heading" className="text-4xl md:text-5xl font-bold mb-6 gradient-text" style={{ 
                fontFamily: 'inherit',
                background: 'linear-gradient(135deg, hsl(141 73% 42%), hsl(280 100% 70%))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px hsl(141 73% 42% / 0.5))'
              }}>
                Choose Your Journey
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Two powerful experiences, one incredible insight into your musical world
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <article>
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
              </article>

              <article>
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
              </article>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 text-center relative z-10" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <h3 id="cta-heading" className="text-3xl md:text-4xl font-bold mb-6 gradient-text" style={{ 
              fontFamily: 'inherit',
              background: 'linear-gradient(135deg, hsl(141 73% 42%), hsl(280 100% 70%))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px hsl(141 73% 42% / 0.5))'
            }}>
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
      </main>

      {/* Mobile Card Reveal Animations */}
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-card-reveal {
            opacity: 0;
            transform: translateY(30px);
            animation: mobileReveal 0.8s ease-out forwards;
          }
          
          .mobile-card-reveal:nth-child(1) { 
            animation-delay: 0s; 
          }
          .mobile-card-reveal:nth-child(2) { 
            animation-delay: 0.3s; 
          }
          .mobile-card-reveal:nth-child(3) { 
            animation-delay: 0.6s; 
          }
          
          @keyframes mobileReveal {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }

        /* Bigger effect for all devices */
        .mobile-card-reveal:nth-child(1) {
          animation: completeAnimation 5s ease-out infinite;
          animation-delay: 0s;
        }
        
        .mobile-card-reveal:nth-child(2) {
          animation: completeAnimation 5s ease-out infinite;
          animation-delay: 0.3s;
        }
        
        .mobile-card-reveal:nth-child(3) {
          animation: completeAnimation 5s ease-out infinite;
          animation-delay: 0.6s;
        }
        
        @keyframes completeAnimation {
          0% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
          10% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
          20% { 
            opacity: 1; 
            transform: translateY(0) scale(1.2); 
          }
          30% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
      `}</style>
    </div>
  );
};

export default Index;
