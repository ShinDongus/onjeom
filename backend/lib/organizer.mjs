import { timingSafeEqual } from "node:crypto";

const DEFAULT_MODEL = "openai/gpt-oss-20b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const leaf = {
  type: "object",
  properties: { title: { type: "string" } },
  required: ["title"],
  additionalProperties: false,
};
const step = {
  type: "object",
  properties: {
    title: { type: "string" },
    children: { type: "array", items: leaf },
  },
  required: ["title", "children"],
  additionalProperties: false,
};
const schema = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          evidence: { type: "string" },
          children: { type: "array", items: step },
        },
        required: ["title", "evidence", "children"],
        additionalProperties: false,
      },
    },
  },
  required: ["tasks"],
  additionalProperties: false,
};

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}
function safeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left),
    b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
function getCors(request, env) {
  const origin = request.headers.get("origin");
  const allowed = (env.ONJEOM_ALLOWED_ORIGINS || "https://shindongus.github.io")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (origin && !allowed.includes(origin)) return null;
  return origin
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        Vary: "Origin",
      }
    : {};
}
function validateGroqResult(value, input) {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray(value.tasks) ||
    value.tasks.length > 20
  )
    throw Error("잘못된 AI 결과");
  const seen = new Set();
  let count = 0;
  const children = (items, depth = 0) => {
    if (!Array.isArray(items) || depth > 2) throw Error("잘못된 하위 단계");
    return items.map((t) => {
      if (
        ++count > 80 ||
        typeof t?.title !== "string" ||
        !t.title.trim() ||
        t.title.length > 200
      )
        throw Error("잘못된 하위 단계");
      return {
        title: t.title.trim(),
        ...(t.children ? { children: children(t.children, depth + 1) } : {}),
      };
    });
  };
  return value.tasks
    .map((task) => {
      if (
        !task ||
        typeof task.title !== "string" ||
        typeof task.evidence !== "string"
      )
        throw Error("잘못된 작업");
      const title = task.title.trim(),
        evidence = task.evidence.trim();
      if (
        !title ||
        title.length > 200 ||
        !evidence ||
        evidence.length > 500 ||
        !input.includes(evidence)
      )
        throw Error("입력과 맞지 않는 결과");
      return {
        title,
        evidence,
        ...(task.children ? { children: children(task.children) } : {}),
      };
    })
    .filter((task) => {
      const id = task.title.toLocaleLowerCase("ko-KR");
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

/**
 * Injectable handler for tests. Browser never receives GROQ_API_KEY.
 * Access token is separate from the Groq API key, entered per user session.
 */
export async function handleOrganize(
  request,
  { env = process.env, fetchImpl = fetch } = {},
) {
  const cors = getCors(request, env);
  if (cors === null)
    return json(403, { error: "허용되지 않은 웹사이트입니다." });
  if (request.method === "OPTIONS")
    return new Response(null, {
      status: 204,
      headers: { ...cors, "Cache-Control": "no-store" },
    });
  if (request.method !== "POST")
    return json(
      405,
      { error: "POST 요청만 지원합니다." },
      { ...cors, Allow: "POST, OPTIONS" },
    );

  const key = env.GROQ_API_KEY,
    password = env.ONJEOM_ACCESS_TOKEN;
  if (
    typeof key !== "string" ||
    !key.startsWith("gsk_") ||
    typeof password !== "string" ||
    password.length < 24
  )
    return json(
      503,
      { error: "Groq 서버 연결이 아직 설정되지 않았습니다." },
      cors,
    );
  const bearer = request.headers.get("authorization") || "";
  if (!bearer.startsWith("Bearer ") || !safeEqual(bearer.slice(7), password))
    return json(401, { error: "접근 코드가 올바르지 않습니다." }, cors);

  if (
    (request.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase() !== "application/json"
  )
    return json(415, { error: "JSON 형식만 지원합니다." }, cors);
  const size = Number(request.headers.get("content-length") || 0);
  if (size > 12000) return json(413, { error: "요청이 너무 깁니다." }, cors);
  let raw;
  try {
    raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 12000)
      return json(413, { error: "요청이 너무 깁니다." }, cors);
  } catch {
    return json(400, { error: "입력을 읽을 수 없습니다." }, cors);
  }
  let input;
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      Object.keys(parsed).sort().join(",") !== "text" ||
      typeof parsed.text !== "string"
    )
      throw Error("invalid");
    input = parsed.text.trim();
  } catch {
    return json(400, { error: "올바른 생각 입력이 필요합니다." }, cors);
  }
  if (!input || input.length > 4000)
    return json(400, { error: "생각을 1~4,000자 사이로 적어주세요." }, cors);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const model = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"].includes(
      env.GROQ_MODEL,
    )
      ? env.GROQ_MODEL
      : DEFAULT_MODEL;
    const response = await fetchImpl(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: [
              "너는 온점. 한국어 생각 정리 도우미다.",
              "사용자가 실제로 명시한 목표를 추출하고 children에 실행 가능한 단계와 더 작은 행동을 제안하라.",
              "감정, 회고, 바람, 단순한 정보는 할 일로 만들지 마라.",
              "입력하지 않은 마감일, 우선순위, 장소, 인물을 만들어내지 마라. 하위 행동은 사용자가 검토할 제안이며 목표를 달성하기 위한 준비와 실행으로 나눠라.",
              "각 할 일은 짧은 한국어로 표현하고 evidence에는 원문에 실제 있는 연속된 문자열을 그대로 써라.",
              "명시된 행동이 없으면 빈 배열을 반환하라.",
              "결과는 저장되지 않고 사용자가 직접 검토한다.",
            ].join("\n"),
          },
          { role: "user", content: input },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "onjeom_tasks", strict: true, schema },
        },
        temperature: 0.2,
        max_completion_tokens: 3000,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return json(
        status,
        {
          error:
            status === 429
              ? "AI 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요."
              : "Groq 호출에 실패했습니다. 규칙 기반 정리를 사용할 수 있습니다.",
        },
        cors,
      );
    }
    const body = await response.json();
    const text = body?.choices?.[0]?.message?.content;
    if (typeof text !== "string")
      return json(502, { error: "AI가 결과를 반환하지 않았습니다." }, cors);
    const tasks = validateGroqResult(JSON.parse(text), input);
    return json(200, { tasks, provider: "groq", model }, cors);
  } catch {
    return json(
      502,
      {
        error: "AI 결과를 확인할 수 없습니다. 규칙 기반 정리를 사용해 주세요.",
      },
      cors,
    );
  } finally {
    clearTimeout(timer);
  }
}
