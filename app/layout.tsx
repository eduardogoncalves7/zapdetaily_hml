import type { Metadata } from "next";
import "./globals.css";
import { getTenantSettings, tenantSettingsToCssVariables } from "@/lib/tenant-settings";

export const metadata: Metadata = {
  title: "Zap Detaily",
  description: "Fundação do produto multi-tenant de agendamento e gestão.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getTenantSettings();
  const cssVariables = tenantSettingsToCssVariables(settings);
  return (
    <html lang="pt-BR">
      <body style={cssVariables}>{children}</body>
    </html>
  );
}
