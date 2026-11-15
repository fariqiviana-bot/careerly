"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FilePlus2, Sparkles, Send, MailPlus, CheckCircle2, Circle, Upload,
  Briefcase, Bookmark, Plus, ArrowRight, FileText, Download, Copy,
  Trash2, Wand2, Eye, Layers, Calendar
} from "lucide-react";
import { useStore, calculateDocScore, type Doc } from "@/lib/store";
import { TEMPLATES } from "@/lib/catalog";
import { ResumeMiniPreview } from "@/components/resume-mini-preview";
import { CreateDocModal, type StartMethod } from "@/components/create-doc-modal";

type GoalTab = "resume" | "jobs" | "interview";
type ProgressFocus = "building" | "tailoring" | "distribution" | "cover";

export default function DashboardPage() {
  const router = useRouter();
  const {
    user, setUser, docs, jobs, tracker, interviews,
    savedJobs, toggleSaveJob, removeDoc, duplicateDoc
  } = useStore();

  // فقط ۳ هدف اصلی (Learning به طور کامل حذف شده است)
  const [goal, setGoal] = useState<GoalTab>("resume");
  const [progressFocus, setProgressFocus] = useState<ProgressFocus>("building");
  const [docSectionTab, setDocSectionTab] = useState<"resume" | "cover" | "tracker">("resume");

  // استیت مودال ۵مسیره ساخت سند
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<"resume" | "cover">("resume");
  const [createMethod, setCreateMethod] = useState<StartMethod>("menu");

  // استیت مودال بررسی تطابق شغل در چک‌لیست Get Started
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [jobAdInput, setJobAdInput] = useState("");
  const [computedMatch, setComputedMatch] = useState<number | null>(null);

  const resumes = docs.filter((d) => d.type === "resume");
  const tailoredResumes = docs.filter((d) => d.type === "tailored");
  const coverLetters = docs.filter((d) => d.type === "cover");

  const primaryResume: Doc = resumes[0] || docs[0];
  const scoreData = primaryResume
    ? calculateDocScore(primaryResume.content)
    : { score: 15, nextStep: { key: "experience", label: "Add employment history", boost: "+25%", section: "experience" }, breakdown: { design: 92, structure: 95, content: 40 } };

  const openCreateModal = (type: "resume" | "cover", method: StartMethod = "menu") => {
    setCreateType(type);
    setCreateMethod(method);
    setCreateOpen(true);
  };

  // وضعیت ۳ قدم چک‌لیست Get Started (کاملاً واقعی و تعاملی)
  const step1Done = Boolean(user.resumeUploaded || resumes.length > 1);
  const step2Done = Boolean(user.matchChecked || tailoredResumes.length > 0 || computedMatch !== null);
  const step3Done = savedJobs.length >= 3 || tracker.length >= 3;
  const completedStepsCount = [step1Done, step2Done, step3Done].filter(Boolean).length;

  const handleRunMatchScore = () => {
    if (!jobAdInput.trim()) return;
    const words = jobAdInput.toLowerCase().split(/\W+/);
    const skillHits = primaryResume?.content.skills.filter((s) =>
      words.includes(s.toLowerCase())
    ).length || 1;
    const score = Math.min(96, 68 + skillHits * 6 + Math.min(12, Math.floor(jobAdInput.length / 80)));
    setComputedMatch(score);
    setUser({ matchChecked: true });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* ۱. هدر سلام و ۳ دکمه هدف (بدون Learning) دقیقاً با ساختار متصل تصویر شما */}
      <div className="text-center space-y-5 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202124]">
            Hi {user.name.split(" ")[0]}! What&apos;s your goal today?
          </h1>
          <p className="text-xs sm:text-sm text-[#706A62] mt-1">
            Select a focus area to track your progress and unlock your next career milestone.
          </p>
        </div>

        {/* ۳ دکمه هدف متصل با خط افقی (Resume Building — Job Search — Interview Prep) */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => setGoal("resume")}
            className={`rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold border transition shadow-2xs ${
              goal === "resume"
                ? "border-[#5d6f61] bg-[#5d6f61]/15 text-[#202124] ring-2 ring-[#5d6f61]/30"
                : "border-[#D8CFC2] bg-[#FCFBF8] text-[#706A62] hover:text-[#202124]"
            }`}
          >
            Resume Building
          </button>
          <div className="h-[2px] w-6 sm:w-10 bg-[#D8CFC2]" />
          <button
            onClick={() => setGoal("jobs")}
            className={`rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold border transition shadow-2xs ${
              goal === "jobs"
                ? "border-[#5d6f61] bg-[#5d6f61]/15 text-[#202124] ring-2 ring-[#5d6f61]/30"
                : "border-[#D8CFC2] bg-[#FCFBF8] text-[#706A62] hover:text-[#202124]"
            }`}
          >
            Job Search
          </button>
          <div className="h-[2px] w-6 sm:w-10 bg-[#D8CFC2]" />
          <button
            onClick={() => setGoal("interview")}
            className={`rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold border transition shadow-2xs ${
              goal === "interview"
                ? "border-[#5d6f61] bg-[#5d6f61]/15 text-[#202124] ring-2 ring-[#5d6f61]/30"
                : "border-[#D8CFC2] bg-[#FCFBF8] text-[#706A62] hover:text-[#202124]"
            }`}
          >
            Interview Prep
          </button>
        </div>
      </div>

      {/* ۲. بخش PROGRESS و کارت پیش‌نمایش زنده رزومه (دقیقاً مطابق عکس ارسالی شما با پالت Farnavi) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ستون چپ: کارت PROGRESS */}
        <div className="lg:col-span-4 rounded-2xl border border-[#D8CFC2] bg-[#FCFBF8] shadow-xs overflow-hidden flex flex-col">
          <div className="border-b border-[#e5dfd5] px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#202124]">
            PROGRESS
          </div>

          {goal === "resume" && (
            <div className="divide-y divide-[#f0ece3] flex-1 flex flex-col justify-between">
              <button
                onClick={() => setProgressFocus("building")}
                className={`w-full flex items-center gap-3.5 px-5 py-4 text-left transition relative ${
                  progressFocus === "building" ? "bg-[#F7F4EE]" : "hover:bg-[#F7F4EE]/50"
                }`}
              >
                {progressFocus === "building" && (
                  <span className="absolute right-0 top-0 bottom-0 w-1 bg-[#5d6f61]" />
                )}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7eef2] text-[#202124]">
                  <FilePlus2 className="h-5 w-5 text-[#5d6f61]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#202124]">
                    <span>Resume Building</span>
                    <span className="text-[#5d6f61] font-bold">{scoreData.score}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-[#e5dfd5] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#5d6f61] transition-all"
                      style={{ width: `${scoreData.score}%` }}
                    />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setProgressFocus("tailoring")}
                className={`w-full flex items-center gap-3.5 px-5 py-4 text-left transition relative ${
                  progressFocus === "tailoring" ? "bg-[#F7F4EE]" : "hover:bg-[#F7F4EE]/50"
                }`}
              >
                {progressFocus === "tailoring" && (
                  <span className="absolute right-0 top-0 bottom-0 w-1 bg-[#5d6f61]" />
                )}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F4EE] border border-[#e5dfd5] text-[#202124]">
                  <Sparkles className="h-5 w-5 text-[#706A62]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#202124]">
                    <span>Resume Tailoring</span>
                    <span>{tailoredResumes.length}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-[#e5dfd5] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#5b7a8c]"
                      style={{ width: `${Math.min(100, tailoredResumes.length * 25)}%` }}
                    />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setProgressFocus("distribution")}
                className={`w-full flex items-center gap-3.5 px-5 py-4 text-left transition relative ${
                  progressFocus === "distribution" ? "bg-[#F7F4EE]" : "hover:bg-[#F7F4EE]/50"
                }`}
              >
                {progressFocus === "distribution" && (
                  <span className="absolute right-0 top-0 bottom-0 w-1 bg-[#5d6f61]" />
                )}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F4EE] border border-[#e5dfd5] text-[#202124]">
                  <Send className="h-5 w-5 text-[#706A62]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#202124]">
                    <span>Resume Distribution</span>
                    <span>0</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-[#e5dfd5] overflow-hidden">
                    <div className="h-full w-2 rounded-full bg-[#706A62]/40" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setProgressFocus("cover")}
                className={`w-full flex items-center gap-3.5 px-5 py-4 text-left transition relative ${
                  progressFocus === "cover" ? "bg-[#F7F4EE]" : "hover:bg-[#F7F4EE]/50"
                }`}
              >
                {progressFocus === "cover" && (
                  <span className="absolute right-0 top-0 bottom-0 w-1 bg-[#5d6f61]" />
                )}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F4EE] border border-[#e5dfd5] text-[#202124]">
                  <MailPlus className="h-5 w-5 text-[#706A62]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#202124]">
                    <span>Cover Letter Crafting</span>
                    <span>{coverLetters.length}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-[#e5dfd5] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#5d6f61]"
                      style={{ width: `${Math.min(100, coverLetters.length * 25)}%` }}
                    />
                  </div>
                </div>
              </button>
            </div>
          )}

          {goal === "jobs" && (
            <div className="divide-y divide-[#f0ece3] flex-1 flex flex-col justify-between p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Apply for Jobs</span>
                <span>{tracker.filter((t) => t.status === "applied").length}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Auto Apply Pipeline</span>
                <span>{tracker.filter((t) => t.status === "auto").length}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Saved Shortlist</span>
                <span>{savedJobs.length}</span>
              </div>
              <Link
                href="/jobs"
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#202124] px-4 py-2.5 text-xs font-semibold text-white"
              >
                Explore Matched Jobs <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {goal === "interview" && (
            <div className="divide-y divide-[#f0ece3] flex-1 flex flex-col justify-between p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Active Interviews</span>
                <span>{tracker.filter((t) => t.status === "interviewing").length}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>AI Prep Guides</span>
                <span>{interviews.length}</span>
              </div>
              <Link
                href="/interviews"
                className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#202124] px-4 py-2.5 text-xs font-semibold text-white"
              >
                Practice STAR Questions <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* ستون راست: کارت متصل پیش‌نمایش زنده رزومه، تاریخ ساخت/ویرایش و بج امتیاز 15% */}
        <div
          className="lg:col-span-8 relative rounded-2xl border border-[#D8CFC2] p-6 sm:p-8 shadow-xs overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{
            background: "linear-gradient(125deg, #eef3f6 0%, #F7F4EE 52%, #f9ebe7 100%)",
          }}
        >
          {/* مثلث کوچک اتصال به کارت PROGRESS در دسکتاپ */}
          <div className="hidden lg:block absolute -left-2.5 top-12 h-5 w-5 rotate-45 border-l border-b border-[#D8CFC2] bg-[#eef3f6]" />

          {/* متن و دکمه اقدام سمت چپ کارت */}
          <div className="flex-1 space-y-4 max-w-md">
            <span className="inline-block rounded-md bg-[#d8e6f3] px-3 py-1 text-xs font-semibold text-[#2c5270]">
              {progressFocus === "building"
                ? "Resume building"
                : progressFocus === "tailoring"
                ? "Resume tailoring"
                : progressFocus === "distribution"
                ? "Recruiter distribution"
                : "Cover letter crafting"}
            </span>

            <h2 className="text-xl sm:text-2xl font-bold text-[#202124] leading-snug">
              {progressFocus === "building"
                ? "Improve your score in 5 mins"
                : progressFocus === "tailoring"
                ? "Tailor your resume for every job"
                : progressFocus === "distribution"
                ? "Match with recruiters hiring now"
                : "Craft a matching cover letter in 30s"}
            </h2>

            <p className="text-xs sm:text-sm text-[#4a4f55] leading-relaxed">
              {progressFocus === "building"
                ? "Take small steps to improve your resume score. You'll start getting interviews at 90% or higher."
                : progressFocus === "tailoring"
                ? "Align your keywords with the exact job description to pass automated ATS screening."
                : progressFocus === "distribution"
                ? "Distribute your standardized A4 or US Letter resume directly to hiring managers."
                : "Pair your resume with a coordinated Series 11, 12, 14, or 22 cover letter."}
            </p>

            {/* متادیتای سند فعال (نام قالب + تاریخ ساخت و آخرین ویرایش) */}
            {primaryResume && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#706A62]">
                <span className="font-semibold text-[#202124]">{primaryResume.title}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Updated {new Date(primaryResume.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}

            {/* دکمه کپسولی سفید با +25% سبز رنگ دقیقاً مطابق تصویر */}
            <div className="pt-2">
              {progressFocus === "building" && primaryResume ? (
                <button
                  onClick={() => router.push(`/editor/${primaryResume.id}?section=${scoreData.nextStep.section}`)}
                  className="inline-flex items-center justify-between gap-8 rounded-xl border border-[#e5dfd5] bg-white px-5 py-3.5 text-sm font-semibold text-[#202124] shadow-sm hover:border-[#202124] hover:shadow-md transition"
                >
                  <span>{scoreData.nextStep.label}</span>
                  <span className="font-bold text-[#2e8540]">{scoreData.nextStep.boost}</span>
                </button>
              ) : progressFocus === "tailoring" ? (
                <button
                  onClick={() => router.push("/checker")}
                  className="inline-flex items-center justify-between gap-6 rounded-xl border border-[#e5dfd5] bg-white px-5 py-3.5 text-sm font-semibold text-[#202124] shadow-sm hover:border-[#202124] transition"
                >
                  <span>Tailor to a job listing</span>
                  <span className="font-bold text-[#2e8540]">+20% Match</span>
                </button>
              ) : progressFocus === "cover" ? (
                <button
                  onClick={() => openCreateModal("cover", "menu")}
                  className="inline-flex items-center justify-between gap-6 rounded-xl border border-[#e5dfd5] bg-white px-5 py-3.5 text-sm font-semibold text-[#202124] shadow-sm hover:border-[#202124] transition"
                >
                  <span>Generate AI Cover Letter</span>
                  <span className="font-bold text-[#2e8540]">30 secs</span>
                </button>
              ) : (
                <button
                  onClick={() => router.push("/auto-apply")}
                  className="inline-flex items-center justify-between gap-6 rounded-xl border border-[#e5dfd5] bg-white px-5 py-3.5 text-sm font-semibold text-[#202124] shadow-sm hover:border-[#202124] transition"
                >
                  <span>Configure Auto Apply</span>
                  <span className="font-bold text-[#2e8540]">Start Now</span>
                </button>
              )}
            </div>
          </div>

          {/* سمت راست کارت: تامبنیل زنده رزومه ویانا فریقی + بج امتیاز 15% Resume Score در کنار آن */}
          <div className="flex items-start gap-4 shrink-0">
            <div
              onClick={() => primaryResume && router.push(`/editor/${primaryResume.id}`)}
              className="group relative w-44 sm:w-48 cursor-pointer rounded-md shadow-lg transition-transform hover:-translate-y-1"
              title="Click to edit resume"
            >
              <ResumeMiniPreview doc={primaryResume} className="w-full rounded-md" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 group-hover:bg-black/25 group-hover:opacity-100 transition rounded-md">
                <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#202124] shadow">
                  Edit Resume
                </span>
              </div>
            </div>

            <div className="pt-2 text-left">
              <div className="inline-block rounded-md bg-[#e26d69] px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                {scoreData.score}%
              </div>
              <div className="mt-1.5 text-xs font-medium leading-tight text-[#5a6570]">
                Resume
                <br />
                Score
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ۳. چک‌لیست تعاملی Get Started (الگوی Enhancv - کاملاً فعال و واقعی) */}
      <div className="rounded-2xl border border-[#D8CFC2] bg-[#FCFBF8] p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#202124]">
              Get Started Checklist ({completedStepsCount}/3 completed)
            </h3>
            <p className="text-xs text-[#706A62]">
              Complete these 3 steps to calibrate your ATS profile and job pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openCreateModal("resume", "menu")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#202124] px-3.5 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Get a new resume in 20 mins
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* قدم ۱: آپلود رزومه */}
          <div
            onClick={() => openCreateModal("resume", "upload")}
            className={`cursor-pointer rounded-xl border p-4 transition flex items-start gap-3 ${
              step1Done
                ? "border-[#5d6f61]/40 bg-[#5d6f61]/8"
                : "border-[#D8CFC2] bg-[#F7F4EE]/60 hover:border-[#202124]"
            }`}
          >
            {step1Done ? (
              <CheckCircle2 className="h-5 w-5 text-[#2e8540] shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-[#706A62] shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="text-xs font-bold text-[#202124]">1. Upload your resume</div>
              <p className="text-[11px] text-[#706A62] mt-0.5">
                Import PDF/DOCX and reformat into Editorial, Harmonized, Calligraphic, or Crest.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#5d6f61]">
                {step1Done ? "Completed · Upload another →" : "Upload Resume →"}
              </span>
            </div>
          </div>

          {/* قدم ۲: افزودن شغل و دریافت امتیاز تطابق ATS */}
          <div
            onClick={() => setMatchModalOpen(true)}
            className={`cursor-pointer rounded-xl border p-4 transition flex items-start gap-3 ${
              step2Done
                ? "border-[#5d6f61]/40 bg-[#5d6f61]/8"
                : "border-[#D8CFC2] bg-[#F7F4EE]/60 hover:border-[#202124]"
            }`}
          >
            {step2Done ? (
              <CheckCircle2 className="h-5 w-5 text-[#2e8540] shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-[#706A62] shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="text-xs font-bold text-[#202124]">
                2. Add a job and get a match score
              </div>
              <p className="text-[11px] text-[#706A62] mt-0.5">
                {computedMatch
                  ? `Last ATS match score: ${computedMatch}% for your active resume.`
                  : "Paste a job ad or link to check your real-time ATS keyword match."}
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#5d6f61]">
                + Add Job & Check ATS Score →
              </span>
            </div>
          </div>

          {/* قدم ۳: ذخیره ۳ شغل */}
          <div
            onClick={() => router.push("/jobs")}
            className={`cursor-pointer rounded-xl border p-4 transition flex items-start gap-3 ${
              step3Done
                ? "border-[#5d6f61]/40 bg-[#5d6f61]/8"
                : "border-[#D8CFC2] bg-[#F7F4EE]/60 hover:border-[#202124]"
            }`}
          >
            {step3Done ? (
              <CheckCircle2 className="h-5 w-5 text-[#2e8540] shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-[#706A62] shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="text-xs font-bold text-[#202124]">
                3. Save 3 jobs that you want to apply to
              </div>
              <p className="text-[11px] text-[#706A62] mt-0.5">
                You have {savedJobs.length} saved job(s) and {tracker.length} tracked applications.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#5d6f61]">
                Browse & Bookmark Jobs ({Math.min(3, savedJobs.length)}/3) →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ۴. بخش Documents روی داشبورد با پیش‌نمایش زنده، تاریخ، بج امتیاز و اکشن‌ها */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8CFC2] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDocSectionTab("resume")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                docSectionTab === "resume"
                  ? "bg-[#202124] text-white"
                  : "bg-[#FCFBF8] text-[#706A62] border border-[#D8CFC2]"
              }`}
            >
              Resumes ({resumes.length + tailoredResumes.length})
            </button>
            <button
              onClick={() => setDocSectionTab("cover")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                docSectionTab === "cover"
                  ? "bg-[#202124] text-white"
                  : "bg-[#FCFBF8] text-[#706A62] border border-[#D8CFC2]"
              }`}
            >
              Cover Letters ({coverLetters.length})
            </button>
            <button
              onClick={() => setDocSectionTab("tracker")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                docSectionTab === "tracker"
                  ? "bg-[#202124] text-white"
                  : "bg-[#FCFBF8] text-[#706A62] border border-[#D8CFC2]"
              }`}
            >
              Job Tracker ({tracker.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8CFC2] bg-[#FCFBF8] px-3.5 py-2 text-xs font-semibold text-[#202124] hover:border-[#202124]"
            >
              <Layers className="h-3.5 w-3.5" /> Browse Templates
            </Link>
            <button
              onClick={() => openCreateModal(docSectionTab === "cover" ? "cover" : "resume", "menu")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#5d6f61] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Create New
            </button>
          </div>
        </div>

        {docSectionTab !== "tracker" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* کارت خط‌چین ساخت سند جدید */}
            <div
              onClick={() => openCreateModal(docSectionTab === "cover" ? "cover" : "resume", "menu")}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8CFC2] bg-[#FCFBF8]/60 p-6 text-center cursor-pointer hover:border-[#202124] hover:bg-[#FCFBF8] transition min-h-[230px]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F4EE] border border-[#D8CFC2] text-[#202124] mb-3">
                <Plus className="h-6 w-6" />
              </div>
              <div className="text-sm font-bold">
                {docSectionTab === "cover" ? "New Cover Letter" : "New Resume"}
              </div>
              <p className="text-xs text-[#706A62] mt-1 max-w-[220px]">
                {docSectionTab === "cover"
                  ? "Generate with AI in 30 seconds or start with a matched template."
                  : "Start blank, use AI, upload PDF/DOCX, or import from LinkedIn."}
              </p>
            </div>

            {(docSectionTab === "cover" ? coverLetters : [...resumes, ...tailoredResumes]).map((d) => {
              const tpl = TEMPLATES.find((t) => t.id === d.template) || TEMPLATES[0];
              const liveDocScore = d.type === "cover" ? d.score || 90 : calculateDocScore(d.content).score;
              return (
                <div
                  key={d.id}
                  className="flex gap-4 rounded-2xl border border-[#D8CFC2] bg-[#FCFBF8] p-4 shadow-2xs hover:border-[#202124] transition"
                >
                  <div
                    onClick={() => router.push(`/editor/${d.id}`)}
                    className="w-28 shrink-0 cursor-pointer"
                  >
                    <ResumeMiniPreview doc={d} className="w-full rounded-sm" />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={`/editor/${d.id}`}
                          className="font-bold text-sm text-[#202124] hover:text-[#5d6f61] truncate"
                        >
                          {d.title}
                        </Link>
                      </div>
                      <div className="text-[11px] text-[#706A62] mt-0.5">
                        {tpl.name} (Series {tpl.series}) · {d.settings?.pageSize || "A4"}
                      </div>
                      <div className="text-[10px] text-[#9aa0a6] mt-0.5">
                        Updated {new Date(d.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>

                      {/* بج امتیاز رزومه مشابه Resume.io */}
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#F7F4EE] border border-[#e5dfd5] px-2 py-0.5 text-[11px] font-semibold">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            liveDocScore >= 80 ? "bg-[#2e8540]" : "bg-[#e26d69]"
                          }`}
                        />
                        <span>Your resume score {liveDocScore}%</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#f0ece3]">
                      <button
                        onClick={() => router.push(`/editor/${d.id}`)}
                        className="rounded-lg bg-[#202124] px-2.5 py-1 text-[11px] font-semibold text-white"
                      >
                        Edit
                      </button>
                      <a
                        href={
                          d.type === "cover"
                            ? tpl.files.docx.a4.cover
                            : tpl.twoCol
                            ? tpl.files.docx.a4.resume1p
                            : tpl.files.docx.a4.ats1p
                        }
                        download
                        className="rounded-lg border border-[#D8CFC2] bg-white px-2 py-1 text-[11px] font-medium text-[#202124] hover:bg-[#F7F4EE]"
                      >
                        DOCX
                      </a>
                      <a
                        href={
                          d.type === "cover"
                            ? tpl.files.pdf.a4.cover
                            : tpl.twoCol
                            ? tpl.files.pdf.a4.resume1p
                            : tpl.files.pdf.a4.ats1p
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-[#D8CFC2] bg-white px-2 py-1 text-[11px] font-medium text-[#202124] hover:bg-[#F7F4EE]"
                      >
                        PDF
                      </a>
                      <button
                        onClick={() => duplicateDoc(d.id)}
                        title="Duplicate"
                        className="rounded-lg border border-[#D8CFC2] p-1 text-[#706A62] hover:text-[#202124]"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeDoc(d.id)}
                        title="Delete"
                        className="rounded-lg border border-[#D8CFC2] p-1 text-[#c05b49] hover:bg-[#f7e4de]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#D8CFC2] bg-[#FCFBF8] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold">Active Job Pipeline</span>
              <Link href="/tracker" className="text-xs font-semibold text-[#5d6f61]">
                Open Full Board →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tracker.slice(0, 6).map((t) => (
                <div key={t.id} className="rounded-xl border border-[#e5dfd5] bg-[#F7F4EE]/50 p-3">
                  <div className="text-xs font-bold">{t.title}</div>
                  <div className="text-[11px] text-[#706A62]">{t.company} · {t.location}</div>
                  <div className="mt-2 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase border border-[#D8CFC2]">
                    {t.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* مودال بررسی تطابق شغل در چک‌لیست Get Started */}
      {matchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#D8CFC2] bg-[#FCFBF8] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Add a job and get an ATS match score</h3>
              <button onClick={() => setMatchModalOpen(false)} className="text-sm text-[#706A62]">✕</button>
            </div>
            <p className="text-xs text-[#706A62]">
              Paste a job description or select one of your saved jobs to calculate how well <strong>{primaryResume?.title}</strong> matches.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {jobs.slice(0, 3).map((j) => (
                <button
                  key={j.id}
                  onClick={() => setJobAdInput(`${j.title} at ${j.company}: ${j.summary} Skills: ${j.tags.join(", ")}`)}
                  className="rounded-lg border border-[#D8CFC2] bg-[#F7F4EE] px-2.5 py-1 text-xs"
                >
                  {j.title} @ {j.company}
                </button>
              ))}
            </div>
            <textarea
              rows={4}
              value={jobAdInput}
              onChange={(e) => setJobAdInput(e.target.value)}
              placeholder="Paste job posting URL or full job description..."
              className="w-full rounded-xl border border-[#D8CFC2] bg-white p-3 text-xs"
            />
            {computedMatch !== null && (
              <div className="rounded-xl border border-[#5d6f61]/40 bg-[#5d6f61]/10 p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#202124]">ATS Match Score: {computedMatch}%</div>
                  <div className="text-[11px] text-[#706A62]">Checklist Step 2 marked as completed!</div>
                </div>
                <button
                  onClick={() => {
                    setMatchModalOpen(false);
                    if (primaryResume) router.push(`/editor/${primaryResume.id}`);
                  }}
                  className="rounded-lg bg-[#202124] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Tailor Resume →
                </button>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMatchModalOpen(false)}
                className="rounded-xl border border-[#D8CFC2] px-4 py-2 text-xs font-medium"
              >
                Close
              </button>
              <button
                onClick={handleRunMatchScore}
                className="rounded-xl bg-[#5d6f61] px-4 py-2 text-xs font-semibold text-white"
              >
                Analyze & Get Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال ۵مسیره ساخت رزومه و کاورلتر */}
      <CreateDocModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        initialType={createType}
        initialMethod={createMethod}
      />
    </div>
  );
}