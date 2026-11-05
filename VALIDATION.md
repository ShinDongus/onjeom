# 원본 통합 검증 기록

2026-11-03 / Linux x64 / Node 24.19 / Expo SDK 54.

## 원본 기준선

- 첨부 ZIP에서 AGENTS.md, README, CODEX_NEXT_PROMPT, CODEX_TASK, src/logic.mjs, src/app.mjs, 테스트를 읽음.
- 변경 전 원본 npm test: **11개 통과**.
- 변경 전 원본 실제 Chromium: 모달에서 ‘할 일로 정돈하기’ 클릭 후 완료 버튼이 나타나지 않아 타임아웃. 원인은 모달의 inline stopPropagation과 문서 위임 이벤트의 충돌. 원본 테스트의 UI 검사는 빈 화면만 확인하므로 이 문제를 발견하지 못했음.
- 원본 17개 파일은 prototype/에 바이트 그대로 저장하고 SHA-256 무결성을 테스트함. 실행용 복사본에서만 모달 이벤트 처리를 수정함.

## 통합 후 실행

- npm test: **31개 통과**, 원본 11개 포함. 실패·스킵 없음.
- npm run test:browser: **4개 통과**, 실제 Chromium. 원본 모달 회귀, 분리 결과 수정/정렬/제외, 저장 후 CRUD, 네 행동 완료·개화, 등록 전 무료 창작 꽃말 카드, 광고 취소/미제공/등록, 씨앗 복원, 원본 키 유지, 모바일 백업 다운로드 검증, 오프라인 재접속·모션 감소, 손상된 원본 JSON 내보내기 거절과 원문 보존.
- npm run check 및 npm run format:check: 통과.
- npm run test:mobile: 실제 App.tsx를 Expo 웹으로 번들링한 React Native UI 시나리오 **3개 통과**. 390×844·320×640, 입력 검토·4회 완료·개화, 무료 SVG 카드 다운로드, 광고 취소/미제공·등록, IndexedDB 재접속 복원, 씨앗 복원, 백업·삭제·복원, 원본 v1 JSON 복원, 삭제 취소, 손상 백업 보호 및 모션 감소 설정을 확인함. 브라우저 렌더러 검증이며 네이티브 브리지 테스트는 아님.
- EXPO_OFFLINE=1 CI=1 npm run export: 원본 도메인을 포함한 iOS·Android Hermes 번들 생성 통과. 서명된 APK/IPA나 스토어 빌드가 아님.
- Node SQLite: 실제 파일 닫기·재오픈, 미등록 꽃/씨앗/설정 복원, 원본 v1 및 앞선 모바일 v2→v3, 마이그레이션 실패 롤백, 잘못된 백업 시 기존 상태 보존, 손상된 구버전 payload의 명시적 유효 백업 복구, 미래 DB 보호를 검증함.

## 확인된 한계

- KASI 공식 일정 자료 요청은 HTTP CONNECT 403. 공식 추석 일정을 검증하지 못해 운영 테이블은 비워 두고 추석 꽃은 비활성화함. 테스트는 가상 일정 주입만 검증하며 실제 추석 날짜가 검증됐다는 뜻이 아님.
- iOS/Android 실기기·시뮬레이터, Expo Go 연결, 네이티브 SQLite 브리지와 파일 공유/선택, 기기 강제 종료/재부팅, VoiceOver/TalkBack·최대 글꼴, 실제 광고/결제·구매 복원, 스토어 배포는 미실행.
- 기존 SDK54를 유지했으며 최신 SDK 업그레이드는 하지 않음. 원본 프로토타입은 여전히 localStorage 기반이며 SQLite는 모바일에 적용함. 플랫폼 간 자동 동기화는 없음.
- 신규 꽃에는 네 완료 행동을 기록하고 원본 꽃에는 원래의 originTask만 유지함. 이전 모바일 기록은 legacy 변이로 보존하고 신규 추첨에는 사용하지 않음.

## 추가 구현과 발견한 문제

품종별 벡터 12종, 성장 단계별 화분, 계절 정원, 기억/도감 전환, 무료 SVG 꽃말 카드, 작은 화면용 공통 스크롤 시트를 구현함. 실제 React Native 화면에서 발견한 탭 전환 후 이전 스크롤 잔류를 수정함. Switch 저장은 비동기 완료 후 UI에 반영하므로 테스트도 최종 저장 상태를 기다려 확인함.

Android 네이티브 프로젝트 생성은 실행함. 첫 APK 빌드는 JDK17 부재로 중단되어 공식 Temurin 17.0.21+9를 SHA256 검증 후 설치함. 이어 Gradle이 앱 이름 `온점.`의 끝 마침표를 프로젝트 이름으로 허용하지 않는 문제를 확인함. Expo 설정 플러그인으로 내부 프로젝트 이름만 `Onjeom`으로 바꾸고 표시 이름은 유지함. 최종 APK 결과는 아래에 별도로 기록함.

최종 Android APK 빌드는 **실패/미생성**: JDK17 설치와 Gradle 프로젝트 이름 수정 후 네이티브 의존성 해석까지 진행했지만 React Native/Hermes AAR의 `repo.reactnative.dev` 리다이렉트가 HTTP403으로 차단됨. `repo.reactnative.dev`·`astro.kasi.re.kr` 허용 초안 저장은 확인됐으며 `requires_publish: true`; 실행 환경 적용/게시는 확인되지 않음. 이 실패는 Hermes 번들 생성이나 React Native 브라우저 테스트 통과와 구분함. 테스트 APK·설치·실기기 실행·스토어 서명은 완료됐다고 주장하지 않음.

## 아이폰 홈 화면 웹앱 준비

public/의 매니페스트·Apple Touch PNG·아이콘과 정적 앱 셸 캐시를 추가함. 실제 React Native 웹 UI 테스트는 기존 3개에 오프라인 설치 셸 1개를 더해 **4개 통과**. 한국어 HTML·iOS 설치 메타데이터·아이콘 응답, 앱 캐싱 후 네트워크를 끊은 재접속, 오프라인 완료와 다시 열기 후 저장을 Chromium에서 확인함. 실제 iPhone/Safari의 홈 화면 추가, HTTPS 공개 호스팅 배포, 서명된 IPA/TestFlight는 미실행. 배포 ZIP은 설치 파일이 아니며 공개 링크는 아직 없음.

## GitHub Pages 경로 검증

Expo가 지원하는 app.config.ts에서 /onjeom baseUrl을 적용함. `.cjs` 동적 설정이 무시되어 처음 하위 경로 테스트가 실패한 원인을 확인하고 고침. npm run test:pages는 실제 /onjeom/ 경로의 번들/아이콘/매니페스트, 해당 scope의 서비스 워커, 오프라인 재접속·작업 완료·재실행 저장 **1개 통과**. GitHub 자체 사이트 응답이나 실기기 Safari 설치가 검증됐다는 뜻은 아님. 기본 루트 빌드와 Pages 빌드를 별도로 생성함.

## 원격 업로드 확인

개발 소스 feat/expo-onjeom의 51aa0846e983d97570254bcdbb00d7c9e4076c93과 정적 배포 gh-pages의 0243779b8cad3d785f8a84c0ec53c7a9c92f09c6을 GitHub origin에서 git ls-remote로 확인함. 배포 스크립트 실행 전후 소스 HEAD와 실제 Git 인덱스 SHA256이 같음을 확인함. GitHub Pages 설정 API와 사이트 응답은 실행 환경 네트워크 정책에서 차단되어 활성화/라이브 공개 성공을 확인하지 못함. 저장소 소유자가 Pages의 Source를 Deploy from a branch, Branch를 gh-pages / (root)로 선택해야 함. 예상 사이트는 https://shindongus.github.io/onjeom/ 이며 활성화 전 작동을 보장하지 않음.

## GitHub 내부 자동 설정 실행

GitHub Actions 실행 https://github.com/ShinDongus/onjeom/actions/runs/41661230637 에서 기존 사이트 조회 후 create_settings 단계가 실제 GitHub HTTP403, Resource not accessible by integration으로 실패함. `.github/pages-status.json`의 sourceSha 7cc80eaccdb3a82794bda4f08baa86de9eae08bf와 해당 워크플로우 커밋의 일치를 확인했고 결과 커밋 053d292bf4000289ab49302fb54f6caf675c6906을 수신함. GitHub의 관리 권한 거부를 다른 권한으로 우회하거나 저장소 공개 상태를 바꾸지 않음. Pages는 아직 활성화 완료·실제 공개 접속 검증 상태가 아님. 자동화는 PAGES_TOKEN이 제공되면 그 인증을 사용하도록 준비돼 있으나 값은 코드/결과에 기록하지 않음. 기존 npm test 31개는 통과했고 워크플로우 YAML 구문 검사를 수행함.

## 실제 사이트 배포 확인 — 2026-11-04

사용자의 Pages 설정 후 GitHub 검증 실행 https://github.com/ShinDongus/onjeom/actions/runs/41756901625 가 통과함. `.github/pages-live-status.json`의 sourceSha 13cfe481475d095580749fd375b1efabf313a05c, 결과 커밋 3f2624c7caf7ef8558bab70039414086db716722를 확인함. Pages source gh-pages /, build_type legacy, status built이며 배포 커밋은 0243779b8cad3d785f8a84c0ec53c7a9c92f09c6. 실제 https://shindongus.github.io/onjeom/ HTML, manifest.webmanifest, apple-touch-icon.png, sw.js, web index JS, install.js의 HTTP200과 올바른 MIME 유형을 확인함. 매니페스트의 이름 온점. 및 standalone 표시 모드도 확인함. 이 검증은 GitHub 측에서 실제 공개 주소로 수행한 HTTP 검증이며, 이 실행 환경의 직접 네트워크 접근은 여전히 차단돼 있음. 실물 iPhone의 Safari 설치/렌더링이나 전체 기능을 실사이트 브라우저에서 테스트했다는 뜻은 아님. 기존 로컬 브라우저 기능 테스트와 구분함. 워크플로우 추가 후 기존 도메인·SQLite 테스트 31개도 통과함.

## 모바일 앱 화면 개편 — 2026-11-04

시작 화면·입력/검토 시트·아이콘 탭·3×3 가상화 정원·꽃 상세 시트를 구현함. npm test 31개, npm run test:mobile 5개, npm run test:pages 1개, TypeScript 검사와 iOS/Android Hermes 번들 생성 통과. 12송이에서 첫 페이지 9송이, 다음 페이지 3송이+빈자리6칸, 빈 정원9칸, 페이지 경계 버튼, 실제 가로 휠 스크롤, 화면 크기 변경, 상세 기록, 광고 취소 보존 및 백업 복구를 확인함. 스크린샷 mobile-today.png, mobile-garden.png, mobile-garden-page2.png, desktop-home.png를 직접 검토함. 브라우저 가로 스크롤을 테스트했고 실물 iOS/Android 터치 스와이프는 미검증. 원본 아카이브·도메인·저장 스키마는 변경하지 않음.

모바일 개편 배포 확인: 소스 cc6f1f1, Pages 배포 e2fb2ab6e5b330c77b745584691f8b730d03b862. GitHub 실행 https://github.com/ShinDongus/onjeom/actions/runs/41759436012 에서 최신 배포 커밋과 built 상태가 일치하고 공개 HTML이 해당 커밋의 index.html과 동일함을 확인함. 새 web index-207b8968a5a68b1e0fc3e227b2d3c445.js, 설치 파일·아이콘·매니페스트 모두 HTTP200. 결과 커밋 9c14283b146a3d49d46d4e6d15f77c04a3f589f5. 공개 사이트 전체 기능은 기존 로컬 브라우저 회귀검증과 구분하며 실물 터치 스와이프는 미검증.

## 온실 공간 UI 개편 — 2026-11-04

사용자 요청에 따라 홈을 창문·빛·원근 받침대와 하단 행동 패널로, 실행을 한 가지 주 행동으로, 정원을 3×3 화분 선반으로 개편했다. 입력/상세는 하단 시트, 개화는 조명 배경과 중앙 꽃말을 사용한다. 원본 프로토타입·순수 도메인·저장 형식은 수정하지 않았다. 비교 후보 공식 사이트/스토어는 환경 네트워크 HTTP403으로 직접 조사하지 못했으며 접근에 필요한 도메인을 기존 초안에 보존·추가했다. 조사 완료나 런타임 허용으로 간주하지 않는다. 판단 근거와 남은 조사는 docs/design-review.md에 기록했다.

실행 결과: npm test **31개 통과**; npm run test:mobile **6개 통과**; npm run test:pages **1개 통과**. 총 **38개**, 최종 실행 실패·스킵 없음. 최초 UI 실행에서 장식 체크 기호가 완료 버튼의 접근성 이름에 섞여 두 테스트가 타임아웃됐고 명시적인 접근성 이름으로 수정한 뒤 전체 UI를 재실행해 통과했다. 빈 실행 화면 문구가 바뀐 두 테스트의 기대 문구도 갱신했다. 기존 사용자 흐름 검증을 제거하지 않았다.

추가 검증은 320×640에서 생각 입력·완료 주 버튼이 탭 위에 노출되는지, 시트의 하단 고정 위치, 닫았다 다시 열었을 때 초안 유지, 홈에서 이어 하기, 실제 작은 단계 분할과 전환을 검사한다. 기존 9+3송이 페이지·빈자리·가로 스크롤·복원/손상 보호·광고 취소·오프라인 기록 유지도 통과했다. 스크린샷 mobile-today.png, mobile-today-active.png, mobile-focus.png, mobile-garden.png, mobile-garden-page2.png, mobile-bloom.png를 직접 검토했다.

npm run check, npm run format:check, iOS/Android Hermes 번들 생성 통과. 실제 iPhone/Safari 설치·터치·키보드·큰 글꼴·스크린리더, 네이티브 런타임/SQLite 실행은 이번에 수행하지 않았다. 원본 기반 별도 PWA의 Chromium 4개 테스트는 이번 UI 변경 범위 밖으로 재실행하지 않았으며 원본 무결성과 도메인은 31개 테스트에 포함했다. 공식 앱 화면 직접 조사도 미완료다.

온실 UI 공개 배포 확인: 소스 03e09c9, 배포 6363c63f81e578adc753ace42ca649f3344e1408. GitHub 실행 https://github.com/ShinDongus/onjeom/actions/runs/41767070214 에서 해당 배포의 built 상태와 공개 HTML의 정확한 일치를 검증했다. 새 web index-16d456e08b9c65eaaa8a80f3866f04f8.js, 설치 스크립트·아이콘·매니페스트·서비스 워커 모두 HTTP200. 검증 트리거 소스 004376db6c266288698cd4aa44db463ae0becc4a와 보고서 sourceSha, expectedCommit과 배포 SHA가 일치하고 verified=true, phase=ready임을 확인했다. 결과 커밋 7bd109ed16fa6e3a2966aed1a38b1bb18483e032를 수신했다. 공개 주소의 HTTP 검증이며 실사이트 전체 브라우저 기능/실물 iPhone 검증과 구분한다.

## 감성 다이어리 전면 개편 — 2026-11-04

현재 제품은 오늘/정원/도감/기록 네 탭이다. 큰 브랜드 헤더와 온실 중심 홈을 날짜·요일·줄노트·메모·작은 완료 표시·식물 스티커로 바꿨다. 실행은 한 가지 작업, 정원은 계절 종이의 3×3 페이지, 도감은 한 종씩 펼치는 표본 책, 기록은 달력→날짜별 페이지다. 씨앗과 설정은 보조 동선이다. 장식은 자체 SVG이며 새 의존성을 추가하지 않았다.

기존 thoughts/tasks/flowers와 완료·확률·광고 규칙, DB user_version 3은 유지한다. 선택형 diary[day]의 draft/note/updatedAt만 추가했고 날짜·길이·형식을 검사한다. 원본 아카이브 무결성, v1/v2/v3 복원, 실제 SQLite 재열기·백업/삭제/복원에서 이 필드까지 검증했다. 원본에 없던 날짜나 삭제된 과거 작업은 추정하지 않는다. 저장한 글은 날짜가 바뀌어 앱을 다시 활성화해도 이전 날에 남고, 새 날짜의 초안을 읽는다. 저장하지 않은 글/검토는 앱 종료나 날짜 전환까지 복원을 보장하지 않는다.

원격 동시 변경 통합 전 실행: npm test **34개**, npm run test:mobile **8개**, npm run test:browser **4개**, npm run test:pages **1개** 통과. 총 **47개**, 최종 실패/스킵 없음. TypeScript·Prettier·git diff 검사와 iOS/Android Hermes 번들 생성도 통과했다. 네이티브 번들 생성은 실제 설치/런타임 검증이 아니다.

모바일 UI 검증은 생각 저장과 재실행, 원문 저장 후 규칙 분리·사용자 검토, 작은 단계, 완료와 개화, 광고 취소/미제공/등록, 씨앗 복원, 손상 백업 거절, 데이터 삭제/복원, 오프라인 완료, 12송이의 9+3 페이지, 320×640 및 390×480의 버튼 접근/스크롤을 포함한다. 추가로 달력의 과거 날짜에서 생각·실제 완료·꽃·짧은 기록을 조회하고, 수정한 기록의 저장 완료를 기다린 뒤 재실행/백업/삭제/복원했다. 도감은 금빛 희귀 색상·개화 날짜·할로윈 시즌 이름을 실제 UI에서 확인했다. 날짜 전환 재활성화도 브라우저 시뮬레이션으로 확인했다.

초기 실행에서 기록 입력/저장 버튼의 부분 일치 선택자가 충돌했고 정확한 접근성 이름으로 보완했다. 비동기 저장 직후 기다리지 않고 재접속한 테스트를 저장 완료 표시 뒤 재접속하도록 수정했다. 원본 기반 웹 회귀 검사에서는 새 diary 모듈의 서버 경로와 오프라인 CORE 누락으로 4건이 실패했으며, 실행용 scripts/serve-web.mjs와 web/sw.js(v2)에 추가하고 4건 모두 재실행해 통과했다. prototype/ 원본은 수정하지 않았다. Pages 비교 문서의 로컬 미리보기에서는 폴더 index 처리가 없어 404가 발생했고, 서버가 GitHub Pages와 같이 하위 폴더 index.html을 제공하도록 수정한 뒤 테스트를 통과했다.

캡처는 docs/screenshots/01~09(홈, 입력, 검토, 실행, 정원, 도감, 달력, 기록 상단, 기록 하단)와 before-home/garden/focus에 준비했다. 모두 테스트 예시 데이터다. docs/ui-review.html에서 비교하며 Pages 빌드의 /review/로 복사한다. 앱 사전 캐시에서는 이 문서를 제외한다. 스크린샷을 직접 검토하고 검토 시트와 실행 화면이 실제 열린 상태인지 기다린 뒤 캡처하도록 했다. 파일 URL 미리보기는 브라우저 관리 정책에서 차단되어 HTTP 미리보기로 비교 문서와 이미지 로딩을 확인했다.

미실행/미구현: 실제 iPhone/Safari 홈 설치·소프트웨어 키보드·터치 제스처·큰 글꼴·VoiceOver/TalkBack, 실기기 SQLite 및 앱 재부팅, 실제 광고/결제 SDK, 공식 추석 일정 데이터. 축소 뷰포트는 실제 키보드와 다르며 시스템 공유/파일 선택도 네이티브 실기기 검증이 남았다. App Store 출시·APK/IPA 생성은 수행하지 않았다.

주요 변경: App.tsx, src/components/{HomeScreen,FocusScreen,GardenPager,CatalogScreen,RecordsScreen,PaperTexture,AppIcon,Sheet,diary-theme}, src/diary.mjs, src/mobile-domain.mjs의 검증 호출. 저장 어댑터는 유지했다. scripts/{serve-web,serve-mobile-preview,export-pages,prepare-iphone-web,prepare-ui-review}, 실행용 web/sw.js는 모듈/비교 문서 제공을 연결한다. tests/diary.test.mjs·storage.test.mjs·mobile/diary.spec.mjs와 기존 모바일/Pages 테스트, README·인계 문서·비교 HTML/캡처를 갱신했다.

### 원격 동시 변경을 보존한 최종 통합

게시 직전 원격 feat/expo-onjeom에 추가된 87f562f~7ae4173의 기존 journals 일기/기분, 선택형 Groq 클라이언트/인증 백엔드 및 자동 배포 워크플로우를 발견했다. 이력을 덮어쓰지 않고 병합했다. 종이 배경을 PaperTexture로 분리해 원격 DiaryPaper 및 관련 컴포넌트도 보존했다. 새 UI는 journals의 긴 일기/기분을 읽고 수정하며 새 diary 초안/짧은 기록과 함께 백업·삭제·복원한다. 원본 웹 경로와 캐시에 journal 모듈도 포함했다.

통합 후 npm test **53개**, React Native 웹 UI **9개**, 기존 웹 프로토타입 **4개**, Pages 설치/비교 문서/오프라인 **1개**를 실행해 총 **67개 통과**했다. TypeScript·iOS/Android Hermes 번들·포맷 검사도 통과했다. 기분 선택의 웹 접근성 상태가 Native accessibilityState만으로 노출되지 않아 aria-checked를 보완했다. 씨앗 보관/완료 직후 재실행 테스트도 DB 저장을 반영한 빈 실행 화면까지 기다린 뒤 재접속하도록 수정했다.

추가 UI 검사는 이전 일기/기분을 복원하고 수정한 뒤 짧은 기록과 함께 백업·삭제·복원하는 흐름을 확인한다. 선택형 Groq는 본인 서버/접근 코드를 메모리에 설정하고 현재 입력만 별도 동의 후 보내며, 동의 취소 때 요청 없음, 요청 본문이 현재 입력 하나뿐임, 결과 사용자 검토, 재실행 시 연결 정보가 비어 있음을 모의 HTTP로 검증했다. 실제 Groq 과금 계정·배포 서버·API 키를 연결해 호출하지 않았다. 기본 규칙 분리도 그대로 동작한다.

원격 자동 배포와 로컬 수동 게시가 경합하지 않도록 통합 소스 푸시 후 배포 워크플로우를 사용한다. 공개 사이트·비교 페이지의 실제 응답 검증 결과는 아래 최신 배포 기록에 별도로 남긴다. 원격에 있던 journals/백엔드 기능의 상세는 docs/GROQ_SETUP.md와 기존 테스트를 함께 참고한다.

최신 공개 배포 확인: 통합 소스 ae095a58ae20dc28b72fc680087a2e01dab41a65가 자동 배포되어 gh-pages a2200c19b3a09468d350385ca871695d3c4f883d에 반영됐다. 검증 실행 https://github.com/ShinDongus/onjeom/actions/runs/41776879709 의 sourceSha는 50e44efdf471d12b1585a2dc1fcbb44863512c0d이고 expectedCommit/build.commit이 해당 배포 SHA와 일치한다. verified=true, phase=ready, build.status=built를 확인했다. 공개 HTML은 최신 배포의 index.html과 동일하며 새 web index-703f0d55305c31ec0d37375608ffe221.js, 설치 자산, /review/ 비교 페이지와 새 화면 PNG 9개가 HTTP200/올바른 MIME으로 응답했다. 결과 커밋 121e0f39dc6d610876155e1e4362c92a8fea8233를 수신했다. 공개 HTTP 검증과 로컬 기능 테스트이며 실물 iPhone 검증은 별도다.

## 사용자 첨부 디자인 명세 적용 — 2026-11-05

`onjeom_ui_ux_design_system.md`를 바이트 그대로 docs/design에 보관하고 지정 HEX 7개·Pretendard/Noto Serif KR 각 400/500/600·26/20/17/16/15/13px 타입·24/20/32 여백·52px/r12 주 버튼·64px 탭·85%/r24 하단 시트를 적용했다. 폰트 6개의 원본 출처·라이선스·SHA-256을 기록했고 fontTools로 실제 weight 400/500/600을 확인했다. 약 44.8 MiB의 원본 폰트를 Expo/Web에 포함한다.

표지→직접 줄노트→드래그 검토→한 걸음 인라인 2~3분할, 홈의 22px 완료 원/44px 터치, 4회 완료 후 자동 팝업 없는 하단 개화, 3×3 계절 정원, 한 종씩 도감, 달력 아래 동일 화면 기록/원문 편집을 구현했다. 원문 편집은 ID·시간·기존 작업·꽃을 유지한다. 씨앗은 날짜순과 복원/비우기다. 기존 원본 prototype, journals·선택형 Groq·성장/확률/광고 규칙, 백업 v1/v2/v3, SQLite user_version 3은 유지했다. 설치당 표지 표시 여부만 기존 메타데이터에 별도 저장하며 사용자 데이터 복원과 독립적이다.

최종 실행: `npm test` **54개**, `npm run test:mobile` **12개**, `npm run test:browser` **4개**, `npm run test:pages` **1개**, 합계 **71개 통과**, 최종 실패/스킵 없음. TypeScript·Prettier 검사와 iOS/Android Hermes 번들 생성도 통과했다. 테스트는 실제 폰트 로드 6개, 날짜/본문/버튼/탭 실제 수치, 마우스 드래그 순서 변경, 축소 뷰포트 고정 확정 버튼, 홈 직접 완료·광고 없는 개화·사용자 선택 뒤 꽃말 열람, 원문 편집 후 백업/복원, 원본 무결성, 희귀/시즌·광고 취소·미제공·중복 등록·씨앗 복원을 포함한다. Pages 하위 경로에서 6개 폰트가 사전 캐시에 포함되고 네트워크 차단/재실행 뒤 모두 실제로 로드되며 작업을 완료·저장하는 것을 확인했다. 표지와 01~09 캡처를 갱신했고 명세 적용 직전 홈도 비교 페이지에 보존했다.

초기 UI 검증에서 폰트 게이트 아래에 남은 중복 로딩 return으로 빈 화면이 발생했다. 중복 return을 제거하고 TypeScript allowUnreachableCode:false로 방지한 뒤 전체 모바일 테스트를 재실행해 통과했다. 변경된 명세의 접근성 이름/인라인 단계/개화 동작에 맞춰 기존 시나리오를 갱신했고 검증 범위를 제거하지 않았다.

지정 HEX의 일부 일반 텍스트 대비는 AA 4.5:1에 미달한다(종이 위 보조색 약 4.471:1, 샌드 위 약 3.889:1). 사용자가 임의 수정을 금지했으므로 색상을 유지했다. 자동 클라우드 제공자가 지정되지 않아 기존 파일 백업·공유·복원을 유지했으며 자동 동기화 서버는 미연결이다. 실물 iPhone/Android의 키보드·햅틱·큰 글꼴·스크린리더·터치 스와이프·SQLite 런타임, 실제 Groq 및 광고·결제 SDK는 이번에 실행하지 않았다. 자세한 대조와 충돌은 docs/design/IMPLEMENTATION_AUDIT.md에 기록했다.

최종 명세 대조에서 완료 원이 왼쪽에 남은 것을 발견해 오른쪽으로 수정했고 실제 좌표와 44px 터치 크기 검사를 추가했다. 해당 수정 후 모바일 12개와 도메인 54개를 다시 실행해 통과했다. 공개 폰트 검증의 첫 실행은 Expo 출력의 중첩 assets/assets/fonts 경로를 assets/fonts로 조회해 HTTP404로 실패했으며 실제 배포 경로로 바로잡은 재실행에서 원본 SHA-256 6개를 모두 확인했다.

설정 토글에도 시스템 기본 색상 대신 명세의 세이지/종이/구분선/샌드를 적용하고 명세 표기인 ‘모션 감소’로 통일했다. 팔레트 변경 후 전체 모바일 12개를 통과했고, 표기 통일 후 해당 토글·완료·복원 시나리오를 추가 재검증했다. 도메인 54개·TypeScript·Prettier와 iOS/Android 번들 생성도 다시 통과했다.

사용자 명세 UI 최종 공개 배포 확인: 소스 `167b1df`, 정적 배포 `fa4b24b09bd1d56fe2633bc45b595f307086c09d`, 검증 트리거 `45cbbec9b72fd36290f9d85732eaeafbfc3718a0`. [GitHub 실행](https://github.com/ShinDongus/onjeom/actions/runs/41975027575)에서 최신 built 커밋과 공개 HTML의 바이트 일치, 앱/설치 자산/폰트6개/표지 및 비교 캡처 등 공개 응답 24건의 HTTP200을 확인했다. 폰트6개는 공개 응답의 SHA-256이 번들 원본과 일치한다. web bundle은 `index-0ab0120e09691936775d0286782e8892.js`다. 결과 커밋 `c31fcd57569abe93c55bb5fe0fa12196c9d94594`, verified=true, phase=ready를 수신했다. 실제 사이트의 HTTP/원본 일치 확인이며 실사이트 브라우저 전체 기능이나 실물 아이폰 설치 검증을 뜻하지 않는다. 기존 초기403/404 기록과 구분한다.
