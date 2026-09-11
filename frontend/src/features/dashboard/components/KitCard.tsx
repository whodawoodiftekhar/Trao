'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, ArrowRight, BookOpen, Calendar, Target } from 'lucide-react';
import { Card, Meter } from '@/shared/components/Card';
import { Button } from '@/shared/components';
import { cleanRoleTitle, cleanText } from '@/lib/utils';
import { IKitCardProps } from '../interfaces/dashboard.interface';

/** Remember which kit the user last opened so the sidebar follows them. */
export function rememberKit(kitId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('trao_last_kit_id', kitId);
    window.dispatchEvent(new CustomEvent('trao_kit_selected', { detail: kitId }));
  } catch {}
}

export function KitCard({ kit, onDelete }: IKitCardProps) {
  const kitId = kit.id || (kit as any)._id || '';
  const requirements = kit.role?.requirements || [];
  const mustHaves = requirements.filter((r) => r.priority === 'must');
  const uncovered = new Set(kit.coverage?.uncovered_requirement_ids || []);
  const coveredMustHaves = mustHaves.filter((r) => !uncovered.has(r.id)).length;

  const questionCount = kit.questions?.length || 0;
  const days = kit.schedule?.days_available || 0;
  const title = cleanRoleTitle(kit.role?.title, 'Role');
  const company = cleanText(kit.source?.company, 'Company');

  return (
    <Card hoverable className="group flex min-w-0 flex-col">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <Link
          href={`/kit/${kitId}`}
          onClick={() => rememberKit(kitId)}
          className="min-w-0 flex-1"
        >
          <p className="truncate text-sm font-medium text-muted">{company}</p>
          <h3
            title={title}
            className="mt-0.5 font-display text-lg leading-snug text-ink transition-colors group-hover:text-brand-700 line-clamp-2"
          >
            {title}
          </h3>
        </Link>

        <button
          onClick={(e) => onDelete(kitId, e)}
          title={`Delete ${title} kit`}
          aria-label={`Delete ${title} kit`}
          className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:text-rose-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pb-4 sm:px-5">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
          {kit.company_brief?.summary || 'Role requirements, questions and a day-by-day plan.'}
        </p>
      </div>

      {/* Readiness is the point of the product, so it gets measured, not badged. */}
      {mustHaves.length > 0 && (
        <div className="px-4 pb-4 sm:px-5">
          <Meter
            value={coveredMustHaves}
            max={mustHaves.length}
            label={`${coveredMustHaves} of ${mustHaves.length} must-haves covered`}
          />
        </div>
      )}

      <dl className="mt-auto grid grid-cols-3 divide-x divide-hairline border-t border-hairline text-center">
        <div className="px-2 py-3">
          <dt className="text-2xs text-muted">Questions</dt>
          <dd className="tabular mt-0.5 font-display text-lg text-ink">{questionCount}</dd>
        </div>
        <div className="px-2 py-3">
          <dt className="flex items-center justify-center gap-1 text-2xs text-muted">
            <Target className="h-3 w-3" /> Must-haves
          </dt>
          <dd className="tabular mt-0.5 font-display text-lg text-ink">{mustHaves.length}</dd>
        </div>
        <div className="px-2 py-3">
          <dt className="flex items-center justify-center gap-1 text-2xs text-muted">
            <Calendar className="h-3 w-3" /> Days
          </dt>
          <dd className="tabular mt-0.5 font-display text-lg text-ink">{days || '—'}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-3 border-t border-hairline p-3 sm:px-5">
        <Link
          href={`/kit/${kitId}/practice`}
          onClick={() => rememberKit(kitId)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink"
        >
          <BookOpen className="h-4 w-4 text-slate-400" />
          Practice
        </Link>

        <Link href={`/kit/${kitId}`} onClick={() => rememberKit(kitId)}>
          <Button size="sm" variant="primary" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
            Open kit
          </Button>
        </Link>
      </div>
    </Card>
  );
}
