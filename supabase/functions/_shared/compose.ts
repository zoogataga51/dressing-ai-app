// Composition des looks avec contrôle qualité et seconde chance.
// 1er essai : le modèle propose 4 tenues ; on garde les 3 meilleures qui passent le contrôle.
// S'il en reste moins de 3, 2e essai en lui expliquant pourquoi les autres ont été refusées.
// Utilisé par la fonction serveur generate-outfits ET par le banc d'essai scripts/looks-lab.

import { geminiJsonWithFallback } from './gemini.ts';
import { OUTFIT_SCHEMA, OUTFIT_SYSTEM, validateOutfits, type ProposedOutfit, type WardrobeItem, type Weather } from './outfits.ts';

export type ComposeResult = {
  ok: ProposedOutfit[]; rejected: string[]; proposed: number; model: string; attempts: number;
  tokensIn: number; tokensOut: number; costEur: number; ms: number;
};

export async function composeOutfits(opts: {
  apiKey: string; models: string[]; prompt: string; wardrobe: WardrobeItem[]; weather: Weather;
  thinking?: 'minimal' | 'low' | 'medium' | 'high'; timeoutMs?: number; secondChance?: boolean;
}): Promise<ComposeResult> {
  const call = (text: string) => geminiJsonWithFallback<{ outfits: ProposedOutfit[] }>(opts.models, {
    apiKey: opts.apiKey, system: OUTFIT_SYSTEM, schema: OUTFIT_SCHEMA, parts: [{ text }], temperature: 0.8,
    thinking: opts.thinking ?? 'low', timeoutMs: opts.timeoutMs ?? 20_000,
  });

  const first = await call(opts.prompt);
  let proposed = first.data.outfits ?? [];
  let { ok, rejected } = validateOutfits(proposed, opts.wardrobe, opts.weather);
  const res: ComposeResult = {
    ok, rejected, proposed: proposed.length, model: first.model, attempts: 1,
    tokensIn: first.tokensIn, tokensOut: first.tokensOut, costEur: first.costEur, ms: first.ms,
  };

  if (ok.length < 3 && rejected.length && opts.secondChance !== false) {
    const feedback = `${opts.prompt}\n\nATTENTION : ces tenues proposées ont été refusées par le contrôle qualité :\n${rejected.join('\n')}\n` +
      `Ne les refais pas. Tenues déjà retenues (à ne pas répéter) :\n${ok.map((o) => o.garment_ids.join(', ')).join('\n') || 'aucune'}\n` +
      `Propose ${3 - ok.length + 1} nouvelles tenues correctes.`;
    try {
      const second = await call(feedback);
      proposed = [...ok, ...(second.data.outfits ?? [])];
      const again = validateOutfits(proposed, opts.wardrobe, opts.weather);
      Object.assign(res, {
        ok: again.ok, rejected: [...rejected, ...again.rejected], proposed: res.proposed + (second.data.outfits?.length ?? 0), attempts: 2,
        tokensIn: res.tokensIn + second.tokensIn, tokensOut: res.tokensOut + second.tokensOut, costEur: res.costEur + second.costEur, ms: res.ms + second.ms,
      });
    } catch { /* on garde le premier résultat */ }
  }
  return res;
}
