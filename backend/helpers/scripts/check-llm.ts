/**
 * Gemini key + model doctor.
 *
 * Tests every configured API key against every candidate model and reports
 * exactly which combinations work, so a generation failure can be traced to a
 * specific key or a retired model name instead of a generic error.
 *
 *   npm run check:llm
 *
 * Keys are read from GEMINI_API_KEYS / GEMINI_API_KEY (backend/.env) and are
 * always masked in output — never paste a key on the command line.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../Config/env';

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
];

const mask = (key: string) =>
  key.length <= 10 ? '***' : `${key.slice(0, 6)}…${key.slice(-4)} (${key.length} chars)`;

type ModelResult = { model: string; ok: boolean; detail: string };

function classify(err: any): string {
  const msg: string = err?.message || String(err);
  const status = err?.status;
  if (status === 404 || /404|not found|is not found/i.test(msg)) return 'model not available for this key';
  if (status === 429 || /429|RESOURCE_EXHAUSTED|quota/i.test(msg)) return 'QUOTA / rate limited';
  if (status === 401 || status === 403 || /401|403|API key not valid|PERMISSION_DENIED|Unauthorized/i.test(msg))
    return 'KEY REJECTED (invalid or not enabled)';
  if (/timeout|aborted|ETIMEDOUT|ENOTFOUND|ECONNRESET|fetch failed/i.test(msg)) return 'network problem';
  return msg.slice(0, 120);
}

/** Asks the API which models this key can actually see. */
async function listModels(key: string): Promise<string[] | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}&pageSize=200`
    );
    if (!res.ok) return null;
    const body: any = await res.json();
    return (body.models || [])
      .filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m: any) => String(m.name).replace(/^models\//, ''))
      .sort();
  } catch {
    return null;
  }
}

/** A real generateContent round-trip — the only proof a model actually works. */
async function testModel(key: string, model: string): Promise<ModelResult> {
  try {
    const client = new GoogleGenerativeAI(key);
    const gen = client.getGenerativeModel(
      {
        model,
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      },
      { timeout: 30000 }
    );
    const result = await gen.generateContent('Respond ONLY with this JSON: {"ok":true}');
    const text = result.response.text().trim();
    if (!text) return { model, ok: false, detail: 'empty response' };
    return { model, ok: true, detail: `replied ${text.slice(0, 40)}` };
  } catch (err: any) {
    return { model, ok: false, detail: classify(err) };
  }
}

(async () => {
  const keys = config.geminiApiKeys.length
    ? config.geminiApiKeys
    : config.geminiApiKey
    ? [config.geminiApiKey]
    : [];

  console.log('\n=== Gemini configuration check ===\n');

  if (keys.length === 0) {
    console.log('No API keys found.\n');
    console.log('Create backend/.env containing:\n');
    console.log('  GEMINI_API_KEYS=key1,key2,key3,key4\n');
    console.log('Get keys at https://aistudio.google.com/apikey');
    process.exit(1);
  }

  console.log(`Keys found: ${keys.length}`);
  console.log(`Configured default model: ${config.geminiModel}\n`);

  const workingByModel = new Map<string, number>();
  let usableKeys = 0;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`--- Key ${i + 1}/${keys.length}: ${mask(key)} ---`);

    const visible = await listModels(key);
    if (visible === null) {
      console.log('  Could not list models (key rejected or network blocked).');
    } else {
      const flash = visible.filter((m) => m.includes('flash'));
      console.log(`  Models visible to this key: ${visible.length} (${flash.length} flash)`);
      const unlisted = CANDIDATE_MODELS.filter((m) => !visible.includes(m) && !m.endsWith('-latest'));
      if (unlisted.length) console.log(`  Not offered to this key: ${unlisted.join(', ')}`);
    }

    let keyWorks = false;
    for (const model of CANDIDATE_MODELS) {
      const r = await testModel(key, model);
      console.log(`    ${r.ok ? 'WORKS  ' : 'fails  '} ${model.padEnd(26)} ${r.ok ? '' : '— ' + r.detail}`);
      if (r.ok) {
        keyWorks = true;
        workingByModel.set(model, (workingByModel.get(model) || 0) + 1);
      }
    }
    if (keyWorks) usableKeys++;
    console.log('');
  }

  console.log('=== Summary ===\n');
  console.log(`Usable keys: ${usableKeys} of ${keys.length}`);

  if (workingByModel.size === 0) {
    console.log('\nNo key/model combination worked. Most likely causes:');
    console.log('  - every key is invalid or the Generative Language API is not enabled on its project');
    console.log('  - all keys are out of quota');
    console.log('  - outbound network to generativelanguage.googleapis.com is blocked');
    process.exit(1);
  }

  const ranked = [...workingByModel.entries()].sort((a, b) => b[1] - a[1]);
  console.log('\nModels that work (and on how many keys):');
  for (const [model, count] of ranked) console.log(`  ${model.padEnd(26)} ${count}/${keys.length} keys`);

  console.log(`\nRecommended: GEMINI_MODEL=${ranked[0][0]}`);
  if (usableKeys < keys.length) {
    console.log(`\n${keys.length - usableKeys} key(s) are dead — remove them from GEMINI_API_KEYS so rotation does not waste attempts on them.`);
  }
  process.exit(0);
})().catch((e) => {
  console.error('Checker failed:', e);
  process.exit(1);
});
