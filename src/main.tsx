import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");

const renderBootRecovery = () => {
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100dvh;background:#05020f;color:#f8fafc;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;">
      <div style="width:100%;max-width:360px;border:1px solid rgba(34,211,238,.35);background:rgba(10,12,28,.88);border-radius:14px;padding:20px;text-align:center;box-shadow:0 0 32px rgba(168,85,247,.22);">
        <div style="font-size:34px;margin-bottom:8px;">⚡</div>
        <h1 style="font-size:18px;margin:0 0 10px;color:#67e8f9;">起動データを復旧します</h1>
        <p style="font-size:12px;line-height:1.7;color:#a1a1aa;margin:0 0 16px;">端末に残った古いデータ、またはブラウザの保存制限で初期化に失敗しました。</p>
        <button id="boot-recover" style="width:100%;border:0;border-radius:10px;padding:12px 14px;font-weight:900;color:white;background:linear-gradient(90deg,#7c3aed,#2563eb);">復旧して再起動</button>
      </div>
    </div>`;
  document.getElementById('boot-recover')?.addEventListener('click', () => {
    try {
      Object.keys(localStorage).filter(k => k.startsWith('kaden-td-')).forEach(k => localStorage.removeItem(k));
    } catch {}
    location.assign('/');
  });
};

try {
  if (!root) throw new Error('Root element not found');
  createRoot(root).render(<App />);
} catch (error) {
  console.error('Boot failed', error);
  renderBootRecovery();
}
