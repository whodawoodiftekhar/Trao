import { CompanyBrief } from '../../models/types';
import { CompanyResearch } from '../crawler/researcher';
import { llm } from './llm-client';

export async function generateCompanyBrief(research: CompanyResearch): Promise<CompanyBrief> {
  const systemPrompt = `You are an expert technical intelligence analyst and career coach.
Analyze the company context and crawled web content to produce an insightful, accurate company brief for an engineering interview candidate.

RULES:
1. Provide a concise, high-signal summary of the company's business model, customer scale, and industry impact.
2. In "what_they_do", highlight key engineering domains, system architectures, technical products, and engineering challenges.
3. Be factual and objective. Do not use filler or generic corporate buzzwords.
4. If crawled content is sparse, synthesize from known domain context and public web presence factually.

Respond ONLY with valid JSON:
{
  "summary": string,
  "what_they_do": string,
  "sources": string[]
}`;

  const userPrompt = `Company: ${research.companyName} (${research.companyUrl})
Crawled Homepage Content:
"""
${research.homepageContent || 'Homepage content unavailable or sparse.'}
"""

Crawled Hiring / Careers Content:
"""
${research.hiringContent || 'Careers page content unavailable.'}
"""

Public Discussion / Interview Notes:
"""
${research.publicDiscussion || 'No public interview discussion available.'}
"""

Discovered Sources: ${JSON.stringify(research.pagesUsed)}`;

  let primaryError: any = null;

  try {
    const brief = await llm.completeJson<CompanyBrief>(userPrompt, {
      systemPrompt,
      temperature: 0.2
    });

    if (brief && brief.summary && brief.what_they_do) {
      return {
        summary: brief.summary.trim(),
        what_they_do: brief.what_they_do.trim(),
        sources: Array.isArray(brief.sources) && brief.sources.length > 0 ? brief.sources : research.pagesUsed
      };
    }
  } catch (err: any) {
    primaryError = err;
    console.warn('[generateCompanyBrief] Primary brief generation failed:', err?.message || err);
  }

  // Dynamic secondary AI prompt with simpler context
  try {
    const fallbackBrief = await llm.completeJson<CompanyBrief>(
      `Create an engineering candidate brief for ${research.companyName} (${research.companyUrl}).
Briefly summarize what this company does and what their engineering team builds.
Respond ONLY with valid JSON: { "summary": string, "what_they_do": string, "sources": string[] }`,
      {
        systemPrompt: 'You are an executive recruiter summarizing company background for interview candidates.',
        temperature: 0.2
      }
    );
    if (fallbackBrief && fallbackBrief.summary && fallbackBrief.what_they_do) {
      return {
        summary: fallbackBrief.summary.trim(),
        what_they_do: fallbackBrief.what_they_do.trim(),
        sources: research.pagesUsed
      };
    }
  } catch (secErr: any) {
    console.warn('[generateCompanyBrief] Secondary synthesis failed:', secErr?.message || secErr);
    primaryError = primaryError || secErr;
  }

  // Surface why it failed. A generic message here made a missing API key and a
  // retired model name look identical from the UI.
  const reason = primaryError?.message ? ` ${primaryError.message}` : '';
  throw new Error(`Could not generate the company brief for ${research.companyName}.${reason}`);
}
