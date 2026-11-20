import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      tone: {
        good: "border-good/40 bg-good/10 text-good",
        warn: "border-blue/50 bg-blue/10 text-blue",
        bad: "border-bad/50 bg-bad/10 text-bad",
        info: "border-info/40 bg-info/10 text-info",
        neutral: "border-line bg-panel-2 text-muted",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
