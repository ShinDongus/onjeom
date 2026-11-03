import { test, expect } from "@playwright/test";
test("Pages 하위 경로에서 설치 자산과 오프라인 기록 보존", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: "할 일로 나눠 보기", exact: true }),
  ).toBeVisible();
  const bundles = await page
    .locator("script[src]")
    .evaluateAll((elements) => elements.map((el) => new URL(el.src).pathname));
  expect(bundles.some((path) => path.startsWith("/onjeom/_expo/"))).toBe(true);
  const manifestUrl = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  const manifest = await (
    await page.request.get(new URL(manifestUrl, page.url()).href)
  ).json();
  expect(manifest.display).toBe("standalone");
  const icon = await page.request.get(
    new URL(manifest.icons[0].src, new URL(manifestUrl, page.url())).href,
  );
  expect(icon.status()).toBe(200);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  expect(
    await page.evaluate(() => navigator.serviceWorker.controller.scriptURL),
  ).toContain("/onjeom/sw.js");
  await page.getByLabel("자유로운 생각 입력").fill("아이폰에서 첫 한 걸음");
  await page
    .getByRole("button", { name: "할 일로 나눠 보기", exact: true })
    .click();
  await page
    .getByRole("button", { name: "검토한 할 일 추가", exact: true })
    .click();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("tab", { name: "실행", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "아이폰에서 첫 한 걸음" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "이만큼 해냈어요 · 완료", exact: true })
    .click();
  await page.reload();
  await page.getByRole("tab", { name: "실행", exact: true }).click();
  await expect(page.getByText("지금은 여백으로 두어도 좋아요.")).toBeVisible();
  expect(errors).toEqual([]);
});
