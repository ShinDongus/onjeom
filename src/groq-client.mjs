import { flattenPlan, rulePlan } from "./planner.mjs";
/**
 * Groq is called only through the user's private, authenticated backend.
 * Neither GROQ_API_KEY nor the access code is stored by this module.
 */
export async function groqSeparate(
  text,
  { endpoint, accessToken, fetchImpl = fetch, signal, structured = false } = {},
) {
  if (typeof text !== "string" || !text.trim() || text.trim().length > 4000)
    throw Error("AI 정리는 1~4,000자의 생각을 지원합니다.");
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw Error("Groq 서버 주소가 올바르지 않습니다.");
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    (url.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(url.hostname)) ||
    url.username ||
    url.password ||
    url.hash ||
    url.search ||
    url.pathname !== "/api/organize"
  )
    throw Error("본인의 HTTPS 백엔드 /api/organize 주소를 입력해 주세요.");
  if (typeof accessToken === "string" && accessToken.startsWith("gsk_"))
    throw Error("Groq API 키를 앱에 입력하지 마세요. 서버 전용 키입니다.");
  if (typeof accessToken !== "string" || accessToken.length < 24)
    throw Error(
      "서버에서 설정한 온점. 접근 코드를 입력해 주세요. Groq API 키가 아닙니다.",
    );
  const response = await fetchImpl(url.href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    body: JSON.stringify({ text: text.trim() }),
    signal,
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw Error("AI 서버 응답을 해석할 수 없습니다.");
  }
  if (!response.ok)
    throw Error(
      typeof result?.error === "string"
        ? result.error
        : "AI 서버에 연결할 수 없습니다.",
    );
  if (
    result?.provider !== "groq" ||
    !Array.isArray(result.tasks) ||
    result.tasks.length > 20
  )
    throw Error("AI 정리 결과가 올바르지 않습니다.");
  const titles = result.tasks.map((task) => {
    if (
      typeof task?.title !== "string" ||
      !task.title.trim() ||
      task.title.length > 200 ||
      typeof task.evidence !== "string" ||
      !text.includes(task.evidence)
    )
      throw Error("AI 결과가 입력 내용과 일치하지 않습니다.");
    return task.title.trim();
  });
  if (!structured) return titles;
  let count = 0;
  const validate = (tasks, depth = 0) => {
    if (!Array.isArray(tasks)) throw Error("AI 단계가 올바르지 않습니다.");
    if (!tasks.length) return [];
    if (depth > 7) throw Error("AI 단계가 올바르지 않습니다.");
    return tasks.map((t) => {
      if (
        ++count > 100 ||
        typeof t.title !== "string" ||
        !t.title.trim() ||
        t.title.length > 200
      )
        throw Error("AI 단계가 올바르지 않습니다.");
      return { ...t, children: validate(t.children || [], depth + 1) };
    });
  };
  const plan = validate(result.tasks);
  // Legacy servers remain usable, with explicitly reviewed offline step suggestions.
  return plan.some((t) => t.children.length)
    ? flattenPlan(plan)
    : titles.flatMap((t) => rulePlan(t));
}
