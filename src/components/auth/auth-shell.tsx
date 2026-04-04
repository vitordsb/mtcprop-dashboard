import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="theme-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.11] mix-blend-multiply"
        style={{
          backgroundImage: "url('/brand/mtcprop-control-room.jpg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />
      <div className="theme-auth-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(69,225,95,0.22),transparent_52%)]" />
      <div className="pointer-events-none absolute left-[-10rem] top-24 h-64 w-64 rounded-full bg-[rgba(69,225,95,0.18)] blur-3xl" />
      <div className="theme-auth-dark-orb pointer-events-none absolute right-[-6rem] bottom-10 h-72 w-72 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(7,17,8,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(7,17,8,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-70" />

      <div className="relative z-10 w-full max-w-xl">{children}</div>
    </div>
  );
}
