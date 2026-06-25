import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "colift — Civic work that counts",
  description:
    "Flexible, verified community work — translation, tree counts, food-access audits, neighborhood writing. If you receive SNAP/EBT, certified hours count toward your monthly work requirement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-body">
        {children}
      </body>
    </html>
  );
}
