'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { formatTime, formatQuestionId } from '@/lib/utils';
import { IScheduleTimelineProps } from '../interfaces/kit-builder.interface';

export function ScheduleTimeline({
  schedule,
  questions,
  kitId
}: IScheduleTimelineProps) {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [questionPage, setQuestionPage] = useState<number>(1);

  const totalMinutes = schedule.days.reduce((acc, d) => acc + d.minutes, 0);
  const totalDays = schedule.days.length || schedule.days_available || 1;


  const activePlan = schedule.days.find((d) => d.day === activeDay) || schedule.days[0];


  const allDayQuestions = activePlan
    ? questions
        .filter((q) => activePlan.question_ids.includes(q.id))
        .sort((a, b) => (a.difficulty || 2) - (b.difficulty || 2))
    : [];

  const l1Count = allDayQuestions.filter((q) => q.difficulty === 1).length;
  const l2Count = allDayQuestions.filter((q) => q.difficulty === 2).length;
  const l3Count = allDayQuestions.filter((q) => q.difficulty === 3).length;


  const PAGE_SIZE = 5;
  const totalQuestionPages = Math.ceil(allDayQuestions.length / PAGE_SIZE) || 1;
  const displayedQuestions = allDayQuestions.slice(
    (questionPage - 1) * PAGE_SIZE,
    questionPage * PAGE_SIZE
  );

  const daysScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollToDay = (day: number) => {
    if (daysScrollRef.current) {
      const el = document.getElementById(`day-tab-${day}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  const handleDayChange = (newDay: number) => {
    setActiveDay(newDay);
    setQuestionPage(1);
    scrollToDay(newDay);
  };

  const scrollDaysTrack = (direction: 'left' | 'right') => {
    if (daysScrollRef.current) {
      const scrollAmount = 240;
      daysScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const dayUrl = kitId && activePlan ? `/kit/${kitId}/day/${activePlan.day}` : '#';

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-6 shadow-card hover:shadow-pop transition-all overflow-hidden max-w-full">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {schedule.days_available || totalDays}-Day Progressive Preparation Schedule
              </h2>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 shrink-0">
                {formatTime(totalMinutes)} total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Progressive difficulty: Foundational (Basic) to Advanced (Hard) day-by-day
            </p>
          </div>
        </div>


        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            Day {activePlan?.day || 1} of {totalDays}
          </span>
        </div>
      </div>


      {totalDays > 1 && (
        <div className="mt-4 p-2 sm:p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0 max-w-full">

          <div className="relative shrink-0 flex items-center gap-1.5 pl-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
              Jump:
            </span>
            <div className="relative flex-1 sm:flex-initial">
              <select
                aria-label="Select preparation day"
                value={activeDay}
                onChange={(e) => handleDayChange(Number(e.target.value))}
                className="w-full sm:w-auto h-8 pl-2.5 pr-7 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-800 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer shadow-xs appearance-none transition-all"
              >
                {schedule.days.map((d) => (
                  <option key={d.day} value={d.day}>
                    Day {d.day}: {d.focus.slice(0, 20)}{d.focus.length > 20 ? '…' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 shrink-0 hidden sm:block" />

          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => scrollDaysTrack('left')}
              title="Scroll days left"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95 shrink-0 transition-all shadow-xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div
              ref={daysScrollRef}
              className="flex items-center gap-1.5 overflow-x-auto scroll-smooth scrollbar-none min-w-0 flex-1 py-0.5 px-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {schedule.days.map((d) => {
                const isActive = d.day === activeDay;
                return (
                  <button
                    key={d.day}
                    id={`day-tab-${d.day}`}
                    type="button"
                    onClick={() => handleDayChange(d.day)}
                    className={`h-8 px-3.5 text-xs font-bold rounded-lg shrink-0 transition-all cursor-pointer border whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white border-brand-600 shadow-sm shadow-brand-500/25 scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span>Day {d.day}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollDaysTrack('right')}
              title="Scroll days right"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95 shrink-0 transition-all shadow-xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}


      {activePlan && (
        <div className="mt-5">
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white shadow-card hover:shadow-pop transition-all group">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0 mt-0.5">
                  D{activePlan.day}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-slate-900 break-words leading-snug">
                    {activePlan.focus}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500 font-medium">
                      {allDayQuestions.length} questions planned
                    </span>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                      {l1Count > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {l1Count} Easy
                        </span>
                      )}
                      {l2Count > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          {l2Count} Medium
                        </span>
                      )}
                      {l3Count > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          {l3Count} Hard
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-mono font-bold px-3 py-1 rounded-xl bg-white border border-slate-300 text-slate-800 shadow-xs">
                  <Clock className="w-4 h-4 text-brand-600" />
                  {activePlan.minutes} mins
                </div>

                {kitId && (
                  <Link
                    href={dayUrl}
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white border border-brand-200 hover:border-brand-600 shadow-xs transition-all cursor-pointer group/btn"
                  >
                    <span>Open Day {activePlan.day}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </div>


            <div className="mt-3.5 space-y-2.5">
              {displayedQuestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                  No questions assigned to Day {activePlan.day}.
                </div>
              ) : (
                displayedQuestions.map((q, qIdx) => {
                  const questionNumber = (questionPage - 1) * PAGE_SIZE + qIdx + 1;

                  const diffColor =
                    q.difficulty === 1
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : q.difficulty === 3
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';

                  const diffLabel =
                    q.difficulty === 1
                      ? 'L1 • Easy'
                      : q.difficulty === 3
                      ? 'L3 • Hard'
                      : 'L2 • Medium';

                  return (
                    <div
                      key={q.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 hover:border-brand-400 transition-colors shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className="font-mono font-bold text-slate-700 text-xs px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 shrink-0">
                            Q{questionNumber}.
                          </span>
                          <span className="text-[11px] sm:text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                            {q.category}
                          </span>
                        </div>

                        <span className={`text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${diffColor}`}>
                          {diffLabel}
                        </span>
                      </div>

                      {q.prompt && (
                        <p className="mt-2 font-medium text-slate-800 text-xs sm:text-sm line-clamp-2 leading-relaxed pl-0.5">
                          {q.prompt}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>


            {totalQuestionPages > 1 && (
              <div className="mt-3.5 pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-slate-500 font-medium">
                  Showing {(questionPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(questionPage * PAGE_SIZE, allDayQuestions.length)} of{' '}
                  {allDayQuestions.length} questions
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQuestionPage((p) => Math.max(1, p - 1))}
                    disabled={questionPage <= 1}
                    className="h-7 px-2.5 font-semibold rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                  >
                    Previous
                  </button>

                  <span className="font-mono font-bold px-2 text-slate-700">
                    {questionPage} / {totalQuestionPages}
                  </span>

                  <button
                    onClick={() => setQuestionPage((p) => Math.min(totalQuestionPages, p + 1))}
                    disabled={questionPage >= totalQuestionPages}
                    className="h-7 px-2.5 font-semibold rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
