import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/** `/` 直アクセス時のフォールバック（proxy と同様にデフォルトロケールへ） */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
