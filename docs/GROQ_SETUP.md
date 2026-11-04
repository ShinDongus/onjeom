# 온점. — Groq AI 생각 정리 연동

**상태:** 소스 코드 구현 및 키 없이 모의 HTTP 테스트. **실제 Groq 계정/키/배포 서버가 등록되기 전까지 라이브 호출 불가.** 이 문서의 예시는 사용자의 실제 비밀키를 포함하지 않습니다.

## 구조

- iOS/Android/Expo Web (GitHub Pages): `src/groq-client.mjs` — 사용자가 명시적으로 "Groq AI로 정리하기"를 누른 때만 현재 입력 원문 전송
- 서버: `backend/api/organize.mjs` → `backend/lib/organizer.mjs` — 온점. 접근 코드 확인, 허용 출처 검사, 제한된 입력만 서버 환경변수의 Groq 키로 호출
- Groq: 공식 Chat Completions `POST https://api.groq.com/openai/v1/chat/completions`; `openai/gpt-oss-20b`의 strict JSON Schema 출력
- 서버 응답: 증거 문구를 포함한 제안된 할 일 최대 20개. 원문에 없는 증거 문구는 거부한다. 최종 할 일 등록은 반드시 사용자의 수정/확인 후에만 진행
- 오류/키 없음: 원래의 **규칙 기반으로 나눠 보기** 기능을 계속 사용할 수 있으며 기존 일기·꽃·씨앗 데이터는 유지

공식 문서:

- Groq API: https://console.groq.com/docs/api-reference
- Groq 보안: https://console.groq.com/docs/production-readiness/security-onboarding
- Groq Structured Outputs: https://console.groq.com/docs/structured-outputs
- Vercel Node.js Functions: https://vercel.com/docs/functions/runtimes/node-js

## 사용자 설정: 키를 대화나 GitHub에 보내지 않는다

1. https://console.groq.com/keys 에서 사용자 본인이 **Groq API 키** 발급 및 호출량 확인
2. 사용자 Vercel 계정에서 **새 백엔드 전용 프로젝트** 생성: GitHub `ShinDongus/onjeom` 저장소를 연결하고 **Root Directory를 `backend`** 로 지정. Vercel 프로젝트를 기존 GitHub Pages 앱 전체 경로로 두지 말 것
3. Vercel 프로젝트 환경변수에 다음을 개별 등록 (Production/Preview 범위는 실제 배포 대상에 맞춤)
   - `GROQ_API_KEY`: Groq 콘솔에서 발급받은 키, **Vercel의 암호화/민감 변수로 등록**
   - `ONJEOM_ACCESS_TOKEN`: Groq 키와 **전혀 다른, 최소 24자 이상의 무작위 접근 코드**. 로컬 쉘에서 `openssl rand -hex 32` 같은 도구로 생성. Vercel 암호화 변수로 등록
   - `ONJEOM_ALLOWED_ORIGINS`: `https://shindongus.github.io`
   - `GROQ_MODEL`: 선택사항. 기본 `openai/gpt-oss-20b`; `openai/gpt-oss-120b`만 추가 지원
4. 배포 확인. 함수는 `https://[Vercel 도메인]/api/organize` 경로에 위치. 키가 설정되지 않았으면 503 반환
5. 온점. 앱의 우측 설정 아이콘 → "선택형 AI 연결 · Groq"에 **자신의 서버 URL**, **ONJEOM_ACCESS_TOKEN 접근 코드** 입력. 이 값은 **현재 열린 앱 메모리에만 유지**, 재접속 시 다시 입력할 수 있음. **Groq API 키를 절대 앱에 입력하지 않음**
6. 오늘 화면에서 생각을 적고 "연결한 AI로 정리하기" → 전송 설명을 확인한 뒤 "이번 생각만 AI로 보내기" 선택. 서버가 응답하면 제안된 메모를 확인·수정·제외한 뒤 "한 걸음 모드 시작" 선택. 전송을 취소하거나 요청 중 "AI 요청 취소"를 누를 수 있으며 기기의 원문은 유지됩니다.

### 보안 및 운영 주의

- Groq API 키는 오직 서버 환경변수에서 읽는다. GitHub Pages, Expo 번들, 브라우저, 로그, 채팅에 넣지 않는다.
- 온점. 접근 코드는 **Groq API 키가 아닌 별도 암호**이며, 앱에서 직접 입력 시 요청 인증 헤더로 서버로 전송한다. 앱 실행을 종료하면 다시 입력해야 한다. 여러 사람이 쓰는 공개 앱에서는 이 공유 코드 대신 개별 사용자 로그인/계정별 인증을 구현해야 한다.
- 출처 제한(CORS)은 브라우저 보조 방어이지 완전한 인증이 아니다. `ONJEOM_ACCESS_TOKEN`이 있어도 정식 공개 서비스에서는 **Vercel WAF/Redis 등 분산 요청 제한**, 남용 모니터링, 키 교체 정책을 추가해야 한다. Groq의 기본 rate limit만으로 비용 피해를 방지할 수 없다.
- 서버는 4000자 초과 입력을 거절하고 요청 실패 시 작업을 자동 생성하거나 기록을 삭제하지 않는다. 서버 코드에 사용자의 문장을 기록하는 로그 기능은 없다. 다만 Groq 제공자에 해당 입력이 전송되므로 개인정보 처리방침 및 서비스 제공자 정책을 검토해야 한다.
- 앱의 **다이어리 본문, 꽃, 작업 이력은 AI를 누를 때 자동으로 전송되지 않는다.** 오직 버튼을 누른 현재 생각 텍스트만 전송된다.
- 개발 환경 `http://localhost:.../api/organize` 은 허용되지만 실제 원격 서버는 반드시 HTTPS를 사용한다.
- Vercel 프로젝트 배포 전에는 **실제 연동 완료를 주장하지 않는다.**

## 개발 검증

루트에서:

```sh
npm ci
npm test
npm run check
npm run export:preview
```

Groq 개발용 서버 통합 테스트는 요청/응답 모의 환경에서 실행된다. **Groq 실제 청구 계정 호출과 iPhone 실기기 호출은 사용자 키 등록 이후 별도로 검증**한다.
