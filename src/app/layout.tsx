import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bingo Web · Tu bingo, ahora en tu bolsillo",
  description:
    "Tu cartón de bingo, siempre contigo. Conoce la interfaz inicial de Bingo Web: una nueva forma de disfrutar tus próximas partidas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
