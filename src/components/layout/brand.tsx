import { cn } from "@/lib/utils";

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5" aria-label="Bingo Web">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 items-center justify-center rounded-full bg-primary shadow-[inset_-3px_-4px_0_#00000015]",
          footer && "size-8",
        )}
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-black text-primary">
          8
        </span>
      </span>
      <span className="text-2xl font-extrabold tracking-tight">
        Bingo<span className="text-primary">{footer ? " Web" : "."}</span>
      </span>
    </div>
  );
}
