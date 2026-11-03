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
