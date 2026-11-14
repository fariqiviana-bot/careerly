import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Careerly — Career OS",
  description: "Resumes, jobs, interviews & AI in one place.",
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