'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Table2,
  LayoutGrid,
  FolderSearch,
  Sparkles
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { KitCard } from './KitCard';
import { KitTable } from './KitTable';
import { EmptyState } from './EmptyState';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { InputField, Pagination, Button } from '@/shared/components';

export function DashboardView() {
  const { kits, isLoading, error, handleDelete } = useDashboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);


  const filteredKits = useMemo(() => {
    if (!searchQuery.trim()) return kits;
    const query = searchQuery.toLowerCase().trim();

    return kits.filter((kit) => {
      const company = kit.source?.company?.toLowerCase() || '';
      const title = kit.role?.title?.toLowerCase() || '';
      const seniority = kit.role?.seniority?.toLowerCase() || '';
      const summary = kit.company_brief?.summary?.toLowerCase() || '';
      const requirements = (kit.role?.requirements || []).map((r) => r.text.toLowerCase()).join(' ');

      return (
        company.includes(query) ||
        title.includes(query) ||
        seniority.includes(query) ||
        summary.includes(query) ||
        requirements.includes(query)
      );
    });
  }, [kits, searchQuery]);


  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };


  const totalKits = filteredKits.length;
  const totalPages = Math.max(1, Math.ceil(totalKits / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalKits);
  const paginatedKits = useMemo(() => {
    return filteredKits.slice(startIndex, endIndex);
  }, [filteredKits, startIndex, endIndex]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">

      <header className="page-head">
        <div className="min-w-0">
          <h1 className="page-title">Your prep kits</h1>
          <p className="page-sub">
            Each kit turns one job posting into requirements, questions and a day-by-day plan.
          </p>
        </div>

        <Link href="/new" className="shrink-0">
          <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />}>
            New prep kit
          </Button>
        </Link>
      </header>

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {kits.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-5">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="w-full sm:max-w-sm">
              <InputField
                placeholder="Search role, company or skill"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                clearable
                onClear={() => handleSearchChange('')}
                inputSize="sm"
                aria-label="Search prep kits"
              />
            </div>

            <div className="flex items-center gap-3 sm:shrink-0">
              <p className="tabular text-sm text-muted" aria-live="polite">
                {totalKits} {totalKits === 1 ? 'kit' : 'kits'}
              </p>

              <div
                role="group"
                aria-label="View mode"
                className="inline-flex rounded-xl border border-hairline bg-surface p-0.5"
              >
                {([
                  { mode: 'table' as const, Icon: Table2, label: 'Table' },
                  { mode: 'grid' as const, Icon: LayoutGrid, label: 'Grid' }
                ]).map(({ mode, Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    aria-pressed={viewMode === mode}
                    title={`${label} view`}
                    className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold transition ${
                      viewMode === mode ? 'bg-ink text-white' : 'text-slate-500 hover:text-ink'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredKits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-surface px-6 py-14 text-center">
              <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-sunken text-slate-400">
                <FolderSearch className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg text-ink">No kits match that search</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Nothing found for &ldquo;{searchQuery}&rdquo;. Try a different role, company or skill.
              </p>
              <Button variant="secondary" size="sm" className="mt-5" onClick={() => handleSearchChange('')}>
                Clear search
              </Button>
            </div>
          ) : viewMode === 'table' ? (
            <KitTable kits={paginatedKits} onDelete={handleDelete} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedKits.map((kit) => (
                <KitCard key={kit.id} kit={kit} onDelete={handleDelete} />
              ))}
            </div>
          )}


          {totalKits > 0 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
              totalItems={totalKits}
              pageSize={pageSize}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              itemName="kits"
            />
          )}
        </div>
      )}
    </div>
  );
}
