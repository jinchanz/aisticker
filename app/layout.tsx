import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s by AI Sticker Generator | AI Sticker Shop",
    default: "AI Sticker Generator | AI Sticker Shop",
  },
  description:
    "AI Sticker Shop is an AI Sticker Generator, used to generate beautiful stickers with AI.",
  keywords:
    "AI Sticker, AI Sticker Shop, AI Sticker Generator, AI Sticker image",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Toaster position="top-center" richColors />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
