import test from "node:test";
import assert from "node:assert/strict";
import { handleOrganize } from "../backend/lib/organizer.mjs";

const env = {
  GROQ_API_KEY: "gsk_test_only_no_real_key",
  ONJEOM_ACCESS_TOKEN: "safe-" + "0".repeat(32),
  ONJEOM_ALLOWED_ORIGINS: "https://shindongus.github.io",
};
function request(text = "빨래하고 친구에게 답장하기", extra = {}) {
  const { headers: added = {}, ...options } = extra;
  return new Request("https://onjeom-groq.example.vercel.app/api/organize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + env.ONJEOM_ACCESS_TOKEN,
      Origin: "https://shindongus.github.io",
      ...added,
    },
    body: JSON.stringify({ text }),
    ...options,
  });
}
function validGroq() {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                tasks: [
                  { title: "빨래하기", evidence: "빨래하고" },
                  { title: "친구에게 답장하기", evidence: "친구에게 답장하기" },
                ],
              }),
            },
          },
        ],
      };
    },
  };
}
test("server accepts authorized request and sends private key only upstream", async () => {
  let upstream;
  const response = await handleOrganize(request(), {
    env,
    fetchImpl: async (url, options) => {
      upstream = { url, options };
      return validGroq();
    },
  });
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    env.ONJEOM_ALLOWED_ORIGINS,
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  const value = await response.json();
  assert.deepEqual(
    value.tasks.map((x) => x.title),
    ["빨래하기", "친구에게 답장하기"],
  );
  assert.equal(upstream.url, "https://api.groq.com/openai/v1/chat/completions");
  const payload = JSON.parse(upstream.options.body);
  assert.equal(payload.response_format.json_schema.strict, true);
  assert.equal(payload.model, "openai/gpt-oss-20b");
  assert.equal(
    upstream.options.headers.Authorization,
    "Bearer " + env.GROQ_API_KEY,
  );
  assert.ok(!JSON.stringify(value).includes(env.GROQ_API_KEY));
});
test("missing key or access code keeps AI unavailable, not mocked as success", async () => {
  const response = await handleOrganize(request(), {
    env: { ...env, GROQ_API_KEY: "" },
    fetchImpl: () => {
      throw Error("not called");
    },
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /설정되지/);
});
test("unauthorized request cannot spend upstream credits", async () => {
  const response = await handleOrganize(
    request(undefined, { headers: { Authorization: "Bearer wrong" } }),
    {
      env,
      fetchImpl: () => {
        throw Error("must not call Groq");
      },
    },
  );
  assert.equal(response.status, 401);
});
test("untrusted browser origin is blocked", async () => {
  const response = await handleOrganize(
    request(undefined, { headers: { Origin: "https://evil.invalid" } }),
    { env },
  );
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});
test("browser preflight only grants registered origin", async () => {
  const response = await handleOrganize(
    new Request("https://x.test/api/organize", {
      method: "OPTIONS",
      headers: { Origin: "https://shindongus.github.io" },
    }),
    { env },
  );
  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    env.ONJEOM_ALLOWED_ORIGINS,
  );
});
test("model hallucinations with no source evidence are rejected", async () => {
  const response = await handleOrganize(request("빨래하기"), {
    env,
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  tasks: [{ title: "병원 예약하기", evidence: "병원 예약" }],
                }),
              },
            },
          ],
        };
      },
    }),
  });
  assert.equal(response.status, 502);
});
test("upstream 429 does not expose upstream error body", async () => {
  const response = await handleOrganize(request(), {
    env,
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      async text() {
        return "private data";
      },
    }),
  });
  assert.equal(response.status, 429);
  assert.ok(!(await response.text()).includes("private data"));
});
test("overlong text and invalid JSON are refused before contacting Groq", async () => {
  const response = await handleOrganize(request("가".repeat(4001)), {
    env,
    fetchImpl: () => {
      throw Error("not called");
    },
  });
  // UTF-8 multibyte payload crosses the earlier byte-size guard.
  assert.equal(response.status, 413);
  const malformed = await handleOrganize(
    new Request("https://x.test/api/organize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + env.ONJEOM_ACCESS_TOKEN,
      },
      body: "{",
    }),
    {
      env,
      fetchImpl: () => {
        throw Error("not called");
      },
    },
  );
  assert.equal(malformed.status, 400);
});
test("non-POST requests cannot invoke Groq", async () => {
  const response = await handleOrganize(
    new Request("https://x.test/api/organize"),
    { env },
  );
  assert.equal(response.status, 405);
});
