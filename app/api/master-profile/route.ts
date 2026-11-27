import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { UpdateMasterProfileSchema, MAX_DOCUMENT_PAYLOAD_BYTES } from "@/lib/server/schemas";
import {
  getWorkspaceUser,
  safeJsonParse,
  serializeMasterProfile,
} from "@/lib/server/workspace";

export const runtime = "nodejs";

async function getOrCreateMaster(userId: string) {
  return prisma.masterProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function GET() {
  try {
    const user = await getWorkspaceUser();
    const mp = await getOrCreateMaster(user.id);
    return NextResponse.json({ profile: serializeMasterProfile(mp) });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load master profile", detail: err?.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getWorkspaceUser();
    const declaredLen = Number(req.headers.get("content-length") || 0);
    if (declaredLen > MAX_DOCUMENT_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Master profile payload exceeds 4 MB limit" }, { status: 413 });
    }
    const rawText = await req.text();
    if (Buffer.byteLength(rawText, "utf8") > MAX_DOCUMENT_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Master profile payload exceeds 4 MB limit" }, { status: 413 });
    }
    let raw: any;
    try { raw = JSON.parse(rawText); } catch { return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }); }
    const parsed = UpdateMasterProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid master profile payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const data: Record<string, any> = {};
    if (d.contact !== undefined) data.contactJson = JSON.stringify(d.contact);
    if (d.summary !== undefined) data.summary = d.summary;
    if (d.experience !== undefined) data.experienceJson = JSON.stringify(d.experience);
    if (d.education !== undefined) data.educationJson = JSON.stringify(d.education);
    if (d.skills !== undefined) data.skillsJson = JSON.stringify(d.skills);
    if (d.technicalSkills !== undefined) data.technicalSkillsJson = JSON.stringify(d.technicalSkills);
    if (d.certifications !== undefined) data.certificationsJson = JSON.stringify(d.certifications);
    if (d.courses !== undefined) data.coursesJson = JSON.stringify(d.courses);
    if (d.awards !== undefined) data.awardsJson = JSON.stringify(d.awards);
    if (d.volunteering !== undefined) data.volunteeringJson = JSON.stringify(d.volunteering);
    if (d.memberships !== undefined) data.membershipsJson = JSON.stringify(d.memberships);
    if (d.languages !== undefined) data.languagesJson = JSON.stringify(d.languages);
    if (d.projects !== undefined) data.projectsJson = JSON.stringify(d.projects);
    if (d.publications !== undefined) data.publicationsJson = JSON.stringify(d.publications);
    if (d.references !== undefined) data.referencesJson = JSON.stringify(d.references);

    const mp = await prisma.masterProfile.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });

    return NextResponse.json({ profile: serializeMasterProfile(mp) });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save master profile", detail: err?.message },
      { status: 500 }
    );
  }
}

// POST /api/master-profile { action: "sync-contact-to-all", contact: {...} }
export async function POST(req: NextRequest) {
  try {
    const user = await getWorkspaceUser();
    const body = await req.json();
    if (body?.action !== "sync-contact-to-all") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const contact = body.contact || {};
    await prisma.masterProfile.upsert({
      where: { userId: user.id },
      update: { contactJson: JSON.stringify(contact) },
      create: { userId: user.id, contactJson: JSON.stringify(contact) },
    });

    const docs = await prisma.document.findMany({ where: { userId: user.id } });
    let updatedCount = 0;

    for (const doc of docs) {
      const prev = safeJsonParse<Record<string, any>>(doc.contentJson, {});
      const next = {
        ...prev,
        ...(contact.name ? { name: contact.name } : {}),
        ...(contact.role ? { role: contact.role } : {}),
        ...(contact.email !== undefined ? { email: contact.email } : {}),
        ...(contact.phone !== undefined ? { phone: contact.phone } : {}),
        ...(contact.location !== undefined ? { location: contact.location } : {}),
        ...(contact.linkedin !== undefined ? { linkedin: contact.linkedin } : {}),
        ...(contact.website !== undefined ? { website: contact.website } : {}),
      };
      await prisma.document.update({
        where: { id: doc.id },
        data: { contentJson: JSON.stringify(next) },
      });
      updatedCount++;
    }

    return NextResponse.json({ ok: true, updatedCount });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to sync contact to all resumes", detail: err?.message },
      { status: 500 }
    );
  }
}