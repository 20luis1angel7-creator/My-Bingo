"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { navigationItems } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = navigationItems.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setOpen(false)}
      aria-current={pathname === item.href ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center rounded-lg px-4 text-sm font-medium text-muted-foreground hover:bg-primary/5",
        pathname === item.href && "bg-primary/7 text-primary",
      )}
    >
      {item.label}
    </Link>
  ));
  return (
    <header className="border-b border-border/70 bg-background">
      <div className="page-container flex h-20 items-center justify-between">
        <Link href="/" aria-label="Bingo Web, inicio">
          <Brand />
        </Link>
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-3 md:flex"
        >
          {links}
        </nav>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 md:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      <nav
        id="mobile-menu"
        hidden={!open}
        aria-label="Navegación móvil"
        className="page-container pb-4 md:hidden"
      >
        {links}
      </nav>
    </header>
  );
}
