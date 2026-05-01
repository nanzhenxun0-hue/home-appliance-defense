export const APP_VERSION = 'v1.2.0';

export type PatchCategory = 'feature' | 'balance' | 'enemy' | 'gacha' | 'fix';

export interface PatchNote {
  version: string;
  date: string;
  highlights: string[];
  changes: Partial<Record<PatchCategory, string[]>>;
}

export const PATCH_CATEGORY_META: Record<PatchCategory, { label: string; color: string; em: string }> = {
  feature: { label: '新機能',    color: '#7c4dff', em: '✨' },
  balance: { label: 'バランス',  color: '#26c6da', em: '⚖️' },
  enemy:   { label: '敵',        color: '#ef5350', em: '👹' },
  gacha:   { label: 'ガチャ',    color: '#ffd54f', em: '🎰' },
  fix:     { label: '修正',      color: '#81c784', em: '🛠️' },
};

export const PATCH_NOTES: PatchNote[] = [
  {
    version: 'v1.2.0',
    date: '2026-05-01',
    highlights: ['全データ整備CSV', '通しプレイ用バランス調整', 'パッチノート機能追加'],
    changes: {
      feature: ['ホームに「パッチノート」画面を追加', 'バージョン番号をHOME右上に表示'],
      balance: [
        '電気ケトル Lv1: ATK 18→20（序盤の詰まり緩和）',
        '冷蔵庫 Lv2: ATK 46→50',
        'テスラコイル Lv3: ATK 120→105（チェーン込みで突出していたため）',
        '電子レンジ Lv3: ATK 120→110、攻撃間隔やや遅く',
        'プラズマキャノン Lv3: ATK 350→300',
      ],
      enemy: [
        'ゴキブリ: 速度 110→95（事故防止）',
        '過電流モンスター: HP 200→230 / 報酬 35→40',
        'ホコリ大王: HP 700→850 / 報酬 80→100',
        '氷ボス・炎ボス撃破報酬 +50',
      ],
      gacha: ['OD排出率 0.30% → 0.40%（極微増）'],
      fix:   ['内部データの整合性を全面チェック'],
    },
  },
  {
    version: 'v1.1.0',
    date: '2026-04-20',
    highlights: ['ガチャ演出大幅刷新', '排出率を商業レベルに厳格化'],
    changes: {
      feature: ['配送トラック→ダンボール開封演出', 'レアリティ別の箱バリエーション5種'],
      gacha:   ['排出率を見直し（OD 1% → 0.3%、G 2% → 0.8%、M 4% → 2%）', 'エコ替え天井（仮50/確定80）追加'],
    },
  },
  {
    version: 'v1.0.0',
    date: '2026-04-01',
    highlights: ['初回リリース'],
    changes: {
      feature: ['18ユニット・5エリア・5難易度・チュートリアルを実装'],
    },
  },
];
