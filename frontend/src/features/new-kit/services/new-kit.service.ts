import { api } from '@/lib/api';
import { GenerationProgress, UIInterviewPrepKit } from '@/lib/types';
import { INewKitFormData } from '../interfaces/new-kit.interface';

export class NewKitService {
  public static async generatePrepKit(
    formData: INewKitFormData,
    onProgress: (p: GenerationProgress) => void
  ): Promise<UIInterviewPrepKit> {
    const completedKit = await api.generateKit(
      {
        jd: formData.jd,
        company_url: formData.companyUrl,
        days: formData.days
      },
      onProgress
    );

    return completedKit;
  }

  public static validateBatchJson(jsonString: string): { isValid: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return { isValid: false, count: 0, error: 'File must contain an array of case objects.' };
      }
      if (parsed.length === 0) {
        return { isValid: false, count: 0, error: 'Array is empty.' };
      }
      return { isValid: true, count: parsed.length };
    } catch {
      return { isValid: false, count: 0, error: 'Invalid JSON syntax.' };
    }
  }

  public static isStubJd(jd: string): boolean {
    const trimmed = jd.trim();
    return trimmed.length > 0 && trimmed.length < 120;
  }
}
