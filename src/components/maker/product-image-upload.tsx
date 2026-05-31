"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { uploadProductImage } from "@/app/[locale]/maker/products/upload-image";

type Props = {
  productId: string;
  currentUrl?: string | null;
};

export function ProductImageUpload({ productId, currentUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    // local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // upload
    const fd = new FormData();
    fd.append("image", file);
    startTransition(async () => {
      const result = await uploadProductImage(productId, fd);
      if (!result.ok) {
        setError(result.error);
        setPreview(currentUrl ?? null);
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">サムネイル画像</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border transition-colors hover:border-primary/40 hover:bg-muted/40"
        disabled={isPending}
      >
        {preview ? (
          <Image
            src={preview}
            alt="thumbnail"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-3xl">🖼️</span>
            <span className="text-sm">クリックして画像をアップロード</span>
            <span className="text-xs opacity-60">PNG / JPG / WebP · 5MB以下</span>
          </div>
        )}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        tabIndex={-1}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {preview && !isPending && (
        <p className="text-xs text-muted-foreground">
          画像が保存されました。クリックして変更できます。
        </p>
      )}
    </div>
  );
}
