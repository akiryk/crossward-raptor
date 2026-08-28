import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crossward",
  description: "A crossword puzzle builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col bg-background text-foreground font-body antialiased">
        <Header />
        <main data-testid="app-main" className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
