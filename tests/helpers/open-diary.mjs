import { expect } from "@playwright/test";
export async function openDiary(page, path = "/") {
  await page.goto(path);
  const cover = page.getByRole("button", {
      name: "다이어리 펼치기",
      exact: true,
    }),
    input = page.getByLabel("자유로운 생각 입력");
  await expect(cover.or(input).first()).toBeVisible({ timeout: 20000 });
  if (await cover.isVisible()) await cover.click();
  await expect(input).toBeVisible();
}
