import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber",
  {
    variants: {
      variant: {
        primary: "bg-amber text-ink hover:bg-amber/90",
        outline: "border border-line bg-panel text-text hover:border-amber",
        ghost: "text-text hover:bg-panel-2",
        danger: "border border-bad/50 text-bad hover:bg-bad/10",
      },
      size: {
        default: "min-h-12 px-4 text-base",
        sm: "min-h-11 px-3 text-sm",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
