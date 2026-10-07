import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

/* basket flows against the mock api */
describe("cart page", () => {
  it("shows an empty state with a way back", async () => {
    renderWithSession(<Router />, "/cart", "student-token");

    expect(await screen.findByText("cart is empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse the market/i })).toBeInTheDocument();
  });

  it("lists items with a server subtotal and a badge", async () => {
    const detail = renderWithSession(<Router />, "/market/listing-laptop", "student-token");
    fireEvent.click(await screen.findByRole("button", { name: /add to cart/i }));
    expect(await screen.findByText(/in your cart/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cart, 1 items/i })).toBeInTheDocument();
    detail.unmount();

    renderWithSession(<Router />, "/cart", "student-token");
    expect(await screen.findByText("dell laptop")).toBeInTheDocument();
    expect(screen.getByText(/vendor user/i)).toBeInTheDocument();
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
  });

  it("bumps quantity and removes the row", async () => {
    const detail = renderWithSession(<Router />, "/market/listing-laptop", "student-token");
    fireEvent.click(await screen.findByRole("button", { name: /add to cart/i }));
    await screen.findByText(/in your cart/i);
    detail.unmount();

    renderWithSession(<Router />, "/cart", "student-token");
    await screen.findByText("dell laptop");

    fireEvent.click(screen.getByRole("button", { name: /one more dell laptop/i }));
    expect(await screen.findByText("2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remove dell laptop/i }));
    expect(await screen.findByText("cart is empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cart, 0 items/i })).toBeInTheDocument();
  });

  it("persists across a fresh visit", async () => {
    /* laptop belongs to the vendor, so the student may basket it */
    const detail = renderWithSession(<Router />, "/market/listing-laptop", "student-token");
    fireEvent.click(await screen.findByRole("button", { name: /add to cart/i }));
    await screen.findByText(/in your cart/i);
    detail.unmount();

    renderWithSession(<Router />, "/cart", "student-token");
    expect(await screen.findByText("dell laptop")).toBeInTheDocument();
  });
});

describe("add to cart button", () => {
  it("stays quiet on your own listing", async () => {
    /* calc belongs to the student behind student-token */
    renderWithSession(<Router />, "/market/listing-calc", "student-token");
    await screen.findByText("calculus textbook");

    expect(screen.getByText("this is your listing")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add to cart/i })).not.toBeInTheDocument();
  });

  it("offers the button on strangers listings", async () => {
    renderWithSession(<Router />, "/market/listing-calc", "vendor-token");
    await screen.findByText("calculus textbook");

    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });
});
