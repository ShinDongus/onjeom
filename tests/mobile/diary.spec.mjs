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
  state = setDiaryEntry(state, "2026-06-01", {
    note: "햇살을 오래 바라본 날.",
  });
  await page.goto("/");
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
  await button(page, "한 걸음 모드 시작").click();
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
    page.getByText("색상 금빛 · 희귀 색상", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("금빛 · 2026-06-01", { exact: true }),
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
    page.getByText(state.thoughts[0].original, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("책상 닦기", { exact: true })).toBeVisible();
  await expect(button(page, "데이지 기록 보기")).toBeVisible();
  await expect(page.getByLabel("짧은 기록", { exact: true })).toHaveValue(
    "햇살을 오래 바라본 날.",
  );
  await page.screenshot({
    path: "docs/screenshots/08-record-page.png",
    fullPage: true,
  });
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
  await button(page, "생각 저장").click();
  await expect(button(page, "✓ 저장됨")).toBeDisabled();
  await page.clock.setFixedTime(new Date("2026-11-05T12:00:00Z"));
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(page.getByLabel("자유로운 생각 입력")).toHaveValue("");
  await expect(
    page.getByRole("heading", { name: "11월 5일", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "기록", exact: true }).click();
  await page
    .getByRole("button", {
      name: "2026-11-04 기록 열기, 기록 있음",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("오늘 날짜에 남겨둘 생각", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
