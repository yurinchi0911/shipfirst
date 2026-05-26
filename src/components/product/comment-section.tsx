"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Comment } from "@/types/database";
import { addComment, deleteComment } from "@/app/[locale]/products/[id]/actions";

type Props = {
  productId: string;
  initialComments: Comment[];
  currentUserId: string | null;
};

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CommentSection({ productId, initialComments, currentUserId }: Props) {
  const t = useTranslations("product");
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !currentUserId) return;
    setError(null);
    startTransition(async () => {
      const result = await addComment(productId, body);
      if (result.error) {
        setError(result.error);
        return;
      }
      // Optimistic append
      setComments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          product_id: productId,
          author_id: currentUserId,
          body: body.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: { display_name: null },
        },
      ]);
      setBody("");
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      await deleteComment(commentId, productId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    });
  }

  return (
    <section className="mt-10 space-y-4">
      <h2 className="text-lg font-semibold">{t("commentsTitle")}</h2>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("commentsEmpty")}</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="flex gap-3 rounded-xl border bg-muted/20 p-4 text-sm"
            >
              <span className="size-7 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                {(c.author?.display_name ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="font-medium">
                    {c.author?.display_name ?? "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(c.created_at)}
                  </span>
                </span>
                <p className="mt-1 whitespace-pre-wrap break-words">{c.body}</p>
              </span>
              {currentUserId === c.author_id && (
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={isPending}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Delete comment"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("commentPlaceholder")}
            rows={3}
            maxLength={1000}
            disabled={isPending}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
            {isPending ? t("commentPosting") : t("commentSubmit")}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">{t("commentLoginPrompt")}</p>
      )}
    </section>
  );
}
