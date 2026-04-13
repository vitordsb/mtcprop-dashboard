"use client";

import {
  Banknote,
  BarChart3,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  Layers,
  ShoppingCart,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
    exact: true,
  },
  {
    icon: ShoppingCart,
    label: "Vendas",
    href: "/dashboard/vendas",
  },
  {
    icon: Layers,
    label: "Planos ativos",
    href: "/dashboard/planos-ativos",
  },
  {
    icon: UsersRound,
    label: "Traders",
    href: "/dashboard/traders",
  },
  {
    icon: ClipboardList,
    label: "Solicitações",
    href: "/dashboard/solicitacoes",
  },
  {
    icon: Banknote,
    label: "Mensalidades",
    href: "/dashboard/mensalidades",
  },
  {
    icon: BarChart3,
    label: "Estatísticas",
    href: "/dashboard/estatisticas",
  },
  {
    icon: KeyRound,
    label: "Acessos",
    href: "/dashboard/acessos",
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="grid min-h-0 flex-1 gap-1 overflow-y-auto px-4 py-5">
      {navItems.map(({ icon: Icon, label, href, exact }) => {
        const isActive = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition ${
              isActive
                ? "theme-nav-item-active"
                : "theme-nav-item"
            }`}
          >
            <Icon
              className={`h-5 w-5 shrink-0 ${
                isActive ? "text-[var(--brand)]" : "theme-nav-icon"
              }`}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
