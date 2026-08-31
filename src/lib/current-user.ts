/**
 * Phase1は自分専用ツールのため、認証は簡易的に環境変数のユーザーIDで固定する。
 * マルチユーザー対応時はSupabase Authのセッションからユーザーを解決する形に差し替える。
 */
export function getCurrentUserId(): string {
  return process.env.DEFAULT_USER_ID ?? "00000000-0000-0000-0000-000000000001";
}
