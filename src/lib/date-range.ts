export type SummaryRange = "day" | "week" | "month";

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

/** 指定日を含む期間の [開始, 終了) を返す(終了は排他的)。週は月曜始まり。 */
export function getDateRange(range: SummaryRange, baseDate: Date): { start: Date; end: Date } {
  const base = startOfDay(baseDate);

  if (range === "day") {
    const end = new Date(base);
    end.setDate(end.getDate() + 1);
    return { start: base, end };
  }

  if (range === "week") {
    const dayOfWeek = (base.getDay() + 6) % 7; // 月曜=0
    const start = new Date(base);
    start.setDate(start.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { start, end };
}

/** [start, end) の範囲を日単位に分割したラベル付き日付配列を返す(グラフ用)。 */
export function splitIntoDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
