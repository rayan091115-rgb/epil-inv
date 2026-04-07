import type { ElementType, PropsWithChildren, ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PageShellProps extends PropsWithChildren {
  className?: string;
}

export const PageShell = ({ children, className }: PageShellProps) => {
  return (
    <div className={cn("relative min-h-screen bg-background", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(17,24,39,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.4),transparent_160px)]" />
      <div className="relative container mx-auto px-4 py-6 md:px-6 md:py-8">{children}</div>
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: ElementType;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  description,
  icon: Icon,
  meta,
  actions,
  className,
}: PageHeaderProps) => {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,247,249,0.98))] p-6 shadow-[0_24px_70px_rgba(16,24,40,0.08)]",
        className,
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
          <div className="flex items-start gap-4">
            {Icon ? (
              <span className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-foreground text-background shadow-[0_14px_30px_rgba(16,24,40,0.15)] sm:inline-flex">
                <Icon className="h-5 w-5" />
              </span>
            ) : null}
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p>
            </div>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
};

interface MetricCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: ElementType;
  tone?: "default" | "success" | "warning" | "danger";
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "text-foreground bg-secondary/70",
  success: "text-emerald-700 bg-emerald-50",
  warning: "text-amber-700 bg-amber-50",
  danger: "text-rose-700 bg-rose-50",
};

export const MetricCard = ({ title, value, description, icon: Icon, tone = "default" }: MetricCardProps) => {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full items-start justify-between gap-4 p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-2xl", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
};

interface SectionPanelProps extends PropsWithChildren {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const SectionPanel = ({ title, description, action, className, children }: SectionPanelProps) => {
  return (
    <Card className={className}>
      <CardHeader className="gap-4 border-b border-border/70 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
};

interface DenseToolbarProps extends PropsWithChildren {
  className?: string;
}

export const DenseToolbar = ({ children, className }: DenseToolbarProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[24px] border border-border/70 bg-card/95 p-4 shadow-[0_10px_30px_rgba(16,24,40,0.05)] lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

interface EmptyStatePanelProps {
  icon: ElementType;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyStatePanel = ({ icon: Icon, title, description, action }: EmptyStatePanelProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary text-foreground">
          <Icon className="h-7 w-7" />
        </span>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
};

export const SurfaceBadge = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-border/80 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </Badge>
  );
};
