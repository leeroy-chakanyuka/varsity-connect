import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

/* basket, checkout, land on the receipt ready to pay */
async function receiptAsStudent() {
  const detail = renderWithSession(<Router />, "/market/listing-laptop", "student-token");
  fireEvent.click(await screen.findByRole("button", { name: /add to cart/i }));
  await screen.findByText(/in your cart/i);
  detail.unmount();

  const checkout = renderWithSession(<Router />, "/checkout", "student-token");
  fireEvent.click(await screen.findByRole("button", { name: /place order/i }));
  await screen.findByText(/pending payment/i);
  checkout.unmount();
}

/* demo till flows against the mock api */
describe("demo payment", () => {
  it("pays successfully, clears the cart and retires the listing", async () => {
    await receiptAsStudent();
    renderWithSession(<Router />, "/orders/order-1", "student-token");

    expect(await screen.findByText(/demo payment/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /pay now/i }));

    expect(await screen.findByText("payment successful")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pay now/i })).not.toBeInTheDocument();
  }, 15000);

  it("fails honestly with a retry path", async () => {
    await receiptAsStudent();
    const detail = renderWithSession(<Router />, "/orders/order-1", "student-token");

    fireEvent.click(await screen.findByRole("button", { name: /simulate failure/i }));
    expect(await screen.findByText("payment failed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /try again/i }));
    expect(await screen.findByText(/last attempt failed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pay now/i })).toBeInTheDocument();
    detail.unmount();
  }, 15000);

  it("sold listings leave the market grid", async () => {
    await receiptAsStudent();
    const detail = renderWithSession(<Router />, "/orders/order-1", "student-token");
    fireEvent.click(await screen.findByRole("button", { name: /pay now/i }));
    await screen.findByText("payment successful");
    detail.unmount();

    renderWithSession(<Router />, "/cart", "student-token");
    expect(await screen.findByText("cart is empty")).toBeInTheDocument();
  }, 15000);
});
