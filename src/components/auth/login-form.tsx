"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeNextPath } from "@/lib/locale-path";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Mode = "login" | "signup";

/** @param nextPath ロケールなしパス（例: `/maker`）。next-intl の router が付与する */
export function LoginForm({ nextPath }: { nextPath: string }) {
  const t = useTranslations("login");
  const locale = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push(normalizeNextPath(nextPath));
        router.refresh();
        return;
      }

      const next = normalizeNextPath(nextPath);
      const redirectTo = `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(next)}`;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        router.push(normalizeNextPath(nextPath));
        router.refresh();
        return;
      }

      setMessage(t("signupConfirm"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("authFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "login" ? t("cardLogin") : t("cardSignup")}</CardTitle>
        <CardDescription>{t("cardDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2" role="tablist" aria-label={t("cardDesc")}>
          <Button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            variant={mode === "login" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => switchMode("login")}
          >
            {t("cardLogin")}
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            variant={mode === "signup" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => switchMode("signup")}
          >
            {t("cardSignup")}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-muted-foreground" role="status">
              {message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? t("submitting")
              : mode === "login"
                ? t("submitLogin")
                : t("submitSignup")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
