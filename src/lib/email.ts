import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "ShipFirst <noreply@shipfirst.vercel.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shipfirst.vercel.app";

export async function sendCheerNotification({
  makerEmail,
  makerName,
  productName,
  productId,
  cheererName,
}: {
  makerEmail: string;
  makerName: string;
  productName: string;
  productId: string;
  cheererName?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const productUrl = `${APP_URL}/en/products/${productId}`;
  await resend.emails.send({
    from: FROM,
    to: makerEmail,
    subject: `🎉 ${productName} に応援が届きました！`,
    html: emailHtml({
      title: `応援が届きました！ 🎉`,
      body: `${cheererName ?? "誰か"} が <strong>${productName}</strong> を応援しました。<br/>あなたのプロダクトが誰かの心を動かしています。`,
      ctaLabel: "プロダクトを見る",
      ctaUrl: productUrl,
      recipientName: makerName,
    }),
  });
}

export async function sendCommentNotification({
  makerEmail,
  makerName,
  productName,
  productId,
  commenterName,
  commentBody,
}: {
  makerEmail: string;
  makerName: string;
  productName: string;
  productId: string;
  commenterName?: string;
  commentBody: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const productUrl = `${APP_URL}/en/products/${productId}`;
  await resend.emails.send({
    from: FROM,
    to: makerEmail,
    subject: `💬 ${productName} にコメントが届きました`,
    html: emailHtml({
      title: `新しいコメント 💬`,
      body: `<strong>${commenterName ?? "ユーザー"}</strong> が <strong>${productName}</strong> にコメントしました：<br/><blockquote style="border-left:3px solid #6366f1;padding-left:12px;margin:16px 0;color:#555">${commentBody.slice(0, 200)}</blockquote>`,
      ctaLabel: "コメントを見る",
      ctaUrl: productUrl,
      recipientName: makerName,
    }),
  });
}

function emailHtml({
  title,
  body,
  ctaLabel,
  ctaUrl,
  recipientName,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  recipientName: string;
}) {
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.07)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0a0a0a,#1a1a2e);padding:28px 36px">
            <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px">🚀 ShipFirst</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 24px">
            <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999">ShipFirst より</p>
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111;letter-spacing:-0.5px">${title}</h1>
            <p style="margin:0 0 8px;font-size:14px;color:#555">こんにちは、${recipientName} さん</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#333">${body}</p>
            <a href="${ctaUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;letter-spacing:-0.2px">${ctaLabel} →</a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px;border-top:1px solid #f0f0f0">
            <p style="margin:0;font-size:12px;color:#aaa">
              このメールは ShipFirst から自動送信されています。<br/>
              <a href="${APP_URL}" style="color:#6366f1;text-decoration:none">shipfirst.vercel.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
