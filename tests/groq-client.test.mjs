import test from "node:test";
import assert from "node:assert/strict";
import { groqSeparate } from "../src/groq-client.mjs";

const auth = "a".repeat(28);
const endpoint = "https://onjeom-groq.example.vercel.app/api/organize";

test("Groq client sends only explicitly authorized thought; original remains untouched", async () => {
  let captured = null;
  const result = await groqSeparate("빨래하고 친구에게 답장하기", {
    endpoint, accessToken: auth,
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return { ok: true, async json() { return { provider: "groq", tasks: [
        { title: "빨래하기", evidence: "빨래하고" },
        { title: "친구에게 답장하기", evidence: "친구에게 답장하기" }
      ] }; } };
    }
  });
  assert.deepEqual(result, ["빨래하기", "친구에게 답장하기"]);
  assert.equal(captured.url, endpoint);
  assert.deepEqual(JSON.parse(captured.init.body), { text: "빨래하고 친구에게 답장하기" });
  assert.equal(captured.init.headers.Authorization, "Bearer " + auth);
  assert.ok(!captured.init.body.includes(auth));
});
test("Groq client refuses insecure remote servers and missing credentials", async () => {
  await assert.rejects(groqSeparate("할 일", { endpoint: "http://example.org/api/organize", accessToken: auth }), /HTTPS/);
  await assert.rejects(groqSeparate("할 일", { endpoint, accessToken: "" }), /접근 코드/);
});
test("Groq client rejects hallucinated citations and explains backend failures", async () => {
  await assert.rejects(groqSeparate("빨래하기", {
    endpoint, accessToken: auth,
    fetchImpl: async () => ({ ok: true, async json() {
      return { provider: "groq", tasks: [{ title: "없는 일", evidence: "운동하기" }] };
    } })
  }), /일치하지/);
  await assert.rejects(groqSeparate("빨래하기", {
    endpoint, accessToken: auth,
    fetchImpl: async () => ({ ok: false, async json() { return {error:"서버 준비 전입니다."}; } })
  }), /준비 전/);
});
