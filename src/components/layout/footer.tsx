import Link from "next/link";
import { Heart } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { navigationItems } from "@/lib/constants/navigation";

export function Footer() {
  return (
    <footer className="page-container mt-16 border-t border-border py-9">
      <div className="flex flex-col justify-between gap-7 md:flex-row md:items-center">
        <div>
          <Brand footer />
          <p className="mt-3 text-sm text-muted-foreground">
            Tu cartón de bingo, siempre contigo.
          </p>
        </div>
        <nav
          aria-label="Navegación del pie de página"
          className="flex flex-wrap gap-x-6 gap-y-1"
        >
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-h-11 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-8 flex flex-col justify-between gap-3 border-t border-border/70 pt-5 text-xs text-muted-foreground sm:flex-row">
        <p>Bingo Web · Tu bingo de bolsillo</p>
        <p className="flex items-center gap-1.5">
          Hecho para compartir buenos momentos{" "}
          <Heart aria-hidden="true" className="size-3.5 text-primary" />
        </p>
      </div>
    </footer>
  );
}
