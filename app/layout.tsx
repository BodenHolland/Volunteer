import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CloudflareAnalytics } from "./_components/cloudflare-analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tended — Online volunteering that counts toward SNAP (EBT)",
  description:
    "Find online volunteering opportunities from sponsoring nonprofits. If you get SNAP (EBT), certify the hours toward your monthly work requirement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <CloudflareAnalytics />
      </head>
      <body className="min-h-full flex flex-col bg-white text-body">
        {children}
      </body>
    </html>
  );
}
