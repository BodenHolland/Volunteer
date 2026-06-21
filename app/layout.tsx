import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tended — Volunteer hours that count toward CalFresh",
  description:
    "Pick a task from a sponsoring nonprofit, do the work, and — if you receive CalFresh — certify the hours toward your monthly work requirement.",
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
