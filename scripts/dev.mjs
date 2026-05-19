#!/usr/bin/env node
import { spawn } from "node:child_process";
import net from "node:net";

const PORT = Number(process.env.PORT ?? 3000);

function portInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(port, "127.0.0.1");
  });
}

const busy = await portInUse(PORT);
if (busy) {
  console.error(
    `\n⚠  ポート ${PORT} は使用中です。別の next dev がハングしている可能性があります。\n` +
      `   解放: lsof -ti :${PORT} | xargs kill -9\n` +
      `   別ポート: PORT=3001 npm run dev\n`
  );
  process.exit(1);
}

const child = spawn("npx", ["next", "dev", "--webpack", "-p", String(PORT)], {
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
