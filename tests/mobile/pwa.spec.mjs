import { test, expect } from "@playwright/test";
test("홈 화면 설치 메타데이터와 캐시된 앱의 오프라인 실행·저장", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(
    page.locator('meta[name="apple-mobile-web-app-capable"]'),
  ).toHaveAttribute("content", "yes");
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.name).toBe("온점.");
  const icon = await page.request.get("/apple-touch-icon.png");
  expect(icon.status()).toBe(200);
  expect(icon.headers()["content-type"]).toBe("image/png");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.getByLabel("자유로운 생각 입력").fill("오프라인에서 할 일");
  await page
    .getByRole("button", { name: "할 일로 나눠 보기", exact: true })
    .click();
  await page
    .getByRole("button", { name: "검토한 할 일 추가", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "오프라인에서 할 일" }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("tab", { name: "실행", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "오프라인에서 할 일" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "이만큼 해냈어요 · 완료", exact: true })
    .click();
  await page.reload();
  await page.getByRole("tab", { name: "실행", exact: true }).click();
  await expect(page.getByText("지금은 여백으로 두어도 좋아요.")).toBeVisible();
});
