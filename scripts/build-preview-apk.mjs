import { readFile, writeFile, mkdir, copyFile, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createHash } from "node:crypto";
const root = fileURLToPath(new URL("../", import.meta.url));
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!sdk)
  throw Error(
    "ANDROID_HOME 또는 ANDROID_SDK_ROOT에 설치된 Android SDK 경로를 지정해 주세요.",
  );
async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      ...options,
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(Error(`${command} exited with ${code}`)),
    );
  });
}
const manifest = join(root, "package.json");
const scripts = JSON.parse(await readFile(manifest, "utf8")).scripts;
await run(process.execPath, [
  join(root, "node_modules/expo/bin/cli"),
  "prebuild",
  "--platform",
  "android",
  "--no-install",
]);
// Prebuild rewrites start shortcuts; preserve the caller's existing scripts.
const prepared = JSON.parse(await readFile(manifest, "utf8"));
prepared.scripts = scripts;
await writeFile(manifest, JSON.stringify(prepared, null, 2) + "\n");
const wrapper = join(root, "android/gradle/wrapper/gradle-wrapper.properties");
let properties = await readFile(wrapper, "utf8");
// Official checksum: https://services.gradle.org/distributions/gradle-8.14.3-bin.zip.sha256
const hashes = {
  "8.14.3": "bd71102213493060956ec229d946beee57158dbd89d0e62b91bca0fa2c5f3531",
};
const version = properties.match(/gradle-([\d.]+)-bin\.zip/)?.[1];
const expected = hashes[version];
const supplied = properties.match(/^distributionSha256Sum=(.+)$/m)?.[1].trim();
if (!expected)
  throw Error(
    "이 Gradle 버전의 공식 SHA256을 확인한 뒤 빌드 스크립트를 갱신해 주세요.",
  );
if (supplied && supplied !== expected)
  throw Error("Gradle 배포본 체크섬이 공식 값과 다릅니다.");
if (!supplied) {
  properties += "\ndistributionSha256Sum=" + expected + "\n";
  await writeFile(wrapper, properties);
}
const args = [
  "assembleRelease",
  "--no-daemon",
  "--max-workers=2",
  "--console=plain",
  "-PreactNativeArchitectures=arm64-v8a",
  "-Dorg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g",
  "-Dorg.gradle.java.installations.auto-download=false",
];
const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxy) {
  const address = new URL(proxy);
  for (const protocol of ["http", "https"])
    args.push(
      `-D${protocol}.proxyHost=${address.hostname}`,
      `-D${protocol}.proxyPort=${address.port || 80}`,
    );
}
if (process.env.ONJEOM_GRADLE_TRUST_STORE)
  args.push(
    "-Djavax.net.ssl.trustStore=" + process.env.ONJEOM_GRADLE_TRUST_STORE,
  );
await run(
  join(
    root,
    "android",
    process.platform === "win32" ? "gradlew.bat" : "gradlew",
  ),
  args,
  { cwd: join(root, "android") },
);
const apk = join(root, "android/app/build/outputs/apk/release/app-release.apk");
await access(apk);
await run(
  join(
    sdk,
    "build-tools/36.0.0",
    process.platform === "win32" ? "apksigner.bat" : "apksigner",
  ),
  ["verify", "--verbose", apk],
);
await mkdir(join(root, "artifacts"), { recursive: true });
const output = join(root, "artifacts/onjeom-preview-arm64.apk");
await copyFile(apk, output);
const sha = createHash("sha256")
  .update(await readFile(output))
  .digest("hex");
await writeFile(output + ".sha256", sha + "  onjeom-preview-arm64.apk\n");
console.log(
  "Created artifacts/onjeom-preview-arm64.apk (arm64 local preview; not a store release).",
);
