"use client";

import { useEffect, useState } from "react";
import type { MealDraftItem, MealLog } from "@/types";
import { MEAL_TYPE_LABELS } from "@/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const INPUT_MODES = [
  { value: "TEXT", label: "テキストで入力" },
  { value: "PHOTO", label: "写真で記録" },
] as const;

export default function MealsPage() {
  const [inputMode, setInputMode] = useState<(typeof INPUT_MODES)[number]["value"]>("TEXT");
  const [rawText, setRawText] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [savedPhotoUrl, setSavedPhotoUrl] = useState<string | null>(null);
  const [mealType, setMealType] = useState<(typeof MEAL_TYPES)[number]>("LUNCH");
  const [draftItems, setDraftItems] = useState<MealDraftItem[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const date = today();

  const loadMeals = () => {
    fetch(`/api/meals?date=${date}`)
      .then((res) => res.json())
      .then((data) => setMeals(data.meals));
  };

  useEffect(loadMeals, [date]);

  const resetDraft = () => {
    setDraftItems([]);
    setRawText("");
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setSavedPhotoUrl(null);
    setError(null);
  };

  const handlePhotoSelect = (file: File | null) => {
    setPhotoFile(file);
    setPhotoPreviewUrl(file ? URL.createObjectURL(file) : null);
    setDraftItems([]);
    setSavedPhotoUrl(null);
  };

  const handleParse = async () => {
    setError(null);
    setParsing(true);
    try {
      if (inputMode === "TEXT") {
        if (!rawText.trim()) return;
        const res = await fetch("/api/meals/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText }),
        });
        const data = await res.json();
        setDraftItems(data.items);
      } else {
        if (!photoFile) return;
        const formData = new FormData();
        formData.append("photo", photoFile);
        const res = await fetch("/api/meals/photo/parse", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "写真の解析に失敗しました");
          return;
        }
        setDraftItems(data.items);
        setSavedPhotoUrl(data.photoUrl);
        if (data.error) setError(data.error);
      }
    } finally {
      setParsing(false);
    }
  };

  const handleGramsChange = (index: number, grams: number) => {
    setDraftItems((prev) => prev.map((item, i) => (i === index ? { ...item, estimatedGrams: grams } : item)));
  };

  const handleConfirm = async () => {
    if (draftItems.length === 0) return;
    setSaving(true);
    try {
      await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loggedAt: new Date().toISOString(),
          mealType,
          inputMethod: inputMode,
          rawText: inputMode === "TEXT" ? rawText : undefined,
          photoUrl: savedPhotoUrl ?? undefined,
          items: draftItems.map((item) => ({
            foodItemId: item.foodItemId,
            foodNameRaw: item.matchedFoodName ?? item.foodNameRaw,
            grams: item.estimatedGrams,
          })),
        }),
      });
      resetDraft();
      loadMeals();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/meals/${id}`, { method: "DELETE" });
    loadMeals();
  };

  const canParse = inputMode === "TEXT" ? rawText.trim().length > 0 : photoFile !== null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">食事記録</h1>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex gap-2">
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value as (typeof MEAL_TYPES)[number])}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {MEAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {MEAL_TYPE_LABELS[type]}
              </option>
            ))}
          </select>

          <div className="flex rounded border border-gray-300 text-sm">
            {INPUT_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => {
                  setInputMode(mode.value);
                  resetDraft();
                }}
                className={`px-3 py-1 ${inputMode === mode.value ? "bg-blue-600 text-white" : "text-gray-600"}`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {inputMode === "TEXT" ? (
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="例: 鶏むね肉のソテーとブロッコリー、ごはん一杯"
            className="mb-3 w-full rounded border border-gray-300 p-2 text-sm"
            rows={3}
          />
        ) : (
          <div className="mb-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => handlePhotoSelect(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            {photoPreviewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreviewUrl} alt="食事の写真プレビュー" className="mt-2 max-h-64 rounded border" />
            )}
          </div>
        )}

        <button
          onClick={handleParse}
          disabled={parsing || !canParse}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {parsing ? "解析中..." : "AIで解析する"}
        </button>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {draftItems.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500">認識結果(分量を確認・修正してください)</h3>
            {draftItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="flex-1">
                  {item.matchedFoodName ?? item.foodNameRaw}
                  {!item.foodItemId && <span className="ml-1 text-xs text-amber-600">(DB未一致)</span>}
                </span>
                <input
                  type="number"
                  value={item.estimatedGrams}
                  onChange={(e) => handleGramsChange(index, Number(e.target.value))}
                  className="w-20 rounded border border-gray-300 px-2 py-1"
                />
                <span className="text-xs text-gray-500">g</span>
              </div>
            ))}
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="mt-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "保存中..." : "確定して記録する"}
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">今日の記録</h2>
        {meals.length === 0 ? (
          <p className="text-sm text-gray-400">まだ記録がありません。</p>
        ) : (
          <ul className="space-y-2">
            {meals.map((meal) => (
              <li key={meal.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">{MEAL_TYPE_LABELS[meal.mealType]}</span>
                  <button onClick={() => handleDelete(meal.id)} className="text-xs text-red-500 hover:underline">
                    削除
                  </button>
                </div>
                {meal.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={meal.photoUrl} alt="食事の写真" className="mb-2 max-h-40 rounded border" />
                )}
                <p className="text-sm text-gray-600">
                  {meal.items
                    .map((item) => `${item.foodItem?.name ?? item.foodNameRaw}(${item.confirmedGrams ?? item.estimatedGrams}g)`)
                    .join("、")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
