import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "AWS Student Community PUCE",
  description: "Plataforma de la comunidad estudiantil AWS en PUCE.",
};

type RootLayoutProperties = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProperties): React.ReactNode {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
