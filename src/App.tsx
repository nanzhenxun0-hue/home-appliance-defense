import { Component, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import SoundVisualizer from "@/components/SoundVisualizer";

const queryClient = new QueryClient();

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('App render failed', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center p-6">
          <div className="glass-panel max-w-sm w-full p-5 text-center space-y-3">
            <div className="text-3xl">⚡</div>
            <h1 className="text-lg font-black text-cyan-300">システム再起動が必要です</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              端末内の古いゲームデータを読み込めませんでした。復旧すると初期画面から再開できます。
            </p>
            <button
              className="game-btn-primary w-full py-2 text-sm font-black"
              onClick={() => {
                try {
                  Object.keys(localStorage)
                    .filter(key => key.startsWith('kaden-td-'))
                    .forEach(key => localStorage.removeItem(key));
                } catch {}
                location.assign('/');
              }}
            >
              復旧して再起動
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/index" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <SoundVisualizer />
      </TooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
