import React from 'react';
import { Link } from 'lucide-react'; // Using Link icon for the "link" part of the logo

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: {
      container: 'h-8',
      icon: 'h-6 w-6',
      text: 'text-lg'
    },
    md: {
      container: 'h-10',
      icon: 'h-8 w-8',
      text: 'text-xl'
    },
    lg: {
      container: 'h-12',
      icon: 'h-10 w-10',
      text: 'text-2xl'
    },
    xl: {
      container: 'h-16',
      icon: 'h-12 w-12',
      text: 'text-3xl'
    }
  }

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${currentSize.container} ${className}`}>
      {/* Logo Icon - Sleek, dark theme compliant design */}
      <div className="relative p-1 rounded-lg bg-primary/10 border border-primary/30">
        {/* Brain-like shape: using a stylized div/icon for the "Brain" part */}
        <div className="relative">
          {/* Using a simple circle with a link icon inside for the sleek look */}
          <div className={`w-6 h-6 rounded-full bg-primary flex items-center justify-center`}>
            <Link className="w-4 h-4 text-primary-foreground rotate-45" />
          </div>
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${currentSize.text} font-bold text-foreground leading-tight`}>
            Brain Link
          </h1>
          <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase -mt-1">
            Tracker
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
