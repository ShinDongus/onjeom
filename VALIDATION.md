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
- EXPO_OFFLINE=1 CI=1 npm run export: 원본 도메인을 포함한 iOS·Android Hermes 번들 생성 통과. 서명된 APK/IPA나 스토어 빌드가 아님.
- Node SQLite: 실제 파일 닫기·재오픈, 미등록 꽃/씨앗/설정 복원, 원본 v1 및 앞선 모바일 v2→v3, 마이그레이션 실패 롤백, 잘못된 백업 시 기존 상태 보존, 손상된 구버전 payload의 명시적 유효 백업 복구, 미래 DB 보호를 검증함.

## 확인된 한계

- KASI 공식 일정 자료 요청은 HTTP CONNECT 403. 공식 추석 일정을 검증하지 못해 운영 테이블은 비워 두고 추석 꽃은 비활성화함. 테스트는 가상 일정 주입만 검증하며 실제 추석 날짜가 검증됐다는 뜻이 아님.
- iOS/Android 실기기·시뮬레이터, Expo Go 연결, 네이티브 SQLite 브리지와 파일 공유/선택, 기기 강제 종료/재부팅, VoiceOver/TalkBack·최대 글꼴, 실제 광고/결제·구매 복원, 스토어 배포는 미실행.
- 기존 SDK54를 유지했으며 최신 SDK 업그레이드는 하지 않음. 원본 프로토타입은 여전히 localStorage 기반이며 SQLite는 모바일에 적용함. 플랫폼 간 자동 동기화는 없음.
- 신규 꽃에는 네 완료 행동을 기록하고 원본 꽃에는 원래의 originTask만 유지함. 이전 모바일 기록은 legacy 변이로 보존하고 신규 추첨에는 사용하지 않음.
