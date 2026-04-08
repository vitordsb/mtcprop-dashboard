"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SearchBar({ placeholder = "Pesquisar..." }: { placeholder?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const currentQuery = searchParams.get("q") ?? "";

  useEffect(() => {
    setTerm(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    if (term === currentQuery) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams);
        if (term) {
          params.set("q", term);
        } else {
          params.delete("q");
        }
        // Force page=1 whenever we search something new to avoid empty bounds
        params.delete("page");
        
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [term, currentQuery, router, searchParams, pathname]);

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={term}
      onChange={(e) => setTerm(e.target.value)}
      className={`theme-input w-full rounded-[12px] border px-4 py-2 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] ${
        isPending ? "opacity-50" : ""
      }`}
    />
  );
}
