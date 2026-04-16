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
  title: "StudyFlow — Free Offline Study Assistant",
  description: "AI-powered personal study assistant that runs 100% offline. Upload notes, extract topics, generate quizzes, and get smart recommendations — no paid APIs needed.",
  keywords: ["StudyFlow", "study assistant", "quiz generator", "NLP", "offline", "free", "study plan"],
  authors: [{ name: "StudyFlow" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "StudyFlow — Free Offline Study Assistant",
    description: "Upload notes, extract topics, generate quizzes, and get smart recommendations — all offline, all free.",
    type: "website",
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
