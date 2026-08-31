import { NextRequest, NextResponse } from "next/server";
import { parseMealImageWithClaude, type SupportedImageMediaType } from "@/lib/anthropic";
import { buildMealDraftItems } from "@/lib/meal-draft";
import { saveMealPhoto } from "@/lib/storage";

const SUPPORTED_MEDIA_TYPES: SupportedImageMediaType[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "写真ファイル(photo)が必要です" }, { status: 400 });
  }
  if (!SUPPORTED_MEDIA_TYPES.includes(file.type as SupportedImageMediaType)) {
    return NextResponse.json(
      { error: "対応していない画像形式です(jpeg/png/webp/gifのいずれかを指定してください)" },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "画像サイズが大きすぎます(8MB以下にしてください)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mediaType = file.type as SupportedImageMediaType;

  const [photoUrl, aiItems] = await Promise.all([
    saveMealPhoto(buffer, mediaType),
    parseMealImageWithClaude(buffer.toString("base64"), mediaType),
  ]);

  if (aiItems === null) {
    return NextResponse.json({
      items: [],
      photoUrl,
      aiUsed: false,
      error: "ANTHROPIC_API_KEYが未設定のため写真解析を実行できません。食品名を手動で入力してください。",
    });
  }

  const draftItems = await buildMealDraftItems(aiItems);

  return NextResponse.json({ items: draftItems, photoUrl, aiUsed: true });
}
