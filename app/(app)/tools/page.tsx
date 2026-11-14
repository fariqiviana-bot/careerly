"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { COACHES, CHAPTERS } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader, Field, ResponsiveModal, StatCard } from "@/components/shared";
import { NumberTicker } from "@/components/magicui";
import { DollarSign, Send, GraduationCap, Users } from "lucide-react";

export default function Tools() {
  const [salary, setSalary] = useState({ title: "", location: "", base: "" });
  const [estimate, setEstimate] = useState(false);
  const [dist, setDist] = useState({ name: "Viana Fariqi", email: "fariqiviana@gmail.com" });
  const [lessons, setLessles] = useState<Record<string, boolean>>({});
  const [book, setBook] = useState<(typeof COACHES)[0] | null>(null);
  const total = CHAPTERS.reduce((a, c) => a + c.lessons.length, 0);
  const doneN = Object.values(lessons).filter(Boolean).length;

  return (
    <div>
      <PageHeader title="Career tools" sub="Salary insight, recruiter distribution, learning paths and human coaching." />
      <Tabs defaultValue="salary">
        <TabsList className="mb-6 w-full justify-start overflow-x-auto rounded-full scrollbar-thin md:w-auto">
          <TabsTrigger value="salary" className="rounded-full"><DollarSign className="mr-1 h-4 w-4" />Salary Analyzer</TabsTrigger>
          <TabsTrigger value="distribution" className="rounded-full"><Send className="mr-1 h-4 w-4" />Resume Distribution</TabsTrigger>
          <TabsTrigger value="learning" className="rounded-full"><GraduationCap className="mr-1 h-4 w-4" />Learning</TabsTrigger>
          <TabsTrigger value="coaching" className="rounded-full"><Users className="mr-1 h-4 w-4" />Coaching</TabsTrigger>
        </TabsList>

        <TabsContent value="salary">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl">Offer details</h2>
              <div className="mt-4 space-y-4">
                <Field label="Job title" required><Input value={salary.title} onChange={(e) => setSalary({ ...salary, title: e.target.value })} /></Field>
                <Field label="Location"><Input value={salary.location} onChange={(e) => setSalary({ ...salary, location: e.target.value })} /></Field>
                <Field label="Base salary (annual)"><Input value={salary.base} onChange={(e) => setSalary({ ...salary, base: e.target.value })} placeholder="$85,000" /></Field>
                <Button className="w-full rounded-full" disabled={!salary.title} onClick={() => setEstimate(true)}>Analyze offer</Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              {estimate ? (
                <>
                  <h2 className="text-xl">Market estimate</h2>
                  <div className="mt-4 text-3xl font-semibold">$78k – $104k</div>
                  <p className="mt-1 text-sm text-muted-foreground">Median $91k for {salary.title} · based on 1,240 data points</p>
                  <div className="relative mt-6 h-3 rounded-full bg-sage-mist"><div className="absolute left-[20%] right-[20%] h-3 rounded-full bg-sage-soft" /><div className="absolute left-[46%] top-1/2 h-5 w-1 -translate-y-1/2 rounded bg-peach" /></div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>$60k</span><span>your offer</span><span>$120k</span></div>
                  <p className="mt-4 rounded-xl bg-sage-mist p-3 text-sm">Your offer sits near the median. Negotiating to $95k is realistic given your 4+ years.</p>
                </>
              ) : <div className="flex h-full items-center justify-center py-10 text-sm text-muted-foreground">Fill the offer details to see your market range.</div>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between"><h2 className="text-xl">We connect you with recruiters</h2><Badge className="rounded-full bg-accent text-accent-foreground hover:bg-accent"><NumberTicker value={1000} />+ matched</Badge></div>
            <p className="mt-1 text-sm text-muted-foreground">We send your resume directly to recruiters hiring for your target role.</p>
            <div className="mt-4 space-y-4">
              <Field label="Name"><Input value={dist.name} onChange={(e) => setDist({ ...dist, name: e.target.value })} /></Field>
              <Field label="Email"><Input value={dist.email} onChange={(e) => setDist({ ...dist, email: e.target.value })} /></Field>
              <Button className="w-full rounded-full" onClick={() => toast.success("Distribution started — first batch goes out today")}>Start distributing</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="learning">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex justify-between text-sm"><span className="font-medium">Job Search Method — The Master Plan</span><span>{doneN}/{total} lessons</span></div>
              <Progress value={(doneN / total) * 100} className="mt-2 h-2" />
            </div>
            <Accordion type="multiple" className="rounded-2xl border border-border bg-card px-5">
              {CHAPTERS.map((c, ci) => (
                <AccordionItem key={c.title} value={c.title}>
                  <AccordionTrigger className="font-medium">{ci + 1}. {c.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pb-2">
                      {c.lessons.map((l) => {
                        const key = `${ci}-${l}`;
                        return <label key={key} className="flex items-center gap-3 rounded-lg p-2 text-sm hover:bg-muted"><Checkbox checked={!!lessons[key]} onCheckedChange={(b) => setLessles({ ...lessons, [key]: !!b })} />{l}</label>;
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </TabsContent>

        <TabsContent value="coaching">
          <div className="grid gap-4 sm:grid-cols-3">
            {COACHES.map((c) => (
              <div key={c.name} className="rounded-2xl border border-border bg-card p-5 text-center">
                <Avatar className="mx-auto h-14 w-14"><AvatarFallback className="bg-sage-soft text-secondary-foreground">{c.name.split(" ").map((x) => x[0]).join("")}</AvatarFallback></Avatar>
                <div className="mt-3 font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.role}</div>
                <Badge variant="secondary" className="mt-2 rounded-full">{c.tag}</Badge>
                <div className="mt-3 text-2xl font-semibold">${c.price}</div>
                <Button className="mt-3 w-full rounded-full" onClick={() => setBook(c)}>Book a coach</Button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Human proofreading also available — $26/resume, ready in 2 business days. <Button variant="link" className="h-auto p-0" onClick={() => toast.success("Proofreading order started (demo)")}>Order</Button></p>
        </TabsContent>
      </Tabs>

      <ResponsiveModal open={!!book} onOpenChange={(b) => !b && setBook(null)} title={`Book ${book?.name ?? ""}`} description={`${book?.tag} package · $${book?.price}`}
        footer={<Button onClick={() => { toast.success("Session requested — check your email"); setBook(null); }}>Request session</Button>}>
        <div className="space-y-4"><Field label="Preferred date"><Input type="date" /></Field><Field label="What do you want to work on?"><Input placeholder="Resume, interviews, negotiation…" /></Field></div>
      </ResponsiveModal>
    </div>
  );
}