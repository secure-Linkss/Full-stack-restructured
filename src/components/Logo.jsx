import React from 'react';
import logoImage from '../assets/logo.png';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: {
      container: 'h-8',
      image: 'h-8 w-8',
      text: 'text-lg'
    },
    md: {
      container: 'h-10',
      image: 'h-10 w-10',
      text: 'text-xl'
    },
    lg: {
      container: 'h-12',
      image: 'h-12 w-12',
      text: 'text-2xl'
    },
    xl: {
      container: 'h-16',
      image: 'h-16 w-16',
      text: 'text-3xl'
    }
  }

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${currentSize.container} ${className}`}>
      {/* Logo Icon - Using the original image */}
      <img src={logoImage} alt="Brain Link Tracker Logo" className={currentSize.image} />

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          {/* Based on the screenshot, "Brain Link" is colored and "TRACKER" is smaller and gray/white */}
          <h1 className={`${currentSize.text} font-bold leading-tight`} style={{
            // Approximate gradient color from the screenshot: purple to pink
            background: 'linear-gradient(to right, #a855f7, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent' // Fallback
          }}>
            Brain Link
          </h1>
          <span className="text-xs font-medium tracking-wider uppercase -mt-1 text-gray-400">
            Tracker
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
