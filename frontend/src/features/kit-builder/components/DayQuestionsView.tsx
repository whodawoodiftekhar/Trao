'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Tag,
  Lightbulb,
  Plus,
  AlertCircle
} from 'lucide-react';
import { UIInterviewPrepKit, UIQuestion } from '@/lib/types';
import { api } from '@/lib/api';
import { cleanRoleTitle, cleanText, formatQuestionId } from '@/lib/utils';
import { InterviewSimulator } from './InterviewSimulator';
import { DataNotFoundState } from '@/components/DataNotFoundState';

interface DayQuestionsViewProps {
  kitId: string;
  dayNumber: number;
}

export function DayQuestionsView({ kitId, dayNumber }: DayQuestionsViewProps) {
  const router = useRouter();
  const [kit, setKit] = useState<UIInterviewPrepKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMockQuestion, setActiveMockQuestion] = useState<UIQuestion | null>(null);
  const [expandedOutlines, setExpandedOutlines] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const found = await api.getKit(kitId);
        if (found) {
          setKit(found);
        } else {
          setError('Preparation kit not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading kit data.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [kitId]);

  const toggleOutline = (questionId: string) => {
    setExpandedOutlines((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === undefined ? false : !prev[questionId]
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Loading Day {dayNumber} questions...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving AI question bank and schedule</p>
      </div>
    );
  }

  if (error || !kit) {
    return (
      <div className="py-10 sm:py-16">
        <DataNotFoundState
          title="Unable to Load Day Questions"
          description={error || `Questions for Day ${dayNumber} could not be loaded because the kit was not found or has been deleted.`}
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

  const daysList = kit.schedule?.days || [];
  const totalDays = kit.schedule?.days_available || daysList.length || 1;
  const currentDayPlan = daysList.find((d) => d.day === dayNumber) || {
    day: dayNumber,
    focus: `Day ${dayNumber} Focused Preparation`,
    question_ids: [],
    minutes: 45
  };

  // Filter questions for this day
  const assignedQuestions = (kit.questions || []).filter((q) =>
    currentDayPlan.question_ids.includes(q.id)
  );

  // If unallocated in schedule, fallback gracefully to day-specific slice without repeating questions across days
  const questionsPerDay = Math.max(1, Math.floor((kit.questions || []).length / Math.max(1, totalDays)));
  const fallbackStart = Math.min((dayNumber - 1) * questionsPerDay, Math.max(0, (kit.questions || []).length - questionsPerDay));
  const fallbackQuestions = assignedQuestions.length > 0
    ? assignedQuestions
    : (kit.questions || []).slice(fallbackStart, fallbackStart + questionsPerDay);

  // Strictly sort questions from Basic (Level 1) to Intermediate (Level 2) to Hard (Level 3)
  const dayQuestions = [...fallbackQuestions].sort(
    (a, b) => (a.difficulty || 2) - (b.difficulty || 2)
  );

  // Requirement lookup map
  const reqMap = new Map((kit.role?.requirements || []).map((r) => [r.id, r]));

  // Difficulty counts
  const l1Count = dayQuestions.filter((q) => q.difficulty === 1).length;
  const l2Count = dayQuestions.filter((q) => q.difficulty === 2).length;
  const l3Count = dayQuestions.filter((q) => q.difficulty === 3).length;

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
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs font-semibold text-slate-700">
            {cleanRoleTitle(kit.role?.title, 'Target Role')}
          </span>
        </div>
      </div>


      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-card overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white font-extrabold flex items-center justify-center text-lg shadow-sm shrink-0">
                D{dayNumber}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    Day {dayNumber} of {totalDays}
                  </span>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    Progressive Learning Path
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {currentDayPlan.focus}
                </h1>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl pt-1">
              All AI-generated interview questions assigned to this preparation day, organized systematically from basic foundational concepts to advanced scenarios.
            </p>
          </div>


          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs sm:text-sm font-mono font-bold shadow-xs">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>{currentDayPlan.minutes} mins plan</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {l1Count > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {l1Count} Easy
                </span>
              )}
              {l2Count > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  {l2Count} Medium
                </span>
              )}
              {l3Count > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  {l3Count} Hard
                </span>
              )}
            </div>
          </div>
        </div>


        {daysList.length > 1 && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Jump to Day:
              </span>
              <span className="text-xs text-slate-400">
                {daysList.length}-day curriculum
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {daysList.map((d) => {
                const isActive = d.day === dayNumber;
                return (
                  <button
                    key={d.day}
                    onClick={() => router.push(`/kit/${kitId}/day/${d.day}`)}
                    className={`h-8 px-3.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    Day {d.day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>


      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-brand-600" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            AI-Generated Questions ({dayQuestions.length})
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Ordered: Easy &rarr; Hard
        </span>
      </div>


      <div className="space-y-4">
        {dayQuestions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">No questions assigned to Day {dayNumber}.</p>
          </div>
        ) : (
          dayQuestions.map((question, index) => {
            const isExpanded = expandedOutlines[question.id] !== false; // default expanded

            const diffColor =
              question.difficulty === 1
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : question.difficulty === 3
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200';

            const diffText =
              question.difficulty === 1
                ? 'Easy'
                : question.difficulty === 3
                ? 'Hard'
                : 'Medium';

            const coveredRequirements = (question.requirement_ids || [])
              .map((id) => reqMap.get(id))
              .filter(Boolean);

            // Split answer outline into readable bullet items if formatted as lines
            const outlineLines = (question.answer_outline || '')
              .split(/\n+/)
              .map((line) => line.replace(/^[-*•\d.]+\s*/, '').trim())
              .filter((line) => line.length > 0);

            return (
              <div
                key={question.id}
                className="bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-pop transition-all overflow-hidden"
              >

                <div className="p-5 sm:p-6 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        Q{index + 1}.
                      </span>

                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${diffColor}`}>
                        {diffText}
                      </span>

                      <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {question.category}
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveMockQuestion(question)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white border border-brand-200 hover:border-brand-600 shadow-xs transition-all cursor-pointer self-start sm:self-auto group"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-brand-600 group-hover:text-white transition-colors" />
                      <span>Practice Answering</span>
                    </button>
                  </div>


                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed mb-3">
                    {question.prompt}
                  </h3>


                  {coveredRequirements.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 mb-3">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                        <Tag className="w-3 h-3" />
                        Target:
                      </span>
                      {coveredRequirements.map((req: any) => (
                        <span
                          key={req.id}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          {req.text}
                        </span>
                      ))}
                    </div>
                  )}


                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => toggleOutline(question.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors cursor-pointer py-1"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Hide' : 'Show'} AI Key Answer Points</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>


                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200 px-5 sm:px-6 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-brand-600" />
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Expected Answer Points & Assessment Criteria
                      </h4>
                    </div>

                    {outlineLines.length > 0 ? (
                      <div className="space-y-2">
                        {outlineLines.map((point, pIdx) => (
                          <div key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{point}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {question.answer_outline}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>


      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div>
          {dayNumber > 1 ? (
            <button
              onClick={() => router.push(`/kit/${kitId}/day/${dayNumber - 1}`)}
              className="inline-flex items-center gap-2 h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Day (Day {dayNumber - 1})</span>
            </button>
          ) : (
            <div />
          )}
        </div>

        <div>
          {dayNumber < totalDays ? (
            <button
              onClick={() => router.push(`/kit/${kitId}/day/${dayNumber + 1}`)}
              className="inline-flex items-center gap-2 h-8 px-3 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-all cursor-pointer"
            >
              <span>Next Day (Day {dayNumber + 1})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>


      {activeMockQuestion && (
        <InterviewSimulator
          question={activeMockQuestion}
          onClose={() => setActiveMockQuestion(null)}
        />
      )}
    </div>
  );
}
