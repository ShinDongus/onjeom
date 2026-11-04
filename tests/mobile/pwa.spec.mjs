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
    .getByRole("button", { name: "생각 정리하기", exact: true })
    .click();
  await page
    .getByRole("button", { name: "한 걸음 모드 시작", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "오프라인에서 할 일" }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole("button", { name: "한 걸음 시작하기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "오프라인에서 할 일" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "완료했어요", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "한 걸음 시작하기", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("checkbox", { name: "오프라인에서 할 일", exact: true }),
  ).toBeVisible();
});
