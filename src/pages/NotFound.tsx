import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { PageShell } from "@/components/app/primitives";
import { IconBadge, Icons } from "@/components/app/icons";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageShell className="flex items-center justify-center">
      <div className="glass-card flex w-full max-w-xl flex-col items-center gap-5 p-10 text-center">
        <IconBadge icon="warning" className="h-16 w-16 rounded-[22px]" iconClassName="h-7 w-7" />
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">404</p>
          <h1 className="text-3xl font-semibold text-foreground">Page introuvable</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            La route demandee n existe pas ou n est plus disponible.
          </p>
        </div>
        <Button asChild>
          <a href="/">
            <Icons.previous className="h-[18px] w-[18px]" />
            Retour a l accueil
          </a>
        </Button>
      </div>
    </PageShell>
  );
};

export default NotFound;
