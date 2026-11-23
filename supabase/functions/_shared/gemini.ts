// Appel à l'API Gemini (Google) depuis les fonctions serveur.
//
// La clé (GEMINI_API_KEY) est un secret des Edge Functions : elle n'est jamais dans l'appli.
// Chaque appel renvoie aussi son coût estimé, enregistré pour suivre le coût IA par utilisateur
// (objectif : moins de 0,50 € par utilisateur et par mois).

export type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

export type GeminiResult<T> = {
  data: T;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costEur: number;
  ms: number;
};

/** Prix publics en dollars par million de jetons (entrée, sortie + réflexion). À mettre à jour si Google les change. */
const PRICES_USD: Record<string, { input: number; output: number }> = {
  'gemini-3.5-flash-lite': { input: 0.3, output: 2.5 },
  'gemini-3.1-flash-lite': { input: 0.3, output: 2.5 }, // prix non confirmé : on prend celui de 3.5 Flash-Lite (prudent)
  'gemini-3.5-flash': { input: 1.5, output: 9 },
};
const USD_TO_EUR = 0.92;

export function costEur(model: string, tokensIn: number, tokensOut: number): number {
  const p = PRICES_USD[model] ?? PRICES_USD['gemini-3.5-flash'];
  return ((tokensIn * p.input + tokensOut * p.output) / 1_000_000) * USD_TO_EUR;
}

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

/**
 * Demande une réponse JSON conforme à `schema`.
 * `thinking` : effort de réflexion du modèle ; « low » suffit et coûte bien moins cher.
 */
export async function geminiJson<T>(opts: {
  apiKey: string;
  model: string;
  system: string;
  parts: GeminiPart[];
  schema: Record<string, unknown>;
  temperature?: number;
  thinking?: 'minimal' | 'low' | 'medium' | 'high';
  timeoutMs?: number;
}): Promise<GeminiResult<T>> {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 25_000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: opts.system }] },
        contents: [{ role: 'user', parts: opts.parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: opts.schema,
          temperature: opts.temperature ?? 0.7,
          thinkingConfig: { thinkingLevel: opts.thinking ?? 'low' },
        },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new GeminiError(body?.error?.message ?? `HTTP ${res.status}`, res.status);
    const text: string = (body.candidates?.[0]?.content?.parts ?? [])
      .filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
      .map((p: { text: string }) => p.text).join('');
    if (!text) throw new GeminiError(`Réponse vide (${body.candidates?.[0]?.finishReason ?? 'inconnue'})`, 502);
    const usage = body.usageMetadata ?? {};
    const tokensIn = usage.promptTokenCount ?? 0;
    const tokensOut = (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0);
    let data: T;
    try { data = JSON.parse(text); } catch { throw new GeminiError('JSON invalide', 502); }
    return { data, model: opts.model, tokensIn, tokensOut, costEur: costEur(opts.model, tokensIn, tokensOut), ms: Date.now() - started };
  } catch (e) {
    if (e instanceof GeminiError) throw e;
    throw new GeminiError(e instanceof Error && e.name === 'AbortError' ? 'Délai dépassé' : String(e), 504);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Même chose, avec repli : si un modèle est saturé (429/503) ou trop lent, on essaie le suivant.
 * Les erreurs de requête (400…) ne sont pas réessayées.
 */
export async function geminiJsonWithFallback<T>(models: string[], opts: Omit<Parameters<typeof geminiJson>[0], 'model'>): Promise<GeminiResult<T>> {
  let last: unknown;
  for (const model of models) {
    try {
      return await geminiJson<T>({ ...opts, model });
    } catch (e) {
      last = e;
      const status = e instanceof GeminiError ? e.status : 500;
      if (![429, 500, 502, 503, 504].includes(status)) throw e;
    }
  }
  throw last;
}
