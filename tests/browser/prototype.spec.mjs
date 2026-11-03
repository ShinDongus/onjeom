import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { importBackup } from "../../src/mobile-domain.mjs";
const state = (page) => page.evaluate(() => window.__ONJEOM_TEST__.getState());
async function compose(page, text) {
  await page.locator('[data-action="compose"]').first().click();
  await page.locator("#thought-input").fill(text);
  await page.locator('[data-action="save-thought"]').click();
}
async function tab(page, name) {
  await page.locator(`nav [data-tab="${name}"]`).click();
}
test("원본 모달 회귀: 검토 → 4회 완료 → 무료 카드 → 광고 취소·미제공·등록 → 씨앗 복원 → 모바일 백업", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const original = "빨래하기\n메일 보내기\n책상 정리\n물 마시기\n산책하기";
  await compose(page, original);
  await page.getByLabel("할 일 1 수정", { exact: true }).fill("수건 빨래");
  await page.getByRole("button", { name: "검토한 할 일 추가" }).click();
  await expect(page.locator(".primary-card h2")).toHaveText("수건 빨래");
  for (let i = 0; i < 4; i++)
    await page.locator('[data-action="finish"]').click();
  await expect.poll(async () => (await state(page)).flowers.length).toBe(1);
  await tab(page, "garden");
  await page.getByRole("button", { name: "꽃말 카드 · 무료" }).click();
  await expect(
    page.getByText("온점. 창작 문구 · 실제 식물학적 꽃말이 아닙니다."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "꽃말 문구 복사" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator('[data-action="register"]').click();
  await page.getByRole("button", { name: "나중에 등록하기" }).click();
  await page.reload();
  await tab(page, "garden");
  await expect(page.locator('[data-action="register"]')).toHaveCount(1);
  await page.locator('[data-action="register"]').click();
  await page.getByRole("button", { name: "테스트: 광고 제공 안 됨" }).click();
  await expect(page.locator('[data-action="register"]')).toHaveCount(1);
  await page.locator('[data-action="register"]').click();
  await page.getByRole("button", { name: "테스트: 광고 완료로 등록" }).click();
  await expect(page.locator('[data-action="register"]')).toHaveCount(0);
  await tab(page, "today");
  await page.locator('[data-action="postpone"]').click();
  await page.reload();
  await tab(page, "archive");
  await expect(
    page.locator(".archive-item").filter({ hasText: "산책하기" }),
  ).toBeVisible();
  await page.locator('[data-action="restore"]').click();
  await tab(page, "today");
  await expect(page.locator(".primary-card h2")).toHaveText("산책하기");
  const before = await page.evaluate(() =>
    localStorage.getItem("onjeom.local.v1"),
  );
  await page.goto("/transfer/");
  await expect(page.getByRole("status")).toContainText("꽃 1송이");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "이 브라우저 기록 내보내기" }).click();
  const file = await (await download).path();
  const migrated = importBackup(await readFile(file, "utf8"));
  expect(migrated.version).toBe(3);
  expect(migrated.thoughts[0].original).toBe(original);
  expect(migrated.tasks.find((t) => t.title === "수건 빨래")).toBeTruthy();
  expect(migrated.flowers[0].registeredAt).toBeTruthy();
  expect(
    await page.evaluate(() => localStorage.getItem("onjeom.local.v1")),
  ).toBe(before);
  expect(errors).toEqual([]);
});
test("기존 웹 v1 데이터 그대로 이어하기와 오프라인 모션 감소", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await compose(page, "원본의 씨앗");
  await page.getByRole("button", { name: "검토한 할 일 추가" }).click();
  await page.locator('[data-action="postpone"]').click();
  const before = await state(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await tab(page, "archive");
  await page.getByLabel("모션 줄이기").check();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "복잡한 마음은 내려놓고," }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveClass(/reduce-motion/);
  const after = await state(page);
  expect(after.tasks).toEqual(before.tasks);
  await tab(page, "archive");
  await page.locator('[data-action="restore"]').click();
  await tab(page, "today");
  await expect(page.locator(".primary-card h2")).toHaveText("원본의 씨앗");
});
test("분리 검토 수정·순서·제외 및 저장 후 CRUD", async ({ page }) => {
  await page.goto("/");
  await compose(page, "첫째\n둘째\n셋째");
  await page
    .locator('[data-action="move-draft"][data-index="2"][data-direction="-1"]')
    .click();
  await page.locator('[data-action="remove-draft"][data-index="0"]').click();
  await page
    .getByLabel("할 일 1 수정", { exact: true })
    .fill("정확한 제목, 쉼표 보존");
  await page.getByRole("button", { name: "검토한 할 일 추가" }).click();
  await expect(page.locator(".primary-card h2")).toHaveText(
    "정확한 제목, 쉼표 보존",
  );
  await page.locator('[data-action="toggle-tasks"]').click();
  await page
    .locator('[data-action="move-task"][data-direction="1"]')
    .first()
    .click();
  await expect(page.locator(".primary-card h2")).toHaveText("둘째");
  await page.locator('[data-action="edit-task"]').first().click();
  await page.getByLabel("할 일 제목 수정").fill("수정한 둘째");
  await page.getByRole("button", { name: "수정 저장" }).click();
  await expect(page.locator(".primary-card h2")).toHaveText("수정한 둘째");
  await page.locator('[data-action="delete-task"]').first().click();
  await expect(page.locator(".primary-card h2")).toHaveText(
    "정확한 제목, 쉼표 보존",
  );
});
test("손상된 원본 백업 내보내기는 거절하고 원문을 보존", async ({ page }) => {
  await page.goto("/transfer/");
  await page.evaluate(() =>
    localStorage.setItem("onjeom.local.v1", "broken raw original"),
  );
  await page.reload();
  await page.getByRole("button", { name: "이 브라우저 기록 내보내기" }).click();
  await expect(page.getByRole("alert")).toContainText("백업 JSON");
  expect(
    await page.evaluate(() => localStorage.getItem("onjeom.local.v1")),
  ).toBe("broken raw original");
});
