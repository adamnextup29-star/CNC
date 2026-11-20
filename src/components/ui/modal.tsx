import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75" />
        <Dialog.Content
          className={cn(
            "fixed z-50 flex flex-col border border-line bg-panel text-text shadow-2xl",
            wide
              ? "inset-2 rounded-lg md:inset-6"
              : "top-1/2 left-1/2 max-h-[min(100%-2rem,44rem)] w-[min(100%-1.5rem,36rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg",
          )}
        >
          <div className="flex items-start justify-between gap-3 p-4">
            <div>
              <Dialog.Title className="font-display text-3xl leading-none tracking-wide">{title}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted">{description}</Dialog.Description>
            </div>
            <Dialog.Close
              className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-line hover:border-blue"
              aria-label="Close"
            >
              <X />
            </Dialog.Close>
          </div>
          <div className={cn("min-h-0", wide ? "flex-1 overflow-auto px-4 pb-4" : "px-4 pb-5")}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
