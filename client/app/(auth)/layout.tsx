import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern [background-size:48px_48px] opacity-50" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/20 blur-3xl" />

      <div className="relative grid min-h-screen lg:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-border bg-card/30 p-10 lg:flex">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-semibold">{APP_NAME}</span>
          </Link>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Ship more with less friction.
            </h2>
            <p className="text-muted-foreground">
              A team workspace with beautiful Kanban boards, real analytics, role-based access,
              and a design system tuned for focus.
            </p>
            <blockquote className="rounded-xl border border-border bg-background/50 p-4 text-sm">
              <p className="italic text-muted-foreground">
                "Looks like Linear, feels like Notion, ships like Trello. Exactly what our team needed."
              </p>
              <footer className="mt-2 text-xs font-medium">— Beta user, Series A startup</footer>
            </blockquote>
          </div>

          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between p-6 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-lg">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm">{APP_NAME}</span>
            </Link>
            <ThemeToggle />
          </div>
          <div className="absolute top-6 right-6 hidden lg:block">
            <ThemeToggle />
          </div>
          <div className="flex flex-1 items-center justify-center p-6 lg:p-10">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
