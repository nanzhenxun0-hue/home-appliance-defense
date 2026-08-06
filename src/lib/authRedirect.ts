const RETURN_KEY = 'kaden-td-auth-return';

/**
 * 全環境（Lovableプレビュー / 公開URL / Vercel / GitHub Pages）で同一の
 * コールバックURLを使う。ルートオリジンは常に許可リストに含まれるため、
 * 戻り先404が起きない。
 */
export function getOAuthRedirectUrl(): string {
  return window.location.origin + '/';
}

/** ログイン後に戻したいアプリ内パス（同一オリジンの相対パスのみ）を保存 */
export function rememberReturnPath(path: string) {
  try {
    if (path.startsWith('/') && !path.startsWith('//')) {
      sessionStorage.setItem(RETURN_KEY, path);
    }
  } catch {}
}

/** 保存済みの戻り先を取り出して消す */
export function consumeReturnPath(): string | null {
  try {
    const v = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    return v && v.startsWith('/') && !v.startsWith('//') ? v : null;
  } catch {
    return null;
  }
}
