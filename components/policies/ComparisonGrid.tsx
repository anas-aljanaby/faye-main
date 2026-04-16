import React from 'react';

interface ComparisonGridProps {
  leftTitle: string;
  rightTitle: string;
  leftItems: string[];
  rightItems: string[];
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export function ComparisonGrid({
  leftTitle,
  rightTitle,
  leftItems,
  rightItems,
  leftIcon,
  rightIcon,
  className = '',
}: ComparisonGridProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 ${className}`}>
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 md:p-5">
        <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
          {leftIcon}
          {leftTitle}
        </h4>
        <ul className="list-none space-y-2 text-base leading-8 text-gray-600">
          {leftItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 font-bold text-amber-600">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-green-200 bg-green-50/80 p-4 md:p-5">
        <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
          {rightIcon}
          {rightTitle}
        </h4>
        <ul className="list-none space-y-2 text-base leading-8 text-gray-600">
          {rightItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 text-green-600">✅</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
