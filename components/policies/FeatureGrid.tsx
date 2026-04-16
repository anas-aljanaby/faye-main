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
    ? 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4'
    : 'grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3';
  return (
    <div className={`${gridClass} ${className}`}>
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-bg-card p-4 shadow-sm md:p-5"
        >
          {card.icon && (
            <div className="mb-3 text-primary">{card.icon}</div>
          )}
          <h4 className="mb-2 text-base font-semibold text-gray-800">{card.title}</h4>
          <p className="text-gray-600 text-base leading-relaxed">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
