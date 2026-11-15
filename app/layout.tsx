import type { Metadata } from "next";
import "@fontsource/instrument-sans";
import "@fontsource/instrument-serif";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farnavi — International Career & Resume OS",
  description: "ATS resumes, personal websites, job tracker, interviews & AI career tools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}