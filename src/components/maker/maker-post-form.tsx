"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addMakerPost } from "@/app/[locale]/maker/actions";

export function MakerPostForm() {
  const t = useTranslations("maker");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addMakerPost(body);
      if (result.error) {
        setError(result.error);
        return;
      }
      setBody("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("postPlaceholder")}
        rows={3}
        maxLength={2000}
        disabled={isPending}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
        {isPending ? t("postPosting") : t("postSubmit")}
      </Button>
    </form>
  );
}
