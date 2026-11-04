import { test, expect } from "@playwright/test";
test("Pages 하위 경로에서 설치 자산과 오프라인 기록 보존", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: "생각 정리하기", exact: true }),
  ).toBeVisible();
  const gallery = await page.request.get("/onjeom/review/");
  expect(gallery.status()).toBe(200);
  expect(await gallery.text()).toContain("온점. 하루를 펼치는 다이어리");
  const screenshot = await page.request.get(
    "/onjeom/review/screenshots/01-today.png",
  );
  expect(screenshot.status()).toBe(200);
  expect(screenshot.headers()["content-type"]).toBe("image/png");
  const workerText = await (await page.request.get("/onjeom/sw.js")).text();
  expect(workerText).not.toContain("./review/");
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
    .getByRole("button", { name: "생각 정리하기", exact: true })
    .click();
  await page
    .getByRole("button", { name: "한 걸음 모드 시작", exact: true })
    .click();
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole("button", { name: "한 걸음 시작하기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "아이폰에서 첫 한 걸음" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "완료했어요", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "잠시, 여백을 누려요.", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "한 걸음 시작하기", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("checkbox", { name: "아이폰에서 첫 한 걸음", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
