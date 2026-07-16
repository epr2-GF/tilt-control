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