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
