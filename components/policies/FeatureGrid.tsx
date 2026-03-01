import React from 'react';

export interface FeatureCard {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface FeatureGridProps {
  cards: FeatureCard[];
  columns?: 2 | 3;
  className?: string;
}

export function FeatureGrid({ cards, columns = 3, className = '' }: FeatureGridProps) {
  const gridClass = columns === 2
    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
  return (
    <div className={`${gridClass} ${className}`}>
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-bg-card border border-gray-200 rounded-xl p-5 shadow-sm"
        >
          {card.icon && (
            <div className="mb-3 text-primary">{card.icon}</div>
          )}
          <h4 className="font-semibold text-gray-800 mb-2">{card.title}</h4>
          <p className="text-gray-600 text-base leading-relaxed">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
