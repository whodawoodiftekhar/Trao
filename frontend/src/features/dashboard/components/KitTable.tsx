'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, BookOpen, Trash2, ArrowRight } from 'lucide-react';
import { UIInterviewPrepKit } from '@/lib/types';
import { cleanRoleTitle, cleanText } from '@/lib/utils';
import { Meter } from '@/shared/components/Card';
import { KitCard, rememberKit } from './KitCard';

interface IKitTableProps {
  kits: UIInterviewPrepKit[];
  onDelete: (id: string, e: React.MouseEvent) => void;
}

function coverageOf(kit: UIInterviewPrepKit) {
  const mustHaves = (kit.role?.requirements || []).filter((r) => r.priority === 'must');
  const uncovered = new Set(kit.coverage?.uncovered_requirement_ids || []);
  return {
    total: mustHaves.length,
    covered: mustHaves.filter((r) => !uncovered.has(r.id)).length,
  };
}

export function KitTable({ kits, onDelete }: IKitTableProps) {
  return (
    <>
      {/* A five-column table is unreadable on a phone, so below `md` the same
          rows render as the card layout rather than scrolling sideways. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
        {kits.map((kit) => (
          <KitCard key={kit.id || kit._id} kit={kit} onDelete={onDelete} />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Your interview preparation kits</caption>
          <thead>
            <tr className="border-b border-hairline bg-canvas">
              <th scope="col" className="px-4 py-3 text-xs font-semibold text-muted">Role</th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold text-muted">Must-have coverage</th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold text-muted">Questions</th>
              <th scope="col" className="hidden px-4 py-3 text-xs font-semibold text-muted lg:table-cell">Plan</th>
              <th scope="col" className="hidden px-4 py-3 text-xs font-semibold text-muted xl:table-cell">Researched</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-muted">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-hairline">
            {kits.map((kit) => {
              const kitId = kit.id || kit._id || '';
              const title = cleanRoleTitle(kit.role?.title, 'Target Role');
              const company = cleanText(kit.source?.company, 'Company');
              const { total, covered } = coverageOf(kit);
              const days = kit.schedule?.days_available || 0;
              const dateStr = kit.source?.researched_at
                ? new Date(kit.source.researched_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—';

              return (
                <tr key={kitId || title} className="group transition-colors hover:bg-canvas">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-brand-200/70 bg-brand-50 text-brand-700">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <Link
                          href={`/kit/${kitId}`}
                          onClick={() => rememberKit(kitId)}
                          title={title}
                          className="block max-w-[16rem] truncate text-base font-semibold text-ink transition-colors hover:text-brand-700 lg:max-w-[22rem]"
                        >
                          {title}
                        </Link>
                        <span className="block truncate text-sm text-muted">{company}</span>
                      </span>
                    </div>
                  </td>

                  <td className="w-48 px-4 py-3.5">
                    {total > 0 ? (
                      <Meter value={covered} max={total} label={`${covered}/${total}`} />
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </td>

                  <td className="tabular px-4 py-3.5 text-base font-semibold text-ink">
                    {kit.questions?.length || 0}
                  </td>

                  <td className="tabular hidden px-4 py-3.5 text-sm text-muted lg:table-cell">
                    {days ? `${days} days` : '—'}
                  </td>

                  <td className="tabular hidden whitespace-nowrap px-4 py-3.5 text-sm text-muted xl:table-cell">
                    {dateStr}
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/kit/${kitId}/practice`}
                        onClick={() => rememberKit(kitId)}
                        title={`Practice ${title} flashcards`}
                        aria-label={`Practice ${title} flashcards`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"
                      >
                        <BookOpen className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={(e) => onDelete(kitId, e)}
                        title={`Delete ${title} kit`}
                        aria-label={`Delete ${title} kit`}
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <Link
                        href={`/kit/${kitId}`}
                        onClick={() => rememberKit(kitId)}
                        className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink"
                      >
                        Open
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
