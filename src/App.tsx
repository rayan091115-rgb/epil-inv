import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, Component, type ReactNode } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

// Configuration Error Component
const ConfigError = () => (
  <div className="min-h-screen flex items-center justify-center bg-muted p-4">
    <div className="bg-card border border-border rounded-xl p-8 max-w-lg text-center shadow-lg">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold mb-2">Configuration requise</h1>
      <p className="text-muted-foreground text-sm mb-4">
        Supabase n'est pas configuré. Veuillez créer un fichier <code className="bg-muted px-2 py-1 rounded">.env</code> à la racine du projet avec les variables suivantes :
      </p>
      <div className="bg-muted p-4 rounded-lg text-left text-xs font-mono mb-4">
        <p className="text-foreground">VITE_SUPABASE_URL=<span className="text-muted-foreground">votre-url-supabase</span></p>
        <p className="text-foreground">VITE_SUPABASE_PUBLISHABLE_KEY=<span className="text-muted-foreground">votre-cle-publique</span></p>
      </div>
      <p className="text-muted-foreground text-xs">
        Vous pouvez obtenir ces clés depuis votre projet Supabase dans <strong>Settings → API</strong>.
      </p>
    </div>
  </div>
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
        <div className="min-h-screen flex items-center justify-center bg-muted p-4">
          <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center shadow-lg">
            <h1 className="text-xl font-bold mb-2">Erreur inattendue</h1>
            <p className="text-muted-foreground text-sm mb-4">{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              Recharger
            </button>
          </div>
        </div>
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
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-foreground text-lg">Chargement...</div>}>
                  <Admin />
                </Suspense>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
