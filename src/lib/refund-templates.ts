import type { Locale } from "@/i18n/routing";
import enMessages from "../../messages/en.json";
import jaMessages from "../../messages/ja.json";

const messagesByLocale = {
  en: enMessages,
  ja: jaMessages,
} as const;

export function getRefundTemplate(
  locale: Locale,
  id: number
): { label: string; body: string } | null {
  const templates = messagesByLocale[locale].refundTemplates as Record<
    string,
    { label: string; body?: string }
  >;
  const t = templates[String(id)];
  if (!t) return null;
  return { label: t.label, body: t.body ?? "" };
}

export function buildRefundPolicy(
  locale: Locale,
  templateId: number | null,
  customPolicy: string,
  supplement: string
): { policy: string; templateId: number | null } {
  if (templateId === 4 || templateId === null) {
    return {
      policy: customPolicy.trim(),
      templateId: templateId === 4 ? 4 : null,
    };
  }

  const template = getRefundTemplate(locale, templateId);
  if (!template) {
    return { policy: customPolicy.trim(), templateId: null };
  }

  const extra = supplement.trim();
  const policy = extra
    ? `${template.body}\n\n${extra}`
    : template.body;

  return { policy, templateId };
}
