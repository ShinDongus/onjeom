import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
test("첨부 원본의 모든 파일을 바이트 그대로 보존", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../prototype-source.json", import.meta.url),
      "utf8",
    ),
  );
  for (const [path, hash] of Object.entries(manifest.sha256))
    assert.equal(
      createHash("sha256")
        .update(
          await readFile(new URL("../prototype/" + path, import.meta.url)),
        )
        .digest("hex"),
      hash,
      path,
    );
  assert.equal(
    await readFile(new URL("../AGENTS.md", import.meta.url), "utf8"),
    await readFile(new URL("../prototype/AGENTS.md", import.meta.url), "utf8"),
  );
});
