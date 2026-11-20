import type { Content } from "./store";

export type HeadingDictionary = {
  contact: string;
  summary: string;
  profile: string;
  areasOfExpertise: string;
  experience: string;
  education: string;
  educationAndCerts: string;
  profDev: string;
  certifications: string;
  certAndLicense: string;
  skills: string;
  professional: string;
  technical: string;
  references: string;
  dear: string;
  sincerely: string;
  rtl?: boolean;
};

export const HEADING_TRANSLATIONS: Record<string, HeadingDictionary> = {
  "English (US)": {
    contact: "CONTACT",
    summary: "PROFESSIONAL SUMMARY",
    profile: "PROFESSIONAL PROFILE",
    areasOfExpertise: "Areas of Expertise:",
    experience: "PROFESSIONAL EXPERIENCE",
    education: "EDUCATION",
    educationAndCerts: "EDUCATION & CERTIFICATIONS",
    profDev: "PROFESSIONAL DEVELOPMENT",
    certifications: "CERTIFICATIONS",
    certAndLicense: "CERTIFICATION & LICENSES",
    skills: "SKILLS",
    professional: "PROFESSIONAL",
    technical: "TECHNICAL",
    references: "REFERENCES",
    dear: "Dear Hiring Manager,",
    sincerely: "Sincerely,",
    rtl: false,
  },
  "Français": {
    contact: "CONTACT",
    summary: "PROFIL PROFESSIONNEL",
    profile: "PROFIL PROFESSIONNEL",
    areasOfExpertise: "Domaines d'expertise :",
    experience: "EXPÉRIENCE PROFESSIONNELLE",
    education: "FORMATION",
    educationAndCerts: "FORMATION ET CERTIFICATIONS",
    profDev: "DÉVELOPPEMENT PROFESSIONNEL",
    certifications: "CERTIFICATIONS",
    certAndLicense: "CERTIFICATIONS ET LICENCES",
    skills: "COMPÉTENCES",
    professional: "PROFESSIONNELLES",
    technical: "TECHNIQUES",
    references: "RÉFÉRENCES PROFESSIONNELLES",
    dear: "Madame, Monsieur,",
    sincerely: "Cordialement,",
    rtl: false,
  },
  "Deutsch": {
    contact: "KONTAKT",
    summary: "BERUFSPROFIL",
    profile: "KURZPROFIL",
    areasOfExpertise: "Kernkompetenzen:",
    experience: "BERUFSERFAHRUNG",
    education: "AUSBILDUNG",
    educationAndCerts: "AUSBILDUNG & ZERTIFIKATE",
    profDev: "WEITERBILDUNG",
    certifications: "ZERTIFIZIERUNGEN",
    certAndLicense: "ZERTIFIKATE & LIZENZEN",
    skills: "KENNTNISSE",
    professional: "FACHLICH",
    technical: "TECHNISCH",
    references: "REFERENZEN",
    dear: "Sehr geehrte Damen und Herren,",
    sincerely: "Mit freundlichen Grüßen,",
    rtl: false,
  },
  "Español": {
    contact: "CONTACTO",
    summary: "RESUMEN PROFESIONAL",
    profile: "PERFIL PROFESIONAL",
    areasOfExpertise: "Áreas de especialización:",
    experience: "EXPERIENCIA PROFESIONAL",
    education: "EDUCACIÓN",
    educationAndCerts: "EDUCACIÓN Y CERTIFICACIONES",
    profDev: "DESARROLLO PROFESIONAL",
    certifications: "CERTIFICACIONES",
    certAndLicense: "CERTIFICACIONES Y LICENCIAS",
    skills: "HABILIDADES",
    professional: "PROFESIONALES",
    technical: "TÉCNICAS",
    references: "REFERENCIAS",
    dear: "Estimado/a responsable de selección:",
    sincerely: "Atentamente,",
    rtl: false,
  },
  "Italiano": {
    contact: "CONTATTI",
    summary: "PROFILO PROFESSIONALE",
    profile: "PROFILO PROFESSIONALE",
    areasOfExpertise: "Aree di competenza:",
    experience: "ESPERIENZA LAVORATIVA",
    education: "ISTRUZIONE",
    educationAndCerts: "ISTRUZIONE E CERTIFICAZIONI",
    profDev: "SVILUPPO PROFESSIONALE",
    certifications: "CERTIFICAZIONI",
    certAndLicense: "CERTIFICAZIONI E LICENZE",
    skills: "COMPETENZE",
    professional: "PROFESSIONALI",
    technical: "TECNICHE",
    references: "REFERENZE",
    dear: "Gentile Responsabile delle Risorse Umane,",
    sincerely: "Cordiali saluti,",
    rtl: false,
  },
  "فارسی": {
    contact: "اطلاعات تماس",
    summary: "خلاصه سوابق حرفه‌ای",
    profile: "پروفایل حرفه‌ای",
    areasOfExpertise: "حوزه‌های تخصصی:",
    experience: "سوابق شغلی و حرفه‌ای",
    education: "تحصیلات",
    educationAndCerts: "تحصیلات و گواهینامه‌ها",
    profDev: "توسعه فردی و دوره‌ها",
    certifications: "گواهینامه‌ها",
    certAndLicense: "گواهینامه‌ها و مجوزها",
    skills: "مهارت‌ها",
    professional: "مهارت‌های حرفه‌ای",
    technical: "مهارت‌های فنی و نرم‌افزاری",
    references: "معرف‌های حرفه‌ای",
    dear: "مدیریت محترم جذب و استخدام،",
    sincerely: "با احترام،",
    rtl: true,
  },
  "العربية": {
    contact: "معلومات الاتصال",
    summary: "الملخص المهني",
    profile: "الملف المهني",
    areasOfExpertise: "مجالات الخبرة:",
    experience: "الخبرة المهنية",
    education: "التعليم",
    educationAndCerts: "التعليم والشهادات",
    profDev: "التطوير المهني",
    certifications: "الشهادات",
    certAndLicense: "الشهادات والتراخيص",
    skills: "المهارات",
    professional: "المهارات المهنية",
    technical: "المهارات التقنية",
    references: "المراجع المهنية",
    dear: "عزيزي مدير التوظيف،",
    sincerely: "مع خالص التحية،",
    rtl: true,
  },
  "Türkçe": {
    contact: "İLETİŞİM",
    summary: "PROFESYONEL ÖZET",
    profile: "PROFESYONEL PROFİL",
    areasOfExpertise: "Uzmanlık Alanları:",
    experience: "İŞ DENEYİMİ",
    education: "EĞİTİM",
    educationAndCerts: "EĞİTİM VE SERTİFİKALAR",
    profDev: "MESLEKİ GELİŞİM",
    certifications: "SERTİFİKALAR",
    certAndLicense: "SERTİFİKA VE LİSANSLAR",
    skills: "YETENEKLER",
    professional: "PROFESYONEL",
    technical: "TEKNİK",
    references: "REFERANSLAR",
    dear: "Sayın İşe Alım Yöneticisi,",
    sincerely: "Saygılarımla,",
    rtl: false,
  },
};

export function getHeadingsForLang(lang?: string): HeadingDictionary {
  if (!lang) return HEADING_TRANSLATIONS["English (US)"];
  if (HEADING_TRANSLATIONS[lang]) return HEADING_TRANSLATIONS[lang];
  if (lang.startsWith("English")) return HEADING_TRANSLATIONS["English (US)"];
  return HEADING_TRANSLATIONS["English (US)"];
}

export function translateResumeContent(c: Content, targetLang: string): Content {
  if (targetLang === "فارسی") {
    return {
      ...c,
      role: c.role === "YOUR PROFESSION" || c.role === "Product Designer" ? "طراح ارشد محصول" : c.role,
      summary:
        "متخصص باتجربه با سابقه اثبات‌شده در بهینه‌سازی فرآیندها، هدایت تیم‌های میان‌رشته‌ای و ارائه نتایج قابل اندازه‌گیری در پروژه‌های سازمانی. تمرکز بر خلق ارزش پایدار، ارتقای بهره‌وری و پیاده‌سازی استانداردهای روز.",
      skills: ["مدیریت پروژه", "رهبری استراتژیک", "تفکر تحلیلی", "حل مسئله", "ارتباطات موثر", "بهینه‌سازی فرآیندها"],
      technicalSkills: ["Microsoft Office Suite", "Figma & Adobe CC", "تحلیل داده", "مدیریت جریان کار"],
      experience: (c.experience || []).map((e, i) => ({
        ...e,
        role: i === 0 ? "مدیر و طراح ارشد پروژه" : "کارشناس ارشد عملیات و توسعه",
        company: "نام شرکت یا سازمان / شهر",
        period: i === 0 ? "۱۴۰۲ \u2013 تاکنون" : "۱۴۰۰ \u2013 ۱۴۰۲",
        overview: e.showOverview ? "مسئولیت هدایت تیم، برنامه‌ریزی استراتژیک و ارتقای شاخص‌های کلیدی عملکرد در سطح سازمان." : e.overview,
        bullets: [
          "افزایش بهره‌وری عملیاتی به میزان ۲۵٪ از طریق استانداردسازی فرآیندها و اجرای راهکارهای داده‌محور.",
          "هدایت تیم‌های تخصصی برای تحویل بهنگام پروژه‌های کلیدی منطبق با اهداف کلان سازمان.",
          "بهبود تجربه کاربری و رضایت ذی‌نفعان تا ۹۴٪ با پیاده‌سازی سیستم‌های نوین پایش کیفیت.",
        ],
        description:
          "\u2022 افزایش بهره‌وری عملیاتی به میزان ۲۵٪ از طریق استانداردسازی فرآیندها.\n\u2022 هدایت تیم‌های تخصصی برای تحویل بهنگام پروژه‌های کلیدی.\n\u2022 بهبود تجربه کاربری و رضایت ذی‌نفعان تا ۹۴٪.",
      })),
      education: (c.education || []).map((ed) => ({
        ...ed,
        degree: "کارشناسی ارشد / کارشناسی تخصصی",
        school: "نام دانشگاه معتبر - شهر",
        period: "۱۴۰۱",
      })),
      certifications: (c.certifications || []).map((ct) => ({
        ...ct,
        name: "گواهینامه تخصصی بین‌المللی",
        issuer: "موسسه صادرکننده معتبر",
        date: "۱۴۰۳",
      })),
      letter: {
        ...c.letter,
        to: "مدیریت محترم استخدام",
        company: "نام سازمان هدف",
        subject: "درخواست همکاری برای موقعیت شغلی",
        body: `مدیریت محترم جذب و استخدام،\n\nبا سلام و احترام، بدین‌وسیله علاقه‌مندی خود را جهت همکاری در آن مجموعه اعلام می‌دارم. با تکیه بر سوابق اجرایی، توانایی مدیریت پروژه‌های چندوجهی و تمرکز بر دستاوردهای کمی و قابل سنجش، اطمینان دارم که می‌توانم نقش موثری در پیشبرد اهداف تیم شما ایفا نمایم.\n\nپیشاپیش از زمان و توجه شما سپاسگزارم.\n\nبا احترام،\n${c.name}`,
      },
    };
  }

  if (targetLang === "Français") {
    return {
      ...c,
      role: "VOTRE PROFESSION",
      summary:
        "Professionnel expérimenté avec une solide expertise dans l'optimisation des processus, la direction d'équipes transversales et la réalisation d'objectifs mesurables à forte valeur ajoutée.",
      skills: ["Gestion de projet", "Leadership stratégique", "Résolution de problèmes", "Communication", "Optimisation des processus", "Esprit critique"],
      experience: (c.experience || []).map((e, i) => ({
        ...e,
        role: "INTITULÉ DE VOTRE POSTE",
        company: "Nom de l'entreprise / Ville",
        period: i === 0 ? "2023 \u2013 Présent" : "2021 \u2013 2023",
        bullets: [
          "Pilotage d'initiatives stratégiques ayant permis d'accroître l'efficacité opérationnelle de 22 %.",
          "Coordination d'équipes pluridisciplinaires pour livrer des projets complexes dans les délais impartis.",
          "Mise en place d'indicateurs de performance (KPI) pour optimiser l'allocation des ressources.",
        ],
        description:
          "\u2022 Pilotage d'initiatives stratégiques (+22 % d'efficacité).\n\u2022 Coordination d'équipes pluridisciplinaires.\n\u2022 Mise en place d'indicateurs de performance (KPI).",
      })),
    };
  }

  if (targetLang === "Deutsch") {
    return {
      ...c,
      role: "IHRE BERUFSBEZEICHNUNG",
      summary:
        "Ergebnisorientierte Fachkraft mit nachgewiesener Erfahrung in der Prozessoptimierung, der Leitung funktionsübergreifender Teams und der Erzielung messbarer Unternehmenserfolge.",
      skills: ["Projektmanagement", "Strategische Führung", "Problemlösung", "Teamleitung", "Prozessoptimierung", "Analytisches Denken"],
      experience: (c.experience || []).map((e, i) => ({
        ...e,
        role: "IHRE POSITION HIER EINGEBEN",
        company: "Unternehmensname / Ort",
        period: i === 0 ? "2023 \u2013 Heute" : "2021 \u2013 2023",
        bullets: [
          "Steigerung der operativen Effizienz um 24 % durch Einführung standardisierter Arbeitsabläufe.",
          "Erfolgreiche Leitung interdisziplinärer Projektteams unter Einhaltung aller Zeit- und Budgetvorgaben.",
          "Entwicklung datengestützter Entscheidungsgrundlagen für das Senior Management.",
        ],
        description:
          "\u2022 Steigerung der operativen Effizienz um 24 %.\n\u2022 Erfolgreiche Leitung interdisziplinärer Projektteams.\n\u2022 Entwicklung datengestützter Entscheidungsgrundlagen.",
      })),
    };
  }

  if (targetLang === "Español") {
    return {
      ...c,
      role: "TU PROFESIÓN",
      summary:
        "Profesional orientado a resultados con amplia experiencia en liderazgo de equipos, optimización de procesos operativos y generación de impacto medible en objetivos estratégicos.",
      skills: ["Gestión de proyectos", "Liderazgo estratégico", "Resolución de conflictos", "Dirección de equipos", "Comunicación efectiva", "Optimización de recursos"],
      experience: (c.experience || []).map((e, i) => ({
        ...e,
        role: "INGRESA TU PUESTO AQUÍ",
        company: "Nombre de la empresa / Ubicación",
        period: i === 0 ? "2023 \u2013 Presente" : "2021 \u2013 2023",
        bullets: [
          "Lideré iniciativas de mejora continua que incrementaron la eficiencia operativa en un 20 %.",
          "Coordiné equipos multidisciplinarios asegurando entregas puntuales y cumplimiento de objetivos.",
          "Implementé métricas clave de rendimiento para optimizar la toma de decisiones.",
        ],
        description:
          "\u2022 Lideré iniciativas de mejora continua (+20 %).\n\u2022 Coordiné equipos multidisciplinarios.\n\u2022 Implementé métricas clave de rendimiento.",
      })),
    };
  }

  return c;
}