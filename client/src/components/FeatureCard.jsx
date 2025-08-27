'use client';

import React from 'react';
import Image from 'next/image';

const FeatureCard = ({ 
  title, 
  description, 
  features, 
  image, 
  buttonText, 
  buttonVariant,
  onAction 
}) => {
  return (
    <div className="card-3d rounded-3xl p-8 h-full flex flex-col animate-fade-in-up">
      <div className="relative mb-6 rounded-2xl overflow-hidden">
        <Image 
          src={image} 
          alt={title}
          width={400}
          height={256}
          className="w-full h-64 object-cover floating-element glow-effect"
          priority
          onError={(e) => {
            console.error('Image failed to load:', image);
            e.target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>
      
      <h3 className="text-3xl font-bold mb-4 gradient-text">
        {title}
      </h3>
      
      <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
        {description}
      </p>
      
      <div className="flex-1 mb-8">
        <h4 className="text-xl font-semibold mb-4 text-primary">Key Features:</h4>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span className="text-white">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <button 
        onClick={onAction}
        className={`w-full py-6 text-lg font-semibold rounded-lg transition-all duration-200 ${
          buttonVariant === 'primary' ? 'btn-hero' : 'btn-secondary-hero'
        }`}
      >
        <svg className="w-6 h-6 mr-3 inline" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
        {buttonText}
      </button>
    </div>
  );
};

export default FeatureCard;