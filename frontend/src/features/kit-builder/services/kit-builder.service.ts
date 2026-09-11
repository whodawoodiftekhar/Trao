import { api } from '@/lib/api';
import {
  UIInterviewPrepKit,
  UIQuestion,
  QuestionCategory,
  InterviewPrepKit
} from '@/lib/types';

export class KitBuilderService {
  public static async persistKit(updatedKit: UIInterviewPrepKit): Promise<void> {
    await api.saveKit(updatedKit);
  }

  public static async regenerateCompanyBrief(kit: UIInterviewPrepKit): Promise<UIInterviewPrepKit> {
    const res = await api.regenerateSection(kit.id || '', 'company_brief');
    if (res?.company_brief) {
      const updated = { ...kit, company_brief: res.company_brief };
      this.persistKit(updated);
      return updated;
    }
    return kit;
  }

  public static async regenerateCategory(
    kit: UIInterviewPrepKit,
    category: QuestionCategory
  ): Promise<UIInterviewPrepKit> {
    const manualAndPinned = kit.questions.filter(
      (q) => q.category === category && (q.origin === 'manual' || q.origin === 'edited' || q.isPinned)
    );

    const res = await api.regenerateSection(kit.id || '', 'category', category, manualAndPinned);
    if (res?.questions) {
      const regeneratedNew = res.questions.filter((q) => q.category === category && !q.isPinned);
      const untouchedOther = kit.questions.filter((q) => q.category !== category);

      const updated = {
        ...kit,
        questions: [...untouchedOther, ...manualAndPinned, ...regeneratedNew]
      };
      this.persistKit(updated);
      return updated;
    }
    return kit;
  }

  public static async regenerateAllQuestions(kit: UIInterviewPrepKit): Promise<UIInterviewPrepKit> {
    const manualAndPinned = kit.questions.filter(
      (q) => q.origin === 'manual' || q.origin === 'edited' || q.isPinned
    );
    const res = await api.regenerateSection(kit.id || '', 'all_questions', undefined, manualAndPinned);
    if (res?.questions) {
      this.persistKit(res);
      return res;
    }
    return kit;
  }

  public static async regenerateFullKit(kit: UIInterviewPrepKit): Promise<UIInterviewPrepKit> {
    const res = await api.regenerateSection(kit.id || '', 'full_kit');
    if (res) {
      this.persistKit(res);
      return res;
    }
    return kit;
  }

  public static async recalculateSchedule(kit: UIInterviewPrepKit): Promise<UIInterviewPrepKit> {
    const res = await api.regenerateSection(kit.id || '', 'schedule');
    if (res?.schedule) {
      const updated = { ...kit, schedule: res.schedule };
      this.persistKit(updated);
      return updated;
    }
    return kit;
  }

  public static exportAppendixAJson(kit: UIInterviewPrepKit): void {
    const cleanKit: InterviewPrepKit = {
      source: kit.source,
      company_brief: {
        summary: kit.company_brief.summary,
        what_they_do: kit.company_brief.what_they_do,
        sources: kit.company_brief.sources
      },
      role: kit.role,
      questions: kit.questions.map((q) => ({
        id: q.id,
        requirement_ids: q.requirement_ids,
        category: q.category,
        prompt: q.prompt,
        answer_outline: q.answer_outline,
        difficulty: q.difficulty
      })),
      flashcards: kit.flashcards.map((f) => ({
        id: f.id,
        front: f.front,
        back: f.back,
        requirement_ids: f.requirement_ids
      })),
      schedule: kit.schedule,
      coverage: kit.coverage
    };

    const blob = new Blob([JSON.stringify(cleanKit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileCompany = (kit.source?.company || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'company';
    const fileRole = (kit.role?.title || 'role').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'role';
    a.download = `${fileCompany}-${fileRole}-prep-kit.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public static async evaluateMockAnswer(params: {
    questionPrompt: string;
    answerOutline: string;
    userAnswer: string;
    questionId?: string;
  }) {
    return api.evaluateAnswer(params);
  }

  public static async fetchMockHistory(questionId: string) {
    return api.getMockQuestionHistory(questionId);
  }
}
