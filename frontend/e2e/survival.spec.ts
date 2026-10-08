import { expect, test } from "@playwright/test";
import { login, logout, register, stamp } from "./helpers";

/* flow C — cry for help, offer, accept, resolve, inbox along the way */
test("survival request runs the full two-user lifecycle", async ({ page }) => {
  const tag = stamp("e2e");
  const helpeeEmail = `${tag}-helpee@cput.ac.za`;
  const helperEmail = `${tag}-helper@cput.ac.za`;
  const title = `e2e dinner ${tag}`;

  await register(page, "e2e helpee", helpeeEmail, `95${Date.now().toString().slice(-6)}`);
  await login(page, helpeeEmail);
  await page.goto("/survival/new");
  await page.getByLabel("type").selectOption("FOOD");
  await page.getByLabel("title").fill(title);
  await page.getByLabel("description").fill("stipend late");
  await page.getByLabel("location").fill("res block c");
  await page.getByLabel("urgency").selectOption("HIGH");
  await page.getByRole("button", { name: /send request/i }).click();
  await expect(page.getByText(title)).toBeVisible();
  const requestUrl = page.url();
  await logout(page);

  await register(page, "e2e helper", helperEmail, `96${Date.now().toString().slice(-6)}`);
  await login(page, helperEmail);
  await page.goto(requestUrl);
  await page.getByRole("button", { name: /offer help/i }).click();
  await page.getByLabel("how can you help").fill("i can bring food around 7");
  await page.getByRole("button", { name: /send offer/i }).click();
  await expect(page.getByText("i can bring food around 7")).toBeVisible();
  await logout(page);

  /* helpee sees the hand, accepts, resolves */
  await login(page, helpeeEmail);
  await page.goto(requestUrl);
  await expect(page.getByText("i can bring food around 7")).toBeVisible();
  await page.getByRole("button", { name: /^accept$/i }).click();
  await expect(page.getByText("in progress")).toBeVisible();
  await page.goto("/notifications");
  await expect(page.getByText("someone offered help").first()).toBeVisible();

  await page.goto(requestUrl);
  await page.getByRole("button", { name: /mark resolved/i }).click();
  await expect(page.getByText("resolved").first()).toBeVisible();
});
