# 栄養管理Webアプリ 設計ドキュメント

## 1. 目的

食事を話す・写真を撮るだけで自動的にPFC(タンパク質・脂質・炭水化物)バランスやビタミン・ミネラルを計算し、日/週/月単位で可視化するパーソナル栄養管理アプリを構築する。Claudeのようなキャラクターが記録内容に基づいてアドバイスを行い、設定した目標に応じて食事・運動のレコメンドを行う。将来的にはiPhoneヘルスケア(歩数等)と連携する。

## 2. 参考アプリと得たい示唆

| アプリ | 得たい示唆 |
|---|---|
| あすけん (Asken) | キャラクター「あすけ」による日次コメント。栄養士監修のフィードバック文言設計 |
| カロミル (Calomeal) | 写真からのAI食品認識→栄養素(ビタミン・ミネラル含む)への変換フロー |
| MyFitnessPal | 目標設定→カロリー収支計算→運動レコメンドの導線、Apple Health連携の実装例 |
| Lose It! | 写真認識(Snap It)とHealthKit連携の統合パターン |
| FatSecret / Yazio | 栄養データAPIの構成、栄養素の分類・単位設計 |

## 3. スコープ確定事項(ヒアリング結果)

- **利用者**: 自分専用ツール(マルチユーザー対応は将来課題、ただし将来の拡張を妨げない設計にする)
- **技術基盤**: まずPWA(Webアプリ)として開発。ヘルスケア連携が必要になった段階でCapacitor等によるネイティブラッパーを追加する
- **写真解析**: Vision LLM(Claude Vision)による食品・分量推定 + ユーザー確認/補正UI
- **栄養データベース**: 日本食品標準成分表(文部科学省)をベースとする
- **キャラクター**: 厳しめのパーソナルトレーナー系(達成度をシビアに指摘し、発破をかけるトーン)
- **今回のセッション**: 設計ドキュメントの作成まで(実装は次フェーズ)

## 4. 全体アーキテクチャ

```
[ブラウザ / PWA (iPhone Safari含む)]
        │  HTTPS
        ▼
[Next.js (App Router, TypeScript)]
   ├─ フロントエンド(React, Tailwind, Recharts)
   └─ API Routes(BFF)
        │
        ├─→ [PostgreSQL (Supabase)] … ユーザー/食事/目標/栄養素マスタ
        ├─→ [Supabase Storage]      … 食事写真
        ├─→ [Claude API (Vision)]  … 食品認識・分量推定
        ├─→ [Claude API (Text)]    … キャラクターアドバイス生成
        └─→ [Supabase Auth]        … 認証(単独利用でもセキュリティ確保のため導入)

(将来フェーズ)
[Capacitorネイティブラッパー] ── HealthKit ──→ 歩数・アクティビティ取得 → API経由でPostgreSQLへ
```

**技術選定理由**:
- Next.js: フロント/BFFを一体で開発でき、個人開発の速度を優先
- Supabase: Postgres + Auth + Storageを1サービスで賄え、個人開発でも運用が軽い
- Prisma: 型安全なDBアクセス、栄養素マスタのような多カラムテーブルの管理がしやすい
- Claude API: 画像認識とキャラクター生成の両方を同一プロバイダで完結できる

## 5. データモデル

```
users
  id, email, name, sex, birth_date, height_cm, activity_level, created_at

goals
  id, user_id, type(減量/増量/維持/筋肉増強), target_weight_kg, target_date,
  daily_kcal_target, pfc_ratio_protein, pfc_ratio_fat, pfc_ratio_carb,
  daily_steps_target, is_active, created_at

food_items                          -- 食品成分表マスタ(文科省データ取り込み)
  id, source(mext/custom), name, name_kana,
  kcal_per100g, protein_g, fat_g, carb_g, fiber_g, sugar_g, salt_g,
  vitamin_a, vitamin_d, vitamin_e, vitamin_k,
  vitamin_b1, vitamin_b2, vitamin_b6, vitamin_b12,
  vitamin_c, niacin, folate, pantothenic_acid,
  sodium, potassium, calcium, magnesium, phosphorus, iron, zinc, copper, manganese

meal_logs
  id, user_id, logged_at, meal_type(朝/昼/夜/間食),
  input_method(text/photo), photo_url, raw_text, status(未確定/確定)

meal_items
  id, meal_log_id, food_item_id(nullable), food_name_raw,
  estimated_grams, confirmed_grams, recognition_confidence

exercise_logs
  id, user_id, logged_at, type, duration_min, calories_burned,
  source(manual/healthkit), steps

advisor_messages
  id, user_id, target_date, trigger(daily/weekly/monthly/goal_event),
  message_text, generated_at

rda_reference                       -- 日本人の食事摂取基準マスタ
  age_band, sex, nutrient, rda_value, unit
```

`daily_summaries` は都度計算(またはキャッシュ)で持たせ、正規化データの二重管理を避ける。

## 6. 主要機能フロー

### 6.1 食事記録(テキスト)
1. ユーザーがテキストで食事内容を入力(例:「鶏むね肉の照り焼き定食」)
2. Claude APIでテキストから食品項目・概算グラム数を抽出
3. `food_items` を名称マッチング(完全一致→あいまい検索)して候補を提示
4. ユーザーが確認・分量補正 → `meal_logs`/`meal_items` に確定保存
5. 保存時に栄養素を集計してその場でPFC・ビタミン・ミネラルを計算

### 6.2 食事記録(写真)
1. 写真をアップロード
2. Claude Vision APIで写真中の食品・見た目の分量を推定(プロンプトに「日本食を想定し、料理名と概算グラムを出力」と指示)
3. 推定結果をテキストフローと同様に `food_items` へマッチング
4. ユーザーが確認画面で修正(分量スライダー、食品差し替え)してから確定
   - 認識精度は完全ではない前提でUI設計し、補正コストを最小化する(候補をタップで選べる形式)

### 6.3 可視化
- ダッシュボード: 当日のカロリー・PFC円グラフ・主要ビタミン/ミネラルの充足率バー
- 履歴画面: 日/週/月の切替タブ、期間ごとの推移(折れ線)とRDA比較(レーダーチャート)

### 6.4 キャラクターアドバイザー(厳しめトレーナー)
- 日次バッチ(または当日最終記録後)で、その日の合計栄養素・目標達成度・不足栄養素をClaude APIに渡し、ペルソナ設定(システムプロンプトで人格・口調を固定)に基づき短文フィードバックを生成
- 週次/月次では傾向(体重・摂取カロリー・PFCの週平均)を踏まえたコメントを生成
- ペルソナ定義は `persona.md` のような設定ファイルに分離し、口調変更を容易にする

### 6.5 目標設定とレコメンド
- 目標(減量/増量/維持/筋肉増強)に応じて `daily_kcal_target` と `pfc_ratio` を算出
- 食事レコメンド: 当日時点の不足栄養素(例:タンパク質不足)を検出し、`food_items` から目標カロリー内で補える候補を提示
- 運動レコメンド: 目標との乖離(カロリー超過分など)をMETs換算で「ウォーキング◯分」等に変換して提示(初期はルールベース、将来的にHealthKitの活動量データで精緻化)

### 6.6 iPhoneヘルスケア連携(将来フェーズ)
- Web単体ではHealthKitに直接アクセス不可のため、Capacitor等でネイティブシェルを追加しHealthKitプラグイン経由で歩数・消費カロリーを取得
- 取得データは `exercise_logs`(source=healthkit)として同期し、運動レコメンドの入力に利用
- Apple Developer登録・プライバシーポリシー整備・健康データアプリとしての審査対応が必要になる点に留意

## 7. 画面構成(初期案)

1. ダッシュボード(今日のサマリー + キャラコメント)
2. 食事記録(テキスト/写真入力 → 認識結果確認)
3. 履歴・グラフ(日/週/月)
4. 目標設定
5. 運動記録・レコメンド
6. 設定(プロフィール、将来のヘルスケア連携設定)

## 8. 開発ロードマップ

- **Phase 0(完了)**: 要件整理・設計ドキュメント確定
- **Phase 1**: 基盤構築 — Next.js/Supabase/Prisma セットアップ、認証、食品成分表マスタの取り込み
- **Phase 2**: テキストでの食事記録 + 栄養計算 + ダッシュボード + 日/週/月グラフ
- **Phase 3**: 写真解析(Claude Vision連携)+ 確認・補正UI
- **Phase 4**: 目標設定 + キャラクターアドバイザー + 食事・運動レコメンド
- **Phase 5**: 運動記録UIの充実、レコメンドロジックの精緻化
- **Phase 6**: iPhoneヘルスケア連携(ネイティブラッパー化)

## 9. 今後決めること(未解決事項)

- 文科省食品成分表データの入手元・ライセンス確認、初期投入は全品目か頻出品目優先か
- Claude Vision API呼び出しの想定コスト(1食あたり)と許容予算
- キャラクターのビジュアル(イラスト/アバター)を用意するか、テキストのみで運用するか
- 運動消費カロリーの推定に使う係数(METs表など)の選定
- 通知の実装方式(PWA Push通知 or 将来のネイティブ通知)
- ホスティング費用(Vercel/Supabaseの無料枠で収まるか、個人開発予算)
