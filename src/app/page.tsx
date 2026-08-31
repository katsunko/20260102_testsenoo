"use client";

import { useEffect, useState } from "react";
import { PfcChart } from "@/components/PfcChart";
import { RdaProgressList } from "@/components/RdaProgressList";
import { AdvisorMessageCard } from "@/components/AdvisorMessageCard";
import type { RecommendationResponse, SummaryResponse } from "@/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const date = today();

  useEffect(() => {
    fetch(`/api/summaries?range=day&date=${date}`)
      .then((res) => res.json())
      .then(setSummary);
    fetch(`/api/recommendations?date=${date}`)
      .then((res) => res.json())
      .then(setRecommendation);
  }, [date]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">今日のサマリー ({date})</h1>

      <AdvisorMessageCard date={date} />

      {summary ? (
        <>
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-gray-700">摂取カロリー</h2>
              <span className="text-2xl font-bold">
                {Math.round(summary.totals.kcal)}
                <span className="ml-1 text-sm font-normal text-gray-500">
                  / {summary.goal?.dailyKcalTarget ?? "未設定"} kcal
                </span>
              </span>
            </div>
            <PfcChart pfc={summary.pfc} />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">ビタミン・ミネラル充足率</h2>
            <RdaProgressList items={summary.rdaProgress} />
          </section>
        </>
      ) : (
        <p className="text-sm text-gray-400">読み込み中...</p>
      )}

      {recommendation ? (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">今日のレコメンド</h2>

          <div className="mb-4">
            <h3 className="mb-1 text-xs font-semibold text-gray-500">運動</h3>
            {recommendation.exerciseRecommendation.walkMinutes > 0 ? (
              <p className="text-sm text-gray-800">
                カロリーが目標を{Math.abs(recommendation.remainingKcal)}kcal超過中。ウォーキング約
                {recommendation.exerciseRecommendation.walkMinutes}分、またはジョギング約
                {recommendation.exerciseRecommendation.joggingMinutes}分で調整しよう。
              </p>
            ) : (
              <p className="text-sm text-gray-800">
                カロリーはまだ目標まで{recommendation.remainingKcal}kcal余裕がある。
              </p>
            )}
            {recommendation.dailyStepsTarget ? (
              <p className="mt-1 text-xs text-gray-500">目標歩数: {recommendation.dailyStepsTarget}歩/日</p>
            ) : null}
          </div>

          <div>
            <h3 className="mb-1 text-xs font-semibold text-gray-500">食事</h3>
            {recommendation.foodRecommendations.length === 0 ? (
              <p className="text-sm text-gray-800">主要栄養素は充足している。この調子を維持しよう。</p>
            ) : (
              <ul className="space-y-2">
                {recommendation.foodRecommendations.map((rec) => (
                  <li key={rec.nutrient} className="text-sm text-gray-800">
                    <span className="font-medium">{rec.nutrient}</span> が充足率{rec.percent}%と不足気味。
                    おすすめ: {rec.foods.map((f) => f.foodName).join("、")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
