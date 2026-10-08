import { expect, test } from "@playwright/test";
import { login, logout, register, stamp } from "./helpers";

/* flow D — thread, reply, author pinged */
test("community thread collects a reply and a notification", async ({ page }) => {
  const tag = stamp("e2e");
  const authorEmail = `${tag}-author@cput.ac.za`;
  const replierEmail = `${tag}-replier@cput.ac.za`;
  const title = `e2e thread ${tag}`;

  await register(page, "e2e author", authorEmail, `97${Date.now().toString().slice(-6)}`);
  await login(page, authorEmail);
  await page.goto("/community/new");
  await page.getByLabel("title").fill(title);
  await page.getByLabel("body").fill("when do allowances drop");
  await page.getByRole("button", { name: /post thread/i }).click();
  await expect(page.getByText("when do allowances drop")).toBeVisible();
  const threadUrl = page.url();
  await logout(page);

  await register(page, "e2e replier", replierEmail, `98${Date.now().toString().slice(-6)}`);
  await login(page, replierEmail);
  await page.goto(threadUrl);
  await page.getByLabel("write a reply").fill("same question here");
  await page.getByRole("button", { name: /^reply$/i }).click();
  await expect(page.getByText("same question here")).toBeVisible();
  await logout(page);

  /* author finds the reply and the ping */
  await login(page, authorEmail);
  await page.goto(threadUrl);
  await expect(page.getByText("same question here")).toBeVisible();
  await page.goto("/notifications");
  await expect(page.getByText("new reply on your thread").first()).toBeVisible();
});
