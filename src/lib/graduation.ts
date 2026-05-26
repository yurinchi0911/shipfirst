import { GRADUATION_THRESHOLD_CENTS } from "@/lib/products";
import { formatPrice } from "@/lib/products";

export function graduationProgress(
  internalCents: number,
  externalCents: number
): {
  total: number;
  percent: number;
  remaining: number;
  graduated: boolean;
} {
  const total = internalCents + externalCents;
  const graduated = total >= GRADUATION_THRESHOLD_CENTS;
  const percent = Math.min(100, Math.round((total / GRADUATION_THRESHOLD_CENTS) * 100));
  const remaining = Math.max(0, GRADUATION_THRESHOLD_CENTS - total);
  return { total, percent, remaining, graduated };
}

export function formatGraduationProgress(
  internalCents: number,
  externalCents: number
): {
  earned: string;
  remaining: string;
  percent: number;
  graduated: boolean;
} {
  const { total, percent, remaining, graduated } = graduationProgress(
    internalCents,
    externalCents
  );
  return {
    earned: formatPrice(total),
    remaining: formatPrice(remaining),
    percent,
    graduated,
  };
}
