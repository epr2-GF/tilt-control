// frontend/app/layout.tsx


import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "../context/AuthContext";
import { DeviceProvider } from "@/context/DeviceContext";
import AppInit from "../components/AppInit";


const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Site Control",
  description: "Industrial Site Management System",
  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Smart Site Control",
  },
};

export const viewport: Viewport = { themeColor: "#020617" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-slate-950 text-white">
<ToastProvider>
  <AuthProvider>
    <DeviceProvider>
      <AppInit>
        {children}
      </AppInit>
    </DeviceProvider>
  </AuthProvider>
</ToastProvider>
      </body>
    </html>
  );
}