import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import AuthGate from "@/components/AuthGate";
import SyncBanner from "@/components/SyncBanner";
import InstallPrompt from "@/components/InstallPrompt";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { AuthProvider } from "@/lib/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Study Timer",
  description: "Prati koliko učiš, po predmetima, uz Pomodoro režim.",
  // No explicit `icons` override here — this lets Next.js's file-convention
  // icons (app/icon.png, app/apple-icon.png) apply, so the browser tab, iOS
  // home screen, and PWA manifest all show the same tomato artwork instead
  // of an emoji glyph that renders differently per OS.
};

export const viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="sr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <AuthProvider>
          <AuthGate>
            <NavBar />
            <InstallPrompt />
            <SyncBanner />
            {children}
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
