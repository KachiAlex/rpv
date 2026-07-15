import React from 'react';

interface Feature {
  title: string;
  body: string;
}

interface FeatureCardsProps {
  features: Feature[];
  className?: string;
}

export function FeatureCards({ features, className = '' }: FeatureCardsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 w-full ${className}`}>
      {features.map((feature, index) => (
        <div 
          key={feature.title} 
          className="flex flex-col rounded-2xl border border-[#f2e5df] bg-[#fff6f1] p-3 lg:p-4 interactive-card layout-stable min-w-0 min-h-[100px] lg:min-h-[120px]"
        >
          <div className="flex-grow">
            <h3 className="text-sm lg:text-base font-semibold text-[#4a2c26] mb-2 leading-tight">{feature.title}</h3>
            <p className="text-xs lg:text-sm leading-relaxed text-[#6a4c43] break-words">{feature.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Enhanced version with auto-fit grid
export function FeatureCardsAutoFit({ features, className = '' }: FeatureCardsProps) {
  return (
    <div className={`grid-auto-fit-cards align-stretch ${className}`}>
      {features.map((feature, index) => (
        <div 
          key={feature.title} 
          className="flex flex-col rounded-2xl border border-[#f2e5df] bg-[#fff6f1] p-5 transition-all duration-300 hover:shadow-md hover:border-[#e5d5cf] aspect-ratio-card"
        >
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-[#4a2c26] mb-3 leading-tight">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-[#6a4c43]">{feature.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}