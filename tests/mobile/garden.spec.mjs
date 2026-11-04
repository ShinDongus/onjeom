import { test, expect } from "@playwright/test";
test("첫 화면은 입력 시트로 시작하고 빈 정원도 아홉 자리를 유지", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "생각 꺼내놓기", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("자유로운 생각 입력")).toHaveCount(0);
  await page
    .getByRole("button", { name: "생각 꺼내놓기", exact: true })
    .click();
  await expect(page.getByLabel("자유로운 생각 입력")).toBeVisible();
  await page.getByRole("button", { name: "돌아가기", exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "artifacts/desktop-home.png" });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole("tab", { name: "정원", exact: true }).click();
  await expect(
    page.getByTestId("garden-page-0").getByTestId("garden-empty"),
  ).toHaveCount(9);
  await expect(
    page.getByRole("button", { name: "다음 정원 페이지" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "이전 정원 페이지" }),
  ).toBeDisabled();
  await expect(page.getByText("1 / 1", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("입력 시트의 초안 유지·홈에서 이어 하기·작은 단계 전환과 한 손 버튼 위치", async ({
  page,
}) => {
  const button = (name) => page.getByRole("button", { name, exact: true });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await expect(button("생각 꺼내놓기")).toBeVisible();
  const composeBox = await button("생각 꺼내놓기").boundingBox();
  const navBox = await page
    .getByRole("tab", { name: "오늘", exact: true })
    .boundingBox();
  expect(composeBox.y + composeBox.height).toBeLessThanOrEqual(navBox.y);
  await button("생각 꺼내놓기").click();
  const sheetBox = await page.getByTestId("bottom-sheet").boundingBox();
  expect(sheetBox.y + sheetBox.height).toBeCloseTo(640, 0);
  await page.getByLabel("자유로운 생각 입력").fill("저녁 준비하기\n책 읽기");
  await button("닫기").click();
  await button("생각 꺼내놓기").click();
  await expect(page.getByLabel("자유로운 생각 입력")).toHaveValue(
    "저녁 준비하기\n책 읽기",
  );
  await button("할 일로 나눠 보기").click();
  await button("검토한 할 일 추가").click();
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await expect(page.getByText("저녁 준비하기", { exact: true })).toBeVisible();
  await button("지금 할 일 이어서 하기").click();
  await button("작은 단계로 나누기").click();
  await page.getByLabel("작은 단계 입력").fill("냉장고 열기\n채소 꺼내기");
  await button("작은 단계로 바꾸기").click();
  await expect(
    page.getByRole("heading", { name: "냉장고 열기", exact: true }),
  ).toBeVisible();
  const completeBox = await button("이만큼 해냈어요 · 완료").boundingBox();
  expect(completeBox.y + completeBox.height).toBeLessThanOrEqual(navBox.y);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/mobile-focus.png" });
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await page.screenshot({ path: "artifacts/mobile-today-active.png" });
});
