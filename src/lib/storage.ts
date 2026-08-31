import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "meals");
const PUBLIC_PATH_PREFIX = "/uploads/meals";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * 食事写真をローカルディスク(public/uploads/meals)に保存しURLを返す。
 * 本番運用でSupabase Storage / S3等に切り替える場合はこの関数の実装のみ差し替えればよい
 * (docs/DESIGN.md 4章のアーキテクチャ参照)。
 */
export async function saveMealPhoto(buffer: Buffer, mimeType: string): Promise<string> {
  const extension = EXTENSION_BY_MIME[mimeType] ?? "jpg";
  const fileName = `${randomUUID()}.${extension}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, fileName), buffer);

  return `${PUBLIC_PATH_PREFIX}/${fileName}`;
}
