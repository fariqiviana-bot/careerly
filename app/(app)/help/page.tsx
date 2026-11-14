"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { FAQ } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/shared";
import { Search, LifeBuoy, MessageCircle, BookOpen } from "lucide-react";

const POSTS = ["Kickresume vs LinkedIn: The Full Comparison", "How to Get a Job With No Experience in 2026", "How Long Does It Take to Hear Back From a Job?", "How to Prepare for a Phone Interview"];

export default function Help() {
  const [q, setQ] = useState("");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Help center" sub="Guides for resumes, cover letters, jobs, tracker, interviews and billing." />
      <div className="relative mb-6"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help articles…" /></div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {FAQ.map((c) => (
          <div key={c.cat} className="rounded-2xl border border-border bg-card p-5">
            <BookOpen className="h-5 w-5 text-primary" />
            <div className="mt-2 text-sm font-medium">{c.cat}</div>
            <Badge variant="secondary" className="mt-1 rounded-full">{c.count} articles</Badge>
          </div>
        ))}
      </div>

      <Accordion type="multiple" className="rounded-2xl border border-border bg-card px-5">
        {FAQ.flatMap((c) => c.items).filter((i) => i.toLowerCase().includes(q.toLowerCase())).map((item) => (
          <AccordionItem key={item} value={item}>
            <AccordionTrigger className="text-sm font-medium">{item}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">Step-by-step guide (demo). Open the related page from the sidebar — every feature has inline hints too.</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <MessageCircle className="h-5 w-5 text-primary" /><div className="mt-2 font-medium">Still stuck?</div>
          <p className="mt-1 text-xs text-muted-foreground">Chat with us — average reply under 5 minutes.</p>
          <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => toast.success("Support chat opened (demo)")}>Contact us</Button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <LifeBuoy className="h-5 w-5 text-primary" /><div className="mt-2 font-medium">From the blog</div>
          <ul className="mt-2 space-y-1.5">{POSTS.map((p) => <li key={p}><button className="text-left text-xs text-primary hover:underline" onClick={() => toast.info("Article (demo)")}>{p}</button></li>)}</ul>
        </div>
      </div>
    </div>
  );
}