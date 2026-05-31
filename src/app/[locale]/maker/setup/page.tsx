import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "LemonSqueezy セットアップガイド | ShipFirst",
  description:
    "ShipFirstでプロダクトを販売するために必要なLemonSqueezyの設定手順をステップごとに解説します。",
};

const steps = [
  {
    number: "01",
    emoji: "🍋",
    title: "LemonSqueezy アカウントを作成",
    body: "app.lemonsqueezy.com にアクセスし、無料アカウントを作成します。メールアドレスで簡単に登録できます。",
    cta: { label: "LemonSqueezy を開く", href: "https://app.lemonsqueezy.com" },
  },
  {
    number: "02",
    emoji: "📦",
    title: "ストアとプロダクトを作成",
    body: "ダッシュボードの「Products」→「+ New product」からプロダクトを作成します。名前・説明・価格・ファイルを設定して公開しましょう。",
    cta: { label: "Products へ", href: "https://app.lemonsqueezy.com/products" },
  },
  {
    number: "03",
    emoji: "🤝",
    title: "アフィリエイトプログラムを有効化",
    body: '左メニューの「Affiliates」→「Program settings」を開き、「Enable affiliate program」をオンにします。コミッション率を 15% 以上に設定し、「Open program（誰でも参加可）」を選択して保存してください。',
    cta: { label: "Affiliates 設定へ", href: "https://app.lemonsqueezy.com/affiliates" },
    important: "コミッション率が15%未満の場合、ShipFirstのアフィリエイト収益が確保できないため、購入ボタンが無効化されることがあります。",
  },
  {
    number: "04",
    emoji: "🔗",
    title: "購入URLをコピー",
    body: "プロダクトページを開き、購入ボタンのURLをコピーします。形式は https://yourstore.lemonsqueezy.com/buy/xxxxx のようになります。",
    tip: "プロダクト詳細画面の「Share」または「Buy link」からコピーできます。",
  },
  {
    number: "05",
    emoji: "🚀",
    title: "ShipFirst にプロダクトを登録",
    body: "「プロダクトを掲載する」から新規登録し、「LemonSqueezy 購入URL」フィールドにコピーしたURLを貼り付けます。あとは価格・説明・画像を設定して公開するだけです！",
    cta: { label: "プロダクトを掲載する", href: "/maker/products/new" },
  },
];

export default function LsSetupPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/maker"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-8 -ml-2")}
      >
        ← ダッシュボードへ
      </Link>

      {/* Header */}
      <div className="mb-12 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🍋</span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            LemonSqueezy セットアップガイド
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          5ステップで ShipFirst × LemonSqueezy の販売設定が完了します。
          設定後は購入ボタンが自動でアフィリエイトリンクになり、
          売れるたびに LemonSqueezy が自動で収益を分配します。
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          {["掲載無料", "決済は LemonSqueezy が処理", "ShipFirst の取り分 15% は自動分配"].map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              ✓ {pill}
            </span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <ol className="relative space-y-0">
        {steps.map((step, i) => (
          <li key={step.number} className="relative flex gap-6 pb-10 last:pb-0">
            {/* vertical line */}
            {i < steps.length - 1 && (
              <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
            )}
            {/* circle */}
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/5 text-sm font-bold text-primary">
              {step.number}
            </div>
            <div className="flex-1 pt-1.5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{step.emoji}</span>
                <h2 className="text-lg font-semibold">{step.title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              {step.important && (
                <div className="rounded-lg border border-amber-400/40 bg-amber-50/60 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
                  ⚠️ <strong>重要：</strong>{step.important}
                </div>
              )}
              {step.tip && (
                <div className="rounded-lg border border-blue-400/30 bg-blue-50/50 px-4 py-3 text-sm text-blue-800 dark:border-blue-700/40 dark:bg-blue-900/20 dark:text-blue-300">
                  💡 {step.tip}
                </div>
              )}
              {step.cta && (
                <a
                  href={step.cta.href}
                  target={step.cta.href.startsWith("http") ? "_blank" : undefined}
                  rel={step.cta.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-2 w-fit"
                  )}
                >
                  {step.cta.label}
                  {step.cta.href.startsWith("http") && <span className="text-xs opacity-50">↗</span>}
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* FAQ */}
      <section className="mt-16 space-y-6">
        <h2 className="text-xl font-bold">よくある質問</h2>
        {[
          {
            q: "ShipFirst に手数料はかかりますか？",
            a: "掲載は無料です。プロダクトが売れた場合、LemonSqueezy がアフィリエイトコミッションとして自動的に 15% を ShipFirst に分配します。あなたの手元には残り 85%（LemonSqueezy の決済手数料を除く）が届きます。",
          },
          {
            q: "アフィリエイトプログラムを設定しないとどうなりますか？",
            a: "ShipFirst の購入ボタンはアフィリエイトURLを使用します。アフィリエイトプログラムが未設定の場合、購入ボタンが「現在購入できません」と表示されます。",
          },
          {
            q: "すでに LemonSqueezy で販売しているプロダクトも登録できますか？",
            a: "もちろんです！既存のプロダクトの購入URLをそのまま使用できます。アフィリエイトプログラムをオンにするだけで OK です。",
          },
          {
            q: "LemonSqueezy 以外の決済サービスは使えますか？",
            a: "現在は LemonSqueezy のみ対応しています。今後他のサービスへの対応も検討中です。",
          },
        ].map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border bg-card p-5 open:shadow-sm"
          >
            <summary className="cursor-pointer list-none text-sm font-medium">
              <span className="flex items-center justify-between gap-4">
                {item.q}
                <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
                  ▾
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </section>

      {/* CTA */}
      <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
        <p className="text-2xl">🚀</p>
        <h2 className="text-xl font-bold">設定できたら掲載してみよう</h2>
        <p className="text-sm text-muted-foreground">
          LemonSqueezy の設定が完了したら、ShipFirst にプロダクトを掲載しましょう。
        </p>
        <Link
          href="/maker/products/new"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          プロダクトを掲載する（無料）
        </Link>
      </div>
    </div>
  );
}
