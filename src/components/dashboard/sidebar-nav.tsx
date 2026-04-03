"use client";

import {
  Banknote,
  BarChart3,
  ClipboardList,
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
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1 px-4 py-5">
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
                ? "bg-[#eef4ee] text-[#071108]"
                : "text-[#334336] hover:bg-[#f4f7f4]"
            }`}
          >
            <Icon
              className={`h-5 w-5 shrink-0 ${
                isActive ? "text-[var(--brand)]" : "text-[#18261a]"
              }`}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
