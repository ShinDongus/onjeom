import { test, expect } from "@playwright/test";
const button = (page, name) => page.getByRole("button", { name, exact: true });
test("한 장의 홈·네 탭·빈 정원 9자리와 작은 화면", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("자유로운 생각 입력")).toBeVisible();
  await expect(page.getByRole("tab")).toHaveText([
    "오늘",
    "정원",
    "도감",
    "기록",
  ]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "artifacts/desktop-home.png" });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole("tab", { name: "정원", exact: true }).click();
  await expect(
    page.getByTestId("garden-page-0").getByTestId("garden-empty"),
  ).toHaveCount(9);
  await expect(button(page, "다음 정원 페이지")).toBeDisabled();
  await expect(button(page, "이전 정원 페이지")).toBeDisabled();
  await expect(page.getByText("1 / 1", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
test("생각 저장·검토 메모 유지·홈 이어 하기·작은 단계 전환", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.getByLabel("자유로운 생각 입력").fill("저녁 준비하기\n책 읽기");
  await button(page, "생각 저장").click();
  await expect(button(page, "✓ 저장됨")).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel("자유로운 생각 입력")).toHaveValue(
    "저녁 준비하기\n책 읽기",
  );
  await button(page, "생각 정리하기").click();
  const box = await page.getByTestId("bottom-sheet").boundingBox();
  expect(box.y + box.height).toBeCloseTo(640, 0);
  await page
    .getByLabel("할 일 1 수정", { exact: true })
    .fill("저녁 준비부터 하기");
  await button(page, "닫기").click();
  await button(page, "생각 정리하기").click();
  await expect(page.getByLabel("할 일 1 수정", { exact: true })).toHaveValue(
    "저녁 준비부터 하기",
  );
  await button(page, "한 걸음 모드 시작").click();
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await button(page, "한 걸음 시작하기").click();
  await button(page, "더 작게 나누기").click();
  await page.getByLabel("작은 단계 입력").fill("냉장고 열기\n채소 꺼내기");
  await button(page, "작은 단계로 바꾸기").click();
  await expect(
    page.getByRole("heading", { name: "냉장고 열기", exact: true }),
  ).toBeVisible();
  const complete = await button(page, "완료했어요").boundingBox(),
    nav = await page
      .getByRole("tab", { name: "오늘", exact: true })
      .boundingBox();
  expect(complete.y + complete.height).toBeLessThanOrEqual(nav.y);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/mobile-focus.png" });
  await page.getByRole("tab", { name: "오늘", exact: true }).click();
  await page.screenshot({ path: "artifacts/mobile-today-active.png" });
});

test("입력 중 작은 뷰포트에서도 스크롤로 검토·실행 버튼에 접근", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 480 });
  await page.goto("/");
  const input = page.getByLabel("자유로운 생각 입력");
  await input.fill("주방 정리하기\n빨래 개기\n편지 쓰기");
  await expect(input).toBeFocused();
  await button(page, "생각 정리하기").click();
  await expect(page.getByLabel("할 일 1 수정", { exact: true })).toBeVisible();
  await button(page, "한 걸음 모드 시작").click();
  await expect(
    page.getByRole("heading", { name: "주방 정리하기", exact: true }),
  ).toBeVisible();
  await button(page, "완료했어요").click();
  await expect(
    page.getByRole("heading", { name: "빨래 개기", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
