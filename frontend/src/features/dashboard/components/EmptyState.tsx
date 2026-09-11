'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Link2, ListChecks, CalendarRange } from 'lucide-react';
import { IEmptyStateProps } from '../interfaces/dashboard.interface';

/**
 * The pipeline genuinely is a sequence — paste, extract, schedule — so numbering
 * it here reports how the product works rather than decorating the panel.
 */
const STEPS = [
  {
    Icon: Link2,
    title: 'Paste the posting',
    body: 'Drop in a job description and the company website.',
  },
  {
    Icon: ListChecks,
    title: 'Get the requirements',
    body: 'Trao pulls out must-haves and writes questions covering each one.',
  },
  {
    Icon: CalendarRange,
    title: 'Work the plan',
    body: 'Questions and flashcards laid out day by day until your interview.',
  },
];

export function EmptyState({ onCreateClick }: IEmptyStateProps) {
  return (
    <section className="mx-auto mt-6 max-w-3xl animate-fade-rise">
      <div className="overflow-hidden rounded-3xl border border-hairline bg-surface shadow-card">
        <div className="border-b border-hairline bg-gradient-to-br from-brand-50 via-surface to-signal-50/40 px-6 py-10 text-center sm:px-10 sm:py-12">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">
            Turn a job posting into a study plan
          </h2>
          <p className="mx-auto mt-2 max-w-md text-md leading-relaxed text-muted">
            You don&apos;t have any prep kits yet. Build one and you&apos;ll know exactly what to
            revise, and when.
          </p>

          <Link
            href="/new"
            onClick={onCreateClick}
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-brand-700 px-6 text-base font-semibold text-white shadow-xs transition hover:bg-brand-800 active:scale-[0.98] motion-reduce:active:scale-100"
          >
            <Plus className="h-4 w-4" />
            Build your first kit
          </Link>
        </div>

        <ol className="grid grid-cols-1 divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STEPS.map(({ Icon, title, body }, i) => (
            <li key={title} className="flex gap-3 px-5 py-5 sm:flex-col sm:gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sunken text-slate-500">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-ink">
                  <span className="tabular mr-1.5 text-muted">{i + 1}.</span>
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
