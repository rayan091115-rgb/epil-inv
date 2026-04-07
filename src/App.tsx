import { Component, lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { IconBadge, Icons } from "@/components/app/icons";
import { PageShell } from "@/components/app/primitives";
import { AppThemeProvider } from "@/components/providers/AppThemeProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      retryDelay: 1000,
    },
  },
});

const ConfigError = () => (
  <PageShell className="flex items-center justify-center">
    <div className="glass-card w-full max-w-xl p-8 text-center">
      <IconBadge icon="warning" className="mx-auto mb-4 h-16 w-16 rounded-[22px]" iconClassName="h-7 w-7" />
      <h1 className="mb-2 text-2xl font-semibold text-foreground">Configuration requise</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Supabase n est pas configure. Creez un fichier <code className="rounded bg-secondary px-2 py-1">.env</code> a
        la racine avec les variables suivantes :
      </p>
      <div className="mb-4 rounded-[20px] bg-secondary/60 p-4 text-left text-xs font-mono">
        <p className="text-foreground">
          VITE_SUPABASE_URL=<span className="text-muted-foreground">votre-url-supabase</span>
        </p>
        <p className="text-foreground">
          VITE_SUPABASE_PUBLISHABLE_KEY=<span className="text-muted-foreground">votre-cle-publique</span>
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Recuperables dans votre projet Supabase, section <strong>Settings - API</strong>.
      </p>
    </div>
  </PageShell>
);

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <PageShell className="flex items-center justify-center">
          <div className="glass-card w-full max-w-md p-8 text-center">
            <IconBadge icon="warning" className="mx-auto mb-4 h-16 w-16 rounded-[22px]" iconClassName="h-7 w-7" />
            <h1 className="mb-2 text-2xl font-semibold text-foreground">Erreur inattendue</h1>
            <p className="mb-5 text-sm text-muted-foreground">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              <Icons.refresh className="mr-2 h-[18px] w-[18px]" />
              Recharger
            </button>
          </div>
        </PageShell>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  if (!isSupabaseConfigured) {
    return <ConfigError />;
  }

  return (
    <ErrorBoundary>
      <AppThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/admin"
                  element={
                    <Suspense
                      fallback={
                        <PageShell className="flex items-center justify-center">
                          <div className="glass-card flex items-center gap-3 px-5 py-4 text-foreground">
                            <Icons.refresh className="h-[18px] w-[18px] animate-spin" />
                            Chargement...
                          </div>
                        </PageShell>
                      }
                    >
                      <Admin />
                    </Suspense>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </AppThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
