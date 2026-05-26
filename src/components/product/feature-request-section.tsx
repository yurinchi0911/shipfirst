"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FeatureRequest } from "@/types/database";
import {
  addFeatureRequest,
  toggleFeatureVote,
} from "@/app/[locale]/products/[id]/actions";

type Props = {
  productId: string;
  initialRequests: FeatureRequest[];
  currentUserId: string | null;
};

export function FeatureRequestSection({
  productId,
  initialRequests,
  currentUserId,
}: Props) {
  const t = useTranslations("product");
  const [requests, setRequests] = useState(initialRequests);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !currentUserId) return;
    setError(null);
    startTransition(async () => {
      const result = await addFeatureRequest(productId, title);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRequests((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          product_id: productId,
          author_id: currentUserId,
          title: title.trim(),
          vote_count: 1,
          created_at: new Date().toISOString(),
          user_voted: true,
        },
      ]);
      setTitle("");
    });
  }

  function handleVote(req: FeatureRequest) {
    if (!currentUserId) return;
    const wasVoted = req.user_voted;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              user_voted: !wasVoted,
              vote_count: wasVoted
                ? Math.max(1, r.vote_count - 1)
                : r.vote_count + 1,
            }
          : r
      )
    );
    startTransition(async () => {
      const result = await toggleFeatureVote(req.id, productId);
      if (result.error) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id
              ? {
                  ...r,
                  user_voted: wasVoted,
                  vote_count: wasVoted ? r.vote_count + 1 : Math.max(1, r.vote_count - 1),
                }
              : r
          )
        );
      }
    });
  }

  const sorted = [...requests].sort((a, b) => b.vote_count - a.vote_count);

  return (
    <section className="mt-10 space-y-4">
      <h2 className="text-lg font-semibold">{t("featureRequestsTitle")}</h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("featureRequestsEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((req) => (
            <li
              key={req.id}
              className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3 text-sm"
            >
              <button
                type="button"
                onClick={() => handleVote(req)}
                disabled={isPending || !currentUserId}
                aria-label={req.user_voted ? t("featureRequestVoted") : t("featureRequestVote")}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors min-w-[3rem]",
                  req.user_voted
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
                  !currentUserId && "opacity-50 cursor-default"
                )}
              >
                <ChevronUp className="size-3" aria-hidden />
                {req.vote_count}
              </button>
              <span className="flex-1">{req.title}</span>
            </li>
          ))}
        </ul>
      )}

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("featureRequestPlaceholder")}
            maxLength={200}
            disabled={isPending}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={isPending || title.trim().length < 3}>
            {t("featureRequestSubmit")}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">{t("featureRequestLoginPrompt")}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
