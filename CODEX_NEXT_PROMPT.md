# 온점. 이어서 개발하기

루트 AGENTS.md·README.md·src/logic.mjs·src/mobile-domain.mjs·src/storage.mjs와 prototype/CODEX_NEXT_PROMPT.md를 먼저 읽으세요. npm test(원본 11개 포함)와 npm run check를 실행하세요. 클라우드 작업은 이미 격리되어 있으므로 사용자 요청 없이 worktree를 만들지 마세요.

첨부받은 onjeom-codex-ready.zip은 prototype/에 바이트 그대로 보존했고 SHA-256 테스트가 있습니다. 원본 로직/테스트를 편의상 수정하거나 포맷하지 마세요. src/logic.mjs가 원본 도메인을 재노출합니다. 모바일이 원본 12종·창작 문구·확률·시즌 기간을 공유하도록 통합했습니다. 앞선 임시 모바일(v1/v2) 형식은 src/legacy-mobile.mjs로 읽고 v3으로 전환합니다.

실행용 웹은 web/app.mjs입니다. 원본 모달의 stopPropagation 이벤트 오류를 수정했고 검토/수정/정렬과 무료 꽃말 카드·/transfer/ 백업을 보완했습니다. prototype/ 보존본에는 당시 버그도 그대로 있습니다. 원본 localStorage 키를 유지하므로 기존 기록을 덮어쓰지 마세요. 원본 v1 → 모바일 v3, 임시 모바일 v2 → v3, 손상된 이전 DB의 확인된 백업 복원 테스트를 유지하세요.

제품 원칙: 실제 완료 4개로 개화, 타이머/출석강요/시들기/페널티 없음. 원본 희귀 변이 확률 무료·PLUS 동일. 새 품종+색상 최초 등록 때만 선택형 보상, 중복 무료, 취소/미제공도 꽃 영구 보관. 광고·PLUS는 명시적 테스트 모드. 꽃말은 창작 문구이며 무료 열람·저장. 분리는 원본 한국어 규칙 기반으로 AI가 아닙니다.

추석은 공식 연도별 일정이 없는 경우 비활성입니다. KASI 접속이 네트워크 정책에서 403으로 차단되어 검증 데이터를 넣지 못했습니다. src/season-calendar.mjs에 검토한 공식 출처·해당 연도 시작/종료일만 추가하고 음력 날짜를 추정하지 마세요. 테스트의 가상 일정은 운영 데이터가 아닙니다.

다음은 실기기 iOS/Android SQLite 재실행 복원·구버전 마이그레이션·파일 공유/복구·큰 글꼴·VoiceOver/TalkBack QA입니다. 현재 Expo SDK54이며 최신 Expo Go 호환성과 SDK 업그레이드는 별도 확인하세요. npm run export는 실기기 실행이 아닙니다. 실제 SDK·계정이 제공되기 전 테스트 광고 버튼을 실보상이나 실제 구매 권한으로 사용하지 마세요.

React Native UI도 브라우저에서 실행할 수 있습니다. npm run mobile:web 또는 npm run export:preview + npm run preview:mobile을 사용하세요. 이 경로는 App.tsx를 공유하지만 IndexedDB와 브라우저 파일 API를 쓰는 미리보기이며 실기기 SQLite와 동기화하지 않습니다. npm run test:mobile의 실제 UI 6개 시나리오를 유지하세요. 12종 벡터·성장 단계·무료 SVG 카드·작은 화면 공통 Sheet는 src/components 및 flower-art/flower-card 모듈에 있습니다. 원본 아카이브는 수정하지 마세요.

Android Gradle은 표시 이름 `온점.`의 마지막 마침표를 프로젝트 이름에 허용하지 않습니다. plugins/withAndroidProjectName.cjs가 내부 프로젝트만 Onjeom으로 설정하므로 제거하지 마세요. APK 빌드에는 JDK17과 API36, build-tools36.0.0, NDK27.1.12297006, CMake3.22.1이 필요합니다. npm run apk:android는 로컬 arm64 미리보기이며 스토어 릴리스가 아닙니다.

APK 빌드 최종 차단은 `repo.reactnative.dev`(React Native/Hermes AAR 리다이렉트) HTTP403입니다. 필요한 네트워크 주소와 KASI 주소만 환경 초안에 저장했지만 게시/런타임 적용은 확인되지 않았습니다. 사용자가 설정을 저장·게시한 뒤 실제 네트워크 정책과 해당 다운로드를 재확인하고 npm run apk:android를 재개하세요. 현재 실제 APK 파일은 없습니다. Gradle/SDK/JDK17은 /workspace/.tools에 준비되어 있으나 환경 복원 시 해당 파일과 환경 변수 활성화를 다시 확인하세요.

아이폰 홈 화면 웹앱 파일은 public/과 scripts/prepare-iphone-web.mjs에 있습니다. export:preview 뒤 설치 메타데이터와 해시 기반 오프라인 셸 캐시를 생성합니다. 배포 루트가 도메인 루트인 HTTPS 정적 호스팅을 사용하세요. 프로젝트 하위 경로에 배포하려면 Expo base URL과 자산 경로를 별도 검증해야 합니다. 공개 배포, 실제 iPhone 설치, TestFlight는 하지 않았으므로 설치 링크가 있다고 말하지 마세요. 배포용 ZIP은 IPA가 아닙니다.

GitHub Pages /onjeom/ 경로 지원은 app.config.ts, export:pages, test:pages에 있습니다. publish:pages는 원본 identity를 확인하고 임시 인덱스로 정적 산출물만 gh-pages에 fast-forward 업로드합니다. Git 인덱스/원본 체크아웃을 바꾸지 말고 강제 푸시하지 마세요. Pages 설정 API와 사이트 주소는 클라우드 네트워크에서 차단되어 자동 활성화·실제 공개 주소 확인이 안 됩니다. 사용자가 GitHub Pages 설정에서 gh-pages / (root)를 선택했는지, 환경에 api.github.com·shindongus.github.io가 적용됐는지 구분해 확인하세요. 예상 사이트 URL은 활성화/배포 성공 전에 작동한다고 주장하지 마세요.

웹앱 정적 파일은 origin/gh-pages 0243779b8cad3d785f8a84c0ec53c7a9c92f09c6에 업로드했고 원격 ref를 확인했습니다. 앱 소스도 origin/feat/expo-onjeom에 있습니다. 라이브 Pages 활성화/응답 확인은 아직 안 됐습니다. 다음 사용자에게 토큰을 채팅으로 요청하거나 이미 설치 링크가 활성화됐다고 말하지 말고, 소유자가 GitHub Pages에서 gh-pages / (root)를 선택했는지 확인하세요. API·사이트 네트워크 도메인은 초안에만 저장됐으므로 적용 여부를 따로 점검하세요.

GitHub 내부 설정 자동화도 실행했습니다. `.github/workflows/configure-pages.yml`과 `.github/pages-status.json`을 확인하세요. 실행 41661230637은 create_settings에서 403 Resource not accessible by integration으로 거부됐습니다. 이는 실제 GitHub 자동화 인증의 사이트 생성 권한 부족입니다. 전체 접근 모드가 GitHub 관리자 권한을 주지는 않습니다. PAGES_TOKEN 등 적절한 인증이 준비되기 전에는 같은 작업을 반복하거나 설정이 끝났다고 주장하지 마세요. 토큰을 채팅에 요청하거나 로그에 출력하지 마세요. 관리 인증이 준비되면 워크플로우를 재실행해 실제 사이트와 설치 메타데이터를 확인하세요.

최신 상태(2026-11-04): 사용자가 Pages 설정을 완료했고 실제 공개 사이트 검증이 통과했습니다. `.github/pages-live-status.json`의 verified:true, phase:ready 및 실행 41756901625를 보세요. 사이트 https://shindongus.github.io/onjeom/ 는 gh-pages / 배포 커밋 0243779에서 HTML/JS/설치파일 HTTP200을 확인했습니다. 이전 pages-status.json의 생성권한 403은 과거 기록입니다. 현재 상태를 그 실패만으로 판단하거나 사용자에게 Pages 활성화를 다시 요구하지 마세요. 실물 아이폰 설치는 별도 검증 대상입니다.

최신 UI: HomeScreen은 입력 폼 대신 화분과 단일 작업 중심이며 생각 입력/규칙 분리/사용자 검토는 compose Sheet에 있습니다. GardenPager는 3×3(페이지당9칸) 가상화 FlatList와 스와이프/이전·다음 제어를 제공합니다. 꽃별 정보·무료 카드·도감 등록은 선택한 꽃의 상세 Sheet로 옮겼습니다. 이전의 전체 꽃 카드 목록으로 되돌리지 마세요. native UI 테스트는 5개이고 정원 페이징·빈칸·복구·광고취소를 유지하세요. 저장 스키마는 v3 그대로입니다.

3×3 정원과 새 HomeScreen은 실제 사이트에 배포됐습니다. 최신 검증 실행 41759436012, 배포 e2fb2ab6e5b330c77b745584691f8b730d03b862, web bundle index-207b8968a5a68b1e0fc3e227b2d3c445.js입니다. verify-live-pages는 이제 gh-pages 최신 커밋이 빌드될 때까지 기다리고 공개 HTML이 실제 커밋의 HTML과 일치하는지 확인하므로 오래된 배포를 성공으로 오인하지 않습니다.

최신 온실 UI: HomeScreen(온실+행동 패널), FocusScreen(한 가지 실행), GardenScene(계절 SVG 공간), GardenPager(3×3 선반), FlowerPortrait(개화/상세), Sheet(하단 고정). 도메인/DB/원본은 변경하지 않았습니다. tests/mobile/garden.spec.mjs는 320px 주 버튼 위치, 초안 닫기/다시 열기, 홈 이어 하기, 작은 단계 실제 전환도 검사합니다. 경쟁 앱의 최신 화면은 App Store/공식 도메인 접근이 차단돼 미확인입니다. docs/design-review.md의 한계를 유지하고 직접 조사했다고 쓰지 마세요. 필요한 도메인은 기존 설정을 보존해 환경 초안에 추가했으며 저장/게시 전 런타임 허용으로 간주하지 마세요.

현재 UI는 감성 다이어리 개편입니다. 첫 화면은 HomeScreen의 직접 입력이며 하단 탭은 오늘/정원/도감/기록입니다. 실행·씨앗·설정은 탭이 아닌 보조 화면입니다. PaperTexture/diary-theme이 종이 디자인을, CatalogScreen이 한 종씩 넘기는 도감을, RecordsScreen이 월 달력과 날짜별 페이지를 담당합니다. src/diary.mjs의 선택형 diary 필드(draft,note,updatedAt)는 v3 상태에 추가되며 validateDiary가 마이그레이션/백업을 검증합니다. 기존 tasks/thoughts/flowers·DB 버전·원본은 유지합니다. 생각/짧은 기록은 저장 버튼 또는 정리 버튼으로 확정하며 저장 완료 뒤 재실행해야 합니다. 노트 편집 버퍼는 탭 전환 중에는 유지되지만 앱 종료까지 보장하지 않습니다. UI 테스트는 9개이고 캡처는 docs/screenshots, 비교는 docs/ui-review.html입니다. Pages 빌드의 /review/는 별도 정적 문서로 앱 사전 캐시에서 제외됩니다. 실물 키보드 QA로 뷰포트 시뮬레이션을 과장하지 마세요.

원격 동시 변경(7ae4173까지)을 병합했습니다. journals(text,mood,updatedAt)와 선택형 Groq 백엔드/클라이언트를 삭제하지 마세요. RecordsScreen에서 이전 일기/기분도 편집하며 새 diary 필드와 독립적으로 보존합니다. 기존 DiaryPaper/DiaryHome 등은 원격 보존 컴포넌트이고 현재 종이 배경은 PaperTexture입니다. 기본 정리는 규칙이며, 설정에 서버/별도 접근 코드를 입력하면 오늘에 AI 버튼이 나타나고 별도 전송 동의 후 현재 입력만 보냅니다. 연결 정보는 저장·백업하지 않습니다. 실제 Groq/배포 서버 호출은 미검증이고 UI 테스트는 모의 요청만 사용합니다. 원본 웹 실행 서버/서비스 워커는 diary와 journal 두 모듈을 모두 제공해야 합니다. 원격 deploy-onjeom 워크플로우가 소스 푸시를 자동 게시하므로 로컬 수동 게시와 경합시키지 마세요.

## 최신 사용자 첨부 명세 구현 — 2026-11-05

이 항목이 위의 과거 UI 설명보다 우선합니다. `docs/design/onjeom_ui_ux_design_system.md`는 사용자가 수정하지 말라고 한 원본입니다. 임의 포맷·변경하지 말고 `docs/design/IMPLEMENTATION_AUDIT.md`를 함께 읽으세요. 토큰은 `diary-theme.ts`, 폰트 6개는 `assets/fonts`와 `font-assets.ts`, 실제 텍스트는 `Type.tsx`를 통합니다. 정적 weight별 alias 파일을 선택하므로 Text의 최종 fontWeight normal을 임의로 바꾸지 마세요.

OnboardingCover는 설치당 최초 표지이며 기존 DB metadata/웹 IDB의 intro-seen 키에 기록합니다. 사용자 데이터 삭제·백업 복원과 별도입니다. Home은 날짜/직접 줄노트/작업 우측 직접 완료 원/하단 식물입니다. ReviewList는 실제 드래그 정렬과 인라인 수정, Sheet.footer는 고정 확정입니다. Focus의 작은 단계는 2~3개 인라인 입력입니다. 네 번째 완료 시 PlantMoment에 꽃이 피어나며 자동 시트를 열지 않습니다. 사용자가 꽃말 버튼을 눌러야 상세가 열립니다. RecordsScreen은 월 달력을 유지하고 아래에 과거 페이지를 펼치며 원문 편집은 ID·날짜·작업·꽃을 유지합니다. Seed는 날짜순과 복원/비우기입니다. 기존 journals·선택형 Groq·원본 도메인·DB 버전3을 보존했습니다.

지정 HEX의 보조 글자/버튼 대비가 일반 글자 AA에 미달합니다. HEX 우선 유지 vs 최소 보정 질문에 답변을 받지 못했으므로 임의 보정하지 않았으며 AA 전체 준수라고 쓰지 마세요. 클라우드 제공자도 답변이 없어 기존 파일 백업/공유/복원을 유지하고 자동 서버를 만들지 않았습니다. 실제 실기기 키보드/햅틱/큰 글꼴/스크린리더/SQLite 런타임은 미실행입니다. 테스트 최종 결과는 VALIDATION.md 최신 항목을 보세요. 캡처는 00-cover와01~09이며 pre-spec-today는 이번 명세 적용 직전 화면입니다.

최신 명세 UI는 소스167b1df에서 gh-pages `fa4b24b09bd1d56fe2633bc45b595f307086c09d`로 배포됐습니다. 공개 검증은 https://github.com/ShinDongus/onjeom/actions/runs/41975027575 에서 verified:true/phase:ready 및 폰트6개 SHA-256 일치까지 통과했습니다. 소스 검증 트리거는 `45cbbec9b72fd36290f9d85732eaeafbfc3718a0`입니다. 과거 pages-status의403이나 최초 폰트 조회404를 현재 실패로 오해하지 마세요. 설정 토글도 지정 팔레트이며 표기는 ‘모션 감소’, 홈 완료 원은 우측입니다.
