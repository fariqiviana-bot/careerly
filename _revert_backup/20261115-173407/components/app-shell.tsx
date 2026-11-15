"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, Layers, ShieldCheck, Briefcase, Kanban,
  Zap, Mic, Sparkles, Compass, Linkedin, Wrench, Settings, HelpCircle,
  ChevronRight, ArrowUpRight, Crown, Menu, X, Plus
} from "lucide-react";
import { useStore, calculateDocScore } from "@/lib/store";
import { CreateDocModal } from "./create-doc-modal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, docs } = useStore();

  const [docsHover, setDocsHover] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const primaryResume = docs.find((d) => d.type === "resume") || docs[0];
  const liveScore = primaryResume ? calculateDocScore(primaryResume.content).score : user.completion || 15;

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/documents", label: "Documents", icon: FileText, hasFlyout: true },
    { href: "/templates", label: "Templates", icon: Layers },
    { href: "/checker", label: "ATS Checker", icon: ShieldCheck },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: "/tracker", label: "Job Tracker", icon: Kanban },
    { href: "/auto-apply", label: "Auto Apply", icon: Zap },
    { href: "/interviews", label: "Interview Prep", icon: Mic },
    { href: "/ai", label: "AI Assistant", icon: Sparkles },
    { href: "/ai/career-map", label: "Career Map", icon: Compass },
    { href: "/ai/linkedin", label: "LinkedIn Coach", icon: Linkedin },
    { href: "/tools", label: "All Tools", icon: Wrench },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/help", label: "Help & Coaches", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#202124] flex flex-col lg:flex-row">
      {/* هدر موبایل */}
      <header className="lg:hidden flex items-center justify-between border-b border-[#D8CFC2] bg-[#FCFBF8] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg border border-[#D8CFC2] p-1.5 text-[#202124]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="font-bold tracking-tight text-base">
            Farnavi <span className="text-xs font-normal text-[#706A62]">Career OS</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#202124] px-2.5 py-1.5 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Create
          </button>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 rounded-lg bg-[#5d6f61] px-2.5 py-1.5 text-xs font-semibold text-white"
          >
            <Crown className="h-3.5 w-3.5" /> Upgrade
          </Link>
        </div>
      </header>

      {/* سایدبار دسکتاپ و کشوی موبایل */}
      <aside
        className={`${
          mobileOpen ? "fixed inset-y-0 left-0 z-50 block" : "hidden"
        } lg:sticky lg:top-0 lg:h-screen lg:flex w-64 shrink-0 flex-col border-r border-[#D8CFC2] bg-[#FCFBF8] select-none`}
      >
        {/* پروفایل بالای سایدبار با حلقه درصد تکمیل مشابه Resume.io */}
        <div className="border-b border-[#e5dfd5] p-4">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#202124] text-xs font-bold text-[#FCFBF8]">
                F
              </div>
              <span className="font-bold tracking-tight text-base">Farnavi</span>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 rounded-full bg-[#5d6f61]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#3d4a3f] hover:bg-[#5d6f61] hover:text-white transition"
            >
              <Crown className="h-3 w-3" /> {user.plan}
            </Link>
          </div>

          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-xl bg-[#F7F4EE] p-2.5 border border-[#e5dfd5] hover:border-[#706A62] transition"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#202124] text-xs font-bold text-white">
              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              <span className="absolute -bottom-1 -right-1 rounded-full bg-[#c05b49] px-1.5 py-0.2 text-[9px] font-bold text-white">
                {liveScore}%
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-[#202124]">{user.name}</div>
              <div className="truncate text-[11px] text-[#706A62]">
                {user.target || "Set your target role"}
              </div>
            </div>
          </Link>
        </div>

        {/* لیست آیتم‌های ناوبری با منوی کشویی هاور روی Documents */}
        <nav className="flex-1 space-y-0.5 px-3 py-3 overflow-y-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            if (item.hasFlyout) {
              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setDocsHover(true)}
                  onMouseLeave={() => setDocsHover(false)}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                      active || docsHover
                        ? "bg-[#e7eef2]/90 text-[#202124] font-semibold"
                        : "text-[#706A62] hover:bg-[#F7F4EE] hover:text-[#202124]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0 text-[#5b7a8c]" />
                      <span>Documents</span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#706A62]" />
                  </Link>

                  {/* منوی کشویی هاور دقیقاً مطابق تصویر Resume.io */}
                  {docsHover && (
                    <div className="hidden lg:block absolute left-full top-0 pl-2 z-50">
                      <div className="w-52 rounded-2xl border border-[#e5dfd5] bg-white p-2 shadow-xl">
                        <button
                          onClick={() => {
                            setDocsHover(false);
                            router.push("/documents?tab=resume");
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-medium text-[#3c4043] hover:bg-[#F7F4EE] hover:text-[#202124] transition"
                        >
                          <span>My Resumes</span>
                        </button>
                        <button
                          onClick={() => {
                            setDocsHover(false);
                            router.push("/documents?tab=cover");
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-medium text-[#3c4043] hover:bg-[#F7F4EE] hover:text-[#202124] transition"
                        >
                          <span>My Cover Letters</span>
                        </button>
                        <div className="my-1 border-t border-[#f0ece3]" />
                        <button
                          onClick={() => {
                            setDocsHover(false);
                            router.push("/help?section=coaches");
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-medium text-[#3c4043] hover:bg-[#F7F4EE] hover:text-[#202124] transition"
                        >
                          <span>Hire Resume Writer</span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-[#706A62]" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-[#202124] text-[#FCFBF8] font-semibold shadow-xs"
                    : "text-[#706A62] hover:bg-[#F7F4EE] hover:text-[#202124]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* فوتر سایدبار */}
        <div className="border-t border-[#e5dfd5] p-3 space-y-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#202124] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> Create New Document
          </button>
          <Link
            href="/pricing"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#5d6f61] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            <Crown className="h-3.5 w-3.5" /> Upgrade Now
          </Link>
        </div>
      </aside>

      {/* محتوای اصلی صفحه */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>

      <CreateDocModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}

export default AppShell;