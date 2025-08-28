import React from 'react';

const ScrollingText = ({ texts, className = "" }) => {
  const duplicatedTexts = [...texts, ...texts]; // Duplicate for seamless loop
  
  return (
    <div className={`relative overflow-hidden whitespace-nowrap ${className}`}>
      <div className="scroll-text">
        <span className="inline-flex">
          {duplicatedTexts.map((text, index) => (
            <span 
              key={index} 
              className="px-16 text-4xl md:text-6xl font-bold gradient-text whitespace-nowrap"
              style={{ fontFamily: 'var(--font-kalam), "Caveat", "Patrick Hand", "Indie Flower", cursive' }}
            >
              {text}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

export default ScrollingText;