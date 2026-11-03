# 온점. 이어서 개발하기

루트 AGENTS.md·README.md·src/logic.mjs·src/mobile-domain.mjs·src/storage.mjs와 prototype/CODEX_NEXT_PROMPT.md를 먼저 읽으세요. npm test(원본 11개 포함)와 npm run check를 실행하세요. 클라우드 작업은 이미 격리되어 있으므로 사용자 요청 없이 worktree를 만들지 마세요.

첨부받은 onjeom-codex-ready.zip은 prototype/에 바이트 그대로 보존했고 SHA-256 테스트가 있습니다. 원본 로직/테스트를 편의상 수정하거나 포맷하지 마세요. src/logic.mjs가 원본 도메인을 재노출합니다. 모바일이 원본 12종·창작 문구·확률·시즌 기간을 공유하도록 통합했습니다. 앞선 임시 모바일(v1/v2) 형식은 src/legacy-mobile.mjs로 읽고 v3으로 전환합니다.

실행용 웹은 web/app.mjs입니다. 원본 모달의 stopPropagation 이벤트 오류를 수정했고 검토/수정/정렬과 무료 꽃말 카드·/transfer/ 백업을 보완했습니다. prototype/ 보존본에는 당시 버그도 그대로 있습니다. 원본 localStorage 키를 유지하므로 기존 기록을 덮어쓰지 마세요. 원본 v1 → 모바일 v3, 임시 모바일 v2 → v3, 손상된 이전 DB의 확인된 백업 복원 테스트를 유지하세요.

제품 원칙: 실제 완료 4개로 개화, 타이머/출석강요/시들기/페널티 없음. 원본 희귀 변이 확률 무료·PLUS 동일. 새 품종+색상 최초 등록 때만 선택형 보상, 중복 무료, 취소/미제공도 꽃 영구 보관. 광고·PLUS는 명시적 테스트 모드. 꽃말은 창작 문구이며 무료 열람·저장. 분리는 원본 한국어 규칙 기반으로 AI가 아닙니다.

추석은 공식 연도별 일정이 없는 경우 비활성입니다. KASI 접속이 네트워크 정책에서 403으로 차단되어 검증 데이터를 넣지 못했습니다. src/season-calendar.mjs에 검토한 공식 출처·해당 연도 시작/종료일만 추가하고 음력 날짜를 추정하지 마세요. 테스트의 가상 일정은 운영 데이터가 아닙니다.

다음은 실기기 iOS/Android SQLite 재실행 복원·구버전 마이그레이션·파일 공유/복구·큰 글꼴·VoiceOver/TalkBack QA입니다. 현재 Expo SDK54이며 최신 Expo Go 호환성과 SDK 업그레이드는 별도 확인하세요. npm run export는 실기기 실행이 아닙니다. 실제 SDK·계정이 제공되기 전 테스트 광고 버튼을 실보상이나 실제 구매 권한으로 사용하지 마세요.

React Native UI도 브라우저에서 실행할 수 있습니다. npm run mobile:web 또는 npm run export:preview + npm run preview:mobile을 사용하세요. 이 경로는 App.tsx를 공유하지만 IndexedDB와 브라우저 파일 API를 쓰는 미리보기이며 실기기 SQLite와 동기화하지 않습니다. npm run test:mobile의 실제 UI 3개 시나리오를 유지하세요. 12종 벡터·성장 단계·무료 SVG 카드·작은 화면 공통 Sheet는 src/components 및 flower-art/flower-card 모듈에 있습니다. 원본 아카이브는 수정하지 마세요.

Android Gradle은 표시 이름 `온점.`의 마지막 마침표를 프로젝트 이름에 허용하지 않습니다. plugins/withAndroidProjectName.cjs가 내부 프로젝트만 Onjeom으로 설정하므로 제거하지 마세요. APK 빌드에는 JDK17과 API36, build-tools36.0.0, NDK27.1.12297006, CMake3.22.1이 필요합니다. npm run apk:android는 로컬 arm64 미리보기이며 스토어 릴리스가 아닙니다.

APK 빌드 최종 차단은 `repo.reactnative.dev`(React Native/Hermes AAR 리다이렉트) HTTP403입니다. 필요한 네트워크 주소와 KASI 주소만 환경 초안에 저장했지만 게시/런타임 적용은 확인되지 않았습니다. 사용자가 설정을 저장·게시한 뒤 실제 네트워크 정책과 해당 다운로드를 재확인하고 npm run apk:android를 재개하세요. 현재 실제 APK 파일은 없습니다. Gradle/SDK/JDK17은 /workspace/.tools에 준비되어 있으나 환경 복원 시 해당 파일과 환경 변수 활성화를 다시 확인하세요.

아이폰 홈 화면 웹앱 파일은 public/과 scripts/prepare-iphone-web.mjs에 있습니다. export:preview 뒤 설치 메타데이터와 해시 기반 오프라인 셸 캐시를 생성합니다. 배포 루트가 도메인 루트인 HTTPS 정적 호스팅을 사용하세요. 프로젝트 하위 경로에 배포하려면 Expo base URL과 자산 경로를 별도 검증해야 합니다. 공개 배포, 실제 iPhone 설치, TestFlight는 하지 않았으므로 설치 링크가 있다고 말하지 마세요. 배포용 ZIP은 IPA가 아닙니다.
