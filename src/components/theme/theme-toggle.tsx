"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";

import { THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof document === "undefined") {
      return "light";
    }

    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  });

  function handleToggle() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={
        theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"
      }
      title={theme === "light" ? "Modo escuro" : "Modo claro"}
      className="theme-icon-button flex h-10 w-10 items-center justify-center rounded-[12px] transition"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
}
