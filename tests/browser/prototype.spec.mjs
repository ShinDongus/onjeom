import { test, expect } from "@playwright/test";
test("생각 검토 → 네 행동 완료 → 취소 꽃 보관 → 보상 등록 → 재접속 → 씨앗 복원 → 백업", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/web/");
  await page
    .getByLabel("자유로운 생각 입력")
    .fill("빨래하기, 메일 보내기, 책상 정리, 물 마시기, 산책하기");
  await page.getByRole("button", { name: "할 일로 나눠 보기" }).click();
  await page.getByLabel("할 일 1 수정", { exact: true }).fill("수건 빨래");
  await page.getByRole("button", { name: "검토한 할 일 추가" }).click();
  await expect(page.getByRole("heading", { name: "수건 빨래" })).toBeVisible();
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "이만큼 해냈어요 · 완료" }).click();
  await expect(page.getByRole("dialog")).toContainText("피었어요");
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.getByRole("button", { name: "정원", exact: true }).click();
  await page.getByRole("button", { name: "도감에 담기", exact: true }).click();
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "정원", exact: true }).click();
  await expect(page.getByRole("button", { name: "도감에 담기" })).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "도감에 담기" }).click();
  await page.getByRole("button", { name: "테스트: 광고 제공 안 됨" }).click();
  await expect(page.getByRole("button", { name: "도감에 담기" })).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "도감에 담기" }).click();
  await page.getByRole("button", { name: "테스트: 보상 완료" }).click();
  await expect(page.getByText("도감에 담았어요")).toBeVisible();
  await page.getByRole("button", { name: "실행", exact: true }).click();
  await page.getByRole("button", { name: "씨앗 보관함에 두기" }).click();
  await page.reload();
  await page.getByRole("button", { name: "씨앗", exact: true }).click();
  await expect(page.getByRole("heading", { name: "산책하기" })).toBeVisible();
  await page.getByRole("button", { name: "다시 꺼내기" }).click();
  await page.getByRole("button", { name: "실행", exact: true }).click();
  await expect(page.getByRole("heading", { name: "산책하기" })).toBeVisible();
  await page.getByRole("button", { name: "설정", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "백업 내보내기" }).click();
  const path = await (await download).path();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "전체 삭제", exact: true }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByLabel("백업에서 복원").setInputFiles(path);
  await expect(page.getByRole("status")).toContainText("복원했습니다");
  await page.reload();
  await page.getByRole("button", { name: "정원", exact: true }).click();
  await expect(page.getByText("도감에 담았어요")).toBeVisible();
  expect(errors).toEqual([]);
});
test("오프라인 재접속 및 모션 감소", async ({ page, context }) => {
  await page.goto("/web/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.getByRole("button", { name: "설정", exact: true }).click();
  await page.getByLabel("모션 줄이기").check();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "마음에 있는 것부터" }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveClass("reduce-motion");
});
