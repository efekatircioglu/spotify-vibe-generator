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
              style={{ 
          fontFamily: 'inherit',
          background: 'linear-gradient(135deg, hsl(141 73% 42%), hsl(280 100% 70%))',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 20px hsl(141 73% 42% / 0.5))'
        }}
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