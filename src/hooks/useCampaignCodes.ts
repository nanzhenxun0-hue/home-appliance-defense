import { useState, useCallback } from 'react';

const CODES_KEY    = 'kaden-td-campaign-codes';
const REDEEMED_KEY = 'kaden-td-redeemed-codes';
const ADMIN_KEY    = 'kaden-td-admin-mode';

export interface CodeReward {
  volts?: number;
  pulls?: number;
  desc: string;
}

export interface CampaignCode {
  code: string;
  reward: CodeReward;
  createdAt: number;
}

const loadCodes = (): CampaignCode[] => {
  try { return JSON.parse(localStorage.getItem(CODES_KEY) || '[]'); } catch { return []; }
};
const saveCodes = (codes: CampaignCode[]) =>
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));

const loadRedeemed = (): string[] => {
  try { return JSON.parse(localStorage.getItem(REDEEMED_KEY) || '[]'); } catch { return []; }
};
const saveRedeemed = (r: string[]) =>
  localStorage.setItem(REDEEMED_KEY, JSON.stringify(r));

const loadAdmin = () => localStorage.getItem(ADMIN_KEY) === '1';

export const useCampaignCodes = () => {
  const [codes, setCodes]       = useState<CampaignCode[]>(loadCodes);
  const [redeemed, setRedeemed] = useState<string[]>(loadRedeemed);
  const [isAdmin, setIsAdmin]   = useState<boolean>(loadAdmin);

  const activateAdmin = useCallback(() => {
    localStorage.setItem(ADMIN_KEY, '1');
    setIsAdmin(true);
  }, []);

  const deactivateAdmin = useCallback(() => {
    localStorage.removeItem(ADMIN_KEY);
    setIsAdmin(false);
  }, []);

  const redeemCode = useCallback((input: string): { ok: true; reward: CodeReward } | { ok: false; error: string } => {
    const upper = input.trim().toUpperCase();
    if (upper === 'CEO') {
      activateAdmin();
      return { ok: true, reward: { desc: '管理者モード有効化' } };
    }
    if (redeemed.includes(upper)) return { ok: false, error: 'このコードは既に使用済みです。' };
    const found = codes.find(c => c.code.toUpperCase() === upper);
    if (!found) return { ok: false, error: '無効なコードです。' };
    const next = [...redeemed, upper];
    saveRedeemed(next);
    setRedeemed(next);
    return { ok: true, reward: found.reward };
  }, [codes, redeemed, activateAdmin]);

  const createCode = useCallback((code: string, reward: CodeReward): boolean => {
    if (!code.trim()) return false;
    const upper = code.trim().toUpperCase();
    if (codes.find(c => c.code === upper)) return false;
    const next: CampaignCode[] = [...codes, { code: upper, reward, createdAt: Date.now() }];
    saveCodes(next);
    setCodes(next);
    return true;
  }, [codes]);

  const deleteCode = useCallback((code: string) => {
    const next = codes.filter(c => c.code !== code);
    saveCodes(next);
    setCodes(next);
  }, [codes]);

  return { codes, redeemed, isAdmin, activateAdmin, deactivateAdmin, redeemCode, createCode, deleteCode };
};
