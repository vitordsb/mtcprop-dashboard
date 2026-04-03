import type { CompanySnapshot } from "@/types/dashboard";

export function getCompanySnapshot(): CompanySnapshot {
  return {
    name: "MTCprop",
    vertical: "Mesa proprietaria, educacao e aceleracao de traders",
    website: "https://mtcprop.com.br/",
    environment:
      process.env.NODE_ENV === "production"
        ? "Operacao em producao"
        : "Operacao local",
    deploymentTarget: process.env.VERCEL
      ? "Vercel"
      : "Docker / desenvolvimento local",
  };
}
