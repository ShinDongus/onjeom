import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
const root = resolve(".");
const git = (args, env = process.env) =>
  execFileSync("git", args, {
    cwd: root,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const origin = git(["config", "--get", "remote.origin.url"]);
let identity;
try {
  identity = new URL(
    origin.replace(/^git@github\.com:/, "ssh://git@github.com/"),
  );
} catch {
  throw Error("Cannot identify the origin repository.");
}
if (
  identity.hostname !== "github.com" ||
  identity.pathname.replace(/\.git$/, "").toLowerCase() !== "/shindongus/onjeom"
)
  throw Error("This publisher is configured only for ShinDongus/onjeom.");
const html = await readFile("dist-preview/index.html", "utf8");
if (!html.includes("/onjeom/_expo/"))
  throw Error("Run npm run export:pages before publishing.");
for (const file of ["sw.js", "manifest.webmanifest", ".nojekyll"])
  await access(join("dist-preview", file));
const remote = git(["ls-remote", "--heads", "origin", "refs/heads/gh-pages"]);
let parent = null;
if (remote) {
  git(["fetch", "origin", "refs/heads/gh-pages"]);
  parent = git(["rev-parse", "FETCH_HEAD"]);
  try {
    git(["cat-file", "-e", parent + ":CNAME"]);
    throw Error(
      "Custom domain configured. Review its base path before publishing.",
    );
  } catch (error) {
    if (!error.status) throw error;
  }
}
const temporary = await mkdtemp(join(tmpdir(), "onjeom-pages-index-"));
const env = { ...process.env, GIT_INDEX_FILE: join(temporary, "index") };
try {
  git(["read-tree", "--empty"], env);
  git(["add", "-f", "--", "dist-preview"], env);
  const container = git(["write-tree"], env);
  const tree = git(["rev-parse", container + ":dist-preview"]);
  const args = [
    "commit-tree",
    tree,
    "-m",
    "Deploy iPhone home-screen web app from " +
      git(["rev-parse", "--short", "HEAD"]),
  ];
  if (parent) args.push("-p", parent);
  const commit = git(args);
  // Fast-forward only; never force a concurrent deployment or change the source checkout.
  console.log(git(["push", "origin", commit + ":refs/heads/gh-pages"]));
  console.log("Deployment branch uploaded: " + commit);
  console.log(
    "Pages must be enabled for gh-pages / (root): https://github.com/ShinDongus/onjeom/settings/pages",
  );
  console.log(
    "Expected site after activation: https://shindongus.github.io/onjeom/",
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
