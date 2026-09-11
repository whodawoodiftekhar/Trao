import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../Config/env';

export interface LlmCompletionOptions {
  systemPrompt?: string;
  temperature?: number;
  maxRetries?: number;
  jsonMode?: boolean;
  timeout?: number;
}

export class LlmClient {
  private apiKeys: string[] = [];
  private currentKeyIndex: number = 0;
  private genAIClients: GoogleGenerativeAI[] = [];
  private modelName: string;
  private lastCallTimestamp: number = 0;
  private minIntervalMs: number = 500;

  private candidateModels: string[];

  constructor() {
    this.modelName = config.geminiModel || 'gemini-3.5-flash-lite';
    // Ordered newest-first, then older generations as fallbacks. Keep this a
    // superset: model availability changes over time and per API key, and a
    // name that is missing today may be the only one that works tomorrow.
    // `-latest` sits last as a catch-all that tracks whatever Google ships.
    this.candidateModels = Array.from(new Set([
      this.modelName,
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-flash-lite-latest'
    ])).filter(Boolean);

    this.apiKeys = config.geminiApiKeys && config.geminiApiKeys.length > 0
      ? config.geminiApiKeys
      : (config.geminiApiKey ? [config.geminiApiKey] : []);

    this.genAIClients = this.apiKeys.map((key) => new GoogleGenerativeAI(key));
  }

  public hasApiKey(): boolean {
    return this.genAIClients.length > 0;
  }

  private getActiveClient(): GoogleGenerativeAI | null {
    if (this.genAIClients.length === 0) return null;
    return this.genAIClients[this.currentKeyIndex % this.genAIClients.length];
  }

  private rotateApiKey() {
    if (this.genAIClients.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.genAIClients.length;
      console.log(`[LlmClient] Rotated to API key #${this.currentKeyIndex + 1} of ${this.genAIClients.length}`);
    }
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async enforceRatePace() {
    const now = Date.now();
    const elapsed = now - this.lastCallTimestamp;
    if (elapsed < this.minIntervalMs) {
      await this.sleep(this.minIntervalMs - elapsed);
    }
    this.lastCallTimestamp = Date.now();
  }

  public async completeJson<T>(userPrompt: string, options: LlmCompletionOptions = {}): Promise<T> {
    const maxRetries = options.maxRetries ?? Math.max(5, this.candidateModels.length * Math.max(1, this.genAIClients.length));
    let delay = 1500;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const activeModel = this.candidateModels[(attempt - 1) % this.candidateModels.length] || this.modelName;
      const client = this.getActiveClient();

      try {
        await this.enforceRatePace();

        if (!client) {
          throw new Error(
            'No Gemini API key configured. Set GEMINI_API_KEY (or GEMINI_API_KEYS) in backend/.env.'
          );
        }

        const model = client.getGenerativeModel(
          {
            model: activeModel,
            generationConfig: {
              temperature: options.temperature ?? 0.2,
              responseMimeType: 'application/json'
            },
            systemInstruction: options.systemPrompt
          },
          { timeout: options.timeout ?? 60000 }
        );

        const result = await model.generateContent(userPrompt);
        const text = result.response.text();

        return this.cleanAndParseJson<T>(text);
      } catch (err: any) {
        lastError = err;
        const isModelNotFound =
          err.status === 404 ||
          err.message?.includes('404') ||
          err.message?.includes('not found');

        const isRateLimit =
          err.status === 429 ||
          err.message?.includes('429') ||
          err.message?.includes('RESOURCE_EXHAUSTED') ||
          err.message?.includes('quota');

        const isTimeout =
          err.name === 'AbortError' ||
          err.message?.includes('aborted') ||
          err.message?.includes('timeout') ||
          err.code === 'ETIMEDOUT';

        const isAuthError =
          err.status === 401 ||
          err.message?.includes('401') ||
          err.message?.includes('authentication') ||
          err.message?.includes('Unauthorized') ||
          err.message?.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED');

        const isTransient =
          isModelNotFound ||
          isRateLimit ||
          isAuthError ||
          err.status === 503 ||
          err.code === 'ECONNRESET' ||
          err.name === 'SyntaxError' ||
          isTimeout;

        // Rotate key on quota/rate limit or authentication failure immediately
        if ((isRateLimit || isAuthError) && this.genAIClients.length > 1) {
          this.rotateApiKey();
        }

        if (attempt < maxRetries && isTransient) {
          const waitTime = isModelNotFound
            ? 100
            : (isRateLimit ? 250 : Math.min(delay, 2000));

          console.warn(`[LlmClient] Model ${activeModel} encountered: ${err.message?.slice(0, 100) || 'transient error'}. Retrying attempt ${attempt + 1}/${maxRetries} in ${Math.round(waitTime)}ms...`);
          await this.sleep(waitTime);
          if (!isModelNotFound && !isRateLimit) delay = Math.min(delay * 1.5, 3000);
        } else {
          throw err;
        }
      }
    }

    throw new Error(
      `LLM call failed after ${maxRetries} attempts across models [${this.candidateModels.join(', ')}]` +
        (lastError?.message ? `. Last error: ${lastError.message}` : '')
    );
  }

  private cleanAndParseJson<T>(rawText: string): T {
    let cleaned = rawText.trim();
    // Strip markdown code fences if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }


    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = 0;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace !== -1) cleaned = cleaned.slice(startIdx, lastBrace + 1);
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      const lastBracket = cleaned.lastIndexOf(']');
      if (lastBracket !== -1) cleaned = cleaned.slice(startIdx, lastBracket + 1);
    }

    return JSON.parse(cleaned);
  }
}

export const llm = new LlmClient();
