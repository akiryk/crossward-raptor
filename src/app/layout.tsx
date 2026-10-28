import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const inter = Inter({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="h-full flex flex-col text-primary font-body antialiased">
        <Header />
        <main data-testid="app-main" className="mx-auto w-full max-w-[1800px] flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
