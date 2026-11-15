"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowLeft, Mail, MapPin, Phone, Sparkles } from "lucide-react";

export default function SharedDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const { docs } = useStore();
  const doc = docs.find((d) => d.id === id);

  useEffect(() => {
    if (doc && sp.get("print") === "1") {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [doc, sp]);

  if (!doc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="font-serif text-3xl">Document not found</h1>
        <p className="text-sm text-muted-foreground">This shared link may have been removed or unpublished.</p>
        <Button asChild className="mt-2 rounded-full"><Link href="/documents">Back to Careerly</Link></Button>
      </div>
    );
  }

  const c = doc.content;
  const details = c.extraDetails ?? {};

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:py-12">
      {/* Top Floating Action Bar (Hidden in Print) */}
      <div className="no-print mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-full border border-border bg-card/90 px-4 py-2.5 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href={`/editor/${doc.id}`}><ArrowLeft className="mr-1 h-4 w-4" />Back to editor</Link>
          </Button>
          <Badge variant="secondary" className="rounded-full capitalize">{doc.type}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="rounded-full" onClick={() => window.print()}>
            <Download className="mr-1.5 h-3.5 w-3.5" />Save as PDF
          </Button>
        </div>
      </div>

      {/* Main Portfolio / Resume View */}
      <div id="resume-print-area" className="mx-auto max-w-3xl rounded-3xl border border-border bg-white p-8 text-neutral-900 shadow-[0_20px_50px_rgba(43,47,42,0.06)] md:p-12" style={{ fontFamily: doc.font }}>
        <header className="border-b-2 pb-6" style={{ borderColor: doc.accent }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: doc.accent, fontFamily: doc.font }}>{c.name}</h1>
              <p className="mt-1 text-lg font-medium text-neutral-700">{c.role}</p>
            </div>
            {c.email && (
              <a href={`mailto:${c.email}`} className="no-print inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90" style={{ background: doc.accent }}>
                <Mail className="h-3.5 w-3.5" />Contact Me
              </a>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-500">
            {c.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{c.email}</span>}
            {c.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{c.phone}</span>}
            {c.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.location}</span>}
          </div>
        </header>

        {doc.type === "cover" || doc.type === "resignation" ? (
          <div className="mt-8 space-y-4 text-sm leading-relaxed text-neutral-700">
            <div><strong>To:</strong> {c.letter.to} ({c.letter.company})</div>
            <div className="text-base font-semibold text-neutral-900">{c.letter.subject}</div>
            <p className="whitespace-pre-wrap pt-2">{c.letter.body}</p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {c.summary && (
              <section>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: doc.accent }}>About</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{c.summary}</p>
              </section>
            )}

            {c.experience.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: doc.accent }}>Experience</h2>
                <div className="space-y-4">
                  {c.experience.map((e) => (
                    <div key={e.id} className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
                      <div className="flex flex-wrap justify-between gap-1 font-semibold text-neutral-900">
                        <span>{e.role} · <span className="font-normal text-neutral-600">{e.company}</span></span>
                        <span className="text-xs font-normal text-neutral-500">{e.period}</span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">{e.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-8 md:grid-cols-2">
              {c.education.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: doc.accent }}>Education</h2>
                  <div className="space-y-3 text-sm">
                    {c.education.map((e) => (
                      <div key={e.id} className="rounded-xl border border-neutral-100 p-3">
                        <div className="font-semibold text-neutral-900">{e.degree}</div>
                        <div className="text-neutral-600">{e.school}</div>
                        <div className="mt-0.5 text-xs text-neutral-400">{e.period}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {c.skills.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: doc.accent }}>Core Skills</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {c.skills.map((s) => (
                      <span key={s} className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">{s}</span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {c.extras?.map((sec) => {
              const text = details[sec];
              if (!text) return null;
              return (
                <section key={sec}>
                  <h2 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: doc.accent }}>{sec}</h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{text}</p>
                </section>
              );
            })}
          </div>
        )}

        <footer className="no-print mt-12 flex items-center justify-center gap-1.5 border-t border-neutral-100 pt-6 text-xs text-neutral-400">
          <Sparkles className="h-3.5 w-3.5" />Built with Careerly OS
        </footer>
      </div>
    </div>
  );
}