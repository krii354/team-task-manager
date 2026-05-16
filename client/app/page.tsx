"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { APP_NAME } from "@/lib/constants";

const features = [
  {
    icon: LayoutDashboard,
    title: "Beautiful Dashboards",
    description: "Real-time analytics, productivity scores, and trend charts that look great in dark and light.",
  },
  {
    icon: ListChecks,
    title: "Drag & Drop Kanban",
    description: "Move tasks across Todo → In Progress → Review → Completed with smooth keyboard-accessible DnD.",
  },
  {
    icon: Users,
    title: "Role-based Access",
    description: "Admins manage everything; members focus on their assignments — securely separated end to end.",
  },
  {
    icon: ShieldCheck,
    title: "Production Auth",
    description: "JWT + refresh-token rotation, bcrypt hashing, rate limiting, helmet, and centralized errors.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-pattern [background-size:48px_48px]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/20 blur-3xl" />

      <header className="container mx-auto flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-base font-semibold">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button variant="gradient" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="container mx-auto flex flex-col items-center text-center py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          v1.0 — built for fast-moving teams
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-6 text-4xl md:text-6xl font-bold tracking-tight"
        >
          Run your team like a{" "}
          <span className="text-gradient">Silicon Valley startup</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground"
        >
          A modern, production-grade task & project manager with Kanban boards, real analytics,
          role-based access, and a UI inspired by Linear and Notion.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button variant="gradient" size="lg" asChild>
            <Link href="/signup">
              Create your workspace <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">I have an account</Link>
          </Button>
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> No credit card</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Dark/light mode</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Open source ready</span>
        </div>
      </section>

      <section className="container mx-auto grid grid-cols-1 gap-5 pb-24 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
          </motion.div>
        ))}
      </section>

      <footer className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-6 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} {APP_NAME}. Built with Next.js, Express & Prisma.</span>
          <span>Production-grade engineering portfolio project.</span>
        </div>
      </footer>
    </div>
  );
}
