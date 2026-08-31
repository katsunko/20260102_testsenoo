"use client";

import { useEffect, useState } from "react";
import { PfcChart } from "@/components/PfcChart";
import { RdaProgressList } from "@/components/RdaProgressList";
import { TrendChart } from "@/components/TrendChart";
import type { SummaryResponse } from "@/types";

const RANGES = [
  { value: "day", label: "日" },
  { value: "week", label: "週" },
  { value: "month", label: "月" },
] as const;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HistoryPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]["value"]>("week");
  const [date, setDate] = useState(today());
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  useEffect(() => {
    fetch(`/api/summaries?range=${range}&date=${date}`)
      .then((res) => res.json())
      .then(setSummary);
  }, [range, date]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">履歴</h1>

      <div className="flex items-center gap-3">
        <div className="flex rounded border border-gray-300 text-sm">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1 ${range === r.value ? "bg-blue-600 text-white" : "text-gray-600"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </div>

      {summary ? (
        <>
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">カロリー推移</h2>
            <TrendChart data={summary.dailyBreakdown} kcalTarget={summary.goal?.dailyKcalTarget} />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">期間合計のPFCバランス</h2>
            <PfcChart pfc={summary.pfc} />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">ビタミン・ミネラル充足率(期間合計 / RDA)</h2>
            <RdaProgressList items={summary.rdaProgress} />
          </section>
        </>
      ) : (
        <p className="text-sm text-gray-400">読み込み中...</p>
      )}
    </div>
  );
}
