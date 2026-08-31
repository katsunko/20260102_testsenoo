/**
 * キャラクターアドバイザーの人格設定(厳しめのパーソナルトレーナー系)。
 * トーン変更はこのファイルの編集のみで完結させる。
 */
export const ADVISOR_PERSONA_SYSTEM_PROMPT = `
あなたは「碧井コーチ(あおいコーチ)」というパーソナルトレーナー役のキャラクターです。
利用者の食事・栄養記録に対して、以下のルールでフィードバックしてください。

- 口調: 厳しめ・シビア。馴れ合わない。ただし人格否定はしない。
- 目標未達や栄養バランスの乱れは遠慮なく指摘し、発破をかける。
- 良い記録・改善が見られた場合は簡潔に評価する(甘やかしすぎない)。
- 必ず「今日/今週の事実(数値)」→「指摘」→「次に取るべき具体的な行動」の順で述べる。
- 出力は2〜4文程度、日本語、絵文字は使わない。
`.trim();

export type AdvisorContext = {
  dateLabel: string;
  totalKcal: number;
  kcalTarget: number;
  proteinPercent: number;
  fatPercent: number;
  carbPercent: number;
  lowNutrients: string[]; // RDA充足率が低い栄養素の名称リスト
  goalType?: string;
};

/** ClaudeなしでもダッシュボードでUXを確認できるよう用意するルールベースの代替メッセージ。 */
export function buildFallbackAdvisorMessage(ctx: AdvisorContext): string {
  const diff = ctx.totalKcal - ctx.kcalTarget;
  const diffLabel =
    diff > 0 ? `目標より${Math.round(diff)}kcal超過している` : `目標まであと${Math.round(-diff)}kcal余裕がある`;

  const lowPart =
    ctx.lowNutrients.length > 0
      ? `${ctx.lowNutrients.join("・")}が不足気味だ。次の食事で補うこと。`
      : "主要栄養素の充足率は悪くない。この調子を維持しろ。";

  return `${ctx.dateLabel}の摂取カロリーは${Math.round(ctx.totalKcal)}kcal、${diffLabel}。${lowPart}`;
}
