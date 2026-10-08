import type { Page } from "@playwright/test";

/* every run mints its own users and items, nothing depends on seeded rows */
export function stamp(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

export async function register(
  page: Page,
  fullName: string,
  email: string,
  studentNumber?: string,
) {
  await page.goto("/welcome");
  await page.getByRole("link", { name: "create account" }).first().click();
  await page.getByLabel("full name").fill(fullName);
  await page.getByLabel("email").fill(email);
  if (studentNumber) {
    await page.getByLabel("student number").fill(studentNumber);
  }
  await page.getByLabel("password", { exact: true }).fill("password123");
  await page.getByLabel("confirm password").fill("password123");
  await page.getByText("i accept the campus terms").click();
  await page.getByRole("button", { name: "create account" }).click();
  /* success card, then an automatic walk to login */
  await page.getByText("you are in.").waitFor();
  await page.waitForURL("**/login");
}

export async function login(page: Page, identifier: string) {
  await page.goto("/login");
  await page.getByLabel("email or student number").fill(identifier);
  await page.getByLabel("password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "log in" }).click();
  await page.getByText("here is campus today").waitFor();
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "log out" }).click();
  await page.getByRole("button", { name: "log in" }).first().waitFor();
}
