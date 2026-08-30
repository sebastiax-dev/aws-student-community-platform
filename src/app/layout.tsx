import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";

import "./globals.css";

export const metadata: Metadata = {
  title: "AWS Student Builder Group at PUCE",
  description: "Plataforma de la comunidad estudiantil AWS Student Builder Group at PUCE.",
};

type RootLayoutProperties = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProperties): React.ReactNode {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}<SiteFooter /></body>
    </html>
  );
}
