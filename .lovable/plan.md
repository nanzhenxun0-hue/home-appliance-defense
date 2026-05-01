## 目的

「アップデート実行チェックリスト」の最優先4項目を一気に反映：
1. データ完成（全キャラ・敵を網羅したCSV）
2. ゲームに反映（数値統一・微調整）
3. 通しプレイで詰まり確認 → バランス微調整
4. パッチノート v1.2.0 を作成しゲーム内に表示

オンライントレード等の大型新規機能は別タスクとし、今回は「データ整備＋バランス＋パッチノート公開」に集中します。

## 実装内容

### 1. データ整備（CSV）

`/mnt/documents/` に2本のCSVを生成し、ダウンロードできるようにします（プロジェクト内 `src/game/constants.ts` を真実の元として書き出し）。

**towers.csv 列**:
`id, 名前, レアリティ, Tier, 性格, 解放条件(req), baseCost, Lv1コスト, Lv1電力供給(pg), Lv1消費電力(pc), Lv1ダメージ, Lv1射程, Lv1攻速, Lv1DPS, Lv2同上…, Lv3同上…, ability, 説明`

**enemies.csv 列**:
`id, 名前, 絵文字, HP, 速度, 報酬(volts), 接触ダメージ, 特殊能力, ボス能力, ピクセル描画`

抜けているフィールドは constants.ts を補完して必ず埋めます（説明文・性格・abilityの欄など）。

### 2. ゲーム本体の調整（src/game/constants.ts）

通しプレイでの「強すぎる/弱すぎる」を是正。

- **電気ケトル(C)**: Lv1 dmg 18→20（序盤の詰まり緩和）
- **テスラLv3**: dmg 120→105（チェーン込みで突出のため微ナーフ）
- **プラズマLv3**: dmg 350→300（OD唯一性は維持しつつ過剰DPS抑制）
- **電子レンジLv3**: dmg 120→110、spd 1.0→0.95
- **冷蔵庫**: 凍結効果は据え置き、Lv2 dmg 46→50（中盤の選択肢として強化）
- **ゴキブリ(cockroach)**: spd 110→95（序盤事故防止）
- **過電流(surge)**: hp 200→230, rew 35→40
- **ホコリ大王(dust_lord)**: hp 700→850, rew 80→100
- **boss_ice / boss_fire**: HPは据え置き、報酬を +50 上方修正（撃破リターン強化）
- **GACHA_RATES**: OD 0.003→0.004（極小UP、引いた時の演出価値担保）

### 3. パッチノート v1.2.0

**新規ファイル** `src/game/patchNotes.ts`
```ts
export const APP_VERSION = 'v1.2.0';
export const PATCH_NOTES = [{
  version: 'v1.2.0', date: '2026-05-01',
  highlights: ['データ整備とバランス調整', 'パッチノート機能追加'],
  changes: {
    balance: ['電気ケトル ATK +2', 'テスラLv3 ATK -15', 'プラズマLv3 ATK -50', '冷蔵庫Lv2 ATK +4', 'ゴキブリ速度 -15'],
    enemies: ['過電流HP +30 / 報酬+5', 'ホコリ大王HP +150 / 報酬+20', 'ボス報酬 +50'],
    gacha:   ['OD排出率 0.3% → 0.4%'],
    fixes:   ['データの整合性を全面チェック'],
  },
}, /* 過去版のプレースホルダ v1.1.0, v1.0.0 */];
```

**新規画面** `src/components/screens/PatchNotesScreen.tsx`
- バージョンごとに折り畳み表示（最新を展開）
- カテゴリ別バッジ（バランス/敵/ガチャ/修正/新機能）

**HomeScreen** にボタン追加：「📋 パッチノート」、右上に `APP_VERSION` をチップ表示。
**Index.tsx** に `'patch'` ルート追加。

### 4. データ反映の自動化スクリプト（リポジトリには残さない）

`/tmp/export_csv.ts` を bun で実行 → `constants.ts` を読み込んで `/mnt/documents/towers.csv` と `/mnt/documents/enemies.csv` を出力。
出力後、`<lov-artifact>` で2ファイル提示。

### 5. 通しプレイの確認

- suburb / normal で wave10 まで自動シミュレーションは行わず、ブラウザで起動確認＋HUD・アップグレードウィンドウのスモークチェック（runtime errors と console を確認）。
- 既存の `vitest` は触らず、追加テストは作りません（範囲外）。

## やらないこと（次回以降）

- オンライントレード機能
- 新キャラ/新ステージの追加（バランス変更のみ）
- 新タワー描画アセット
- レイドや図鑑などの大型システム

## ファイル変更一覧

- 編集: `src/game/constants.ts`（数値調整のみ）
- 新規: `src/game/patchNotes.ts`
- 新規: `src/components/screens/PatchNotesScreen.tsx`
- 編集: `src/components/screens/HomeScreen.tsx`（ボタン＋バージョンチップ）
- 編集: `src/pages/Index.tsx`（ルート追加）
- 生成物: `/mnt/documents/towers.csv`, `/mnt/documents/enemies.csv`, `/mnt/documents/patch_notes_v1.2.0.md`

承認いただければこの内容で実装します。