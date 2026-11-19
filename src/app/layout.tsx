import type { Metadata } from "next";
import { Sora, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestão VG - ERP SaaS",
  description: "Plataforma de Gestão Integrada para Pequenas e Médias Empresas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <html
        lang="pt-BR"
        suppressHydrationWarning
        className={`${sora.variable} ${plexMono.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-background text-foreground [--font-sans:var(--font-sora)] [--font-mono:var(--font-plex-mono)]">
          {children}
        </body>
      </html>
    </ThemeProvider>
  );
}
