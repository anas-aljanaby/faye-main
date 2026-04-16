import React from 'react';

export interface PolicyTableColumn {
  key: string;
  label: string;
  className?: string;
}

interface PolicyDataTableProps<T extends Record<string, React.ReactNode>> {
  columns: PolicyTableColumn[];
  rows: T[];
  className?: string;
}

export function PolicyDataTable<T extends Record<string, React.ReactNode>>({
  columns,
  rows,
  className = '',
}: PolicyDataTableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-gray-200 bg-white ${className}`}>
      <table className="min-w-[40rem] w-full text-right text-sm md:text-base">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-3 font-semibold text-gray-800 md:px-4 ${col.className ?? ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
              {columns.map((col) => (
                <td key={col.key} className={`px-3 py-3 text-gray-600 md:px-4 ${col.className ?? ''}`}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
