/** Public, non-sensitive readiness check. Does not call Groq or expose credentials. */
export function GET() {
  const hasGroqKey = typeof process.env.GROQ_API_KEY === "string" &&
    process.env.GROQ_API_KEY.startsWith("gsk_");
  const hasAccess = typeof process.env.ONJEOM_ACCESS_TOKEN === "string" &&
    process.env.ONJEOM_ACCESS_TOKEN.length >= 24;
  return Response.json({
    service: "onjeom-groq-api",
    status: hasGroqKey && hasAccess ? "configured" : "configuration_required",
    message: hasGroqKey && hasAccess
      ? "서버 환경변수가 등록되어 있습니다. 실제 Groq 호출은 인증 요청으로 별도 검증해야 합니다."
      : "Groq API 키 또는 온점. 접근 코드 설정이 필요합니다."
  }, { headers: { "Cache-Control": "no-store" } });
}
