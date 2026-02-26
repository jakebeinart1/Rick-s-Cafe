"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/#timeline", label: "Timeline", icon: Clock },
  { href: "/search", label: "Search", icon: Search },
  { href: "/about", label: "About", icon: User },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: Fixed top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 hidden md:block backdrop-blur-sm bg-background/80">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-heading text-2xl font-bold tracking-tight">
              Rick&apos;s Caf&eacute;
            </span>
            <span className="font-mono text-xs text-muted">HTX</span>
          </Link>
          <div className="flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-sm tracking-wide transition-colors",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/40 hover:text-foreground/70"
                )}
              >
                {item.label}
                {pathname === item.href && (
                  <div className="absolute -bottom-1 left-0 right-0 h-px bg-accent" />
                )}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile: Bottom-docked navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-accent-gold/25 bg-background/90 backdrop-blur-xl rounded-t-lg md:hidden">
        <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 transition-colors",
                  isActive ? "text-foreground" : "text-foreground/30"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className="font-mono text-[10px] uppercase tracking-wider">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
