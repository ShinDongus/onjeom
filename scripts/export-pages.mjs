import { spawnSync } from "node:child_process";
const env = { ...process.env, ONJEOM_WEB_BASE_PATH: "/onjeom" };
const result = spawnSync(
  process.execPath,
  [
    "node_modules/expo/bin/cli",
    "export",
    "--platform",
    "web",
    "--output-dir",
    "dist-preview",
  ],
  { env, stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status || 1);
const prepared = spawnSync(
  process.execPath,
  ["scripts/prepare-iphone-web.mjs"],
  { env, stdio: "inherit" },
);
if (prepared.status !== 0) process.exit(prepared.status || 1);
await import("./prepare-ui-review.mjs");
