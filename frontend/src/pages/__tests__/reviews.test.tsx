import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

const STUDENT_ID = "11111111-1111-1111-1111-111111111111";
const VENDOR_ID = "22222222-2222-2222-2222-222222222222";

/* vendor buys the student's textbook, pays, completes, reviews */
async function buyAndPay() {
  const page = renderWithSession(<Router />, "/market/listing-calc", "vendor-token");
  fireEvent.click(await screen.findByRole("button", { name: /add to cart/i }));
  fireEvent.click(await screen.findByRole("link", { name: /cart, 1 items/i }));

  fireEvent.click(await screen.findByRole("link", { name: /^checkout$/i }));
  fireEvent.click(await screen.findByRole("button", { name: /place order/i }));
  await screen.findByText(/pending payment/i);

  fireEvent.click(await screen.findByRole("button", { name: /pay now/i }));
  await screen.findByText("payment successful");
  page.unmount();
}

/* full trust loop against the mock api */
describe("reviews", () => {
  it("completes an order and reviews the seller", async () => {
    await buyAndPay();

    /* receipt carries the lifecycle buttons */
    const receipt = renderWithSession(<Router />, "/orders/order-1", "vendor-token");
    fireEvent.click(await screen.findByRole("button", { name: /mark as completed/i }));
    expect(await screen.findByText(/completed — thank you/i)).toBeInTheDocument();

    /* one voice for the seller */
    fireEvent.click(screen.getByRole("radio", { name: /rate 5 stars/i }));
    fireEvent.change(screen.getByLabelText(/review comment/i), {
      target: { value: "excellent seller" },
    });
    fireEvent.click(screen.getByRole("button", { name: /post review/i }));
    expect(await screen.findByText("review posted, thank you")).toBeInTheDocument();
    receipt.unmount();

    /* the seller's card carries the numbers now */
    renderWithSession(<Router />, `/profile/${STUDENT_ID}`, "vendor-token");
    expect(await screen.findByText("excellent seller")).toBeInTheDocument();
    expect(screen.getByText(/5\.0 from 1 review/)).toBeInTheDocument();
  }, 20000);

  it("rejects a second voice on the same order", async () => {
    await buyAndPay();

    const first = renderWithSession(<Router />, "/orders/order-1", "vendor-token");
    fireEvent.click(await screen.findByRole("button", { name: /mark as completed/i }));
    await screen.findByText(/completed — thank you/i);

    const post = async (rating: number, comment: string) => {      fireEvent.click(screen.getByRole("radio", { name: new RegExp(`rate ${rating} stars?`, "i") }));
      fireEvent.change(screen.getByLabelText(/review comment/i), { target: { value: comment } });
      fireEvent.click(screen.getByRole("button", { name: /post review/i }));
    };

    await post(5, "first voice");
    await screen.findByText("review posted, thank you");
    first.unmount();

    /* fresh form for the same seller, the server remembers the first voice */
    renderWithSession(<Router />, "/orders/order-1", "vendor-token");
    await screen.findByText(/completed — thank you/i);
    await post(1, "second voice");
    expect(await screen.findByText(/already reviewed/i)).toBeInTheDocument();
  }, 25000);

  it("refuses a review before completion", async () => {
    renderWithSession(<Router />, "/orders/order-1", "vendor-token");

    /* order-1 does not exist yet, nothing to complete */
    expect(await screen.findByText("order not found")).toBeInTheDocument();
    expect(screen.queryByText(/rate your sellers/i)).not.toBeInTheDocument();
  });

  it("shows the vendor's own card with no reviews yet", async () => {
    renderWithSession(<Router />, `/profile/${VENDOR_ID}`, "vendor-token");

    expect(await screen.findByText("vendor user")).toBeInTheDocument();
    expect(screen.getByText("no reviews yet")).toBeInTheDocument();
  });
});
