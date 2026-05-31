"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export type UploadImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function uploadProductImage(
  productId: string,
  formData: FormData
): Promise<UploadImageResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "ファイルを選択してください" };
  if (file.size > MAX_BYTES) return { ok: false, error: "5MB 以下のファイルを選択してください" };
  if (!file.type.startsWith("image/")) return { ok: false, error: "画像ファイルを選択してください" };

  // 自分のプロダクトか確認
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("maker_id", user.id)
    .single();
  if (!product) return { ok: false, error: "プロダクトが見つかりません" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${productId}/thumbnail.${ext}`;

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: uploadError } = await adminClient.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: urlData } = adminClient.storage
    .from(BUCKET)
    .getPublicUrl(path);

  const publicUrl = urlData.publicUrl;

  // DB に保存
  await supabase
    .from("products")
    .update({ thumbnail_url: publicUrl })
    .eq("id", productId);

  revalidatePath(`/products/${productId}`);
  revalidatePath(`/maker`);

  return { ok: true, url: publicUrl };
}
