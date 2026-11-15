"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Sparkles, Upload, Linkedin, LayoutGrid, Check, ArrowRight,
  ArrowLeft, Loader2, Search, FileCheck2, Mail
} from "lucide-react";
import { useStore, baseContent, defaultSettings, uid } from "@/lib/store";
import { TEMPLATES, COVER_TEMPLATES, RESUME_EXAMPLES } from "@/lib/catalog";
import { ResumeMiniPreview } from "./resume-mini-preview";

export type StartMethod = "menu" | "scratch" | "ai" | "upload" | "linkedin" | "example";

export function CreateDocModal({
  open,
  onClose,
  initialType = "resume",
  initialMethod = "menu",
}: {
  open: boolean;
  onClose: () => void;
  initialType?: "resume" | "cover";
  initialMethod?: StartMethod;
}) {
  const router = useRouter();
  const { docs, jobs, addDoc, setUser } = useStore();

  const [docType, setDocType] = useState<"resume" | "cover">(initialType);
  const [method, setMethod] = useState<StartMethod>(initialMethod);

  // استیت‌های ساخت رزومه
  const [selectedTpl, setSelectedTpl] = useState<string>(TEMPLATES[0].id);
  const [pageSize, setPageSize] = useState<"A4" | "Letter">("A4");
  const [docTitle, setDocTitle] = useState<string>("");

  // استیت AI Resume
  const [aiRole, setAiRole] = useState<string>("Product Designer");
  const [aiSeniority, setAiSeniority] = useState<string>("Mid-Senior");
  const [aiSkills, setAiSkills] = useState<string>("Figma, Design Systems, Prototyping, User Research");
  const [generating, setGenerating] = useState(false);

  // استیت Upload Resume
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [uploadRawText, setUploadRawText] = useState<string>("");

  // استیت LinkedIn Import
  const [linkedinUrl, setLinkedinUrl] = useState<string>("");

  // استیت Examples
  const [exampleQuery, setExampleQuery] = useState<string>("");

  // استیت‌های ویزارد ۳ مرحله‌ای Cover Letter (الگوی Enhancv)
  const [coverStep, setCoverStep] = useState<1 | 2 | 3>(1);
  const [pickedResumeId, setPickedResumeId] = useState<string>(
    docs.find((d) => d.type === "resume" || d.type === "tailored")?.id || "d1"
  );
  const [coverJobTitle, setCoverJobTitle] = useState<string>("Marketing Manager");
  const [coverCompany, setCoverCompany] = useState<string>("Telgorithm");
  const [coverJobDesc, setCoverJobDesc] = useState<string>("");
  const [selectedCoverTpl, setSelectedCoverTpl] = useState<string>(COVER_TEMPLATES[0].pairedResumeId);

  React.useEffect(() => {
    if (open) {
      setDocType(initialType);
      setMethod(initialMethod);
      setCoverStep(1);
    }
  }, [open, initialType, initialMethod]);

  if (!open) return null;

  const resumesList = docs.filter((d) => d.type === "resume" || d.type === "tailored");

  // ۱. شروع از صفر
  const handleCreateScratch = () => {
    const tpl = TEMPLATES.find((t) => t.id === selectedTpl) || TEMPLATES[0];
    const d = addDoc("resume", docTitle.trim() || `Viana Fariqi — ${tpl.name} Resume`, {
      template: tpl.id,
      accent: tpl.accent,
      font: tpl.headingFont,
      secondaryFont: tpl.bodyFont,
      settings: { ...defaultSettings(tpl.twoCol), pageSize },
    });
    onClose();
    router.push(`/editor/${d.id}`);
  };

  // ۲. ساخت با هوش مصنوعی
  const handleCreateAI = () => {
    setGenerating(true);
    setTimeout(() => {
      const tpl = TEMPLATES.find((t) => t.id === selectedTpl) || TEMPLATES[0];
      const base = baseContent();
      const skillsArr = aiSkills.split(",").map((s) => s.trim()).filter(Boolean);
      const customContent = {
        ...base,
        role: aiRole || "Product Designer",
        summary: `${aiSeniority} ${aiRole} with proven expertise in ${skillsArr.slice(0, 3).join(", ")}. Adept at translating complex business requirements into measurable outcomes and high-impact deliverables.`,
        skills: skillsArr.length > 0 ? skillsArr : base.skills,
        experience: [
          {
            id: uid(),
            role: aiRole,
            company: "Rangin Agency",
            location: "Tehran",
            period: "Jan 2023 — Present",
            current: true,
            description: `Spearheaded core ${aiRole} initiatives utilizing ${skillsArr[0] || "modern workflows"}, lifting key performance metrics by 24% across 3 quarters.`,
          },
          ...base.experience.slice(1),
        ],
      };
      const d = addDoc("resume", `${aiRole} — AI Resume (${tpl.name})`, {
        template: tpl.id,
        accent: tpl.accent,
        font: tpl.headingFont,
        secondaryFont: tpl.bodyFont,
        settings: { ...defaultSettings(tpl.twoCol), pageSize },
        content: customContent,
      });
      setGenerating(false);
      onClose();
      router.push(`/editor/${d.id}`);
    }, 900);
  };

  // ۳. آپلود فایل رزومه (PDF / DOCX)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const txt = typeof reader.result === "string" ? reader.result : "";
      setUploadRawText(txt.slice(0, 600));
    };
    reader.readAsText(file);
  };

  const handleConfirmUpload = () => {
    if (!uploadFileName) return;
    const tpl = TEMPLATES.find((t) => t.id === selectedTpl) || TEMPLATES[0];
    const cleanTitle = uploadFileName.replace(/\.(pdf|docx|doc)$/i, "");
    const base = baseContent();
    const d = addDoc("resume", `${cleanTitle} (Reformatted)`, {
      template: tpl.id,
      accent: tpl.accent,
      font: tpl.headingFont,
      secondaryFont: tpl.bodyFont,
      settings: { ...defaultSettings(tpl.twoCol), pageSize },
      content: {
        ...base,
        summary:
          uploadRawText && uploadRawText.length > 40 && !uploadRawText.includes("%PDF")
            ? uploadRawText.slice(0, 350)
            : base.summary,
      },
    });
    setUser({ resumeUploaded: true });
    onClose();
    router.push(`/editor/${d.id}`);
  };

  // ۴. ایمپورت از لینکدین
  const isLinkedinValid = linkedinUrl.trim().toLowerCase().includes("linkedin.com/in/");
  const handleLinkedinConvert = () => {
    if (!isLinkedinValid) return;
    const slug = linkedinUrl.split("linkedin.com/in/")[1]?.replace(/\/$/, "") || "viana-fariqi";
    const tpl = TEMPLATES.find((t) => t.id === selectedTpl) || TEMPLATES[0];
    const base = baseContent();
    const d = addDoc("resume", `LinkedIn Import (${slug})`, {
      template: tpl.id,
      accent: tpl.accent,
      font: tpl.headingFont,
      secondaryFont: tpl.bodyFont,
      settings: { ...defaultSettings(tpl.twoCol), pageSize },
      content: { ...base, linkedin: linkedinUrl.trim() },
    });
    onClose();
    router.push(`/editor/${d.id}`);
  };

  // ۵. ساخت از روی نمونه آماده (Resume Example)
  const handleUseExample = (ex: (typeof RESUME_EXAMPLES)[number]) => {
    const tpl = TEMPLATES.find((t) => t.id === ex.template) || TEMPLATES[0];
    const base = baseContent();
    const d = addDoc("resume", `${ex.role} — Sample Resume`, {
      template: tpl.id,
      accent: tpl.accent,
      font: tpl.headingFont,
      secondaryFont: tpl.bodyFont,
      settings: { ...defaultSettings(tpl.twoCol), pageSize },
      content: {
        ...base,
        role: ex.role,
        summary: ex.summary,
        skills: ex.skills,
      },
    });
    onClose();
    router.push(`/editor/${d.id}`);
  };

  // ۶. ساخت کاورلتر با AI (ویزارد ۳ مرحله‌ای Enhancv)
  const handleGenerateCoverAI = () => {
    setCoverStep(3);
    setTimeout(() => {
      const sourceResume = docs.find((d) => d.id === pickedResumeId) || docs[0];
      const tplId = sourceResume?.template || selectedCoverTpl || "editorial-11";
      const tpl = TEMPLATES.find((t) => t.id === tplId) || TEMPLATES[0];
      const base = sourceResume ? { ...sourceResume.content } : baseContent();

      const generatedBody = `Dear Hiring Manager,\n\nI am writing to apply for the ${coverJobTitle} position at ${coverCompany}. Building on my background as a ${base.role}—where I ${base.experience[0]?.description?.toLowerCase() || "delivered measurable product outcomes"}—I am excited to bring my expertise in ${base.skills.slice(0, 4).join(", ")} to your team.\n\n${coverJobDesc ? "Having reviewed your requirements closely, my track record aligns directly with your goals for scalable execution and cross-functional impact.\n\n" : ""}Thank you for considering my application. I look forward to discussing how I can contribute to ${coverCompany}.\n\nSincerely,\n${base.name}`;

      const d = addDoc("cover", `Cover Letter — ${coverCompany} (${coverJobTitle})`, {
        template: tpl.id,
        accent: tpl.accent,
        font: tpl.headingFont,
        secondaryFont: tpl.bodyFont,
        content: {
          ...base,
          role: coverJobTitle,
          letter: {
            to: "Hiring Manager",
            company: coverCompany,
            subject: `Application for ${coverJobTitle}`,
            body: generatedBody,
          },
        },
      });
      onClose();
      router.push(`/editor/${d.id}`);
    }, 1000);
  };

  const handleCreateBlankCover = (pairedResumeTplId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === pairedResumeTplId) || TEMPLATES[0];
    const d = addDoc("cover", `New Cover Letter (${tpl.name})`, {
      template: tpl.id,
      accent: tpl.accent,
      font: tpl.headingFont,
      secondaryFont: tpl.bodyFont,
    });
    onClose();
    router.push(`/editor/${d.id}`);
  };

  const filteredExamples = RESUME_EXAMPLES.filter(
    (ex) =>
      !exampleQuery.trim() ||
      ex.role.toLowerCase().includes(exampleQuery.toLowerCase()) ||
      ex.category.toLowerCase().includes(exampleQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[#D8CFC2] bg-[#FCFBF8] p-6 shadow-2xl text-[#202124]">
        {/* هدر مودال و سوئیچ بین Resume و Cover Letter */}
        <div className="flex items-center justify-between border-b border-[#e5dfd5] pb-4 mb-5">
          <div className="flex items-center gap-3">
            {method !== "menu" && docType === "resume" && (
              <button
                onClick={() => setMethod("menu")}
                className="rounded-lg border border-[#D8CFC2] bg-[#F7F4EE] p-1.5 text-[#706A62] hover:text-[#202124]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {docType === "cover"
                  ? "Create your cover letter"
                  : method === "menu"
                  ? "How do you want to start?"
                  : method === "scratch"
                  ? "Choose a template & paper size"
                  : method === "ai"
                  ? "Create with AI assistance"
                  : method === "upload"
                  ? "Upload your existing resume"
                  : method === "linkedin"
                  ? "Import from LinkedIn"
                  : "Start from a proven resume example"}
              </h2>
              <p className="text-xs text-[#706A62]">
                {docType === "cover"
                  ? "Most people start with AI — tailored to your resume and target job in 30 seconds."
                  : "Select your preferred workflow to build an ATS-ready Farnavi document."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[#D8CFC2] bg-[#F7F4EE] p-0.5 text-xs">
              <button
                onClick={() => { setDocType("resume"); setMethod("menu"); }}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  docType === "resume" ? "bg-[#202124] text-white" : "text-[#706A62]"
                }`}
              >
                Resume
              </button>
              <button
                onClick={() => { setDocType("cover"); setCoverStep(1); }}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  docType === "cover" ? "bg-[#202124] text-white" : "text-[#706A62]"
                }`}
              >
                Cover Letter
              </button>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg px-2.5 py-1 text-sm text-[#706A62] hover:bg-[#F7F4EE] hover:text-[#202124]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* =================== حالت ۱: ساخت کاورلتر (ویزارد Enhancv + Blank) =================== */}
        {docType === "cover" ? (
          <div>
            {coverStep === 1 && (
              <div className="space-y-5">
                <div className="rounded-xl border border-[#5d6f61]/30 bg-[#5d6f61]/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5d6f61] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      <Sparkles className="h-3 w-3" /> Recommended · Step 1 of 3
                    </span>
                    <span className="text-xs text-[#706A62]">Let AI write it for you</span>
                  </div>
                  <h3 className="mt-2 font-semibold text-sm">Pick the resume you&apos;re applying with</h3>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-52 overflow-y-auto">
                    {resumesList.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setPickedResumeId(r.id)}
                        className={`cursor-pointer rounded-xl border p-2.5 transition flex items-center gap-3 ${
                          pickedResumeId === r.id
                            ? "border-[#202124] bg-white shadow-sm ring-1 ring-[#202124]"
                            : "border-[#D8CFC2] bg-[#F7F4EE]/60 hover:bg-white"
                        }`}
                      >
                        <ResumeMiniPreview doc={r} className="w-11 shrink-0 rounded-xs" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold">{r.title}</div>
                          <div className="text-[11px] text-[#706A62]">{r.content.role}</div>
                          <div className="mt-1 inline-block rounded-xs bg-[#F7F4EE] px-1.5 py-0.5 text-[10px] font-medium text-[#5d6f61]">
                            Score {r.score}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setCoverStep(2)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#202124] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                    >
                      Next: Target Job <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* شروع خالی با یکی از ۴ قالب کاورلتر */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#706A62] mb-2.5">
                    Or start blank with a matched Cover Letter template
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {COVER_TEMPLATES.map((ct) => (
                      <div
                        key={ct.id}
                        onClick={() => handleCreateBlankCover(ct.pairedResumeId)}
                        className="group cursor-pointer rounded-xl border border-[#D8CFC2] bg-white p-2.5 hover:border-[#202124] transition"
                      >
                        <ResumeMiniPreview templateId={ct.pairedResumeId} type="cover" className="w-full mb-2 rounded-xs" />
                        <div className="text-xs font-semibold group-hover:text-[#5d6f61]">{ct.name}</div>
                        <div className="text-[10px] text-[#706A62] line-clamp-1">Series {ct.series}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {coverStep === 2 && (
              <div className="space-y-4">
                <div className="text-xs font-semibold text-[#5d6f61]">Step 2 of 3 · What job are you applying for?</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Target Job Title</label>
                    <input
                      value={coverJobTitle}
                      onChange={(e) => setCoverJobTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#D8CFC2] bg-white px-3 py-2 text-sm"
                      placeholder="e.g. Product Designer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Company Name</label>
                    <input
                      value={coverCompany}
                      onChange={(e) => setCoverCompany(e.target.value)}
                      className="w-full rounded-xl border border-[#D8CFC2] bg-white px-3 py-2 text-sm"
                      placeholder="e.g. Telgorithm"
                    />
                  </div>
                </div>

                {jobs.length > 0 && (
                  <div>
                    <div className="text-[11px] text-[#706A62] mb-1.5">Quick-fill from open jobs:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {jobs.slice(0, 4).map((j) => (
                        <button
                          key={j.id}
                          type="button"
                          onClick={() => {
                            setCoverJobTitle(j.title);
                            setCoverCompany(j.company);
                            setCoverJobDesc(j.summary);
                          }}
                          className="rounded-lg border border-[#D8CFC2] bg-[#F7F4EE] px-2.5 py-1 text-xs hover:border-[#202124]"
                        >
                          {j.title} @ {j.company}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium mb-1">Job Description / Key Requirements (Optional)</label>
                  <textarea
                    rows={3}
                    value={coverJobDesc}
                    onChange={(e) => setCoverJobDesc(e.target.value)}
                    className="w-full rounded-xl border border-[#D8CFC2] bg-white p-3 text-xs"
                    placeholder="Paste job requirements to tailor your cover letter..."
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setCoverStep(1)}
                    className="rounded-xl border border-[#D8CFC2] px-4 py-2 text-xs font-medium"
                  >
                    Back
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerateCoverAI}
                      className="rounded-xl border border-[#D8CFC2] bg-[#F7F4EE] px-4 py-2 text-xs font-medium"
                    >
                      Skip This Step
                    </button>
                    <button
                      onClick={handleGenerateCoverAI}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#202124] px-5 py-2 text-xs font-semibold text-white"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Generate Cover Letter
                    </button>
                  </div>
                </div>
              </div>
            )}

            {coverStep === 3 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#5d6f61] mb-3" />
                <div className="text-base font-semibold">Generating cover letter...</div>
                <p className="text-xs text-[#706A62] mt-1">
                  Matching typography & achievements for {coverJobTitle} at {coverCompany}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* =================== حالت ۲: ۵ مسیر استاندارد ساخت رزومه (ایستگاه ۲) =================== */
          <div>
            {method === "menu" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setMethod("scratch")}
                  className="flex items-start gap-3.5 rounded-xl border border-[#D8CFC2] bg-white p-4 text-left hover:border-[#202124] hover:shadow-sm transition"
                >
                  <div className="rounded-xl bg-[#F7F4EE] p-2.5 text-[#202124]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Create new resume</div>
                    <p className="text-xs text-[#706A62] mt-0.5">
                      Start blank with our 4 signature editorial & ATS template suites in A4 or US Letter.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setMethod("ai")}
                  className="flex items-start gap-3.5 rounded-xl border border-[#5d6f61]/40 bg-[#5d6f61]/5 p-4 text-left hover:border-[#5d6f61] hover:shadow-sm transition"
                >
                  <div className="rounded-xl bg-[#5d6f61] p-2.5 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Create with AI assistance</span>
                      <span className="rounded-full bg-[#5d6f61] px-2 py-0.5 text-[10px] font-semibold text-white">Fast</span>
                    </div>
                    <p className="text-xs text-[#706A62] mt-0.5">
                      Enter your target role & skills—AI writes your summary and quantified bullet points.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setMethod("upload")}
                  className="flex items-start gap-3.5 rounded-xl border border-[#D8CFC2] bg-white p-4 text-left hover:border-[#202124] hover:shadow-sm transition"
                >
                  <div className="rounded-xl bg-[#F7F4EE] p-2.5 text-[#202124]">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Upload existing resume</div>
                    <p className="text-xs text-[#706A62] mt-0.5">
                      Drag & drop your PDF or DOCX (up to 10MB)—we&apos;ll reformat it into a template instantly.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setMethod("linkedin")}
                  className="flex items-start gap-3.5 rounded-xl border border-[#D8CFC2] bg-white p-4 text-left hover:border-[#202124] hover:shadow-sm transition"
                >
                  <div className="rounded-xl bg-[#F7F4EE] p-2.5 text-[#5b7a8c]">
                    <Linkedin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Create with LinkedIn profile</div>
                    <p className="text-xs text-[#706A62] mt-0.5">
                      Paste your public LinkedIn profile URL and convert your experience into a resume.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setMethod("example")}
                  className="sm:col-span-2 flex items-start gap-3.5 rounded-xl border border-[#D8CFC2] bg-white p-4 text-left hover:border-[#202124] hover:shadow-sm transition"
                >
                  <div className="rounded-xl bg-[#F7F4EE] p-2.5 text-[#706A62]">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Create from example</div>
                    <p className="text-xs text-[#706A62] mt-0.5">
                      Browse role-specific resume examples pre-filled with recruiter-approved phrasing.
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* مسیر ۱: شروع از صفر با انتخاب قالب و سایز */}
            {method === "scratch" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <input
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Document title (e.g. Viana Fariqi — Product Designer)"
                    className="flex-1 rounded-xl border border-[#D8CFC2] bg-white px-3.5 py-2 text-xs"
                  />
                  <div className="flex items-center gap-1.5 rounded-xl border border-[#D8CFC2] bg-[#F7F4EE] p-1 text-xs">
                    <button
                      onClick={() => setPageSize("A4")}
                      className={`rounded-lg px-3 py-1 font-medium ${pageSize === "A4" ? "bg-[#202124] text-white" : "text-[#706A62]"}`}
                    >
                      A4 (8.27&quot; × 11.69&quot;)
                    </button>
                    <button
                      onClick={() => setPageSize("Letter")}
                      className={`rounded-lg px-3 py-1 font-medium ${pageSize === "Letter" ? "bg-[#202124] text-white" : "text-[#706A62]"}`}
                    >
                      US Letter
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-0.5">
                  {TEMPLATES.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTpl(t.id)}
                      className={`cursor-pointer rounded-xl border p-2 transition ${
                        selectedTpl === t.id
                          ? "border-[#202124] bg-white ring-2 ring-[#202124]"
                          : "border-[#D8CFC2] bg-[#F7F4EE]/50 hover:bg-white"
                      }`}
                    >
                      <ResumeMiniPreview templateId={t.id} className="w-full mb-2 rounded-xs" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{t.name}</span>
                        <span className="rounded-xs bg-[#F7F4EE] px-1.5 py-0.5 text-[9px] font-semibold text-[#5d6f61]">
                          {t.twoCol ? "2-Col" : "ATS"}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#706A62] truncate">Series {t.series}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleCreateScratch}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#202124] px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Create & Open Editor <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* مسیر ۲: ساخت با هوش مصنوعی */}
            {method === "ai" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Target Job Title *</label>
                    <input
                      value={aiRole}
                      onChange={(e) => setAiRole(e.target.value)}
                      className="w-full rounded-xl border border-[#D8CFC2] bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Experience Level</label>
                    <select
                      value={aiSeniority}
                      onChange={(e) => setAiSeniority(e.target.value)}
                      className="w-full rounded-xl border border-[#D8CFC2] bg-white px-3 py-2 text-sm"
                    >
                      <option>Entry-Level / Junior</option>
                      <option>Mid-Level</option>
                      <option>Mid-Senior</option>
                      <option>Senior / Lead</option>
                      <option>Executive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Core Skills (comma separated)</label>
                  <input
                    value={aiSkills}
                    onChange={(e) => setAiSkills(e.target.value)}
                    className="w-full rounded-xl border border-[#D8CFC2] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Select Template Architecture</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TEMPLATES.slice(0, 4).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTpl(t.id)}
                        className={`rounded-lg border p-2 text-left text-xs ${
                          selectedTpl === t.id ? "border-[#202124] bg-white font-semibold" : "border-[#D8CFC2] bg-[#F7F4EE]"
                        }`}
                      >
                        <div>{t.name}</div>
                        <div className="text-[10px] text-[#706A62]">Series {t.series}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    disabled={generating || !aiRole.trim()}
                    onClick={handleCreateAI}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#5d6f61] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generating ? "Building your resume..." : "Generate AI Resume"}
                  </button>
                </div>
              </div>
            )}

            {/* مسیر ۳: آپلود رزومه فعلی (PDF / DOCX) */}
            {method === "upload" && (
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8CFC2] bg-[#F7F4EE]/60 p-8 text-center cursor-pointer hover:border-[#202124] transition">
                  <Upload className="h-8 w-8 text-[#5d6f61] mb-2" />
                  <div className="text-sm font-semibold">
                    {uploadFileName ? uploadFileName : "Drag & drop your resume, or browse"}
                  </div>
                  <p className="text-xs text-[#706A62] mt-1">
                    PDF, DOC, or DOCX (up to 10MB) — we&apos;ll reformat it into a template instantly
                  </p>
                  <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="hidden" />
                </label>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#706A62]">Target Template:</span>
                  <select
                    value={selectedTpl}
                    onChange={(e) => setSelectedTpl(e.target.value)}
                    className="rounded-xl border border-[#D8CFC2] bg-white px-3 py-1.5 text-xs"
                  >
                    {TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Series {t.series} · {t.twoCol ? "Two-Column" : "ATS"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    disabled={!uploadFileName}
                    onClick={handleConfirmUpload}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#202124] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    <FileCheck2 className="h-4 w-4" /> Upload & Reformat Resume
                  </button>
                </div>
              </div>
            )}

            {/* مسیر ۴: ایمپورت از لینکدین */}
            {method === "linkedin" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Your Public LinkedIn URL</label>
                  <input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/your.name"
                    className="w-full rounded-xl border border-[#D8CFC2] bg-white px-3.5 py-2.5 text-sm"
                  />
                  <p className="text-[11px] text-[#706A62] mt-1.5">
                    Note: Make sure your LinkedIn profile visibility is set to public so we can import your headline, experience, and education fields.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    disabled={!isLinkedinValid}
                    onClick={handleLinkedinConvert}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#202124] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    <Linkedin className="h-4 w-4" /> Convert to Resume
                  </button>
                </div>
              </div>
            )}

            {/* مسیر ۵: گالری نمونه‌های آماده شغلی */}
            {method === "example" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className=" h-4 w-4 text-[#706A62] absolute left-3 top-2.5" />
                  <input
                    value={exampleQuery}
                    onChange={(e) => setExampleQuery(e.target.value)}
                    placeholder="Search by role (e.g. Product Designer, Marketing, Engineer, Biology)..."
                    className="w-full rounded-xl border border-[#D8CFC2] bg-white pl-9 pr-3 py-2 text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {filteredExamples.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-start gap-3 rounded-xl border border-[#D8CFC2] bg-white p-3 hover:border-[#202124] transition"
                    >
                      <ResumeMiniPreview templateId={ex.template} className="w-14 shrink-0 rounded-xs" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5d6f61]">
                          {ex.category}
                        </span>
                        <div className="text-xs font-bold truncate">{ex.role}</div>
                        <p className="text-[11px] text-[#706A62] line-clamp-2 mt-0.5">{ex.summary}</p>
                        <button
                          onClick={() => handleUseExample(ex)}
                          className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#5d6f61] px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90"
                        >
                          Use This Resume <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}