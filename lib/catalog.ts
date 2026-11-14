export const ACCENTS = ["#5d6f61", "#c98d72", "#c05b49", "#5b7a8c", "#8a6f9e", "#3d4a3f"];
export const FONTS = ["Instrument Sans", "Georgia", "Times New Roman", "Garamond"];
export const LANGS = ["English","Français","Deutsch","Español","Svenska","Português","Italiano","Nederlands","Dansk","Suomi","Čeština","Polski","Norsk","فارسی","العربية","Türkçe"];

export type Tpl = { id: string; name: string; ats: boolean; twoCol: boolean; photo: boolean; pro: boolean; accent: string };
export const TEMPLATES: Tpl[] = [
  { id: "classic", name: "Classic", ats: true, twoCol: false, photo: false, pro: false, accent: "#5d6f61" },
  { id: "prime-ats", name: "Prime ATS", ats: true, twoCol: false, photo: false, pro: false, accent: "#3d4a3f" },
  { id: "pure-ats", name: "Pure ATS", ats: true, twoCol: false, photo: false, pro: false, accent: "#5b7a8c" },
  { id: "half-tone", name: "Half Tone", ats: false, twoCol: false, photo: true, pro: false, accent: "#c98d72" },
  { id: "executive", name: "Executive", ats: true, twoCol: false, photo: false, pro: false, accent: "#3d4a3f" },
  { id: "modern", name: "Modern", ats: false, twoCol: true, photo: true, pro: true, accent: "#5d6f61" },
  { id: "elegant", name: "Elegant", ats: false, twoCol: false, photo: true, pro: true, accent: "#8a6f9e" },
  { id: "ivy", name: "Ivy", ats: true, twoCol: false, photo: false, pro: true, accent: "#5d6f61" },
  { id: "league", name: "League", ats: false, twoCol: true, photo: true, pro: true, accent: "#c05b49" },
  { id: "radar", name: "Radar", ats: true, twoCol: true, photo: false, pro: true, accent: "#5b7a8c" },
  { id: "creative", name: "Creative", ats: false, twoCol: true, photo: true, pro: true, accent: "#c98d72" },
  { id: "minimalist", name: "Minimalist", ats: true, twoCol: false, photo: false, pro: true, accent: "#3d4a3f" },
];

export const EXTRA_SECTIONS = ["Projects","Volunteering","Languages","Certifications","Awards","Publications","References","Custom section"];
export const FREE_CHECKS = ["Spellcheck & Grammar","Quantified Impact","Wording & Readability","Recommendations"];
export const LOCKED_CHECKS = ["Credibility","Interview Risks","Age Bias","Employment Gaps"];

export const LINKEDIN_STEPS = ["LinkedIn URL","Custom URL","Target & Position","Competencies","Headline","Profile Photo","Banner","Achievements","Spelling & Grammar","Resume Match","About / Summary","Experience","Skills","Recommendations","Age Discrimination"];

export const QUESTIONS = [
  { q: "Tell me about yourself.", tip: "Present → Past → Future. Keep it under 2 minutes." },
  { q: "Describe a project you're proud of.", tip: "STAR: Situation, Task, Action, Result — quantify the result." },
  { q: "Tell me about a conflict with a teammate.", tip: "Focus on the resolution, not the drama." },
  { q: "Why do you want this role?", tip: "Connect their mission to your last 2 achievements." },
  { q: "What is your biggest weakness?", tip: "Real weakness + the system you built to manage it." },
  { q: "Describe a time you failed.", tip: "Own it, then show the lesson applied later." },
  { q: "Where do you see yourself in 3 years?", tip: "Growth that aligns with this team's trajectory." },
  { q: "Do you have questions for us?", tip: "Ask about success metrics for the first 90 days." },
];

export const COACHES = [
  { name: "Karen Maida", role: "Resume & LinkedIn Coach", price: 179, tag: "Career Evolution" },
  { name: "Sayyid Tirmizi", role: "Interview & Search Strategy", price: 229, tag: "Career Confidence" },
  { name: "Patricia Tejera", role: "Executive Positioning", price: 349, tag: "Executive Priority" },
];

export const FAQ = [
  { cat: "Resumes & Cover Letters", count: 16, items: ["How do I import my LinkedIn profile?","Which template is ATS-friendly?","How does resume tailoring work?","Can I export to DOCX?"] },
  { cat: "Billing & Accounts", count: 7, items: ["How do I change my plan?","How do I delete my account?","Do you offer student discounts?"] },
  { cat: "Jobs & Tracker", count: 14, items: ["What is Ghost-Job Risk?","How does Auto Apply work?","How do job alerts work?"] },
];

export const CHAPTERS = [
  { title: "The Master Plan", lessons: ["Define your target","Set weekly goals","Build your pipeline"] },
  { title: "Brand Yourself", lessons: ["Positioning statement","LinkedIn refresh","Portfolio basics"] },
  { title: "Get More Meetings", lessons: ["Outreach that works","Follow-up cadence","Referrals"] },
  { title: "Interview and Win", lessons: ["STAR stories","Salary questions","Closing"] },
  { title: "Close the Deal", lessons: ["Negotiation basics","Competing offers","First 90 days"] },
];

export type TrackStatus = "recommended"|"shortlist"|"auto"|"applied"|"interviewing"|"offer"|"rejected";
export const STATUS_ORDER: TrackStatus[] = ["recommended","shortlist","auto","applied","interviewing","offer","rejected"];
export const STATUS: Record<TrackStatus, { label: string; dot: string; chip: string }> = {
  recommended: { label: "Recommended", dot: "bg-sage", chip: "bg-sage-mist text-secondary-foreground" },
  shortlist:   { label: "Shortlist",   dot: "bg-peach", chip: "bg-accent text-accent-foreground" },
  auto:        { label: "Auto Apply",  dot: "bg-[#8a6f9e]", chip: "bg-[#efe9f4] text-[#5f4a72]" },
  applied:     { label: "Applied",     dot: "bg-[#5b7a8c]", chip: "bg-[#e7eef2] text-[#3d5563]" },
  interviewing:{ label: "Interviewing",dot: "bg-[#b98a4e]", chip: "bg-[#f6ecdd] text-[#7c5a2e]" },
  offer:       { label: "Offer",       dot: "bg-[#4e8a5a]", chip: "bg-[#e6f0e8] text-[#33613d]" },
  rejected:    { label: "Rejected",    dot: "bg-destructive", chip: "bg-[#f7e4de] text-[#8a4436]" },
};