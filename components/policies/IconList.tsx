import React from 'react';

interface IconListProps {
  items: string[];
  icon?: React.ReactNode;
  className?: string;
}

const defaultIcon = (
  <span className="font-bold text-primary" aria-hidden>◈</span>
);

export function IconList({ items, icon = defaultIcon, className = '' }: IconListProps) {
  return (
    <ul className={`list-none space-y-3 text-base leading-8 text-gray-600 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          {icon}
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}
