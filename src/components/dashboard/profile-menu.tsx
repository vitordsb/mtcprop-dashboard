"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUserRound, LogOut } from "lucide-react";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

type ProfileMenuProps = {
  initial: string;
};

export function ProfileMenu({ initial }: ProfileMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleOutsidePointerDown = useEffectEvent((event: PointerEvent) => {
    if (!menuRef.current?.contains(event.target as Node)) {
      setOpen(false);
    }
  });

  const handleEscapeKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    setIsLoggingOut(true);

    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
      });
    } finally {
      startTransition(() => {
        router.replace("/login");
        router.refresh();
      });
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Abrir menu do perfil"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[rgba(69,225,95,0.2)] bg-[#071108] text-sm font-semibold text-white transition hover:border-[rgba(69,225,95,0.38)] hover:bg-[#0f1d12]"
      >
        {initial}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Menu do perfil"
          className="theme-dropdown absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[220px] rounded-[18px] p-2"
        >
          <Link
            href="/dashboard/perfil"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="theme-menu-item flex items-center gap-3 rounded-[14px] px-4 py-3 text-[15px] font-medium transition"
          >
            <CircleUserRound className="h-5 w-5" />
            <span>My Profile</span>
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="theme-menu-item flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left text-[15px] font-medium transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogOut className="h-5 w-5" />
            <span>{isLoggingOut ? "Saindo..." : "Logout"}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
