import type { Metadata } from "next";
import { Saira, Unbounded } from "next/font/google";

import { ThemeScript } from "@/components/theme/theme-script";

import "./globals.css";

const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MTCprop | Dashboard Interno",
  description:
    "Painel interno da MTCprop para gestao de alunos, inscricoes e acessos.",
  icons: {
    icon: "/brand/mtcprop-symbol.png",
    shortcut: "/brand/mtcprop-symbol.png",
    apple: "/brand/mtcprop-symbol.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      suppressHydrationWarning
      className={`${saira.variable} ${unbounded.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
