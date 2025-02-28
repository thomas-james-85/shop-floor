import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TerminalProvider } from "@/contexts/terminalContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unifabs Shop Floor Capture",
  description: "Unifabs LTD 2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TerminalProvider>{children}</TerminalProvider>
      </body>
    </html>
  );
}
