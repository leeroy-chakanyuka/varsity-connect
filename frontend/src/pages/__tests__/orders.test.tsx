import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

/* basket one laptop so checkout has something to freeze, single tree after */
async function fillBasket() {
  const detail = renderWithSession(<Router />, "/market/listing-laptop", "student-token");
  fireEvent.click(await screen.findByRole("button", { name: /add to cart/i }));
  await screen.findByText(/in your cart/i);
  detail.unmount();
}

/* checkout flows against the mock api */
describe("checkout page", () => {
  it("shows the summary and creates the order", async () => {
    await fillBasket();
    renderWithSession(<Router />, "/checkout", "student-token");

    expect(await screen.findByText("dell laptop")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /place order/i }));

    /* lands on the fresh receipt */
    const receipt = await screen.findByText(/pending payment|order not found/i, {}, { timeout: 5000 });
    expect(receipt).toHaveTextContent("pending payment");
    expect(screen.getByText("dell laptop")).toBeInTheDocument();
  }, 15000);

  it("explains an empty basket", async () => {
    renderWithSession(<Router />, "/checkout", "student-token");

    expect(await screen.findByText("nothing to check out")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse the market/i })).toBeInTheDocument();
  });
});

describe("orders pages", () => {
  it("lists your orders", async () => {
    await fillBasket();
    const checkout = renderWithSession(<Router />, "/checkout", "student-token");
    fireEvent.click(await screen.findByRole("button", { name: /place order/i }));
    await screen.findByText("pending payment");
    checkout.unmount();

    renderWithSession(<Router />, "/orders", "student-token");
    expect(await screen.findByText(/dell laptop/i)).toBeInTheDocument();
    expect(screen.getByText(/pending payment/i)).toBeInTheDocument();
  });

  it("hides strangers receipts", async () => {
    await fillBasket();
    const checkout = renderWithSession(<Router />, "/checkout", "student-token");
    fireEvent.click(await screen.findByRole("button", { name: /place order/i }));
    await screen.findByText("pending payment");
    checkout.unmount();

    /* vendor did not buy this */
    renderWithSession(<Router />, "/orders/order-1", "vendor-token");
    expect(await screen.findByText("order not found")).toBeInTheDocument();
  });
});
