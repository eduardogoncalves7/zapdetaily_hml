import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zap Detaily",
  description: "Fundação do produto multi-tenant de agendamento e gestão.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
