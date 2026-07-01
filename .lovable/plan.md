## 概要

3つのオンライン機能を追加します。すべて Lovable Cloud (Supabase) 上で構築し、既存のオフラインプレイも維持します（未ログイン時はローカル保存のまま）。

## 1. 認証システム

- メール+パスワード & Google サインイン
- ホーム画面右上に「ログイン」ボタン追加
- `/auth` ページ（サインアップ/ログイン/パスワードリセット）
- `/reset-password` ページ
- ログイン後、`profiles` テーブルに `display_name`（初期値: メール前半）を自動作成
- ログイン時のみオンライン機能を有効化

## 2. 所持キャラを「個数管理」に移行

現状 `owned: TowerID[]` （有無のみ）→ `inventory: Record<TowerID, number>` に変更。
- 既存プレイヤーのローカルデータは自動マイグレーション（各1個所持として変換）
- ガチャで被り時は個数+1
- 編成画面では所持数バッジ表示（1個以上あれば使用可能）
- 交換で0個になったキャラは編成から自動除外

## 3. プレイヤー間トレード（1対1申請制）

**プレイヤーID**: プロフィール作成時に短いフレンドコード（例: `KADEN-A3F7X`）を自動発行、コピー可能。

**フロー**:
1. 「トレード」画面で相手のフレンドコードを入力
2. 自分の出すキャラ・相手に要求するキャラを選択して送信
3. 相手に通知（受信箱にリアルタイム表示）
4. 相手が「承認」または「拒否」
5. 承認時: サーバー側 Edge Function で両者の inventory を原子的に更新（両者所持確認・二重実行防止）

**画面**: 送信中／受信中／履歴 の3タブ

## 4. オンラインランキング（総合スコア）

- ゲームクリア時に自動送信（ログイン中のみ）
- `leaderboard` テーブル: user_id, display_name, best_score, best_wave, diff, updated_at
- 総合スコア = wave * 10000 + power（既存ロジック流用）
- スコア画面に「オンライン Top 100」タブを追加
- 自分の順位ハイライト、リアルタイム更新

## 5. 管理者コード全サーバー同期

現状 `campaign_codes` テーブル + polling は動作中。追加で:
- 管理者判定を **サーバー側の `user_roles` テーブル**（app_role enum: admin/user）に移行 — セキュリティ向上、`localStorage` の `CEO` 判定を廃止
- 「CEO」コード入力時: `has_role(auth.uid(), 'admin')` が true のユーザーのみ管理者モード有効化。初回のみ、パスコード `CEO` 一致でサーバー側に admin ロール付与（既存挙動を維持しつつサーバー化）
- 作成/削除は既存の `manage-codes` Edge Function を `x-admin-token` から JWT + `has_role` チェックに変更

## 技術詳細

### データベース

```text
profiles           id(=auth.users.id) / display_name / friend_code(unique)
user_roles         user_id / role(app_role enum)   +has_role() SECURITY DEFINER
inventories        user_id / tower_id / count       PK(user_id, tower_id)
trades             id / from_user / to_user / offer(jsonb) / request(jsonb)
                   / status(pending|accepted|declined|cancelled) / created_at
leaderboard        user_id / display_name / score / wave / diff / updated_at
                   UNIQUE(user_id, diff)
```

すべてのテーブルに RLS + `GRANT SELECT,INSERT,UPDATE,DELETE ... TO authenticated;` を付与。leaderboard のみ全ユーザーに SELECT 可、他は本人スコープ。

### Edge Functions

- `execute-trade` — 承認時に両者 inventory を原子的に更新
- `submit-score` — スコア送信（サーバー側でユーザー確認）
- `manage-codes` — 既存を JWT + `has_role` にリファクタ

### フロントエンド

- `src/hooks/useAuth.ts` (新規): セッション管理
- `src/hooks/useInventory.ts` (新規): ログイン時サーバー同期／未ログイン時ローカル
- `src/hooks/useTrades.ts` (新規): 送受信＋リアルタイム
- `src/hooks/useLeaderboard.ts` (新規)
- `src/pages/Auth.tsx`, `src/pages/ResetPassword.tsx`
- `src/components/screens/TradeScreen.tsx` (新規)
- `src/components/screens/LeaderboardScreen.tsx` (新規)
- `src/hooks/useGacha.ts`, `useTeam.ts` を inventory ベースに改修

## ホーム画面への追加ボタン

- 🔐 ログイン / 👤 プロフィール
- 🔄 トレード（要ログイン）
- 🏆 オンラインランキング

## スコープ外

- チャット / フレンドリスト / ギルド
- リアルタイム対戦
- 課金
