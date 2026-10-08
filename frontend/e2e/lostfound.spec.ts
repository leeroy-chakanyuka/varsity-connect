import { expect, test } from "@playwright/test";
import { login, logout, register, stamp } from "./helpers";

/* flow B — lost meets found, both sides accept, both inboxes ping */
test("lost and found pairs across two students", async ({ page }) => {
  const tag = stamp("e2e");
  const lostEmail = `${tag}-lost@cput.ac.za`;
  const foundEmail = `${tag}-found@cput.ac.za`;
  const item = `e2e wallet ${tag}`;

  async function report(type: "lost" | "found") {
    await page.goto("/lost-found/new");
    await page.getByText(type === "lost" ? "i lost it" : "i found it").click();
    await page.getByLabel("item name").fill(item);
    await page.getByLabel("category").selectOption("OTHER");
    await page.getByLabel("description").fill("black leather wallet with student card");
    await page.getByLabel("location").fill("library steps");
    await page.getByLabel("incident date").fill("2026-10-06");
    await page.getByRole("button", { name: /report it/i }).click();
    await expect(page.getByText("black leather wallet with student card").first()).toBeVisible();
  }

  await register(page, "e2e lost", lostEmail, `93${Date.now().toString().slice(-6)}`);
  await login(page, lostEmail);
  await report("lost");
  const lostUrl = page.url();
  await logout(page);

  await register(page, "e2e found", foundEmail, `94${Date.now().toString().slice(-6)}`);
  await login(page, foundEmail);
  await report("found");

  /* found side sees the pair and accepts */
  await expect(page.getByText(/potential match/i).first()).toBeVisible();
  await page.getByRole("button", { name: /^accept$/i }).first().click();
  await expect(page.getByText(/you accepted this one/i)).toBeVisible();
  await logout(page);

  /* lost side accepts too — matched */
  await login(page, lostEmail);
  await page.goto(lostUrl);
  await page.getByRole("button", { name: /^accept$/i }).first().click();
  await expect(page.getByText(/both accepted/i)).toBeVisible();

  /* both inboxes heard about it */
  await page.goto("/notifications");
  await expect(page.getByText("possible match found").first()).toBeVisible();
});
