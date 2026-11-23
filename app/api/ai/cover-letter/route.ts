import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ANTI_HALLUCINATION_RULE, callAiJson } from "@/lib/server/ai-client";

export const runtime = "nodejs";

const CoverLetterReqSchema = z.object({
  content: z.record(z.any()),
  jobTitle: z.string().optional().default(""),
  company: z.string().optional().default(""),
  jobDescription: z.string().optional().default(""),
  tone: z.enum(["confident", "warm", "executive"]).optional().default("confident"),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = CoverLetterReqSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid cover letter request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, jobTitle, company, jobDescription, tone } = parsed.data;
    const fullName = String(content.name || content.fullName || "Candidate").trim();
    const role = jobTitle.trim() || String(content.role || "the open position").trim();
    const comp = company.trim() || "your team";
    const exp: any[] = Array.isArray(content.experience) ? content.experience : [];
    const skills: string[] = Array.isArray(content.skills) ? content.skills.slice(0, 6) : [];
    const today = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const ai = await callAiJson<{
      greeting: string;
      openingParagraph: string;
      bodyParagraph: string;
      bulletHighlights: string[];
      closingParagraph: string;
      signOff: string;
    }>({
      temperature: 0.5,
      maxTokens: 1100,
      messages: [
        {
          role: "system",
          content: `Write a crisp, human, high-converting cover letter in a "${tone}" tone tailored to the job posting and candidate's actual experience. ${ANTI_HALLUCINATION_RULE} Return strict JSON: { "greeting": string, "openingParagraph": string, "bodyParagraph": string, "bulletHighlights": string[], "closingParagraph": string, "signOff": string }.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            candidateName: fullName,
            targetRole: role,
            targetCompany: comp,
            jobDescription: jobDescription.slice(0, 4000),
            summary: content.summary,
            experience: exp.slice(0, 3),
            skills,
          }),
        },
      ],
    });

    if (ai.ok && ai.data?.openingParagraph) {
      return NextResponse.json({
        coverLetter: {
          date: today,
          recipientName: "Hiring Manager",
          recipientTitle: "Hiring Team",
          companyName: company.trim() || "Company Name",
          companyAddress: "",
          reSubject: `Application for ${role}`,
          greeting: ai.data.greeting || "Dear Hiring Manager,",
          openingParagraph: ai.data.openingParagraph,
          bodyParagraph: ai.data.bodyParagraph || "",
          highlightsIntro: "Key highlights I would bring to this role include:",
          bulletHighlights: Array.isArray(ai.data.bulletHighlights) ? ai.data.bulletHighlights.slice(0, 3) : [],
          closingParagraph: ai.data.closingParagraph || "",
          signOff: ai.data.signOff || "Sincerely,",
          signatureText: fullName,
        },
        mode: "ai",
        provider: ai.provider,
        model: ai.model,
      });
    }

    // Smart Local Cover Letter grounded strictly in candidate's real resume data
    const topBullets: string[] = [];
    for (const e of exp.slice(0, 2)) {
      const bl: string[] = Array.isArray(e.bullets) ? e.bullets : [];
      if (bl[0]) topBullets.push(bl[0]);
      if (bl[1] && topBullets.length < 3) topBullets.push(bl[1]);
    }

    const latestRole = exp[0]?.role ? `${exp[0].role}${exp[0].company ? ` at ${exp[0].company}` : ""}` : role;
    const skillPhrase = skills.length > 0 ? skills.slice(0, 4).join(", ") : "strategic execution and collaboration";

    return NextResponse.json({
      coverLetter: {
        date: today,
        recipientName: "Hiring Manager",
        recipientTitle: "Talent Acquisition",
        companyName: company.trim() || "Company Name",
        companyAddress: "",
        reSubject: `Application for ${role}`,
        greeting: "Dear Hiring Manager,",
        openingParagraph: `I am excited to apply for the ${role} position at ${comp}. Having built hands-on experience as ${latestRole}, I bring a practical combination of ${skillPhrase} focused on delivering measurable outcomes.`,
        bodyParagraph: `Throughout my career, I have prioritized aligning daily execution with broader product and business goals. I thrive in collaborative environments where clear communication, ownership, and continuous improvement directly elevate results.`,
        highlightsIntro: "A few highlights from my recent work include:",
        bulletHighlights:
          topBullets.length > 0
            ? topBullets.slice(0, 3)
            : [
                `Delivered high-priority ${role} initiatives with measurable gains in quality and speed.`,
                `Partnered across teams leveraging ${skillPhrase} to solve complex operational challenges.`,
              ],
        closingParagraph: `I would welcome the opportunity to discuss how my background aligns with ${comp}'s roadmap for the ${role} role. Thank you for your time and consideration.`,
        signOff: "Sincerely,",
        signatureText: fullName,
      },
      mode: "smart-local",
      provider: "local",
      model: "cover-letter-deterministic",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate cover letter", detail: err?.message },
      { status: 500 }
    );
  }
}