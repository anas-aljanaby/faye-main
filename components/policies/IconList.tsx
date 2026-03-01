import React from 'react';

interface IconListProps {
  items: string[];
  icon?: React.ReactNode;
  className?: string;
}

const defaultIcon = (
  <span className="text-primary font-bold ml-2" aria-hidden>◈</span>
);

export function IconList({ items, icon = defaultIcon, className = '' }: IconListProps) {
  return (
    <ul className={`space-y-2 text-base text-gray-600 leading-relaxed list-none ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          {icon}
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}
