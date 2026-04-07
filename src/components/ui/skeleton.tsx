import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-skeleton rounded-xl",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
