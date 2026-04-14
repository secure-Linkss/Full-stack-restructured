import React from 'react';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: {
      container: 'h-8',
      img: 'w-6 h-6',
      title: 'text-[15px]',
      subtitle: 'text-[9px]'
    },
    md: {
      container: 'h-10',
      img: 'w-8 h-8',
      title: 'text-[18px]',
      subtitle: 'text-[10px]'
    },
    lg: {
      container: 'h-12',
      img: 'w-10 h-10',
      title: 'text-[22px]',
      subtitle: 'text-[11px]'
    },
    xl: {
      container: 'h-16',
      img: 'w-12 h-12',
      title: 'text-[28px]',
      subtitle: 'text-[13px]'
    }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${currentSize.container} ${className}`}>
      {/* Physical Image Logo */}
      <div className="relative shrink-0">
         <div className="absolute inset-0 bg-[#3b82f6] rounded-md blur-md opacity-30"></div>
         <img 
            src="/logo.png" 
            alt="Brain Link Tracker Logo" 
            className={`${currentSize.img} relative z-10 rounded-md object-contain shadow-[0_0_15px_rgba(59,130,246,0.5)]`}
         />
      </div>

      {/* Branded Text */}
      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className={`${currentSize.title} font-heading font-black tracking-tight text-white leading-none`}>
             Brain <span className="text-[#3b82f6]">Link</span>
          </h1>
          <span className={`${currentSize.subtitle} text-muted-foreground font-mono tracking-[0.2em] font-medium uppercase mt-0.5`}>
             Tracker
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
