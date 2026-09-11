import { UIFlashcard, UIInterviewPrepKit } from '@/lib/types';
import { api } from '@/lib/api';

export class PracticeService {

  public static sortFlashcardsForPractice(cards: UIFlashcard[]): UIFlashcard[] {
    const getWeight = (c: UIFlashcard): number => {
      switch (c.confidence) {
        case 'low':
          return 100;
        case 'unreviewed':
        case undefined:
          return 75;
        case 'medium':
          return 50;
        case 'high':
          return 10;
        default:
          return 50;
      }
    };

    return [...cards].sort((a, b) => {
      const weightDiff = getWeight(b) - getWeight(a);
      if (weightDiff !== 0) return weightDiff;

      const timeA = a.lastPracticedAt ? new Date(a.lastPracticedAt).getTime() : 0;
      const timeB = b.lastPracticedAt ? new Date(b.lastPracticedAt).getTime() : 0;
      return timeA - timeB;
    });
  }

  public static async saveFlashcardProgress(kit: UIInterviewPrepKit, updatedCards: UIFlashcard[]): Promise<void> {
    if (!kit.id) {
      await api.saveKit({ ...kit, flashcards: updatedCards });
      return;
    }
    await api.savePracticeProgress(kit.id, updatedCards);
  }
}
