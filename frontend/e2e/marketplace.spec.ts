import { expect, test } from "@playwright/test";
import { login, logout, register, stamp } from "./helpers";

/* flow A — student sells, student buys, pays, completes, reviews */
test("marketplace journey ends in a visible rating", async ({ page, request }) => {
  const tag = stamp("e2e");
  const sellerEmail = `${tag}-seller@cput.ac.za`;
  const buyerEmail = `${tag}-buyer@cput.ac.za`;
  const title = `e2e lamp ${tag}`;

  /* student A lists */
  await register(page, "e2e seller", sellerEmail, `91${Date.now().toString().slice(-6)}`);
  await login(page, sellerEmail);
  await page.goto("/market/new");
  await page.getByLabel("title").fill(title);
  await page.getByLabel("description").fill("barely used desk lamp");
  await page.getByLabel("price (r)").fill("150");
  await page.getByLabel("category").selectOption("TEXTBOOKS");
  await page.getByLabel("condition").selectOption("GOOD");
  await page.getByRole("button", { name: "list it" }).click();
  await expect(page.getByText(title).first()).toBeVisible();
  await logout(page);

  /* student B buys */
  await register(page, "e2e buyer", buyerEmail, `92${Date.now().toString().slice(-6)}`);
  await login(page, buyerEmail);
  await page.goto("/market");
  await page.getByLabel("search listings").fill(title);
  await page.getByRole("link", { name: new RegExp(title, "i") }).first().click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.getByRole("link", { name: /cart, 1 items/i }).click();
  await page.getByRole("link", { name: /^checkout$/i }).click();
  await page.getByRole("button", { name: /place order/i }).click();
  await expect(page.getByText("pending payment").first()).toBeVisible();
  await page.getByRole("button", { name: /pay now/i }).click();
  await expect(page.getByText("payment successful")).toBeVisible();

  /* back to the receipt, straight to completed, then review */
  await page.goto("/orders");
  await page.getByText(title).first().click();
  await expect(page.getByText("paid — arrange collection").first()).toBeVisible();
  await page.getByRole("button", { name: /mark as completed/i }).click();
  await expect(page.getByText("completed — thank you").first()).toBeVisible();
  await page.getByRole("radio", { name: /rate 5 stars/i }).click();
  await page.getByLabel("review comment").fill("smooth trade");
  await page.getByRole("button", { name: /post review/i }).click();
  await expect(page.getByText("review posted, thank you")).toBeVisible();

  /* the seller wears the rating now (sold cards leave the shelf, go direct) */
  const sellerLogin = await request.post("http://localhost:8080/api/v1/auth/login", {
    data: { identifier: sellerEmail, password: "password123" },
  });
  const sellerBody = await sellerLogin.json();
  await page.goto(`/profile/${sellerBody.user.id}`);
  await expect(page.getByText("smooth trade")).toBeVisible();
  await expect(page.getByText(/5\.0 from 1 review/)).toBeVisible();
});
