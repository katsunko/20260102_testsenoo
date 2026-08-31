"use client";

import { useEffect, useState } from "react";
import type { Goal } from "@/types";

const GOAL_TYPES = [
  { value: "LOSE_WEIGHT", label: "減量" },
  { value: "MAINTAIN", label: "維持" },
  { value: "GAIN_WEIGHT", label: "増量" },
  { value: "BUILD_MUSCLE", label: "筋肉増強" },
] as const;

export default function GoalsPage() {
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [type, setType] = useState<(typeof GOAL_TYPES)[number]["value"]>("MAINTAIN");
  const [dailyKcalTarget, setDailyKcalTarget] = useState(2000);
  const [proteinRatio, setProteinRatio] = useState(20);
  const [fatRatio, setFatRatio] = useState(25);
  const [carbRatio, setCarbRatio] = useState(55);
  const [targetWeightKg, setTargetWeightKg] = useState<number | "">("");
  const [dailyStepsTarget, setDailyStepsTarget] = useState<number | "">(8000);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoal = () => {
    fetch("/api/goals")
      .then((res) => res.json())
      .then((data) => setActiveGoal(data.goal));
  };

  useEffect(loadGoal, []);

  const ratioSum = proteinRatio + fatRatio + carbRatio;

  const handleSubmit = async () => {
    setError(null);
    if (Math.abs(ratioSum - 100) > 0.5) {
      setError("PFC比率の合計は100%にしてください");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          dailyKcalTarget,
          pfcRatioProtein: proteinRatio,
          pfcRatioFat: fatRatio,
          pfcRatioCarb: carbRatio,
          targetWeightKg: targetWeightKg === "" ? undefined : targetWeightKg,
          dailyStepsTarget: dailyStepsTarget === "" ? undefined : dailyStepsTarget,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "保存に失敗しました");
        return;
      }
      loadGoal();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">目標設定</h1>

      {activeGoal && (
        <section className="rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm">
          <h2 className="mb-1 text-xs font-semibold text-gray-500">現在の目標</h2>
          <p>
            {GOAL_TYPES.find((g) => g.value === activeGoal.type)?.label} / 目標カロリー{" "}
            {activeGoal.dailyKcalTarget}kcal / PFC {activeGoal.pfcRatioProtein}:{activeGoal.pfcRatioFat}:
            {activeGoal.pfcRatioCarb}
            {activeGoal.dailyStepsTarget ? ` / 目標歩数 ${activeGoal.dailyStepsTarget}歩` : ""}
          </p>
        </section>
      )}

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">目標タイプ</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as (typeof GOAL_TYPES)[number]["value"])}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {GOAL_TYPES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">1日の目標カロリー(kcal)</label>
          <input
            type="number"
            value={dailyKcalTarget}
            onChange={(e) => setDailyKcalTarget(Number(e.target.value))}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">
            PFC比率(%) 合計: {ratioSum}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={proteinRatio}
              onChange={(e) => setProteinRatio(Number(e.target.value))}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="P"
            />
            <input
              type="number"
              value={fatRatio}
              onChange={(e) => setFatRatio(Number(e.target.value))}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="F"
            />
            <input
              type="number"
              value={carbRatio}
              onChange={(e) => setCarbRatio(Number(e.target.value))}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="C"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">目標体重(kg・任意)</label>
          <input
            type="number"
            value={targetWeightKg}
            onChange={(e) => setTargetWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500">目標歩数(歩/日・任意)</label>
          <input
            type="number"
            value={dailyStepsTarget}
            onChange={(e) => setDailyStepsTarget(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "保存中..." : "目標を保存する"}
        </button>
      </section>
    </div>
  );
}
