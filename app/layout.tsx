import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Jinhua Obituary",
  description: "Honor • Remember • Celebrate",

  // ✅ PWA / Theme
  themeColor: "#000000",

  // ✅ iOS support (Step 4)
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jinhua",
  },

  // ✅ App icons
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },

  // ✅ Manifest (Step 3)
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}