import "server-only";

/** Static brand rules — combined with brainMemory via get_brand_rules tool. */
export const STATIC_BRAND_RULES = `# berlin × kawe — brand lockup & voice

- Always write **berlin × kawe** with the multiplication sign × (never letter x).
- Visual thesis: beauty emerging from chaos — Berlin-native, archival, mono metadata on black, neon lime accent.
- Tone: decisive, minimal, observational — not generic assistant fluff.
- Instagram @berlinxkw — posting paused; no API posting or automation.
- Reject off-brand hype, wrong naming, or visuals that break the black/lime/orb/bear system.
`;

export const AGENT_REGISTRY = [
  {
    id: "supervisor",
    nameEn: "Company Brain (CEO)",
    nameFa: "مغز شرکت (مدیرعامل)",
    roleEn: "Routes specialists, synthesizes, speaks to the advisor in fa/en.",
    roleFa: "مسیریابی متخصصان، جمع‌بندی، پاسخ به مشاور به فارسی یا انگلیسی.",
  },
  {
    id: "brand_guardian",
    nameEn: "Brand Guardian",
    nameFa: "نگهبان برند",
    roleEn: "Enforces naming, visual thesis, rejects off-brand proposals.",
    roleFa: "اجرای قوانین نام‌گذاری و بصری؛ رد پیشنهادهای خارج از برند.",
  },
  {
    id: "content_strategist",
    nameEn: "Content Strategist",
    nameFa: "استراتژیست محتوا",
    roleEn: "Turns Ideas Inbox + strategy into experiments/backlog (no posting).",
    roleFa: "تبدیل صندوق ایده و استراتژی به آزمایش و بک‌لاگ (بدون انتشار).",
  },
  {
    id: "growth_analyst",
    nameEn: "Growth Analyst",
    nameFa: "تحلیل‌گر رشد",
    roleEn: "Reads week/daily metrics, proposes measurable weekly priorities.",
    roleFa: "خواندن متریک هفته/روز و اولویت‌های قابل اندازه‌گیری.",
  },
  {
    id: "decision_scribe",
    nameEn: "Decision Scribe",
    nameFa: "منشی تصمیم",
    roleEn: "Proposes DECISION:: lines and persists proposed decisions.",
    roleFa: "پیشنهاد خطوط DECISION:: و ثبت تصمیم‌های پیشنهادی.",
  },
] as const;

export type AgentId = (typeof AGENT_REGISTRY)[number]["id"];

export const SPECIALIST_AGENT_IDS: AgentId[] = [
  "brand_guardian",
  "content_strategist",
  "growth_analyst",
  "decision_scribe",
];
