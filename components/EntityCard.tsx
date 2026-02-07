import React from 'react';
import Avatar from './Avatar';

export interface EntityCardField {
  label: string;
  value: string;
  type?: 'text' | 'pill';
  pillClass?: string;
}

export interface EntityCardProps {
  /** Primary title (e.g. entity name) */
  title: string;
  /** Secondary line (e.g. "12 سنوات • ذكر") */
  subtitle?: string;
  imageUrl: string;
  imageAlt?: string;
  /** For card view: label/value rows. For pill use type: 'pill' and pillClass */
  fields: EntityCardField[];
  /** Optional location line with pin icon */
  location?: string;
  /** Button label at bottom of card */
  actionLabel: string;
  onClick: () => void;
  variant: 'card' | 'row';
  /** Selection (row and card) */
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  showCheckbox?: boolean;
}

const PERFORMANCE_PILL: Record<string, string> = {
  'ممتاز': 'bg-green-100 text-green-700 border-green-200',
  'جيد جداً': 'bg-blue-100 text-blue-700 border-blue-200',
  'جيد': 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

function getPillClass(value: string, customClass?: string): string {
  return customClass ?? PERFORMANCE_PILL[value] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

/**
 * Reusable card for entities (orphans, sponsors, etc.).
 * - variant="card": rounded card with avatar, fields, location, and action button (matches new repo icon view).
 * - variant="row": compact row for list/table view with same data.
 */
const EntityCard: React.FC<EntityCardProps> = ({
  title,
  subtitle,
  imageUrl,
  imageAlt,
  fields,
  location,
  actionLabel,
  onClick,
  variant,
  selected = false,
  onSelect,
  showCheckbox = true,
}) => {
  if (variant === 'row') {
    return (
      <div
        role="row"
        className={`grid grid-cols-[auto_200px_1fr_1fr_auto_1fr] gap-4 items-center bg-white rounded-xl border border-gray-100 px-4 py-3 transition-all duration-200 cursor-pointer ${
          selected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md hover:border-gray-300'
        }`}
        onClick={onClick}
      >
        {showCheckbox && onSelect ? (
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-0 cursor-pointer"
              aria-label={`تحديد ${title}`}
            />
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
            <Avatar src={imageUrl} name={imageAlt ?? title} size="md" className="!w-full !h-full !text-sm" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-gray-900 truncate">{title}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{subtitle}</div>
          </div>
        </div>
        {fields.map((field, idx) => (
          <div key={idx} className="min-w-0 text-sm text-gray-600">
            {field.type === 'pill' ? (
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPillClass(
                  field.value,
                  field.pillClass
                )}`}
              >
                {field.value}
              </span>
            ) : (
              <span className="truncate block">{field.value}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer transition-all group flex flex-col h-full min-w-0 ${
        selected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-[0_20px_25px_-5px_rgb(0_0_0_/_0.1),_0_8px_10px_-6px_rgb(0_0_0_/_0.1)] hover:-translate-y-0.5'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 mb-5">
        {showCheckbox && onSelect && (
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-0 cursor-pointer"
              aria-label={`تحديد ${title}`}
            />
          </div>
        )}
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-light group-hover:border-primary transition-colors flex-shrink-0">
          <Avatar src={imageUrl} name={imageAlt ?? title} size="md" className="!w-full !h-full !text-base" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors truncate">
            {title}
          </h3>
          {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="space-y-3 flex-1 min-w-0">
        {fields.map((field, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-gray-500 flex-shrink-0">{field.label}</span>
            {field.type === 'pill' ? (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex-shrink-0 ${getPillClass(
                  field.value,
                  field.pillClass
                )}`}
              >
                {field.value}
              </span>
            ) : (
              <span className="font-medium text-gray-700 truncate">{field.value}</span>
            )}
          </div>
        ))}
        {location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50">
        <button
          type="button"
          className="w-full py-2.5 bg-primary-light text-primary text-sm font-bold rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default EntityCard;
