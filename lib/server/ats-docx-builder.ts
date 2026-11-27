import JSZip from "jszip";
import {
  type ExportLayoutOptions,
  isSectionVisible,
  resolveSectionLabel,
  resolveSectionOrder,
} from "@/lib/server/export-options";

export interface AtsDocxOptions extends ExportLayoutOptions {
  seriesId?: string;
  kind?: "resume" | "cover" | "references";
  pageSize?: "A4" | "Letter";
  accent?: string;
  font?: string;
  content: Record<string, any>;
}

function escapeXml(input: unknown): string {
  const s = String(input ?? "")
    // Strip illegal XML 1.0 control chars
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanHex(hex: unknown, fallback = "1F3A5F"): string {
  const raw = String(hex ?? "").replace(/^#/, "").trim();
  return /^[0-9a-fA-F]{6}$/.test(raw) ? raw.toUpperCase() : fallback;
}

function cleanFont(font: unknown): string {
  const f = String(font ?? "").trim();
  if (!f) return "Calibri";
  // Map web fonts to universally available clean ATS-safe Word fonts if needed, keeping user font name valid
  return f.replace(/['"<>;&]/g, "").slice(0, 40) || "Calibri";
}

function runXml(text: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string; font?: string } = {}): string {
  if (!text) return "";
  const rPr: string[] = [];
  if (opts.font) {
    const f = escapeXml(opts.font);
    rPr.push(`<w:rFonts w:ascii="${f}" w:hAnsi="${f}" w:cs="${f}"/>`);
  }
  if (opts.bold) rPr.push("<w:b/>");
  if (opts.italic) rPr.push("<w:i/>");
  if (opts.color) rPr.push(`<w:color w:val="${cleanHex(opts.color)}"/>`);
  if (opts.size) rPr.push(`<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`);
  const rPrTag = rPr.length ? `<w:rPr>${rPr.join("")}</w:rPr>` : "";
  return `<w:r>${rPrTag}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

function paraXml(
  runs: string,
  opts: {
    spaceBefore?: number;
    spaceAfter?: number;
    line?: number;
    align?: "left" | "center" | "right" | "both";
    bottomBorderColor?: string;
    keepNext?: boolean;
    indentLeft?: number;
    hanging?: number;
  } = {}
): string {
  const pPr: string[] = [];
  if (opts.keepNext) pPr.push("<w:keepNext/>");
  if (opts.bottomBorderColor) {
    pPr.push(
      `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="3" w:color="${cleanHex(opts.bottomBorderColor)}"/></w:pBdr>`
    );
  }
  const spacingAttrs: string[] = [];
  if (opts.spaceBefore !== undefined) spacingAttrs.push(`w:before="${opts.spaceBefore}"`);
  if (opts.spaceAfter !== undefined) spacingAttrs.push(`w:after="${opts.spaceAfter}"`);
  if (opts.line !== undefined) spacingAttrs.push(`w:line="${opts.line}" w:lineRule="auto"`);
  if (spacingAttrs.length) pPr.push(`<w:spacing ${spacingAttrs.join(" ")}/>`);

  if (opts.indentLeft !== undefined || opts.hanging !== undefined) {
    const indAttrs: string[] = [];
    if (opts.indentLeft !== undefined) indAttrs.push(`w:left="${opts.indentLeft}"`);
    if (opts.hanging !== undefined) indAttrs.push(`w:hanging="${opts.hanging}"`);
    pPr.push(`<w:ind ${indAttrs.join(" ")}/>`);
  }
  if (opts.align) pPr.push(`<w:jc w:val="${opts.align}"/>`);

  const pPrTag = pPr.length ? `<w:pPr>${pPr.join("")}</w:pPr>` : "";
  return `<w:p>${pPrTag}${runs}</w:p>`;
}

function sectionHeading(title: string, accent: string, font: string): string {
  return paraXml(
    runXml(title.toUpperCase(), { bold: true, size: 22, color: accent, font }),
    { spaceBefore: 180, spaceAfter: 80, bottomBorderColor: accent, keepNext: true }
  );
}

function toStringList(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const o = item as Record<string, any>;
        return String(o.name || o.label || o.title || o.skill || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

export async function generateAtsSafeDocxBuffer(options: AtsDocxOptions): Promise<{ buffer: Buffer }> {
  const c = options.content || {};
  const kind = options.kind || "resume";
  const pageSize = options.pageSize || "A4";
  const accent = cleanHex(options.accent, "1F3A5F");
  const font = cleanFont(options.font);
  const darkText = "1F2937";
  const mutedText = "4B5563";

  const fullName =
    String(c.name || c.fullName || `${c.firstName || ""} ${c.lastName || ""}`).trim() || "Candidate Name";
  const role = String(c.role || c.profession || c.title || "").trim();
  const contactParts = [
    c.email,
    c.phone,
    c.location,
    c.linkedin,
    c.website,
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  const blocks: string[] = [];

  // Header block — strictly inside <w:body> (NEVER inside Word header/footer or TextBox!)
  blocks.push(
    paraXml(runXml(fullName.toUpperCase(), { bold: true, size: 36, color: darkText, font }), {
      spaceBefore: 0,
      spaceAfter: 40,
      keepNext: true,
    })
  );
  if (role) {
    blocks.push(
      paraXml(runXml(role.toUpperCase(), { bold: true, size: 22, color: accent, font }), {
        spaceBefore: 0,
        spaceAfter: 60,
        keepNext: true,
      })
    );
  }
  if (contactParts.length) {
    blocks.push(
      paraXml(runXml(contactParts.join("  |  "), { size: 19, color: mutedText, font }), {
        spaceBefore: 0,
        spaceAfter: 120,
        bottomBorderColor: "D1D5DB",
      })
    );
  }

  if (kind === "cover") {
    blocks.push(sectionHeading("Cover Letter", accent, font));
    const clText =
      String(c.coverLetter || c.cover?.body || c.letterBody || "").trim() ||
      `Dear Hiring Manager,\n\nI am writing to express my interest in the ${role || "open"} position.\n\nSincerely,\n${fullName}`;
    for (const para of clText.split(/\n{2,}/)) {
      const cleaned = para.trim();
      if (!cleaned) continue;
      blocks.push(
        paraXml(runXml(cleaned, { size: 21, color: darkText, font }), {
          spaceBefore: 40,
          spaceAfter: 120,
          line: 276,
        })
      );
    }
  } else if (kind === "references") {
    blocks.push(sectionHeading("Professional References", accent, font));
    const refs = Array.isArray(c.references) ? c.references : [];
    if (!refs.length) {
      blocks.push(
        paraXml(runXml("Professional references are available upon request.", { size: 21, color: darkText, font }), {
          spaceBefore: 40,
          spaceAfter: 120,
        })
      );
    } else {
      for (const r of refs) {
        const rName = String(r.name || "").trim();
        const rMeta = [r.role || r.title, r.company].filter(Boolean).join(" — ");
        const rContact = [r.email, r.phone, r.relationship].filter(Boolean).join(" | ");
        if (rName) {
          blocks.push(
            paraXml(runXml(rName, { bold: true, size: 21, color: darkText, font }), {
              spaceBefore: 100,
              spaceAfter: 20,
              keepNext: true,
            })
          );
        }
        if (rMeta) {
          blocks.push(
            paraXml(runXml(rMeta, { italic: true, size: 20, color: mutedText, font }), {
              spaceBefore: 0,
              spaceAfter: 20,
              keepNext: true,
            })
          );
        }
        if (rContact) {
          blocks.push(
            paraXml(runXml(rContact, { size: 19, color: darkText, font }), {
              spaceBefore: 0,
              spaceAfter: 80,
            })
          );
        }
      }
    }
  } else {
    const orderedSections = resolveSectionOrder(options.sectionOrder);
    const lbl = (key: string, def: string) =>
      resolveSectionLabel(key, def, options.customLabels, options.sectionOrder);
    const vis = (key: string) =>
      isSectionVisible(key, options.visibility, options.sectionOrder);

    for (const secKey of orderedSections) {
      if (!vis(secKey)) continue;

      if (secKey === "summary") {
        const summary = String(c.summary || "").trim();
        if (summary) {
          blocks.push(sectionHeading(lbl("summary", "Professional Summary"), accent, font));
          blocks.push(
            paraXml(runXml(summary, { size: 20, color: darkText, font }), {
              spaceBefore: 20,
              spaceAfter: 100,
              line: 264,
            })
          );
        }
      } else if (secKey === "experience") {
        const exp = Array.isArray(c.experience) ? c.experience.filter((e: any) => !e?.hidden) : [];
        if (exp.length) {
          blocks.push(sectionHeading(lbl("experience", "Professional Experience"), accent, font));
          for (const item of exp) {
            const jobRole = String(item.role || item.title || "").trim();
            const company = String(item.company || "").trim();
            const location = String(item.location || "").trim();
            const dates = String(item.period || item.date || item.dates || [item.start, item.end].filter(Boolean).join(" - ")).trim();

            const titleRuns = [
              jobRole ? runXml(jobRole, { bold: true, size: 21, color: darkText, font }) : "",
              company ? runXml(jobRole ? ` \u2014 ${company}` : company, { bold: true, size: 21, color: accent, font }) : "",
            ].join("");
            if (titleRuns) {
              blocks.push(paraXml(titleRuns, { spaceBefore: 100, spaceAfter: 20, keepNext: true }));
            }

            const subLine = [location, dates].filter(Boolean).join("  |  ");
            if (subLine) {
              blocks.push(
                paraXml(runXml(subLine, { italic: true, size: 19, color: mutedText, font }), {
                  spaceBefore: 0,
                  spaceAfter: 40,
                  keepNext: true,
                })
              );
            }

            const jobSummary = String(item.summary || item.description || "").trim();
            if (jobSummary) {
              blocks.push(
                paraXml(runXml(jobSummary, { size: 20, color: darkText, font }), {
                  spaceBefore: 0,
                  spaceAfter: 40,
                  line: 252,
                })
              );
            }

            const bullets = Array.isArray(item.bullets)
              ? item.bullets.map((b: any) => String(b || "").trim()).filter(Boolean)
              : [];
            for (const b of bullets) {
              blocks.push(
                paraXml(
                  runXml("\u2022  ", { bold: true, size: 20, color: accent, font }) +
                    runXml(b, { size: 20, color: darkText, font }),
                  { spaceBefore: 10, spaceAfter: 35, line: 252, indentLeft: 280, hanging: 160 }
                )
              );
            }
          }
        }
      } else if (secKey === "education") {
        const edu = Array.isArray(c.education) ? c.education : [];
        if (edu.length) {
          blocks.push(sectionHeading(lbl("education", "Education"), accent, font));
          for (const item of edu) {
            const degree = String(item.degree || item.title || "").trim();
            const school = String(item.school || item.institution || "").trim();
            const meta = [item.location, item.period || item.date || item.dates].filter(Boolean).join("  |  ");
            const details = String(item.details || item.gpa || "").trim();

            const headRuns = [
              degree ? runXml(degree, { bold: true, size: 21, color: darkText, font }) : "",
              school ? runXml(degree ? ` \u2014 ${school}` : school, { size: 21, color: darkText, font }) : "",
            ].join("");
            if (headRuns) {
              blocks.push(paraXml(headRuns, { spaceBefore: 80, spaceAfter: 20, keepNext: true }));
            }
            if (meta) {
              blocks.push(
                paraXml(runXml(meta, { italic: true, size: 19, color: mutedText, font }), {
                  spaceBefore: 0,
                  spaceAfter: details ? 20 : 60,
                })
              );
            }
            if (details) {
              blocks.push(
                paraXml(runXml(details, { size: 19, color: darkText, font }), {
                  spaceBefore: 0,
                  spaceAfter: 60,
                })
              );
            }
          }
        }
      } else if (secKey === "skills") {
        const coreSkills = toStringList(c.skills || c.professionalSkills || c.areasOfExpertise);
        const techSkills = toStringList(c.technicalSkills);
        if (coreSkills.length || techSkills.length) {
          blocks.push(sectionHeading(lbl("skills", "Skills"), accent, font));
          if (coreSkills.length) {
            blocks.push(
              paraXml(
                runXml("Core Competencies: ", { bold: true, size: 20, color: darkText, font }) +
                  runXml(coreSkills.join(" \u00B7 "), { size: 20, color: darkText, font }),
                { spaceBefore: 20, spaceAfter: 50, line: 252 }
              )
            );
          }
          if (techSkills.length) {
            blocks.push(
              paraXml(
                runXml("Technical Skills: ", { bold: true, size: 20, color: darkText, font }) +
                  runXml(techSkills.join(" \u00B7 "), { size: 20, color: darkText, font }),
                { spaceBefore: 20, spaceAfter: 60, line: 252 }
              )
            );
          }
        }
      } else if (secKey === "certifications") {
        const certs = Array.isArray(c.certifications) ? c.certifications : [];
        if (certs.length) {
          blocks.push(sectionHeading(lbl("certifications", "Certifications"), accent, font));
          for (const item of certs) {
            const line =
              typeof item === "string"
                ? item
                : [item.name || item.title, item.issuer, item.date].filter(Boolean).join(" \u2014 ");
            if (line.trim()) {
              blocks.push(
                paraXml(
                  runXml("\u2022  ", { bold: true, size: 20, color: accent, font }) +
                    runXml(line.trim(), { size: 20, color: darkText, font }),
                  { spaceBefore: 10, spaceAfter: 35, indentLeft: 280, hanging: 160 }
                )
              );
            }
          }
        }
      } else if (secKey === "projects") {
        const projects = Array.isArray(c.projects) ? c.projects : [];
        if (projects.length) {
          blocks.push(sectionHeading(lbl("projects", "Projects"), accent, font));
          for (const p of projects) {
            const pName = String(p.name || p.title || "").trim();
            const pDesc = String(p.description || p.summary || "").trim();
            if (pName || pDesc) {
              blocks.push(
                paraXml(
                  (pName ? runXml(pName + (pDesc ? ": " : ""), { bold: true, size: 20, color: darkText, font }) : "") +
                    (pDesc ? runXml(pDesc, { size: 20, color: darkText, font }) : ""),
                  { spaceBefore: 30, spaceAfter: 50, line: 252 }
                )
              );
            }
          }
        }
      } else if (secKey === "languages") {
        const langs = toStringList(c.languages);
        if (langs.length) {
          blocks.push(sectionHeading(lbl("languages", "Languages"), accent, font));
          blocks.push(
            paraXml(runXml(langs.join(" \u00B7 "), { size: 20, color: darkText, font }), {
              spaceBefore: 20,
              spaceAfter: 60,
            })
          );
        }
      }
    }
  }

  // Page dimensions in twips (1 inch = 1440 twips)
  const pgW = pageSize === "Letter" ? 12240 : 11906;
  const pgH = pageSize === "Letter" ? 15840 : 16838;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${blocks.join("\n    ")}
    <w:sectPr>
      <w:pgSz w:w="${pgW}" w:h="${pgH}"/>
      <w:pgMar w:top="864" w:right="936" w:bottom="864" w:left="936" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="${escapeXml(font)}" w:hAnsi="${escapeXml(font)}" w:cs="${escapeXml(font)}"/>
        <w:sz w:val="20"/>
        <w:szCs w:val="20"/>
        <w:color w:val="${darkText}"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
</w:styles>`;

  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypesXml);
  zip.file("_rels/.rels", rootRelsXml);
  zip.file("word/_rels/document.xml.rels", docRelsXml);
  zip.file("word/styles.xml", stylesXml);
  zip.file("word/document.xml", documentXml);

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return { buffer };
}