# 검증 기록

2026-11-03, Linux x64 / Node 24.19 / Expo SDK 54.

## 실행 결과

- 최초 `npm test`: package.json 부재로 ENOENT. 원래 저장소에 테스트가 없었음.
- 구현 후 `npm test`: 도메인/실제 SQLite 테스트 16개 통과, 실패·스킵 없음.
- `npm run check`: TypeScript 통과.
- `EXPO_OFFLINE=1 CI=1 npm run export`: iOS·Android Hermes 번들 생성 통과. 서명된 설치 파일/스토어 빌드가 아님.
- `npm run test:browser`: 설치된 Chromium에서 2개 시나리오 통과. 생각 분리·수정, 네 행동 완료 및 개화, 광고 취소·미제공, 등록, 재접속, 씨앗 복원, 백업 내보내기/삭제/복원, 서비스 워커 오프라인 재접속, 모션 감소.
- SQLite 통합 테스트는 실제 임시 파일 DB를 닫고 다시 열어 미등록 꽃과 씨앗 보존, 잘못된 복원 시 기존 데이터 유지, 마이그레이션 실패 롤백, 미래 DB 버전 보호를 검증함. 모바일과 동일한 storage.mjs에 Node SQLite 어댑터를 주입함.

## 미실행 및 한계

iOS·Android 네이티브 런타임, Expo Go 연결, 실기기 강제 종료·재부팅, 파일 선택/공유, VoiceOver/TalkBack, 최대 글꼴/작은 화면, 실제 광고·결제·구매 복원, 스토어 배포는 실행하지 않음. 네이티브 SQLite 브리지는 기기에서 추가 검증 필요.

현재 제공된 저장소 및 원격 main에는 README만 있었으므로 과거 대화의 원본 웹·로직·테스트 보존 여부와 이전 데이터 호환성은 검증할 수 없음. 현재 웹은 새로 작성한 참조 프로토타입임. 12종의 이름·꽃말·추첨·등록은 구현했으나 일러스트는 공통 식물 모티프임.
