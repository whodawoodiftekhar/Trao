'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Sparkles,
  Plus,
  AlertCircle
} from 'lucide-react';
import { UIInterviewPrepKit, UIQuestion } from '@/lib/types';
import { cleanRoleTitle, cleanText, formatTime } from '@/lib/utils';
import { ScheduleTimeline } from './ScheduleTimeline';
import { InterviewSimulator } from './InterviewSimulator';
import { ScheduleSkeleton } from '@/components/skeletons/ScheduleSkeleton';
import { useKitQuery } from '@/lib/queries';
import { DataNotFoundState } from '@/components/DataNotFoundState';
import { errorMessage } from '@/lib/utils';

interface ScheduleViewProps {
  kitId: string;
}

export function ScheduleView({ kitId }: ScheduleViewProps) {
  const { data: serverKit, isLoading: isQueryLoading, error: queryError } = useKitQuery(kitId);
  const [kit, setKit] = useState<UIInterviewPrepKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMockQuestion, setActiveMockQuestion] = useState<UIQuestion | null>(null);

  useEffect(() => {
    if (serverKit) {
      setKit(serverKit);
      setIsLoading(false);
      setError(null);
      if (typeof window !== 'undefined') {
        localStorage.setItem('trao_last_kit_id', kitId);
        window.dispatchEvent(new CustomEvent('trao_kit_selected', { detail: kitId }));
      }
    } else if (!isQueryLoading && (queryError || !serverKit)) {
      setKit(null);
      setError(errorMessage(queryError));
      setIsLoading(false);
    }
  }, [serverKit, isQueryLoading, queryError, kitId]);

  if (isLoading) {
    return <ScheduleSkeleton />;
  }

  if (error || !kit || !kit.schedule) {
    return (
      <div className="py-10 sm:py-16">
        <DataNotFoundState
          title="Unable to Load Schedule"
          description={error || 'The preparation schedule for this kit is unavailable or the kit has been deleted.'}
          primaryAction={{
            label: 'Return to Dashboard',
            href: '/dashboard',
            icon: ArrowLeft
          }}
          secondaryAction={{
            label: 'Create New Kit',
            href: '/new',
            icon: Plus
          }}
        />
      </div>
    );
  }

  const totalMinutes = kit.schedule.days.reduce((acc, d) => acc + d.minutes, 0);

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-4 sm:px-6 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <Link
          href={`/kit/${kitId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Kit Builder</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
            {cleanText(kit.source?.company, 'Company')}
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono">
            {kit.schedule.days_available} Days Plan
          </span>
        </div>
      </div>


      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Preparation Schedule & Day Curriculum
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              {cleanRoleTitle(kit.role?.title, 'Role')} Interview Schedule
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Progressive mastery structured from foundational basics to advanced system design and mock drills
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 shadow-xs">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>{formatTime(totalMinutes)} total study</span>
            </div>
          </div>
        </div>
      </div>


      <ScheduleTimeline
        schedule={kit.schedule}
        questions={kit.questions || []}
        requirements={kit.role?.requirements || []}
        kitId={kitId}
      />


      {activeMockQuestion && (
        <InterviewSimulator
          question={activeMockQuestion}
          onClose={() => setActiveMockQuestion(null)}
        />
      )}
    </div>
  );
}
