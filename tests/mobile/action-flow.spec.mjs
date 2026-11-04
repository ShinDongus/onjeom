import { test, expect } from "@playwright/test";
import { addPlan } from "../../src/planner.mjs";
import {
  initialState,
  completeTask,
  actionableTasks,
  exportBackup,
} from "../../src/mobile-domain.mjs";
const button = (p, name) => p.getByRole("button", { name, exact: true });
async function snapshot(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open("onjeom-expo-preview", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return new Promise((resolve) => {
      const r = db.transaction("app_state").objectStore("app_state").get(1);
      r.onsuccess = () => {
        resolve(r.result);
        db.close();
      };
    });
  });
}
test("capture review nested split one-action completion offline reload and optional reflection", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByTestId("action-home")).toBeVisible();
  await page
    .getByLabel("머릿속 생각", { exact: true })
    .fill("서류 제출해야 해");
  await button(page, "생각만 보관하기").click();
  await page.reload();
  await expect(page.getByLabel("머릿속 생각", { exact: true })).toHaveValue(
    "서류 제출해야 해",
  );
  await button(page, "생각 정리하기 →").click();
  await expect(
    page.getByRole("heading", { name: "목표와 작은 행동 검토" }),
  ).toBeVisible();
  await page.getByLabel("할 일 1 수정", { exact: true }).fill("서류 제출");
  await page.getByLabel("할 일 2 수정", { exact: true }).fill("  서류 열기");
  await page
    .getByLabel("할 일 3 수정", { exact: true })
    .fill("  제출 버튼 누르기");
  await button(page, "한 걸음 모드 시작").click();
  await expect(
    page.getByRole("heading", { name: "서류 열기", exact: true }),
  ).toBeVisible();
  await button(page, "더 작게 나누기").click();
  await page.getByLabel("작은 단계 입력").fill("폴더 열기\n서류 선택하기");
  await button(page, "작은 단계로 바꾸기").click();
  await expect(
    page.getByRole("heading", { name: "폴더 열기", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/action-focus.png" });
  await button(page, "완료했어요").click();
  await expect(
    page.getByRole("heading", { name: "서류 선택하기", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await expect(page.getByText("실제 행동 1/4 · 다음 꽃까지 3개")).toBeVisible();
  await page
    .getByRole("button", { name: "서류 제출, 1/3 완료", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "서류 열기, 1/2 완료", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/action-tree.png", fullPage: true });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.reload();
  await expect(page.getByTestId("action-home")).toBeVisible();
  await page.screenshot({ path: "artifacts/action-home.png" });
  await context.setOffline(true);
  await page.reload();
  await button(page, "한 걸음 시작하기").click();
  await button(page, "완료했어요").click();
  await expect(
    page.getByRole("heading", { name: "제출 버튼 누르기", exact: true }),
  ).toBeVisible();
  await button(page, "완료했어요").click();
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await button(page, "지금 기분 돌아보기").click();
  await button(page, "지침").click();
  await button(page, "기분 남기기").click();
  await expect(page.getByText("오늘의 기분을 보관했어요.")).toBeVisible();
  await page.reload();
  const state = await snapshot(page);
  expect(state.completedTotal).toBe(3);
  expect(state.flowers).toHaveLength(0);
  expect(state.tasks.find((t) => t.title === "서류 제출").status).toBe("done");
  expect(Object.values(state.journals)[0].mood).toBe("지침");
  expect(errors).toEqual([]);
});
test("320px return without tasks can reflect and skip without granting growth; garden tabs remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await button(page, "지금 기분 돌아보기").click();
  await button(page, "맑음").click();
  await button(page, "기분 남기기").click();
  await expect(page.getByText("오늘의 기분을 보관했어요.")).toBeVisible();
  await button(page, "오늘은 건너뛰기").click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("tab", { name: "정원", exact: true }).click();
  await expect(
    page.getByTestId("garden-page-0").getByTestId("garden-empty"),
  ).toHaveCount(9);
  await page.getByRole("tab", { name: "도감", exact: true }).click();
  await page.screenshot({
    path: "artifacts/action-catalog-small.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  expect((await snapshot(page)).completedTotal).toBe(0);
});
test("nested fourth action blooms once; reward cancellation keeps bloom; tree backup survives restoration", async ({
  page,
}) => {
  let s = addPlan(initialState(), ["목표", "  하나", "  둘", "  셋", "  넷"]);
  for (let i = 0; i < 3; i++)
    s = completeTask(s, actionableTasks(s)[0].id, { random: () => 0.7 });
  await page.goto("/");
  await expect(page.getByTestId("action-home")).toBeVisible();
  await page.evaluate(async (state) => {
    const db = await new Promise((resolve) => {
      const r = indexedDB.open("onjeom-expo-preview", 1);
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise((resolve) => {
      const tx = db.transaction("app_state", "readwrite");
      tx.objectStore("app_state").put(state, 1);
      tx.oncomplete = resolve;
    });
    db.close();
  }, s);
  await page.reload();
  await button(page, "한 걸음 시작하기").click();
  await button(page, "완료했어요").click();
  await page.screenshot({ path: "artifacts/action-bloom.png" });
  await button(page, "기억의 정원에서 만나기").click();
  await page
    .getByTestId("garden-page-0")
    .getByTestId("garden-flower")
    .first()
    .click();
  await expect(button(page, "도감에 담기")).toBeVisible();
  await button(page, "도감에 담기").click();
  await button(page, "취소하고 꽃 보관").click();
  await page.reload();
  const state = await snapshot(page);
  expect(state.completedTotal).toBe(4);
  expect(state.flowers).toHaveLength(1);
  expect(state.flowers[0].registeredAt).toBeNull();
  expect(state.flowers[0].achievements).toEqual(["하나", "둘", "셋", "넷"]);
  expect(
    JSON.parse(exportBackup(state)).data.tasks.filter((t) => t.aggregate),
  ).toHaveLength(1);
  await expect(page.getByTestId("action-home")).toBeVisible();
  await page.screenshot({
    path: "artifacts/action-complete.png",
    fullPage: true,
  });
  await button(page, "설정 열기").click();
  const chooser = page.waitForEvent("filechooser");
  await button(page, "백업 파일에서 복원").click();
  await (
    await chooser
  ).setFiles({
    name: "tree.json",
    mimeType: "application/json",
    buffer: Buffer.from(exportBackup(state)),
  });
  await button(page, "복원").click();
  expect((await snapshot(page)).tasks).toEqual(state.tasks);
});
