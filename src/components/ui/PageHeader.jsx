import React from 'react';

const PageHeader = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', letterSpacing: '-0.03em' }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm text-white/35 mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
