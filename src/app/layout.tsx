import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deadman's Wallet",
  description: "Modern Next.js scaffold optimized for AI-powered development with Deadman's Wallet. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["Deadman's wallet", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React"],
  authors: [{ name: "Deadman's Wallet Team" }],
  openGraph: {
    title: "Deadman's Wallet",
    description: "AI-powered development with modern React stack",
    siteName: "Deadman's Wallet",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deadman's Wallet",
    description: "AI-powered development with modern React stack",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
