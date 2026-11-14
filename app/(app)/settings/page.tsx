"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PageHeader, ResponsiveModal, Field, ScoreRing, DangerConfirm } from "@/components/shared";
import { Plus, Trash2, Chrome, Linkedin, Smartphone, Sparkles, Lock, Globe } from "lucide-react";

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-[200px]"><div className="text-sm font-medium">{title}</div>{desc && <div className="text-xs text-muted-foreground">{desc}</div>}</div>{children}</div>;
}

export default function Settings() {
  const { user, setUser } = useStore();
  const [name, setName] = useState(user.name);
  const [emailModal, setEmailModal] = useState(false);
  const [del, setDel] = useState(false);
  const [delText, setDelText] = useState("");
  const [qa, setQa] = useState<{ q: string; a: string }[]>([]);
  const [prefs, setPrefs] = useState({ matches: true, ats: true, activity: true, news: false });

  return (
    <div>
      <PageHeader title="Settings" sub="Profile, career data, autofill and account — everything in one place." />
      <Tabs defaultValue="profile" orientation="vertical" className="gap-6 md:flex">
        <TabsList className="mb-4 flex h-auto w-full justify-start overflow-x-auto rounded-full scrollbar-thin md:mb-0 md:w-52 md:flex-col md:items-stretch md:rounded-2xl md:bg-card md:p-2 md:border md:border-border">
          {["profile", "career", "autofill", "preferences", "account", "integrations"].map((t) => (
            <TabsTrigger key={t} value={t} className="rounded-full capitalize md:justify-start md:rounded-xl">{t === "career" ? "Career profile" : t}</TabsTrigger>
          ))}
        </TabsList>

        <div className="min-w-0 flex-1">
          <TabsContent value="profile" className="mt-0 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16"><AvatarFallback className="bg-peach text-xl text-accent-foreground">VF</AvatarFallback></Avatar>
              <div><div className="font-medium">{user.name}</div><div className="text-sm text-muted-foreground">{user.email}</div><Badge variant="secondary" className="mt-1 rounded-full">{user.plan} plan</Badge></div>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Target role"><Input value={user.target} onChange={(e) => setUser({ target: e.target.value })} /></Field>
              <Field label="Phone"><Input placeholder="+98 …" /></Field>
              <Field label="Location"><Input placeholder="Tehran, Iran" /></Field>
            </div>
            <Button className="mt-4 rounded-full" onClick={() => { setUser({ name }); toast.success("Profile saved"); }}>Save changes</Button>
          </TabsContent>

          <TabsContent value="career" className="mt-0 space-y-4">
            <div className="flex items-center gap-5 rounded-2xl border border-border bg-card p-6">
              <ScoreRing value={user.completion} size={92} label="complete" />
              <div className="flex-1">
                <h2 className="text-xl">Career profile</h2>
                <div className="mt-2 space-y-1 text-sm">
                  <button className="block text-primary hover:underline" onClick={() => toast.info("Confirm your target role (+10%)")}>+10% · Confirm your target role</button>
                  <button className="block text-primary hover:underline" onClick={() => toast.info("Add your work experience (+40%)")}>+40% · Add your work experience</button>
                  <button className="block text-primary hover:underline" onClick={() => toast.info("Career Assessment opens (demo) (+45%)")}>+45% · Take the Career Assessment</button>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {["Career Insights", "Professional Pitch", "AI Cover Letter"].map((t) => (
                <div key={t} className="rounded-2xl border border-border bg-card p-5">
                  <Lock className="h-4 w-4 text-muted-foreground" /><div className="mt-2 text-sm font-medium">{t}</div>
                  <p className="mt-1 text-xs text-muted-foreground">Unlock with the Career Assessment.</p>
                  <Button variant="outline" size="sm" className="mt-3 w-full rounded-full" onClick={() => toast.info("Assessment required first")}>Start now</Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="autofill" className="mt-0 rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">These values override your resume when auto-filling application forms.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Authorized to work in the US?"><Select defaultValue="no"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></Field>
              <Field label="Require visa sponsorship?"><Select defaultValue="yes"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></Field>
              <Field label="Expected salary"><Input placeholder="$90,000" /></Field>
              <Field label="Notice period"><Input placeholder="2 weeks" /></Field>
              <Field label="Willing to relocate?"><Select defaultValue="yes"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></Field>
              <Field label="Gender identity (optional, EEO)"><Select><SelectTrigger><SelectValue placeholder="Prefer not to say" /></SelectTrigger><SelectContent><SelectItem value="f">Female</SelectItem><SelectItem value="m">Male</SelectItem><SelectItem value="na">Prefer not to say</SelectItem></SelectContent></Select></Field>
            </div>
            <Separator className="my-5" />
            <div className="flex items-center justify-between"><div className="text-sm font-medium">Custom questions</div><Button variant="outline" size="sm" className="rounded-full" onClick={() => setQa([...qa, { q: "", a: "" }])}><Plus className="mr-1 h-3.5 w-3.5" />Add question</Button></div>
            <div className="mt-3 space-y-2">
              {qa.map((x, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Question" value={x.q} onChange={(e) => setQa(qa.map((y, j) => j === i ? { ...y, q: e.target.value } : y))} />
                  <Input placeholder="Answer" value={x.a} onChange={(e) => setQa(qa.map((y, j) => j === i ? { ...y, a: e.target.value } : y))} />
                  <Button variant="ghost" size="icon" onClick={() => setQa(qa.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
            <Button className="mt-4 rounded-full" onClick={() => toast.success("Autofill saved")}>Save autofill</Button>
          </TabsContent>

          <TabsContent value="preferences" className="mt-0 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl">Email preferences</h2>
            <div className="divide-y divide-border">
              <Row title="Jobs matching your profile" desc="Fresh roles for your target"><Switch checked={prefs.matches} onCheckedChange={(b) => setPrefs({ ...prefs, matches: b })} /></Row>
              <Row title="ATS alerts & optimization" desc="Score changes and fixes"><Switch checked={prefs.ats} onCheckedChange={(b) => setPrefs({ ...prefs, ats: b })} /></Row>
              <Row title="Search activity & next actions" desc="Weekly nudges"><Switch checked={prefs.activity} onCheckedChange={(b) => setPrefs({ ...prefs, activity: b })} /></Row>
              <Row title="Product news & strategy" desc="Occasional updates"><Switch checked={prefs.news} onCheckedChange={(b) => setPrefs({ ...prefs, news: b })} /></Row>
            </div>
            <Separator className="my-2" />
            <Row title="Interface language"><Select defaultValue="en"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="fa">فارسی</SelectItem><SelectItem value="de">Deutsch</SelectItem></SelectContent></Select></Row>
            <Row title="Cookie preferences" desc="Analytics & advertising off by default"><Button variant="outline" size="sm" className="rounded-full" onClick={() => toast.success("Cookie preferences saved")}>Manage</Button></Row>
          </TabsContent>

          <TabsContent value="account" className="mt-0 rounded-2xl border border-border bg-card p-6">
            <div className="divide-y divide-border">
              <Row title="Email address" desc={user.email}><Button variant="outline" size="sm" className="rounded-full" onClick={() => setEmailModal(true)}>Change email</Button></Row>
              <Row title="Password" desc="No password set — you sign in with Google"><Button variant="outline" size="sm" className="rounded-full" onClick={() => toast.success("Password setup email sent")}>Set a password</Button></Row>
              <Row title="Sign out of all devices"><Button variant="outline" size="sm" className="rounded-full" onClick={() => toast.success("Signed out everywhere")}>Sign out all</Button></Row>
              <Row title="Delete account" desc="Permanently removes all documents and data"><Button variant="destructive" size="sm" className="rounded-full" onClick={() => setDel(true)}>Delete account</Button></Row>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="mt-0 grid gap-4 sm:grid-cols-2">
            {[
              { icon: Chrome, t: "2-in-1 Chrome Extension", d: "Save jobs & autofill applications. 10k users · 4.5★", a: "Add to Chrome" },
              { icon: Linkedin, t: "LinkedIn Import", d: "Convert your public profile into a resume.", a: "Import profile" },
              { icon: Sparkles, t: "Careerly GPT", d: "Use our assistant inside ChatGPT.", a: "Open GPT" },
              { icon: Smartphone, t: "Mobile App", d: "Edit and share anywhere — iOS & Android.", a: "Get the app" },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-border bg-card p-5">
                <c.icon className="h-5 w-5 text-primary" /><div className="mt-2 font-medium">{c.t}</div>
                <p className="mt-1 text-xs text-muted-foreground">{c.d}</p>
                <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => toast.success(`${c.a} (demo)`)}>{c.a}</Button>
              </div>
            ))}
            <div className="rounded-2xl border border-border bg-card p-5 sm:col-span-2">
              <div className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /><span className="font-medium">Connected accounts</span></div>
              <Row title="Google" desc={user.email}><Badge variant="secondary" className="rounded-full">Connected</Badge></Row>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <ResponsiveModal open={emailModal} onOpenChange={setEmailModal} title="Change email address"
        footer={<Button onClick={() => { toast.success("Confirmation sent to the new address"); setEmailModal(false); }}>Save changes</Button>}>
        <div className="space-y-4"><Field label="New email"><Input type="email" placeholder="new@email.com" /></Field><Field label="Confirm email"><Input type="email" /></Field></div>
      </ResponsiveModal>

      <DangerConfirm open={del && delText === "DELETE"} onOpenChange={(b) => !b && setDel(false)} title="Delete account?" desc="This is permanent. All documents, jobs and settings will be erased." onConfirm={() => toast.success("Account deletion scheduled (demo)")} />
      <ResponsiveModal open={del && delText !== "DELETE"} onOpenChange={(b) => { if (!b) { setDel(false); setDelText(""); } }} title="Delete account" description="Type DELETE to confirm."
        footer={<Button variant="destructive" disabled={delText !== "DELETE"} onClick={() => { toast.success("Account deletion scheduled (demo)"); setDel(false); setDelText(""); }}>Keep account? No — delete</Button>}>
        <Input value={delText} onChange={(e) => setDelText(e.target.value)} placeholder="DELETE" />
      </ResponsiveModal>
    </div>
  );
}