import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { recordNotFound, type NotFoundLogEntry } from "@/lib/notFoundLog";

const NotFound = () => {
  const location = useLocation();
  const [entry, setEntry] = useState<NotFoundLogEntry | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEntry(recordNotFound(location.pathname));
  }, [location.pathname]);

  const copyDetails = async () => {
    if (!entry) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>

        {entry && (
          <div className="mb-4 rounded-lg border border-border bg-card p-3 text-left text-xs text-muted-foreground">
            <div className="mb-2 font-semibold text-foreground">診断ログ（自動記録済み）</div>
            <dl className="space-y-1 break-all">
              <div>
                <dt className="inline font-medium">環境: </dt>
                <dd className="inline">{entry.environment}</dd>
              </div>
              <div>
                <dt className="inline font-medium">URL: </dt>
                <dd className="inline">{entry.href}</dd>
              </div>
              <div>
                <dt className="inline font-medium">パス: </dt>
                <dd className="inline">{entry.pathname}</dd>
              </div>
              <div>
                <dt className="inline font-medium">ルーター: </dt>
                <dd className="inline">{entry.routerMode}</dd>
              </div>
              <div>
                <dt className="inline font-medium">参照元: </dt>
                <dd className="inline">{entry.referrer || "(なし)"}</dd>
              </div>
              <div>
                <dt className="inline font-medium">時刻: </dt>
                <dd className="inline">{entry.timestamp}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={copyDetails}
              className="mt-3 w-full rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              {copied ? "コピーしました" : "診断ログをコピー"}
            </button>
          </div>
        )}

        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
