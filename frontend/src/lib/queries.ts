import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import {
  UIInterviewPrepKit,
  UIQuestion,
  UIFlashcard,
  UICompanyBrief,
  QuestionCategory
} from './types';

interface KitSchedulePayload {
  days: unknown[];
  days_available: number;
}
import { purgeKit } from './query-client';

export const queryKeys = {
  kits: ['kits'] as const,
  kit: (id: string) => ['kit', id] as const,
  mockHistory: (questionId?: string) => ['mock-history', questionId || 'all'] as const,
};


export function useKitsQuery() {
  return useQuery({
    queryKey: queryKeys.kits,
    queryFn: () => api.getKits(),
    staleTime: 1000 * 60 * 2,
  });
}


export function useKitQuery(kitId: string) {
  return useQuery({
    queryKey: queryKeys.kit(kitId),
    queryFn: () => api.getKit(kitId),
    enabled: !!kitId && kitId !== 'new',
    staleTime: 1000 * 60 * 3,
  });
}


export function useDeleteKitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kitId: string) => api.deleteKit(kitId),
    onSuccess: (_, kitId) => {
      purgeKit(kitId, queryClient);
    },
  });
}


export function useSaveKitMutation(kitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kit: UIInterviewPrepKit) => api.saveKit(kit),
    onSuccess: (updatedKit) => {
      queryClient.setQueryData(queryKeys.kit(kitId), updatedKit);
      queryClient.invalidateQueries({ queryKey: queryKeys.kits });
    },
  });
}


export function useUpdateBriefMutation(kitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (brief: UICompanyBrief) => api.saveBrief(kitId, brief),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kit(kitId) });
    },
  });
}


export function useQuestionMutations(kitId: string) {
  const queryClient = useQueryClient();

  const addQuestion = useMutation({
    mutationFn: (newQ: UIQuestion) => api.addQuestion(kitId, newQ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kit(kitId) });
    },
  });

  const updateQuestion = useMutation({
    mutationFn: (q: UIQuestion) => api.updateQuestion(kitId, q),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kit(kitId) });
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: (qId: string) => api.deleteQuestion(kitId, qId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kit(kitId) });
    },
  });

  return { addQuestion, updateQuestion, deleteQuestion };
}


export function useUpdateScheduleMutation(kitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (schedule: KitSchedulePayload) => api.saveSchedule(kitId, schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kit(kitId) });
    },
  });
}


export function useSavePracticeMutation(kitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cards: UIFlashcard[]) => api.savePracticeProgress(kitId, cards),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.kit(kitId), (old: UIInterviewPrepKit | undefined) => {
        if (!old) return old;
        return { ...old, flashcards: data.flashcards };
      });
    },
  });
}


export function useRegenerateSectionMutation(kitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      section,
      category,
      existingManualQuestions,
    }: {
      section: 'company_brief' | 'schedule' | 'category' | 'all_questions' | 'full_kit';
      category?: QuestionCategory;
      existingManualQuestions?: UIQuestion[];
    }) => api.regenerateSection(kitId, section, category, existingManualQuestions),
    onSuccess: (updatedKit) => {
      queryClient.setQueryData(queryKeys.kit(kitId), updatedKit);
    },
  });
}


export function useMockHistoryQuery(questionId?: string) {
  return useQuery({
    queryKey: queryKeys.mockHistory(questionId),
    queryFn: () => questionId ? api.getMockQuestionHistory(questionId) : api.getMockHistory(),
    staleTime: 1000 * 60,
  });
}
