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
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
          {leftIcon}
          {leftTitle}
        </h4>
        <ul className="space-y-2 text-gray-600 list-none">
          {leftItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5 font-bold">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-green-50/80 border border-green-200 rounded-xl p-5">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
          {rightIcon}
          {rightTitle}
        </h4>
        <ul className="space-y-2 text-gray-600 list-none">
          {rightItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✅</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
