import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { AuthHydrator } from "@/providers/auth-hydrator";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: "Production-grade collaborative task and project management built with Next.js + Express.",
  applicationName: APP_NAME,
  keywords: ["task manager", "project management", "kanban", "team collaboration"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthHydrator />
            {children}
            <Toaster
              richColors
              position="top-right"
              toastOptions={{
                classNames: { toast: "rounded-xl border shadow-lg" },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
