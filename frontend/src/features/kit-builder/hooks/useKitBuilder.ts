'use client';

import { useState, useEffect } from 'react';
import {
  UIInterviewPrepKit,
  UIQuestion,
  UIFlashcard,
  UICompanyBrief,
  QuestionCategory
} from '@/lib/types';
import { KitBuilderService } from '../services/kit-builder.service';
import { useKitQuery } from '@/lib/queries';
import { errorMessage } from '@/lib/utils';

export function useKitBuilder(kitId: string) {
  const { data: serverKit, isLoading: isQueryLoading, error: queryError } = useKitQuery(kitId);
  const [kit, setKit] = useState<UIInterviewPrepKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
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

  const updateKitState = (updatedKit: UIInterviewPrepKit) => {
    setKit(updatedKit);
    KitBuilderService.persistKit(updatedKit);
  };


  const handleUpdateBrief = (brief: UICompanyBrief) => {
    if (!kit) return;
    updateKitState({ ...kit, company_brief: brief });
  };

  const handleRegenerateBrief = async () => {
    if (!kit) return;
    setRegeneratingSection('brief');
    try {
      const updated = await KitBuilderService.regenerateCompanyBrief(kit);
      setKit(updated);
    } catch (err: any) {
      alert(`Could not regenerate brief: ${err.message || 'Error'}`);
    } finally {
      setRegeneratingSection(null);
    }
  };

  // Questions
  const handleUpdateQuestion = (updated: UIQuestion) => {
    if (!kit) return;
    const questions = kit.questions.map((q) => (q.id === updated.id ? updated : q));
    updateKitState({ ...kit, questions });
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!kit) return;
    const questions = kit.questions.filter((q) => q.id !== qId);
    updateKitState({ ...kit, questions });
  };

  const handleAddQuestion = (newQuestion: UIQuestion) => {
    if (!kit) return;
    updateKitState({ ...kit, questions: [...kit.questions, newQuestion] });
  };

  const handleMoveQuestion = (fromIdx: number, toIdx: number, category: QuestionCategory) => {
    if (!kit) return;
    const catQuestions = kit.questions.filter((q) => q.category === category);
    const otherQuestions = kit.questions.filter((q) => q.category !== category);

    const moved = [...catQuestions];
    const [target] = moved.splice(fromIdx, 1);
    moved.splice(toIdx, 0, target);

    updateKitState({ ...kit, questions: [...otherQuestions, ...moved] });
  };

  const handleCategoryChange = (questionId: string, newCategory: QuestionCategory) => {
    if (!kit) return;
    const questions = kit.questions.map((q) =>
      q.id === questionId ? { ...q, category: newCategory, origin: 'edited' as const, isPinned: true } : q
    );
    updateKitState({ ...kit, questions });
  };

  const handleRegenerateCategory = async (cat: QuestionCategory) => {
    if (!kit) return;
    setRegeneratingSection(`cat-${cat}`);
    try {
      const updated = await KitBuilderService.regenerateCategory(kit, cat);
      setKit(updated);
    } catch (err: any) {
      alert(`Could not regenerate category: ${err.message || 'Error'}`);
    } finally {
      setRegeneratingSection(null);
    }
  };

  // Flashcards
  const handleUpdateFlashcard = (updated: UIFlashcard) => {
    if (!kit) return;
    const flashcards = kit.flashcards.map((f) => (f.id === updated.id ? updated : f));
    updateKitState({ ...kit, flashcards });
  };

  const handleDeleteFlashcard = (fId: string) => {
    if (!kit) return;
    const flashcards = kit.flashcards.filter((f) => f.id !== fId);
    updateKitState({ ...kit, flashcards });
  };

  const handleAddFlashcard = (newCard: UIFlashcard) => {
    if (!kit) return;
    updateKitState({ ...kit, flashcards: [...kit.flashcards, newCard] });
  };

  // Schedule
  const handleRecalculateSchedule = async (days: number) => {
    if (!kit) return;
    setRegeneratingSection('schedule');
    try {
      const updated = await KitBuilderService.recalculateSchedule(kit);
      setKit(updated);
    } catch (err: any) {
      alert(`Could not recalculate schedule: ${err.message || 'Error'}`);
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleRegenerateAllQuestions = async () => {
    if (!kit) return;
    setRegeneratingSection('all_questions');
    try {
      const updated = await KitBuilderService.regenerateAllQuestions(kit);
      setKit(updated);
    } catch (err: any) {
      alert(`Could not regenerate questions: ${err.message || 'Error'}`);
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleRegenerateFullKit = async () => {
    if (!kit) return;
    setRegeneratingSection('full_kit');
    try {
      const updated = await KitBuilderService.regenerateFullKit(kit);
      setKit(updated);
    } catch (err: any) {
      alert(`Could not regenerate kit: ${err.message || 'Error'}`);
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleExportJson = () => {
    if (!kit) return;
    KitBuilderService.exportAppendixAJson(kit);
  };

  return {
    kit,
    isLoading,
    error,
    regeneratingSection,
    activeMockQuestion,
    setActiveMockQuestion,
    handleUpdateBrief,
    handleRegenerateBrief,
    handleUpdateQuestion,
    handleDeleteQuestion,
    handleAddQuestion,
    handleMoveQuestion,
    handleCategoryChange,
    handleRegenerateCategory,
    handleUpdateFlashcard,
    handleDeleteFlashcard,
    handleAddFlashcard,
    handleRecalculateSchedule,
    handleRegenerateAllQuestions,
    handleRegenerateFullKit,
    handleExportJson
  };
}
