import React, { useState, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  renderBulkActions?: (selectedRows: TData[]) => React.ReactNode;
  storageKey?: string;
  filterPlaceholder?: string;
  disablePagination?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  renderBulkActions,
  storageKey = 'datatable_state',
  filterPlaceholder = 'بحث...',
  disablePagination = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Persistence
  useEffect(() => {
    const savedState = localStorage.getItem(storageKey);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setSorting(parsed.sorting || []);
        setPagination(prev => ({ ...prev, pageSize: parsed.pageSize || 10 }));
      } catch (e) {
        console.error('Failed to load table state', e);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        sorting,
        pageSize: pagination.pageSize,
      })
    );
  }, [sorting, pagination.pageSize, storageKey]);

  // Table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(disablePagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
  });

  // Virtualization
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const _rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  // Export CSV
  const handleExportCSV = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const rowsToExport = selectedRows.length > 0 ? selectedRows : table.getFilteredRowModel().rows;

    if (rowsToExport.length === 0) return;

    const headers = columns
      .filter(col => typeof col.header === 'string')
      .map(col => String(col.header));

    const csvContent = [
      headers.join(','),
      ...rowsToExport.map(row => {
        return row
          .getVisibleCells()
          .map(cell => {
            const val = cell.getValue();
            return typeof val === 'string' ? `"${val}"` : val;
          })
          .join(',');
      }),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data_export.csv';
    link.click();
  };

  const selectedData = table.getFilteredSelectedRowModel().rows.map(row => row.original);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:p-4">
        <div className="relative w-full sm:w-72">
          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-gray-50 pe-10 ps-4 text-sm transition-colors focus:border-transparent focus:bg-white focus:ring-2 focus:ring-primary"
            placeholder={filterPlaceholder}
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          {selectedData.length > 0 && renderBulkActions && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-[32px] items-center rounded-lg bg-primary-light px-2 py-1 text-xs font-semibold text-primary whitespace-nowrap">
                {selectedData.length} محدّد
              </span>
              {renderBulkActions(selectedData)}
              <div className="mx-2 hidden h-6 w-px bg-gray-300 sm:block"></div>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            title="تصدير CSV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span className="hidden sm:inline">تصدير</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div ref={tableContainerRef} className="overflow-auto max-h-[600px] relative w-full">
          <table className="min-w-[48rem] w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-700 font-semibold sticky top-0 z-10 shadow-sm">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className="px-4 py-3 first:rounded-tr-lg last:rounded-tl-lg whitespace-nowrap"
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none hover:text-primary' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: (
                              <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                            ),
                            desc: (
                              <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length > 0 ? (
                rows.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={`group transition-colors hover:bg-gray-50/80 ${onRowClick ? 'cursor-pointer' : ''} ${
                      row.getIsSelected() ? 'bg-blue-50 hover:bg-blue-100/50' : ''
                    }`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center align-middle text-gray-500">
                    <div className="flex flex-col items-center justify-center p-6">
                      <svg className="w-12 h-12 text-gray-200 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-gray-400 font-medium">لا توجد بيانات مطابقة.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!disablePagination && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-sm text-gray-500">
              صفحة <span className="font-bold text-gray-900">{table.getState().pagination.pageIndex + 1}</span> من{' '}
              <span className="font-bold text-gray-900">{table.getPageCount()}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-gray-300 bg-white transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
              <button
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-gray-300 bg-white transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
