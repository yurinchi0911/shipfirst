import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvConfig } from "@next/env";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// 親フォルダの lockfile 誤検知でも shipfirst の .env.local を読む
loadEnvConfig(projectRoot);

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

export default withNextIntl(nextConfig);
