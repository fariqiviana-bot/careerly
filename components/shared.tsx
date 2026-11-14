"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { STATUS, type TrackStatus } from "@/lib/catalog";

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl md:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* Designjoy-style gradient panel — palette blobs + grain + optional glass children */
export function GradientPanel({ className, children, calm = false }: { className?: string; children: React.ReactNode; calm?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-cream", className)}>
      <div className="absolute -left-[15%] -top-[25%] h-[75%] w-[60%] rounded-full bg-peach-soft blur-3xl animate-blob-a" />
      <div className="absolute -right-[10%] top-[5%] h-[70%] w-[55%] rounded-full bg-peach blur-3xl opacity-80 animate-blob-b" />
      <div className="absolute -bottom-[30%] left-[10%] h-[80%] w-[60%] rounded-full bg-sage-soft blur-3xl animate-blob-c" />
      <div className="absolute -bottom-[20%] -right-[15%] h-[70%] w-[55%] rounded-full bg-sage blur-3xl opacity-70 animate-blob-a" />
      {!calm && <div className="noise absolute inset-0" />}
      <div className="relative">{children}</div>
    </div>
  );
}

export function ScoreRing({ value, size = 96, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 10) / 2, c = 2 * Math.PI * r;
  const color = value >= 75 ? "#4e8a5a" : value >= 50 ? "#b98a4e" : "#c05b49";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eaf0ea" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-semibold">{value}</div>
        {label && <div className="text-[10px] text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: TrackStatus }) {
  const s = STATUS[status];
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", s.chip)}><span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />{s.label}</span>;
}

export function EmptyState({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sage-line bg-card px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-mist text-primary">{icon}</div>
      <h3 className="text-xl">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{sub}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

/* Pattern library rule: Dialog on desktop, bottom Drawer on mobile — same content & order */
export function ResponsiveModal({ open, onOpenChange, title, description, children, footer, wide }: {
  open: boolean; onOpenChange: (b: boolean) => void; title: string; description?: string;
  children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  const desktop = useMediaQuery("(min-width: 768px)");
  if (desktop !== false) return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[85vh] overflow-y-auto", wide ? "max-w-2xl" : "max-w-lg")}>
        <DialogHeader><DialogTitle className="font-serif text-2xl">{title}</DialogTitle>{description && <DialogDescription>{description}</DialogDescription>}</DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4">
        <DrawerHeader className="px-0 text-left"><DrawerTitle className="font-serif text-2xl">{title}</DrawerTitle>{description && <DrawerDescription>{description}</DrawerDescription>}</DrawerHeader>
        <div className="max-h-[65vh] overflow-y-auto pb-2">{children}</div>
        {footer && <DrawerFooter className="px-0">{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
}

export function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}{required && <span className="ml-0.5 text-destructive">*</span>}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function DangerConfirm({ open, onOpenChange, title, desc, onConfirm }: { open: boolean; onOpenChange: (b: boolean) => void; title: string; desc: string; onConfirm: () => void }) {
  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title={title} description={desc}
      footer={<>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false); }}>Confirm</Button>
      </>}><div /></ResponsiveModal>
  );
}