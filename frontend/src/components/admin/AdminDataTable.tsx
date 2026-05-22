/**
 * Admin Data Table Component
 * Generic, reusable table with pagination, sorting, and selection
 */
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onSelect?: (selectedItems: T[]) => void;
  showCheckboxes?: boolean;
  pagination?: {
    page: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void;
  };
}

export function AdminDataTable<T extends { id: number }>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No data found',
  onSelect,
  showCheckboxes = false,
  pagination,
}: AdminDataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSelected = data.map((item) => item.id);
      setSelectedIds(newSelected);
      onSelect?.(data);
    } else {
      setSelectedIds([]);
      onSelect?.([]);
    }
  };

  const handleSelectRow = (item: T) => {
    const newSelected = selectedIds.includes(item.id)
      ? selectedIds.filter((id) => id !== item.id)
      : [...selectedIds, item.id];
    setSelectedIds(newSelected);
    const selectedItems = data.filter((d) => newSelected.includes(d.id));
    onSelect?.(selectedItems);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-6 h-6 text-muted animate-spin" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const allSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              {showCheckboxes && (
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    if (col.sortable) {
                      if (sortKey === col.key) {
                        setSortAsc(!sortAsc);
                      } else {
                        setSortKey(col.key);
                        setSortAsc(true);
                      }
                    }
                  }}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span>{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item, index) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {showCheckboxes && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleSelectRow(item)}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={`${item.id}-${col.key}`}
                    className="px-4 py-3"
                    style={{ width: col.width }}
                  >
                    {col.render ? col.render(item, index) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted font-medium">
            Showing {(pagination.page - 1) * pagination.perPage + 1} to{' '}
            {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
            {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded border border-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.pages }).map((_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === pagination.page;
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-terracotta text-white'
                        : 'border border-border hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-2 rounded border border-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
