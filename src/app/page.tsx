"use client";

import { useEffect, useState } from "react";
import type { MealLog, RecommendationResponse, SummaryResponse } from "@/types";
import { MEAL_TYPE_LABELS, NUTRIENT_GROUPS, NUTRIENT_LABELS } from "@/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${weekday})`;
}

function statusClass(nutrient: string, percent: number): "ok" | "mid" | "low" {
  if (nutrient === "salt_g") return percent > 100 ? "low" : "ok";
  if (percent >= 70) return "ok";
  if (percent >= 40) return "mid";
  return "low";
}

function mealKcal(meal: MealLog): number {
  return meal.items.reduce((sum, item) => {
    if (!item.foodItem) return sum;
    const grams = item.confirmedGrams ?? item.estimatedGrams;
    return sum + (item.foodItem.kcalPer100g * grams) / 100;
  }, 0);
}

/** 目標グラム数に対する実績の比率でバー幅を決める。目標未設定時はカロリー構成比をそのまま表示する。 */
function pfcBarWidth(actualGrams: number, targetGrams: number | null, caloriePercent: number): number {
  if (targetGrams !== null && targetGrams > 0) return Math.min((actualGrams / targetGrams) * 100, 100);
  return Math.min(caloriePercent, 100);
}

function mealProtein(meal: MealLog): number {
  return meal.items.reduce((sum, item) => {
    if (!item.foodItem) return sum;
    const grams = item.confirmedGrams ?? item.estimatedGrams;
    return sum + (item.foodItem.proteinG * grams) / 100;
  }, 0);
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const date = today();

  useEffect(() => {
    fetch(`/api/summaries?range=day&date=${date}`)
      .then((res) => res.json())
      .then(setSummary);
    fetch(`/api/meals?date=${date}`)
      .then((res) => res.json())
      .then((data) => setMeals(data.meals));
    fetch(`/api/recommendations?date=${date}`)
      .then((res) => res.json())
      .then(setRecommendation);
  }, [date]);

  if (!summary) {
    return <p className="text-sm text-gray-400">読み込み中...</p>;
  }

  const kcalTarget = summary.goal?.dailyKcalTarget ?? null;
  const kcalDiff = kcalTarget !== null ? summary.totals.kcal - kcalTarget : null;

  const pfcTargets = summary.goal
    ? {
        protein: (summary.goal.dailyKcalTarget * (summary.goal.pfcRatioProtein / 100)) / 4,
        fat: (summary.goal.dailyKcalTarget * (summary.goal.pfcRatioFat / 100)) / 9,
        carb: (summary.goal.dailyKcalTarget * (summary.goal.pfcRatioCarb / 100)) / 4,
      }
    : null;

  const rdaByNutrient = new Map(summary.rdaProgress.map((p) => [p.nutrient, p]));

  return (
    <div className="washi-sheet">
      <div className="date-label">{formatDateLabel(date)}</div>
      <h1>今日の食事記録</h1>
      <p className="lede">
        記録した食事から算出したカロリー・PFCバランス・栄養素の概算です。日本食品標準成分表をもとにした標準値のため、実際の摂取量とは差が生じる場合があります。
      </p>

      <div className="kcal-row">
        <div className="kcal-num">{Math.round(summary.totals.kcal).toLocaleString()}</div>
        <div className="kcal-unit">kcal(概算)</div>
        <div className="kcal-note">
          {kcalTarget !== null ? (
            <>
              目標: {kcalTarget.toLocaleString()}kcal
              <br />
              {kcalDiff !== null && kcalDiff > 0
                ? `→ 目標より${Math.round(kcalDiff)}kcal超過`
                : kcalDiff !== null
                  ? `→ 目標まであと${Math.round(-kcalDiff)}kcal`
                  : ""}
            </>
          ) : (
            "目標未設定"
          )}
        </div>
      </div>

      <section>
        <h2>PFCバランス</h2>

        <div className="pfc-item">
          <div className="pfc-head">
            <span className="name">タンパク質 P</span>
            <span className="val">
              {summary.totals.proteinG.toFixed(0)}g({Math.round(summary.pfc.proteinKcal)}kcal・
              {summary.pfc.proteinPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill p"
              style={{
                width: `${pfcBarWidth(summary.totals.proteinG, pfcTargets?.protein ?? null, summary.pfc.proteinPercent)}%`,
              }}
            />
          </div>
          {pfcTargets && (
            <div className="pfc-target">
              目標比率 {summary.goal!.pfcRatioProtein}%(約{pfcTargets.protein.toFixed(0)}g)に対し実績{" "}
              {summary.pfc.proteinPercent.toFixed(0)}%
            </div>
          )}
        </div>

        <div className="pfc-item">
          <div className="pfc-head">
            <span className="name">脂質 F</span>
            <span className="val">
              {summary.totals.fatG.toFixed(0)}g({Math.round(summary.pfc.fatKcal)}kcal・
              {summary.pfc.fatPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill f"
              style={{ width: `${pfcBarWidth(summary.totals.fatG, pfcTargets?.fat ?? null, summary.pfc.fatPercent)}%` }}
            />
          </div>
          {pfcTargets && (
            <div className="pfc-target">
              目標比率 {summary.goal!.pfcRatioFat}%(約{pfcTargets.fat.toFixed(0)}g)に対し実績{" "}
              {summary.pfc.fatPercent.toFixed(0)}%
            </div>
          )}
        </div>

        <div className="pfc-item">
          <div className="pfc-head">
            <span className="name">炭水化物 C</span>
            <span className="val">
              {summary.totals.carbG.toFixed(0)}g({Math.round(summary.pfc.carbKcal)}kcal・
              {summary.pfc.carbPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill c"
              style={{ width: `${pfcBarWidth(summary.totals.carbG, pfcTargets?.carb ?? null, summary.pfc.carbPercent)}%` }}
            />
          </div>
          {pfcTargets && (
            <div className="pfc-target">
              目標比率 {summary.goal!.pfcRatioCarb}%(約{pfcTargets.carb.toFixed(0)}g)に対し実績{" "}
              {summary.pfc.carbPercent.toFixed(0)}%
            </div>
          )}
        </div>
      </section>

      <section>
        <h2>食事の内訳</h2>
        {meals.length === 0 ? (
          <p className="lede">まだ記録がありません。</p>
        ) : (
          meals.map((meal) => (
            <div className="meal" key={meal.id}>
              <div className="meal-time">
                {MEAL_TYPE_LABELS[meal.mealType]} ・{" "}
                {new Date(meal.loggedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="meal-name">
                {meal.items.map((item) => item.foodItem?.name ?? item.foodNameRaw).join("、")}
              </div>
              <div className="meal-detail">
                {meal.items
                  .map((item) => `${item.foodItem?.name ?? item.foodNameRaw} ${item.confirmedGrams ?? item.estimatedGrams}g`)
                  .join(" / ")}
              </div>
              <div className="meal-kcal">
                約{Math.round(mealKcal(meal))} kcal(P {mealProtein(meal).toFixed(0)}g)
              </div>
            </div>
          ))
        )}
      </section>

      <section>
        <h2>ビタミン・ミネラル(概算)</h2>
        <div className="legend">
          <span>
            <i className="ok" />
            70%以上
          </span>
          <span>
            <i className="mid" />
            40〜70%
          </span>
          <span>
            <i className="low" />
            40%未満/食塩は超過
          </span>
        </div>

        {NUTRIENT_GROUPS.map((group) => (
          <div key={group.label}>
            <h3>{group.label}</h3>
            {group.nutrients.map((nutrientKey) => {
              const row = rdaByNutrient.get(nutrientKey);
              if (!row) return null;
              const status = statusClass(nutrientKey, row.percent);
              const isOverLimit = nutrientKey === "salt_g" && row.percent > 100;
              return (
                <div className="nutrient-row" key={nutrientKey}>
                  <div className="nutrient-name">{NUTRIENT_LABELS[nutrientKey] ?? nutrientKey}</div>
                  <div className="nutrient-track">
                    <div
                      className={`nutrient-fill ${isOverLimit ? "over" : status}`}
                      style={{ width: `${Math.min(row.percent, 100)}%` }}
                    />
                  </div>
                  <div className="nutrient-val">
                    {row.intake.toFixed(1)}
                    {row.unit}/{row.rdaValue}
                    {row.unit}
                    {nutrientKey === "salt_g" ? "未満" : ""}
                  </div>
                  <div className={`nutrient-pct ${status === "ok" ? "ok" : status === "low" ? "low" : ""}`}>
                    {isOverLimit ? "超過" : `${Math.round(row.percent)}%`}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div className="callout">
          <b>碧井コーチから</b>
          <br />
          <AdvisorMessageText date={date} />
        </div>
      </section>

      {recommendation && (recommendation.foodRecommendations.length > 0 || recommendation.exerciseRecommendation.walkMinutes > 0) && (
        <section>
          <h2>今日のレコメンド</h2>
          <ul className="reco-list">
            {recommendation.exerciseRecommendation.walkMinutes > 0 && (
              <li>
                カロリーが目標を{Math.abs(recommendation.remainingKcal)}kcal超過中。ウォーキング約
                {recommendation.exerciseRecommendation.walkMinutes}分、またはジョギング約
                {recommendation.exerciseRecommendation.joggingMinutes}分で調整しよう。
                {recommendation.dailyStepsTarget ? `(目標歩数: ${recommendation.dailyStepsTarget}歩/日)` : ""}
              </li>
            )}
            {recommendation.foodRecommendations.map((rec) => (
              <li key={rec.nutrient}>
                {NUTRIENT_LABELS[rec.nutrient] ?? rec.nutrient} が充足率{rec.percent}%と不足気味。 おすすめ:{" "}
                {rec.foods.map((f) => f.foodName).join("、")}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer>
        ※記録した食品は「日本食品標準成分表」に基づく標準的な概算値です。目安量は厚生労働省「日本人の食事摂取基準」の成人を参照した簡易値であり、実際の必要量には個人差があります。
      </footer>
    </div>
  );
}

function AdvisorMessageText({ date }: { date: string }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/advisor?date=${date}`)
      .then((res) => res.json())
      .then((data) => setMessage(data.message));
  }, [date]);

  return <>{message ?? "コメント生成中..."}</>;
}
