"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/app/[locale]/account/profile/actions";

type Defaults = {
  display_name: string;
  bio: string;
  sns_twitter: string;
  sns_github: string;
  sns_website: string;
};

export function ProfileEditForm({
  defaultValues,
  userId,
}: {
  defaultValues: Defaults;
  userId: string;
}) {
  const t = useTranslations("profileEdit");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="display_name">{t("displayName")}</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={defaultValues.display_name}
          placeholder={t("displayNamePlaceholder")}
          maxLength={50}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">{t("bio")}</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={defaultValues.bio}
          placeholder={t("bioPlaceholder")}
          rows={4}
          maxLength={300}
          disabled={isPending}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t("snsTitle")}</h2>
        <div className="space-y-2">
          <Label htmlFor="sns_twitter">{t("twitter")}</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">@</span>
            <Input
              id="sns_twitter"
              name="sns_twitter"
              defaultValue={defaultValues.sns_twitter}
              placeholder="yourhandle"
              maxLength={50}
              disabled={isPending}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sns_github">{t("github")}</Label>
          <Input
            id="sns_github"
            name="sns_github"
            defaultValue={defaultValues.sns_github}
            placeholder="yourusername"
            maxLength={50}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sns_website">{t("website")}</Label>
          <Input
            id="sns_website"
            name="sns_website"
            type="url"
            defaultValue={defaultValues.sns_website}
            placeholder="https://yoursite.com"
            maxLength={200}
            disabled={isPending}
          />
        </div>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? t("saving") : saved ? `✓ ${t("saved")}` : t("save")}
      </Button>
    </form>
  );
}
