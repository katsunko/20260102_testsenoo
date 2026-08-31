"use client";

import { useEffect, useState } from "react";

export function AdvisorMessageCard({ date }: { date: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/advisor?date=${date}`)
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          碧
        </div>
        <span className="text-sm font-semibold text-gray-700">碧井コーチ</span>
      </div>
      {loading ? (
        <p className="text-sm text-gray-400">コメント生成中...</p>
      ) : (
        <p className="text-sm leading-relaxed text-gray-800">{message}</p>
      )}
    </div>
  );
}
