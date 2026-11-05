import { test, expect } from "@playwright/test";
import { openDiary } from "../helpers/open-diary.mjs";
const button = (page, name) => page.getByRole("button", { name, exact: true });
test("첨부 명세: 최초 표지·실제 폰트 6종·날짜/본문/주 버튼/탭 수치", async ({
  page,
}) => {
  await page.goto("/");
  await expect(button(page, "다이어리 펼치기")).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByText(
      "복잡한 생각 끝에 온점을 찍고, 작은 행동 하나를 시작해보세요.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/00-cover.png" });
  await button(page, "다이어리 펼치기").click();
  const date = page.getByRole("heading").first();
  await expect(date).toHaveCSS("font-family", /NotoSerifKR600/);
  await expect(date).toHaveCSS("font-size", "26px");
  await expect(date).toHaveCSS("line-height", "36px");
  const input = page.getByLabel("자유로운 생각 입력");
  await expect(input).toHaveCSS("font-family", /Pretendard400/);
  await expect(input).toHaveCSS("font-size", "16px");
  await expect(input).toHaveCSS("line-height", "28px");
  const emptyBox = await input.boundingBox();
  expect(emptyBox.height).toBeGreaterThanOrEqual(140);
  await input.fill("책 한 쪽 읽기");
  const primary = button(page, "생각 정리하기"),
    cta = primary.locator("div").first();
  await expect(cta).toHaveCSS("background-color", "rgb(97, 120, 92)");
  await expect(cta).toHaveCSS("border-radius", "12px");
  expect((await primary.boundingBox()).height).toBe(52);
  expect((await page.getByTestId("bottom-tab-bar").boundingBox()).height).toBe(
    64,
  );
  const faces = await page.evaluate(async () => {
    await Promise.all([...document.fonts].map((f) => f.load()));
    return [...document.fonts].map((f) => ({
      family: f.family,
      status: f.status,
    }));
  });
  expect(faces).toHaveLength(6);
  expect(faces.every((f) => f.status === "loaded")).toBe(true);
  await page.reload();
  await expect(input).toBeVisible();
  await expect(button(page, "다이어리 펼치기")).toHaveCount(0);
});
test("첨부 명세: 드래그 정렬·85% 하단 시트·고정 확정 버튼", async ({
  page,
}) => {
  await openDiary(page);
  await page
    .getByLabel("자유로운 생각 입력")
    .fill("물 마시기\n창문 열기\n컵 씻기");
  await button(page, "생각 정리하기").click();
  const sheet = page.getByTestId("bottom-sheet");
  await expect(sheet).toBeVisible();
  const geometry = await sheet.boundingBox();
  expect(geometry.height).toBeLessThanOrEqual(844 * 0.85 + 1);
  await expect(sheet).toHaveCSS("border-top-left-radius", "24px");
  const first = page.getByLabel("할 일 1 드래그 순서 변경", { exact: true }),
    second = page.getByLabel("할 일 2 드래그 순서 변경", { exact: true });
  const a = await first.boundingBox(),
    b = await second.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByLabel("할 일 1 수정", { exact: true })).toHaveValue(
    "창문 열기",
  );
  await page.setViewportSize({ width: 390, height: 480 });
  const footer = await page.getByTestId("sheet-footer").boundingBox(),
    confirm = await button(page, "오늘의 작은 일로 확정하기").boundingBox();
  expect(confirm.y).toBeGreaterThanOrEqual(footer.y);
  expect(confirm.y + confirm.height).toBeLessThanOrEqual(480);
  await button(page, "오늘의 작은 일로 확정하기").click();
  await expect(
    page.getByRole("heading", { name: "창문 열기", exact: true }),
  ).toBeVisible();
});
test("첨부 명세: 홈 완료 원·조용한 4회 개화·선택한 뒤에만 꽃말 시트", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openDiary(page);
  await page
    .getByLabel("자유로운 생각 입력")
    .fill("컵 씻기\n물 마시기\n창문 열기\n책 읽기");
  await button(page, "생각 정리하기").click();
  await button(page, "오늘의 작은 일로 확정하기").click();
  await button(page, "오늘로 돌아가기").click();
  for (const task of ["컵 씻기", "물 마시기", "창문 열기", "책 읽기"]) {
    await button(page, `${task} 완료하기`).click();
    await expect(
      page.getByRole("checkbox", { name: task, exact: true }),
    ).toBeChecked();
  }
  await expect(
    page.getByText("오늘의 작은 걸음들이 모여 꽃 한 송이가 피어났어요", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByTestId("bottom-sheet")).toHaveCount(0);
  await button(page, "꽃말 보러 가기").click();
  await expect(button(page, "꽃말 카드 저장·공유 · 무료")).toBeVisible();
});
