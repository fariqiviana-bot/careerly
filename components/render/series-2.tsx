"use client";
import React from "react";
import { Ed, AddRow, Del } from "./editable";
const NAVY = "#1F3C88";
const TINT = "#DDE0F7";
const INK = "#202124";
const MUTED = "#5A6472";
const st = (o: React.CSSProperties) => o;
const uid = () => Math.random().toString(36).slice(2, 9);
function H({ children }: { children: React.ReactNode }) {
  return <div style={st({ fontSize: "8pt", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: NAVY, borderBottom: "0.3mm solid " + NAVY, paddingBottom: "1.1mm", marginBottom: "2.4mm" })}>{children}</div>;
}
export default function Series2({ doc, onPatch, vis }: { doc: any; onPatch: (c: any) => void; vis: Record<string, boolean> }) {
  const c = doc.content || {};
  const set = (k: string, v: any) => onPatch({ ...c, [k]: v });
  const arr = (k: string) => (c[k] || []) as any[];
  const setAt = (k: string, i: number, f: string, v: any) => { const a = arr(k).slice(); a[i] = { ...a[i], [f]: v }; set(k, a); };
  const addAt = (k: string, item: any) => set(k, [...arr(k), item]);
  const delAt = (k: string, i: number) => set(k, arr(k).filter((_, j) => j !== i));
  const skills = (c.skills || []) as string[];
  const bullets = (s: string) => (s || "").split("\n").filter((x) => x.trim().length > 0);
  return (
    <div className="resume-doc" style={st({ width: "210mm", minHeight: "297mm", background: "#fff", fontFamily: "Rubik, sans-serif", color: INK, display: "flex", flexDirection: "column", ["--ed-ring" as any]: NAVY, ["--ed-fill" as any]: "rgba(31,60,136,0.06)" })}>
      <div style={st({ height: "3.4mm", background: NAVY, flex: "0 0 auto" })} />
      <div style={st({ padding: "10mm 12.7mm 12.7mm", flex: 1, display: "flex", flexDirection: "column" })}>
        <div style={st({ textAlign: "center", marginBottom: "7mm" })}>
          <Ed v={c.name || ""} on={(v) => set("name", v)} ph="Your Name" style={st({ fontSize: "25pt", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: NAVY, lineHeight: 1.1 })} />
          <Ed v={c.role || ""} on={(v) => set("role", v)} ph="Your Profession" style={st({ fontSize: "8pt", fontWeight: 500, letterSpacing: "0.26em", textTransform: "uppercase", color: MUTED, marginTop: "2mm" })} />
        </div>
        <div style={st({ display: "grid", gridTemplateColumns: "62mm 1fr", gap: "8mm", flex: 1, alignItems: "stretch" })}>
          <div style={st({ background: TINT, padding: "6mm 5mm" })}>
            <H>Contact</H>
            <div style={st({ fontSize: "7.8pt", lineHeight: 1.85, marginBottom: "5mm" })}>
              {vis.phone !== false && <Ed v={c.phone || ""} on={(v) => set("phone", v)} ph="Phone" />}
              {vis.email !== false && <Ed v={c.email || ""} on={(v) => set("email", v)} ph="Email" style={st({ wordBreak: "break-all" })} />}
              {vis.link !== false && <Ed v={c.linkedin || ""} on={(v) => set("linkedin", v)} ph="linkedin.com/in/you" style={st({ wordBreak: "break-all" })} />}
              {vis.location !== false && <Ed v={c.location || ""} on={(v) => set("location", v)} ph="City, Country" />}
            </div>
            {vis.skills !== false && <>
              <H>Skills</H>
              <div style={st({ marginBottom: "5mm" })}>
                {skills.map((s, i) => (
                  <div key={i} style={st({ display: "flex", alignItems: "flex-start", gap: "1mm" })}>
                    <span style={st({ color: NAVY, fontSize: "7.8pt", lineHeight: 1.6 })}>•</span>
                    <Ed v={s} on={(v) => { const a = skills.slice(); a[i] = v; set("skills", a); }} ph="Skill" style={st({ flex: 1, fontSize: "7.8pt", lineHeight: 1.6 })} />
                    <Del on={() => set("skills", skills.filter((_, j) => j !== i))} tone={NAVY} />
                  </div>))}
                <AddRow label="Add skill" tone={NAVY} on={() => set("skills", [...skills, "New skill"])} />
              </div>
            </>}
            {vis.technical !== false && <>
              <H>Technical</H>
              <div style={st({ marginBottom: "5mm" })}>
                {arr("tools").map((t, i) => (
                  <div key={i} style={st({ display: "flex", alignItems: "flex-start", gap: "1mm" })}>
                    <span style={st({ color: NAVY, fontSize: "7.8pt", lineHeight: 1.6 })}>•</span>
                    <Ed v={typeof t === "string" ? t : t.name || ""} on={(v) => setAt("tools", i, "name", v)} ph="Tool" style={st({ flex: 1, fontSize: "7.8pt", lineHeight: 1.6 })} />
                    <Del on={() => delAt("tools", i)} tone={NAVY} />
                  </div>))}
                <AddRow label="Add tool" tone={NAVY} on={() => addAt("tools", { id: uid(), name: "Tool" })} />
              </div>
            </>}
            {vis.education !== false && <>
              <H>Education</H>
              {arr("education").map((e, i) => (
                <div key={i} style={st({ marginBottom: "3mm" })}>
                  <div style={st({ display: "flex", gap: "1mm" })}>
                    <Ed v={e.degree || ""} on={(v) => setAt("education", i, "degree", v)} ph="Degree" style={st({ flex: 1, fontSize: "7.8pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" })} />
                    <Del on={() => delAt("education", i)} tone={NAVY} />
                  </div>
                  <Ed v={e.school || ""} on={(v) => setAt("education", i, "school", v)} ph="Institution" style={st({ fontSize: "7.4pt", color: MUTED, marginTop: "0.6mm" })} />
                  <Ed v={e.period || ""} on={(v) => setAt("education", i, "period", v)} ph="Years" style={st({ fontSize: "7pt", color: MUTED })} />
                </div>))}
              <AddRow label="Add education" tone={NAVY} on={() => addAt("education", { id: uid(), degree: "Degree", school: "Institution", period: "Years" })} />
            </>}
            {vis.certifications !== false && <>
              <div style={st({ marginTop: "5mm" })}><H>Certifications</H></div>
              {arr("certifications").map((e, i) => (
                <div key={i} style={st({ marginBottom: "2.6mm", display: "flex", gap: "1mm" })}>
                  <div style={st({ flex: 1 })}>
                    <Ed v={e.name || ""} on={(v) => setAt("certifications", i, "name", v)} ph="Certification" style={st({ fontSize: "7.6pt", fontWeight: 700 })} />
                    <Ed v={e.issuer || ""} on={(v) => setAt("certifications", i, "issuer", v)} ph="Issuer · Year" style={st({ fontSize: "7.2pt", color: MUTED })} />
                  </div>
                  <Del on={() => delAt("certifications", i)} tone={NAVY} />
                </div>))}
              <AddRow label="Add certification" tone={NAVY} on={() => addAt("certifications", { id: uid(), name: "Certification", issuer: "Issuer · Year" })} />
            </>}
          </div>
          <div>
            {vis.summary !== false && <>
              <H>Professional Summary</H>
              <Ed multi v={c.summary || ""} on={(v) => set("summary", v)} ph="Two or three sentences on your experience, strongest skills and the role you want." style={st({ fontSize: "8.4pt", lineHeight: 1.6, marginBottom: "6mm" })} />
            </>}
            <H>Professional Experience</H>
            {arr("experience").map((e, i) => (
              <div key={i} style={st({ marginBottom: "5mm" })}>
                <div style={st({ display: "flex", justifyContent: "space-between", gap: "3mm", alignItems: "baseline" })}>
                  <Ed v={e.role || ""} on={(v) => setAt("experience", i, "role", v)} ph="Job Title" style={st({ flex: 1, fontSize: "8.6pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" })} />
                  <Ed v={e.period || ""} on={(v) => setAt("experience", i, "period", v)} ph="Dates" style={st({ fontSize: "7.2pt", color: MUTED, whiteSpace: "nowrap" })} />
                  <Del on={() => delAt("experience", i)} tone={NAVY} />
                </div>
                <Ed v={e.company || ""} on={(v) => setAt("experience", i, "company", v)} ph="Company, Location" style={st({ fontSize: "7.8pt", fontWeight: 500, color: MUTED, margin: "0.8mm 0 1.6mm" })} />
                {bullets(e.description).map((b, j) => (
                  <div key={j} style={st({ display: "flex", gap: "1.2mm", alignItems: "flex-start" })}>
                    <span style={st({ color: NAVY, fontSize: "8.2pt", lineHeight: 1.55 })}>•</span>
                    <Ed multi v={b} on={(v) => { const a = bullets(e.description); a[j] = v; setAt("experience", i, "description", a.filter((x) => x.trim()).join("\n")); }} ph="Achievement with a number" style={st({ flex: 1, fontSize: "8.2pt", lineHeight: 1.55, marginBottom: "0.8mm" })} />
                    <Del on={() => setAt("experience", i, "description", bullets(e.description).filter((_, k) => k !== j).join("\n"))} tone={NAVY} />
                  </div>))}
                <AddRow label="Add achievement" tone={NAVY} on={() => setAt("experience", i, "description", [...bullets(e.description), "Delivered a measurable result"].join("\n"))} />
              </div>))}
            <AddRow label="Add role" tone={NAVY} on={() => addAt("experience", { id: uid(), role: "Job Title", company: "Company, Location", period: "Dates", description: "Achievement with a number" })} />
            {vis.projects !== false && arr("projects").length > 0 && <>
              <div style={st({ marginTop: "6mm" })}><H>Projects</H></div>
              {arr("projects").map((p, i) => (
                <div key={i} style={st({ marginBottom: "2.6mm", display: "flex", gap: "1mm" })}>
                  <div style={st({ flex: 1, fontSize: "8.2pt", lineHeight: 1.55 })}>
                    <Ed v={p.name || p.title || ""} on={(v) => setAt("projects", i, "name", v)} ph="Project" style={st({ fontWeight: 700, display: "inline-block" })} />
                    <Ed multi v={p.description || ""} on={(v) => setAt("projects", i, "description", v)} ph="What you built and the outcome" />
                  </div>
                  <Del on={() => delAt("projects", i)} tone={NAVY} />
                </div>))}
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
