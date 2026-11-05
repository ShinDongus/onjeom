import { openDiary } from "../helpers/open-diary.mjs";
import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import {
  initialState,
  addTasks,
  completeTask,
  registerFlower,
  exportBackup,
  importBackup,
} from "../../src/mobile-domain.mjs";
import { saveJournal } from "../../src/journal.mjs";
import { setDiaryEntry } from "../../src/diary.mjs";
const button = (page, name) => page.getByRole("button", { name, exact: true });
test("날짜별 다이어리·희귀/시즌 도감·한 문장 저장·백업 복구와 비교 캡처", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-04T12:00:00Z"));
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let state = addTasks(initialState(), [
    "창문 열기",
    "물 한 잔 마시기",
    "책상 닦기",
    "책 한 쪽 읽기",
    "산책하기",
    "우산 챙기기",
    "안부 전하기",
    "컵 씻기",
  ]);
  state.thoughts[0].createdAt = "2026-06-01T09:00:00Z";
  for (let i = 0; i < 8; i++)
    state = completeTask(
      state,
      state.tasks.find((t) => t.status === "active").id,
      { day: i < 4 ? "2026-06-01" : "2026-10-31", random: () => 0.001 },
    );
  for (const flower of state.flowers)
    state = registerFlower(state, flower.id, { reward: "earned-test" });
  state = saveJournal(state, "2026-06-01", {
    text: "예전 버전에서 남겨둔 일기",
    mood: "맑음",
  });
  state = setDiaryEntry(state, "2026-06-01", {
    note: "햇살을 오래 바라본 날.",
  });
  await openDiary(page);
  await button(page, "설정 열기").click();
  const choose = page.waitForEvent("filechooser");
  await button(page, "백업 파일에서 복원").click();
  await (
    await choose
  ).setFiles({
    name: "diary.json",
    mimeType: "application/json",
    buffer: Buffer.from(exportBackup(state)),
  });
  await button(page, "복원").click();
  await mkdir("docs/screenshots", { recursive: true });
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await page.screenshot({ path: "docs/screenshots/01-today.png" });
  await page
    .getByLabel("자유로운 생각 입력")
    .fill(
      "마음이 복잡해서 창문을 열고 물 한 잔을 마시고 싶어요.\n책상에 쌓인 책도 정리해야 해요.",
    );
  await page.screenshot({ path: "docs/screenshots/02-writing.png" });
  await button(page, "생각 정리하기").click();
  await expect(page.getByTestId("bottom-sheet")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/03-review.png" });
  await button(page, "오늘의 작은 일로 확정하기").click();
  await expect(page.getByTestId("one-step-mode")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/04-one-step.png" });
  await button(page, "완료했어요").click();
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await expect(
    page.getByText("마음이 복잡해서 창문을 열고 물 한 잔을 마시고 싶어요", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "정원", exact: true }).click();
  await page.screenshot({ path: "docs/screenshots/05-garden.png" });
  await page.getByRole("tab", { name: "도감", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "데이지", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("금빛 · 희귀 색상", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("최초 개화일 2026-06-01", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/06-catalog.png" });
  for (let i = 0; i < 13; i++) await button(page, "다음 도감 페이지").click();
  await expect(
    page.getByRole("heading", { name: "달그림자 장미", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("시즌 할로윈", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "기록", exact: true }).click();
  await page.screenshot({ path: "docs/screenshots/07-calendar.png" });
  for (let i = 0; i < 5; i++) await button(page, "이전 달").click();
  await page
    .getByRole("button", {
      name: "2026-06-01 기록 열기, 기록 있음",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "6월 1일의 페이지", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("생각 원문 1 수정", { exact: true }),
  ).toHaveValue(state.thoughts[0].original);
  await expect(page.getByText("책상 닦기", { exact: true })).toBeVisible();
  await expect(button(page, "데이지 기록 보기")).toBeVisible();
  await expect(page.getByLabel("짧은 기록", { exact: true })).toHaveValue(
    "햇살을 오래 바라본 날.",
  );
  await page.screenshot({
    path: "docs/screenshots/08-record-page.png",
    fullPage: true,
  });
  await expect(
    page.getByRole("heading", { name: "2026년 6월", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", {
        name: "2026-06-01 기록 열기, 기록 있음",
        exact: true,
      })
      .getByTestId("calendar-bloom-dot"),
  ).toHaveCSS("background-color", "rgb(213, 171, 187)");
  await page
    .getByLabel("생각 원문 1 수정", { exact: true })
    .fill("작은 행동들을 돌아보고 원문을 다정하게 고쳤어요.");
  await button(page, "생각 원문 1 저장").click();
  await expect(button(page, "생각 원문 1 저장")).toHaveText("✓ 저장됨");
  await expect(page.getByLabel("이전 일기 수정")).toHaveValue(
    "예전 버전에서 남겨둔 일기",
  );
  await expect(
    page.getByRole("checkbox", { name: "그날의 기분 맑음", exact: true }),
  ).toBeChecked();
  await page
    .getByLabel("이전 일기 수정")
    .fill("이전 일기도 다정하게 이어서 썼어요.");
  await button(page, "이전 일기 저장").click();
  await expect(button(page, "이전 일기 저장")).toHaveText("✓ 저장됨");
  await page.getByLabel("짧은 기록", { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: "docs/screenshots/09-record-note.png" });
  await page
    .getByLabel("짧은 기록", { exact: true })
    .fill("오늘은 천천히 걸어도 괜찮았어요.");
  await button(page, "짧은 기록 저장").click();
  await expect(button(page, "짧은 기록 저장")).toHaveText("✓ 저장됨");
  await page.reload();
  await button(page, "설정 열기").click();
  const download = page.waitForEvent("download");
  await button(page, "백업 파일 내보내기").click();
  const { readFile } = await import("node:fs/promises");
  const backup = await readFile(await (await download).path(), "utf8");
  expect(
    importBackup(backup).thoughts.find((t) => t.id === state.thoughts[0].id)
      .original,
  ).toBe("작은 행동들을 돌아보고 원문을 다정하게 고쳤어요.");
  expect(
    importBackup(backup).thoughts.find((t) => t.id === state.thoughts[0].id)
      .createdAt,
  ).toBe(state.thoughts[0].createdAt);
  expect(importBackup(backup).flowers).toEqual(state.flowers);
  expect(importBackup(backup).journals["2026-06-01"].text).toBe(
    "이전 일기도 다정하게 이어서 썼어요.",
  );
  expect(importBackup(backup).journals["2026-06-01"].mood).toBe("맑음");
  expect(importBackup(backup).diary["2026-06-01"].note).toBe(
    "오늘은 천천히 걸어도 괜찮았어요.",
  );
  await button(page, "기기 데이터 전체 삭제").click();
  await button(page, "전체 삭제").click();
  const restore = page.waitForEvent("filechooser");
  await button(page, "백업 파일에서 복원").click();
  await (
    await restore
  ).setFiles({
    name: "restore.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });
  await button(page, "복원").click();
  await page.getByRole("tab", { name: "기록", exact: true }).click();
  for (let i = 0; i < 5; i++) await button(page, "이전 달").click();
  await page
    .getByRole("button", {
      name: "2026-06-01 기록 열기, 기록 있음",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("짧은 기록", { exact: true })).toHaveValue(
    "오늘은 천천히 걸어도 괜찮았어요.",
  );
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await page.getByLabel("자유로운 생각 입력").fill("오늘 날짜에 남겨둘 생각");
  await button(page, "원문 저장").click();
  await expect(button(page, "원문 저장")).toBeDisabled();
  await page.clock.setFixedTime(new Date("2026-11-05T12:00:00Z"));
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(page.getByLabel("자유로운 생각 입력")).toHaveValue("");
  await expect(page.getByRole("heading", { name: /^11월 5일/ })).toBeVisible();
  await page.getByRole("tab", { name: "기록", exact: true }).click();
  await page
    .getByRole("button", {
      name: "2026-11-04 기록 열기, 기록 있음",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("저장한 생각 수정", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("선택형 Groq 보존: 전송 동의·현재 입력만 요청·검토와 비영구 연결 정보", async ({
  page,
}) => {
  const requests = [];
  await page.route(
    "https://organizer.example.test/api/organize",
    async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          provider: "groq",
          tasks: [{ title: "물 마시기", evidence: "물" }],
        }),
      });
    },
  );
  await openDiary(page);
  await button(page, "설정 열기").click();
  await page
    .getByLabel("Groq 백엔드 주소")
    .fill("https://organizer.example.test/api/organize");
  await page
    .getByLabel("온점 서버 접근 코드")
    .fill("test-access-code-only-123456789");
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await page.getByLabel("자유로운 생각 입력").fill("물 한 잔 마시기");
  await button(page, "연결한 AI로 정리하기").click();
  await expect(
    page.getByText("이번 생각만 AI로 보낼까요?", { exact: true }),
  ).toBeVisible();
  expect(requests).toEqual([]);
  await button(page, "보내지 않고 돌아가기").click();
  expect(requests).toEqual([]);
  await button(page, "연결한 AI로 정리하기").click();
  await button(page, "이번 생각만 AI로 보내기").click();
  await expect(page.getByLabel("할 일 1 수정", { exact: true })).toHaveValue(
    "물 마시기",
  );
  expect(requests).toEqual([{ text: "물 한 잔 마시기" }]);
  await expect(
    page.getByText(
      "Groq AI가 제안한 메모예요. 입력과 맞는지 직접 검토한 뒤 시작해요.",
      { exact: true },
    ),
  ).toBeVisible();
  await button(page, "오늘의 작은 일로 확정하기").click();
  await expect(
    page.getByRole("heading", { name: "물 마시기", exact: true }),
  ).toBeVisible();
  await page.reload();
  await button(page, "설정 열기").click();
  await expect(page.getByLabel("Groq 백엔드 주소")).toHaveValue("");
  await expect(page.getByLabel("온점 서버 접근 코드")).toHaveValue("");
});
