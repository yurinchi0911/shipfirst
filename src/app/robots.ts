import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shipfirst.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/account/", "/maker/products/", "/auth/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
