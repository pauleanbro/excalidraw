"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Home,
  Layers,
  Menu,
  Settings,
  ShoppingBag,
  X,
} from "lucide-react";
import { useState } from "react";

import { BRAND } from "@/config/brand";

type NavItem = {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ElementType;
  readonly disabled?: boolean;
  readonly badge?: string;
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Perfis", href: "/dashboard/profiles", icon: Layers },
  { label: "Loja", href: "/dashboard/shop", icon: ShoppingBag, disabled: true, badge: "soon" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Assinatura", href: "/dashboard/billing", icon: CreditCard },
  { label: "Configurações", href: "/dashboard/settings", icon: Settings },
] as const;

type SidebarProps = {
  readonly user: {
    readonly name?: string | null;
    readonly image?: string | null;
    readonly email?: string | null;
  };
};

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        aria-label="Abrir menu"
        className="fixed left-4 top-5 z-50 inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[rgba(111,131,103,0.14)] bg-[rgba(255,251,245,0.88)] shadow-shell backdrop-blur-[12px] lg:hidden"
        onClick={() => setMobileOpen(true)}
        type="button"
      >
        <Menu className="h-[18px] w-[18px] text-[#293126]" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(20,24,18,0.18)] backdrop-blur-[6px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-[rgba(111,131,103,0.1)] bg-[rgba(255,253,250,0.96)] backdrop-blur-[16px] transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex h-[72px] items-center justify-between px-6">
          <Link
            className="inline-flex items-center gap-3 text-[1.1rem] font-bold tracking-tight text-[#20261f]"
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
          >
            <span className="h-[20px] w-[20px] rounded-[7px] bg-mark-accent shadow-[0_10px_24px_rgba(90,112,87,0.28)]" />
            <span className="font-display">{BRAND.name}</span>
          </Link>

          <button
            aria-label="Fechar menu"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#6e7669] transition-colors hover:bg-[rgba(111,131,103,0.08)] lg:hidden"
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-[2px] overflow-y-auto px-3 pt-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  className="flex cursor-default items-center gap-3 rounded-[14px] px-3 py-[10px] text-[0.88rem] text-[#b0b5ab]"
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full border border-[rgba(111,131,103,0.1)] bg-[rgba(111,131,103,0.06)] px-[7px] py-[2px] text-[9px] font-bold uppercase tracking-[0.1em] text-[#a0a69b]">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                className={[
                  "group flex items-center gap-3 rounded-[14px] px-3 py-[10px] text-[0.88rem] font-medium transition-all duration-200",
                  isActive
                    ? "bg-[rgba(107,131,100,0.1)] font-semibold text-[#3d5236]"
                    : "text-[#697163] hover:bg-[rgba(111,131,103,0.06)] hover:text-[#3d5236]",
                ].join(" ")}
                href={item.href}
                onClick={() => setMobileOpen(false)}
              >
                <Icon
                  className={[
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive ? "text-[#56704f]" : "text-[#8a8f83] group-hover:text-[#697163]",
                  ].join(" ")}
                  strokeWidth={isActive ? 2 : 1.8}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && (
                  <span className="h-[6px] w-[6px] rounded-full bg-[#56704f]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User card at bottom */}
        <div className="border-t border-[rgba(111,131,103,0.1)] px-4 py-4">
          <div className="flex items-center gap-3 rounded-[16px] border border-[rgba(111,131,103,0.08)] bg-[rgba(255,255,255,0.7)] px-3 py-3">
            <span
              className="h-[38px] w-[38px] shrink-0 rounded-full border border-[rgba(111,131,103,0.12)] bg-[#c8d4c3] bg-cover bg-center"
              style={
                user.image
                  ? { backgroundImage: `url(${user.image})` }
                  : undefined
              }
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.88rem] font-semibold text-[#20261f]">
                {user.name ?? "Criador"}
              </p>
              <p className="truncate text-[0.78rem] text-[#8a8f83]">
                {user.email ?? ""}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
