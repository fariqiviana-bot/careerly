"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { GradientPanel } from "@/components/shared";
import { FarnaviLogo } from "@/components/farnavi-logo";
import { LayoutDashboard, Files, LayoutTemplate, ScanSearch, Search, SquareKanban, Zap, MessagesSquare, Sparkles, Map, Linkedin, Briefcase, LifeBuoy, Settings, Bell, Menu, Crown, LogOut, ChevronLeft, Command, Home, Plus } from "lucide-react";

const NAV = [
  { group: "Main", items: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/documents", label: "Documents", icon: Files },
    { href: "/templates", label: "Templates", icon: LayoutTemplate },
    { href: "/checker", label: "ATS Checker", icon: ScanSearch },
  ]},
  { group: "Jobs", items: [
    { href: "/jobs", label: "Find Jobs", icon: Search },
    { href: "/tracker", label: "Job Tracker", icon: SquareKanban },
    { href: "/auto-apply", label: "Auto Apply", icon: Zap },
    { href: "/interviews", label: "Interviews", icon: MessagesSquare },
  ]},
  { group: "AI", items: [
    { href: "/ai", label: "AI Assistant", icon: Sparkles },
    { href: "/ai/career-map", label: "Career Map", icon: Map },
    { href: "/ai/linkedin", label: "LinkedIn Coach", icon: Linkedin },
  ]},
  { group: "Grow", items: [
    { href: "/tools", label: "Career Tools", icon: Briefcase },
    { href: "/help", label: "Help Center", icon: LifeBuoy },
  ]},
];
const TITLES: Record<string, string> = { "/": "Dashboard", "/documents": "Documents", "/templates": "Templates", "/checker": "ATS Checker", "/jobs": "Find Jobs", "/tracker": "Job Tracker", "/auto-apply": "Auto Apply", "/interviews": "Interviews", "/ai": "AI Assistant", "/ai/career-map": "Career Map", "/ai/linkedin": "LinkedIn Coach", "/tools": "Career Tools", "/pricing": "Plans & Pricing", "/settings": "Settings", "/help": "Help Center" };

function NavLinks({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 scrollbar-thin">
      {NAV.map((g) => (
        <div key={g.group}>
          {!collapsed && <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{g.group}</div>}
          <div className="space-y-0.5">
            {g.items.map((it) => {
              const active = path === it.href;
              const link = (
                <Link href={it.href} onClick={onNavigate} className={cn("flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors", active ? "bg-sage-mist font-medium text-primary" : "text-foreground/75 hover:bg-muted", collapsed && "justify-center px-0")}>
                  <it.icon className="h-[18px] w-[18px] shrink-0" />{!collapsed && it.label}
                </Link>
              );
              return collapsed ? (
                <Tooltip key={it.href}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{it.label}</TooltipContent></Tooltip>
              ) : <React.Fragment key={it.href}>{link}</React.Fragment>;
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function UserBlock({ collapsed }: { collapsed?: boolean }) {
  const { user , authenticated, signOut } = useStore();
  return (
    <div className={cn("flex items-center gap-3 px-4 py-4", collapsed && "justify-center px-0")}>
      <Avatar className="h-9 w-9 border border-sage-line"><AvatarFallback className="bg-peach text-accent-foreground text-sm">VF</AvatarFallback></Avatar>
      {!collapsed && <div className="min-w-0"><div className="truncate text-sm font-medium">{user.name}</div><div className="truncate text-xs text-muted-foreground">{user.target || "Set your target role"}</div></div>}
    </div>
  );
}

function UpgradeCard() {
  return (
    <GradientPanel className="mx-3 mb-3 p-4">
      <div className="glass rounded-xl p-3">
        <div className="flex items-center gap-2 text-sm font-semibold"><Crown className="h-4 w-4 text-accent-foreground" />Go Pro</div>
        <p className="mt-1 text-xs text-foreground/70">Unlimited docs, all templates, Auto Apply & full ATS reports.</p>
        <Button asChild size="sm" className="mt-3 w-full rounded-full"><Link href="/pricing">See plans</Link></Button>
      </div>
    </GradientPanel>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, docs, authenticated, signOut } = useStore();
  const isEditorRoute = path.startsWith("/editor");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [cmd, setCmd] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmd((v) => !v); } };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  }, []);

  const title = TITLES[path] ?? (isEditorRoute ? "Resume Studio" : "Farnavi");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-all md:flex", collapsed ? "w-[76px]" : "w-[264px]")}>
          <div className="flex items-center justify-between px-4 pt-4">
            <Link href="/" className="focus:outline-none">
              <FarnaviLogo collapsed={collapsed} size="md" />
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </Button>
          </div>
          <UserBlock collapsed={collapsed} />
          <NavLinks collapsed={collapsed} />
          {!collapsed ? <UpgradeCard /> : (
            <Tooltip><TooltipTrigger asChild><Button asChild variant="ghost" size="icon" className="mx-auto mb-3"><Link href="/pricing"><Crown className="h-4 w-4 text-accent-foreground" /></Link></Button></TooltipTrigger><TooltipContent side="right">Upgrade</TooltipContent></Tooltip>
          )}
          <div className={cn("border-t border-border p-3", collapsed && "flex justify-center")}>
            <Button asChild variant="ghost" size={collapsed ? "icon" : "default"} className={cn(!collapsed && "w-full justify-start gap-3")}>
              <Link href="/settings"><Settings className="h-[18px] w-[18px]" />{!collapsed && "Settings"}</Link>
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-card/85 px-4 backdrop-blur md:px-6">
            <Sheet open={mobileNav} onOpenChange={setMobileNav}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger>
              <SheetContent side="left" className="w-[290px] bg-sidebar p-0">
                <SheetTitle className="px-4 pt-4">
                  <FarnaviLogo size="md" />
                </SheetTitle>
                <UserBlock />
                <div className="flex h-[calc(100%-140px)] flex-col"><NavLinks onNavigate={() => setMobileNav(false)} /><UpgradeCard /></div>
              </SheetContent>
            </Sheet>
            <div className="font-serif text-xl md:text-2xl">{title}</div>
            <div className="ml-auto flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="hidden gap-2 rounded-full text-muted-foreground md:flex" onClick={() => setCmd(true)}>
                <Search className="h-3.5 w-3.5" />Search<kbd className="ml-1 flex items-center gap-0.5 rounded border border-border bg-muted px-1 text-[10px]"><Command className="h-2.5 w-2.5" />K</kbd>
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setCmd(true)}><Search className="h-5 w-5" /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="relative"><Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-peach" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel><DropdownMenuSeparator />
                  <DropdownMenuItem className="flex flex-col items-start gap-0.5"><span className="text-sm">3 new jobs match “Product Designer”</span><span className="text-xs text-muted-foreground">Job alert · 2h ago</span></DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-0.5"><span className="text-sm">Interview with Nova Labs tomorrow</span><span className="text-xs text-muted-foreground">Reminder · 5h ago</span></DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-0.5"><span className="text-sm">Your weekly career digest is ready</span><span className="text-xs text-muted-foreground">Digest · 1d ago</span></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild size="sm" className="hidden rounded-full md:flex"><Link href="/pricing"><Crown className="mr-1 h-3.5 w-3.5" />Upgrade</Link></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><Avatar className="h-8 w-8 border border-sage-line"><AvatarFallback className="bg-peach text-accent-foreground text-xs">VF</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel><div className="text-sm">{user.name}</div><div className="text-xs font-normal text-muted-foreground">{user.email}</div></DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/settings")}>Profile & Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/pricing")}>Plans <Badge variant="secondary" className="ml-auto">{user.plan}</Badge></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => (authenticated ? signOut() : router.push('/login'))}><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className={cn(
            "mx-auto w-full flex-1",
            isEditorRoute ? "max-w-[1600px] px-3 pb-16 pt-4 md:px-6 md:pb-8" : "max-w-[1200px] px-4 pb-24 pt-6 md:px-8 md:pb-10"
          )}>{children}</main>
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur md:hidden">
          {[{ href: "/", label: "Home", icon: Home }, { href: "/documents", label: "Docs", icon: Files }, { href: "/jobs", label: "Jobs", icon: Search }, { href: "/tracker", label: "Tracker", icon: SquareKanban }].map((it) => (
            <Link key={it.href} href={it.href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px]", path === it.href ? "text-primary" : "text-muted-foreground")}>
              <it.icon className="h-5 w-5" />{it.label}
            </Link>
          ))}
          <button onClick={() => setMobileNav(true)} className="flex flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground"><Plus className="h-5 w-5" />More</button>
        </nav>

        {/* Command palette */}
        <CommandDialog open={cmd} onOpenChange={setCmd}>
          <CommandInput placeholder="Search pages, documents, actions…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Pages">
              {NAV.flatMap((g) => g.items).map((it) => (
                <CommandItem key={it.href} onSelect={() => { router.push(it.href); setCmd(false); }}><it.icon className="mr-2 h-4 w-4" />{it.label}</CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Documents">
              {docs.map((d) => <CommandItem key={d.id} onSelect={() => { router.push(`/editor/${d.id}`); setCmd(false); }}><Files className="mr-2 h-4 w-4" />{d.title}</CommandItem>)}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </TooltipProvider>
  );
}