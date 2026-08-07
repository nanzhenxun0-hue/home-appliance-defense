/**
 * 404 発生時の環境情報とURLを自動記録するユーティリティ。
 * コンソールへ出力しつつ、直近20件を localStorage に保存する。
 */

export type NotFoundLogEntry = {
  timestamp: string;
  href: string;
  pathname: string;
  hash: string;
  search: string;
  origin: string;
  host: string;
  referrer: string;
  environment: string;
  routerMode: "hash" | "history";
  userAgent: string;
  viewport: string;
  online: boolean;
};

const STORAGE_KEY = "hd_404_logs";
const MAX_ENTRIES = 20;

function detectEnvironment(host: string): string {
  if (!host) return "unknown";
  if (host.includes("localhost") || host.includes("127.0.0.1")) return "local";
  if (host.includes("id-preview--")) return "lovable-preview";
  if (host.includes("lovableproject.com")) return "lovable-sandbox";
  if (host.includes("lovable.app")) return "lovable-published";
  if (host.includes("github.io")) return "github-pages";
  if (host.includes("vercel.app")) return "vercel";
  if (host.includes("netlify.app")) return "netlify";
  return `custom:${host}`;
}

export function buildNotFoundEntry(pathname: string): NotFoundLogEntry {
  const loc = typeof window !== "undefined" ? window.location : ({} as Location);
  const host = loc.host ?? "";
  return {
    timestamp: new Date().toISOString(),
    href: loc.href ?? "",
    pathname: pathname || loc.pathname || "",
    hash: loc.hash ?? "",
    search: loc.search ?? "",
    origin: loc.origin ?? "",
    host,
    referrer: typeof document !== "undefined" ? document.referrer : "",
    environment: detectEnvironment(host),
    routerMode: (loc.hash ?? "").startsWith("#/") ? "hash" : "history",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    viewport:
      typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio ?? 1}` : "",
    online: typeof navigator !== "undefined" ? navigator.onLine !== false : true,
  };
}

export function readNotFoundLogs(): NotFoundLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearNotFoundLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function recordNotFound(pathname: string): NotFoundLogEntry {
  const entry = buildNotFoundEntry(pathname);

  // コンソールに構造化して出力
  console.error("[404] ページが見つかりません", entry);
  console.table?.([
    { key: "environment", value: entry.environment },
    { key: "url", value: entry.href },
    { key: "pathname", value: entry.pathname },
    { key: "hash", value: entry.hash },
    { key: "routerMode", value: entry.routerMode },
    { key: "referrer", value: entry.referrer },
  ]);

  try {
    const logs = readNotFoundLogs();
    logs.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_ENTRIES)));
  } catch {
    /* localStorage が使えない環境は無視 */
  }

  // 外部からの取得用（デバッグコンソールで window.__404_LOGS で確認可能）
  try {
    (window as unknown as Record<string, unknown>).__404_LOGS = readNotFoundLogs();
  } catch {
    /* ignore */
  }

  return entry;
}
