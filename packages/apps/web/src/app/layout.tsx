import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "naksilaclina",
    template: "%s | MyApp"
  },
  description: "A modern web application with dark mode support, responsive design, and smooth animations built with Next.js 15 and Shadcn UI.",
  keywords: ["nextjs", "react", "shadcn-ui", "tailwindcss", "typescript", "dark-mode", "framer-motion", "web-application"],
  authors: [{ name: "MyApp Team" }],
  creator: "",
  publisher: "MyApp",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    }
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://myapp.example.com",
    title: "MyApp - Modern Web Application",
    description: "A modern web application with dark mode support, responsive design, and smooth animations built with Next.js 15 and Shadcn UI.",
    siteName: "MyApp",
    images: [
      {
        url: "https://myapp.example.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MyApp - Modern Web Application",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyApp - Modern Web Application",
    description: "A modern web application with dark mode support, responsive design, and smooth animations built with Next.js 15 and Shadcn UI.",
    creator: "@myapp",
    images: ["https://myapp.example.com/twitter-image.jpg"],
  },
  alternates: {
    canonical: "https://myapp.example.com",
  },
  verification: {
    google: "your-google-verification-code",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}