import { test, expect } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import {
  initialState,
  addTasks,
  completeTask,
  exportBackup,
  importBackup,
} from "../../src/mobile-domain.mjs";
const button = (page, name) => page.getByRole("button", { name, exact: true });
async function pickBackup(page, text) {
  const chooser = page.waitForEvent("filechooser");
  await button(page, "백업 파일에서 복원").click();
  await (
    await chooser
  ).setFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(text),
  });
  await button(page, "복원").click();
}
test("React Native UI: 검토·완료·개화·취소 보관·등록·재실행·씨앗·백업 복원", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByLabel("자유로운 생각 입력")).toBeVisible();
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/mobile-today.png" });
  await page.getByLabel("자유로운 생각 입력").fill("하나\n둘\n셋\n넷\n씨앗");
  await button(page, "생각 정리하기").click();
  await page
    .getByLabel("할 일 1 수정", { exact: true })
    .fill("책상 위 컵 치우기");
  await button(page, "한 걸음 모드 시작").click();
  await expect(
    page.getByRole("heading", { name: "책상 위 컵 치우기" }),
  ).toBeVisible();
  for (let i = 0; i < 4; i++) await button(page, "완료했어요").click();
  await expect(page.getByText("당신의 작은 행동 끝에")).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "artifacts/mobile-bloom.png" });
  await page.setViewportSize({ width: 320, height: 640 });
  const cardDownload = page.waitForEvent("download");
  await button(page, "꽃말 카드 저장·공유 · 무료").click();
  expect((await cardDownload).suggestedFilename()).toBe(
    "onjeom-flower-card.svg",
  );
  await button(page, "기억의 정원에서 만나기").click();
  await page.setViewportSize({ width: 390, height: 844 });
  const openFirst = () =>
    page
      .getByTestId("garden-page-0")
      .getByTestId("garden-flower")
      .first()
      .click();
  await openFirst();
  await button(page, "도감에 담기").click();
  await button(page, "취소하고 꽃 보관").click();
  await page.reload();
  await page.getByRole("tab", { name: "정원", exact: true }).click();
  await openFirst();
  await expect(button(page, "도감에 담기")).toBeVisible();
  await button(page, "도감에 담기").click();
  await button(page, "테스트: 광고 제공 안 됨").click();
  await openFirst();
  await expect(button(page, "도감에 담기")).toBeVisible();
  await button(page, "도감에 담기").click();
  await button(page, "테스트: 보상 완료").click();
  await openFirst();
  await expect(page.getByText("도감에 담았어요")).toBeVisible();
  await button(page, "꽃 상세 닫기").click();
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await button(page, "한 걸음 시작하기").click();
  await button(page, "나중에 하기").click();
  await expect(
    page.getByRole("heading", { name: "잠시, 여백을 누려요.", exact: true }),
  ).toBeVisible();
  await page.reload();
  await button(page, "씨앗 보관함 열기").click();
  await button(page, "다시 꺼내기").click();
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await button(page, "한 걸음 시작하기").click();
  await expect(page.getByRole("heading", { name: "씨앗" })).toBeVisible();
  await button(page, "설정 열기").click();
  await page.getByRole("switch", { name: "모션 줄이기", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "모션 줄이기", exact: true }),
  ).toBeChecked();
  const download = page.waitForEvent("download");
  await button(page, "백업 파일 내보내기").click();
  const path = await (await download).path();
  const backup = await readFile(path, "utf8");
  const state = importBackup(backup);
  expect(state.completedTotal).toBe(4);
  expect(state.flowers).toHaveLength(1);
  expect(state.settings.reduceMotion).toBe(true);
  await button(page, "기기 데이터 전체 삭제").click();
  await button(page, "전체 삭제").click();
  await pickBackup(page, backup);
  await page.reload();
  await page.getByRole("tab", { name: "정원", exact: true }).click();
  await page
    .getByTestId("garden-page-0")
    .getByTestId("garden-flower")
    .first()
    .click();
  await expect(page.getByText("도감에 담았어요")).toBeVisible();
  await button(page, "꽃 상세 닫기").click();
  await page.getByRole("tab", { name: "도감", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "나의 식물도감" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("React Native 실제 렌더링: 12종 벡터·작은 화면·감소 모션·손상 백업 보호", async ({
  page,
}) => {
  let state = addTasks(
    initialState(),
    Array.from({ length: 48 }, (_, i) => `기록 ${i + 1}`),
  );
  for (let flower = 0; flower < 12; flower++) {
    let roll = 0;
    for (let step = 0; step < 4; step++)
      state = completeTask(
        state,
        state.tasks.find((t) => t.status === "active").id,
        {
          day: "2026-06-01",
          random: () => (roll++ % 2 === 0 ? (flower + 0.1) / 12 : 0.8),
        },
      );
  }
  state.settings.reduceMotion = true;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await button(page, "설정 열기").click();
  await pickBackup(page, exportBackup(state));
  await page.getByRole("tab", { name: "정원", exact: true }).click();
  await expect(
    page.getByTestId("garden-page-0").getByTestId("garden-flower"),
  ).toHaveCount(9);
  await expect(
    page.getByTestId("garden-page-0").getByTestId("garden-empty"),
  ).toHaveCount(0);
  await expect(button(page, "이전 정원 페이지")).toBeDisabled();
  await page.screenshot({ path: "artifacts/mobile-garden.png" });
  await button(page, "다음 정원 페이지").click();
  await expect(page.getByText("2 / 2", { exact: true })).toBeVisible();
  await expect(
    page.getByTestId("garden-page-1").getByTestId("garden-flower"),
  ).toHaveCount(3);
  await expect(
    page.getByTestId("garden-page-1").getByTestId("garden-empty"),
  ).toHaveCount(6);
  await expect(button(page, "다음 정원 페이지")).toBeDisabled();
  await page
    .getByTestId("garden-page-1")
    .getByTestId("garden-flower")
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: state.flowers[9].name, exact: true }),
  ).toBeVisible();
  await button(page, "꽃 상세 닫기").click();
  await page.setViewportSize({ width: 320, height: 640 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  await button(page, "이전 정원 페이지").click();
  await expect(page.getByText("1 / 2", { exact: true })).toBeVisible();
  await page.getByTestId("garden-pager").hover();
  await page.mouse.wheel(350, 0);
  await expect(page.getByText("2 / 2", { exact: true })).toBeVisible();
  await page.screenshot({ path: "artifacts/mobile-garden-page2.png" });
  await button(page, "설정 열기").click();
  await pickBackup(page, '{"broken":true}');
  await expect(page.getByRole("alert")).toContainText("백업 파일");
  await page.reload();
  await page.getByRole("tab", { name: "정원", exact: true }).click();
  await expect(
    page.getByTestId("garden-page-0").getByTestId("garden-flower"),
  ).toHaveCount(9);
  await button(page, "다음 정원 페이지").click();
  await expect(
    page.getByTestId("garden-page-1").getByTestId("garden-flower"),
  ).toHaveCount(3);
});

test("원본 웹 JSON을 실제 앱에서 복원하고 삭제 취소로 기록 보존", async ({
  page,
}) => {
  const original = await import("../../prototype/src/logic.mjs");
  let raw = original.addThought(
    original.createInitialState(),
    "원래 생각 하나\n둘\n셋\n넷\n나중에 할 일",
  );
  for (let i = 0; i < 4; i++)
    raw = original.finishTask(
      raw,
      original.activeTask(raw).id,
      () => 0.001,
      new Date("2026-11-03T10:00:00Z"),
    );
  raw = original.postponeTask(raw, original.activeTask(raw).id);
  await page.goto("/");
  await button(page, "설정 열기").click();
  await pickBackup(page, JSON.stringify(raw));
  await button(page, "기기 데이터 전체 삭제").click();
  await button(page, "취소").click();
  const download = page.waitForEvent("download");
  await button(page, "백업 파일 내보내기").click();
  const migrated = importBackup(
    await readFile(await (await download).path(), "utf8"),
  );
  expect(migrated.thoughts).toEqual(raw.thoughts);
  expect(migrated.flowers).toEqual(raw.flowers);
  await page.reload();
  await button(page, "씨앗 보관함 열기").click();
  await expect(page.getByText("나중에 할 일")).toBeVisible();
  await button(page, "다시 꺼내기").click();
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await button(page, "한 걸음 시작하기").click();
  await expect(
    page.getByRole("heading", { name: "나중에 할 일" }),
  ).toBeVisible();
});
