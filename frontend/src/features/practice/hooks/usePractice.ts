'use client';

import { useState, useEffect } from 'react';
import { UIFlashcard, UIInterviewPrepKit } from '@/lib/types';
import { PracticeService } from '../services/practice.service';
import { useKitQuery } from '@/lib/queries';
import { errorMessage } from '@/lib/utils';

export function usePractice(kitId: string) {
  const { data: serverKit, isLoading: isQueryLoading, error: queryError } = useKitQuery(kitId);
  const [kit, setKit] = useState<UIInterviewPrepKit | null>(null);
  const [cards, setCards] = useState<UIFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serverKit) {
      setKit(serverKit);
      if (serverKit.flashcards && serverKit.flashcards.length > 0) {
        const sorted = PracticeService.sortFlashcardsForPractice(serverKit.flashcards);
        setCards(sorted);
      } else {
        setCards([]);
      }
      setIsLoading(false);
    } else if (!isQueryLoading && (queryError || !serverKit)) {
      setKit(null);
      setCards([]);
      if (queryError) setError(errorMessage(queryError));
      setIsLoading(false);
    }
  }, [serverKit, isQueryLoading, queryError, kitId]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || cards.length === 0) return;


      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'textarea' || activeTag === 'input') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setIsFlipped(false);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < cards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
        }
      } else if (isFlipped) {
        if (e.key === '1') {
          handleRate('low');
        } else if (e.key === '2') {
          handleRate('medium');
        } else if (e.key === '3') {
          handleRate('high');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isFinished, currentIndex, cards]);

  const saveUserAnswer = async (cardId: string, answer: string) => {
    const updatedCards = cards.map((c) =>
      c.id === cardId ? { ...c, userAnswer: answer, lastPracticedAt: new Date().toISOString() } : c
    );
    setCards(updatedCards);
    if (kit) {
      await PracticeService.saveFlashcardProgress(kit, updatedCards);
    }
  };

  const handleRate = async (confidence: 'low' | 'medium' | 'high', draftAnswer?: string) => {
    const currentCard = cards[currentIndex];
    const answer = draftAnswer !== undefined ? draftAnswer : (currentCard?.userAnswer || '');
    const updatedCards = [...cards];
    updatedCards[currentIndex] = {
      ...updatedCards[currentIndex],
      confidence,
      userAnswer: answer,
      lastPracticedAt: new Date().toISOString()
    };

    setCards(updatedCards);
    if (kit) {
      await PracticeService.saveFlashcardProgress(kit, updatedCards);
    }

    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestartSmartSession = () => {
    const nextQueue = PracticeService.sortFlashcardsForPractice(cards);
    setCards(nextQueue);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  const handleAddCard = async (front: string, back: string) => {
    if (!kit) return;
    const newCard: UIFlashcard = {
      id: `f${Date.now().toString().slice(-4)}`,
      front,
      back,
      requirement_ids: kit.role?.requirements?.map((r) => r.id) || ['r1'],
      confidence: 'unreviewed',
      origin: 'manual',
      isPinned: true
    };
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);
    await PracticeService.saveFlashcardProgress(kit, updatedCards);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!kit) return;
    const updatedCards = cards.filter((c) => c.id !== cardId);
    setCards(updatedCards);
    if (currentIndex >= updatedCards.length) {
      setCurrentIndex(Math.max(0, updatedCards.length - 1));
    }
    await PracticeService.saveFlashcardProgress(kit, updatedCards);
  };

  const handleShuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  const jumpToCard = (index: number) => {
    if (index >= 0 && index < cards.length) {
      setCurrentIndex(index);
      setIsFlipped(false);
      setIsFinished(false);
    }
  };

  // Progress stats
  const coveredCount = cards.filter((c) => c.confidence && c.confidence !== 'unreviewed').length;
  const highCount = cards.filter((c) => c.confidence === 'high').length;
  const medCount = cards.filter((c) => c.confidence === 'medium').length;
  const lowCount = cards.filter((c) => c.confidence === 'low').length;
  const progressPercent = Math.round((coveredCount / (cards.length || 1)) * 100) || 0;
  const sessionPercent = cards.length > 0 ? Math.min(100, Math.round(((currentIndex + 1) / cards.length) * 100)) : 0;

  return {
    kit,
    cards,
    currentCard: cards[currentIndex],
    currentIndex,
    setCurrentIndex,
    isFlipped,
    setIsFlipped,
    isFinished,
    isLoading,
    error,
    handleRate,
    saveUserAnswer,
    handleRestartSmartSession,
    handleAddCard,
    handleDeleteCard,
    handleShuffleCards,
    jumpToCard,
    coveredCount,
    highCount,
    medCount,
    lowCount,
    progressPercent,
    sessionPercent
  };
}
