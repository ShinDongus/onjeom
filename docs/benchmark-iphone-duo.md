# 온점. — App Store 벤치마크 + iPhone Duo/애니메이션 구현 기록

조사 시점: 2026-11-04. 출처는 각 앱의 한국 App Store 상세 설명과 Apple Developer 가이드다. 특정 앱의 화면·상표·그림·카피를 복제하지 않는다.

## 1. 벤치마킹: 적용할 장점만 추출

| 앱 | 확인된 기능 | 온점.에 선택적으로 적용 | 가져오지 않을 것 |
|---|---|---|---|
| Day One | 날짜별 저널·기록 탐색·멀티미디어 | 날짜별 다이어리와 과거 기록 열람 | 복잡한 프로 일기 설정 |
| MOODA | 감정과 일상 기록, 방 꾸미기, 최근 할 일 지원 | 선택형 짧은 감정 기록, 작은 감성 소품 | 필수 감정 입력 |
| Journey | 캘린더·타임라인, 추억 재방문 | 날짜 기반 기록 아카이브 | 위치 자동 수집 |
| Zinnia | 종이 다이어리·스티커·템플릿 | 종이 질감과 식물 스티커 스타일 | 복잡한 자유 배치 에디터 |
| Structured | 인박스→시각적 실행 | 쏟아낸 생각에서 실행으로 넘어가는 명료함 | 타이머·시간표 강요 |
| Kinder World | 감정 부담 없이 식물 성장, 공간 꾸미기 | 아늑한 정원과 무벌점 성장 | 별도 반복 일일 미션 강요 |
| Finch | 작은 성취로 성장, 시즌 장식 | 작은 완료에 즉각적이고 차분한 반응 | 과도한 출석 압박 |
| Plant Nanny | 활동→식물 변화, 특별 식물·장식 | 성장 단계와 시즌 정원 | 건강 지표 수집 |
| Focus Aura | 식물 수집·월별 씨앗, 정원 분위기 | 시즌 컬렉션·부드러운 정원 연출 | 타이머·시든 식물·유료 희귀율 우대 |
| 루티니 | 습관 완료·식물 성장·컬렉션 | 행동 완료형 성장의 검증된 접근 | 화폐·영양제 다단계 조작 |
| Forest / Focus Pot | 집중→식물 성장 | 완료 행동의 시각적 기록만 | 집중시간 조건·이탈 페널티 |

원본 링크:
- Day One https://apps.apple.com/kr/app/id1044867788
- MOODA https://apps.apple.com/kr/app/id6449689589
- Journey https://apps.apple.com/kr/app/id1300202543
- Zinnia https://apps.apple.com/kr/app/id1485310935
- Structured https://apps.apple.com/kr/app/id1499198946
- Kinder World https://apps.apple.com/kr/app/id1541796687
- Finch https://apps.apple.com/kr/app/id1528595748
- Plant Nanny https://apps.apple.com/kr/app/id1424178757
- Focus Aura https://apps.apple.com/kr/app/id6762025536
- 루티니 https://apps.apple.com/kr/app/id6758573546
- Forest https://apps.apple.com/kr/app/id866450515
- Focus Pot https://apps.apple.com/kr/app/id6788602363

## 2. 온점.만의 중심 흐름

**생각 자유 입력 → 할 일 사용자 확인 → 지금 하나 실행 → 행동 완료 → 식물 성장 → 4회 완료시 개화 → 꽃말과 성취 기록 → 선택적으로 최초 도감 등록(보상형 광고 테스트 모드)**

- 다이어리는 할 일과 독립된 일자별 원본 기록이다. 생각에서 작업을 추출해도 일기 원문을 덮어쓰지 않는다.
- 기록과 기분은 사용자의 선택이다. 기분을 입력하지 않아도 아무 기능이 막히지 않는다.
- 꽃 성장에 집중 시간, 로그인 일수, 출석 스트릭, 금전 결제를 사용하지 않는다.
- 미완료 작업은 씨앗 보관함에 남기며 시들지 않는다.
- 꽃말은 창작 문구이다. 실제 전통 꽃말인 것처럼 표현하지 않는다.
- 꽃말 카드 저장은 무료다. 신규 품종·색상의 최초 도감 등록에만 자발적 보상형 광고 모의 흐름을 적용한다. PLUS는 테스트 토글이며 실제 결제가 아니다.

## 3. 코드에서 현재 구현한 부분

- `src/journal.mjs`: 기기 내 일기 저장·날짜 검증·달력용 날짜 집계·기존 저장 기록 보존
- `src/components/DiaryPaper.tsx`: 줄 노트 질감의 자유 입력·자동 저장·기분 선택, 빠른 화면 전환 시 미저장 기록 처리
- `src/components/DiaryHome.tsx`: 글 중심 랜딩페이지를 실제로 작성 가능한 다이어리+현재 할 일+식물 성장으로 교체
- `src/components/DiaryHistory.tsx`: 달력 날짜 선택 및 당일 원문·완료한 일·개화 꽃 확인
- `src/components/MemoryGarden.tsx`: 동일한 빈 화분 아홉 개를 하나의 계절 정원으로 교체, 실제 꽃 배치
- `src/components/BotanicalCatalog.tsx`: 식물도감 스타일 목록
- `src/components/PlantGrowth.tsx`: 작업 완료 시 잠깐 부드럽게 커지는 성장 반응
- `src/components/BloomMoment.tsx`: 4회 완료 후 개화 장면에 짧은 페이드+스프링 연출
- `App.tsx`: 기록 탭, 실제 저장 연결, 넓은 화면에서 좌측 세로 내비게이션
- `tests/journal.test.mjs`: 일기 검증, 기존 v3 데이터 호환성, 날짜별 기록 테스트

실제 SDK 광고/결제/AI 미연동 상태 유지. Code changes have not been tested on a physical iPhone Duo.

## 4. iPhone Duo — 네이티브 대응의 필수 후속 검증

Apple 공식 참조:
- https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo
- https://developer.apple.com/iphone-duo/prepare/
- https://developer.apple.com/videos/play/tech-talks/111461/

기존 Expo SDK 54 프로젝트는 최신 iOS 27.1 SDK 완전 대응 여부를 별도로 확인해야 한다. 단순히 폭이 넓어진 웹 미리보기가 **Duo 전용 네이티브 대응을 증명하지는 않는다**.

필수 점검:
1. Xcode 27.1 / iOS 27.1 SDK로 실제 Duo 시뮬레이터 빌드
2. 접힘 외부 화면: 다이어리 한 페이지, 기능 동일
3. 펼침 내부 화면: 탐색 목록+선택한 기록 두 영역 표시, 세로 내비게이션
4. 펼침 도중: 작성 중인 텍스트와 키보드 포커스/스크롤 위치 유지
5. 반쯤 접힌 상태: 경첩/접힘 예약 영역에 텍스트·컨트롤 배치 금지
6. 안전 영역: 외부 카메라/Dynamic Island 및 안쪽 카메라 상태, 양쪽 스플릿뷰
7. 큰 글씨, VoiceOver, Reduce Motion, 한손 터치 검증
8. 앱 종료·재실행 후 일기/꽃/씨앗/희귀도·도감 데이터 유지
9. 기존 `feat/expo-onjeom` 기반 설치/백업/복원/데이터 삭제 기능 회귀 테스트

현재 RN 미리보기의 `useWindowDimensions` 폭에 따른 두 칸 구성은 **적응형 프로토타입**이다. 진짜 경첩 예약 영역/세로 시스템 툴바의 완전한 처리는 iOS 27.1 네이티브 프레임워크 또는 호환되는 브리지로 구현·검증해야 한다.

## 5. 움직임 디자인

Apple HIG: https://developer.apple.com/design/human-interface-guidelines/motion
Reduced Motion: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria

| 사건 | 일반 모션 | Reduce Motion |
|---|---|---|
| 실제 할 일 1개 완료 | 식물 0.88→1.0 스프링, 1회만 | 즉시 다음 성장 상태 |
| 4회 완료 후 꽃 피움 | 짧은 페이드와 스프링, 화면 조작 차단 없음 | 정지된 꽃 + 텍스트 |
| 정원 계절 변경 | 배경/식물 장면 업데이트, 무한 반복 없음 | 즉시 변경 |
| 기록 페이지 선택 | 내용 즉시 보임, 텍스트 입력 상태 유지 | 동일 |
| 희귀 꽃 발견 | 별도의 가챠 롤링·자동폭발 효과 없음 | 내용 동일 |

**아직 구현하지 않은 것:** 고해상도 플라워 프레임 애니메이션, 햅틱 피드백, 앱스토어 메타데이터, 실제 보상형 광고 SDK, iPhone Duo 실기기 테스트. 현 단계는 핵심 구조와 가벼운 모션만 구현.

## 6. 테스트 및 Codex 인계

```bash
npm ci
npm test
npm run check
npm run export:preview
npm run test:mobile
```

테스트 결과는 해당 브랜치 GitHub Actions를 확인하라. 실제 브라우저/기기 체험 검증이 끝나기 전까지 배포된 최신 UI라고 단정하지 말 것.

다음 Codex 과제:
1. iPhone Duo의 펼침·접힘·반접힘 및 예약 영역을 Xcode 27.1 Device Hub에서 검증해 네이티브 레이아웃 완성
2. 다이어리 동시 수정/저장 경쟁 상황·빠른 날짜 변경·백업/복원 테스트 보완
3. 진행 중인 꽃과 도감의 품종별 시각적 차이 확장(독창적 식물 일러스트 제작)
4. 정원·일기 페이지 전환 시 애니메이션이 과도하지 않은지 사용자 테스트
5. 광고/결제/AI를 실제로 연결할 경우 SDK 및 개인정보 정책 검증, 가격/광고 없이도 핵심 기능 이용 보장
