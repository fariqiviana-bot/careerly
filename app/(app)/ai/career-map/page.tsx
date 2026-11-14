"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter } from "@/components/ui/drawer";
import { PageHeader, Field } from "@/components/shared";
import { Plus, Minus, SlidersHorizontal, RefreshCw } from "lucide-react";

const NODES = [
  { id: "n1", label: "Front End Developer", salary: "$101,000", fit: 82, x: 130, y: 90 },
  { id: "n2", label: "UX Engineer", salary: "$96,000", fit: 88, x: 620, y: 80 },
  { id: "n3", label: "IT Director", salary: "$125,000", fit: 54, x: 660, y: 300 },
  { id: "n4", label: "Design Lead", salary: "$110,000", fit: 76, x: 120, y: 310 },
  { id: "n5", label: "CTO", salary: "$160,000", fit: 41, x: 390, y: 370 },
];

export default function CareerMap() {
  const [zoom, setZoom] = useState(1);
  const [prefs, setPrefs] = useState({ goal: "advancement", balance: "healthy", income: "high", identity: "specialist" });
  const [seed, setSeed] = useState(0);

  return (
    <div>
      <PageHeader title="Career map" sub="Where your profile can take you — with fit and salary on every node." actions={<>
        <Drawer>
          <DrawerTrigger asChild><Button variant="outline" className="rounded-full"><SlidersHorizontal className="mr-1 h-4 w-4" />Preferences</Button></DrawerTrigger>
          <DrawerContent className="px-4">
            <DrawerHeader className="px-0 text-left"><DrawerTitle className="font-serif text-2xl">Adjust preferences</DrawerTitle></DrawerHeader>
            <div className="mx-auto grid w-full max-w-lg gap-4 pb-4">
              {([["goal", "Your goal", ["exploration", "advancement", "change"]], ["balance", "Work / life balance", ["chill", "healthy", "hustle"]], ["income", "Desired income", ["unimportant", "comfortable", "high"]], ["identity", "Desired identity", ["specialist", "generalist", "owner"]]] as const).map(([key, label, opts]) => (
                <Field key={key} label={label}>
                  <RadioGroup value={(prefs as any)[key]} onValueChange={(v) => setPrefs({ ...prefs, [key]: v })} className="flex flex-wrap gap-4">
                    {opts.map((o) => <label key={o} className="flex items-center gap-2 text-sm capitalize"><RadioGroupItem value={o} />{o}</label>)}
                  </RadioGroup>
                </Field>
              ))}
            </div>
            <DrawerFooter className="px-0"><Button onClick={() => { setSeed(seed + 1); toast.success("Map regenerated from your preferences"); }}>Submit</Button></DrawerFooter>
          </DrawerContent>
        </Drawer>
        <Button variant="outline" size="icon" className="rounded-full" onClick={() => setSeed(seed + 1)}><RefreshCw className="h-4 w-4" /></Button>
      </>} />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setZoom(Math.min(1.4, zoom + 0.1))}><Plus className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}><Minus className="h-4 w-4" /></Button>
        </div>
        <svg viewBox="0 0 800 440" className="w-full" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
          {NODES.map((n) => <line key={n.id} x1="400" y1="210" x2={n.x} y2={n.y} stroke="#c3cfc4" strokeWidth="2" strokeDasharray="4 4" />)}
          {NODES.map((n, i) => {
            const fit = Math.min(97, n.fit + ((seed * (i + 3)) % 9) - 4);
            return (
              <g key={n.id} className="cursor-pointer" onClick={() => toast.info(`${n.label} — fit ${fit}% · ${n.salary}`)}>
                <rect x={n.x - 85} y={n.y - 28} width="170" height="56" rx="14" fill="#eaf0ea" stroke="#bfcac0" />
                <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize="13" fontWeight="600" fill="#2b2f2a">{n.label}</text>
                <text x={n.x} y={n.y + 14} textAnchor="middle" fontSize="11" fill="#6d776d">{n.salary} · fit {fit}%</text>
              </g>
            );
          })}
          <circle cx="400" cy="210" r="46" fill="#e6b5a1" />
          <circle cx="400" cy="210" r="46" fill="none" stroke="#c98d72" strokeWidth="2" />
          <text x="400" y="206" textAnchor="middle" fontSize="13" fontWeight="700" fill="#5c3a2b">Viana</text>
          <text x="400" y="222" textAnchor="middle" fontSize="10" fill="#5c3a2b">You</text>
        </svg>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">Click a node for details · fits update when you change preferences.</p>
    </div>
  );
}