import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

/* inbox flows against the mock api */
describe("notifications bell", () => {
  it("shows the unread count", async () => {
    renderWithSession(<Router />, "/dashboard", "student-token");

    expect(await screen.findByRole("link", { name: /notifications, 1 unread/i })).toBeInTheDocument();
  });

  it("hides the badge when all read", async () => {
    renderWithSession(<Router />, "/notifications", "student-token");
    await screen.findByText("payment successful");

    fireEvent.click(screen.getByRole("button", { name: /mark all read/i }));
    expect(await screen.findByRole("link", { name: /^notifications$/i })).toBeInTheDocument();
  });
});

describe("notifications page", () => {
  it("lists read and unread together", async () => {
    renderWithSession(<Router />, "/notifications", "student-token");

    expect(await screen.findByText("payment successful")).toBeInTheDocument();
    expect(screen.getByText("welcome aboard")).toBeInTheDocument();
  });

  it("filters to unread only", async () => {
    renderWithSession(<Router />, "/notifications", "student-token");
    await screen.findByText("payment successful");

    fireEvent.click(screen.getByRole("tab", { name: /^unread$/i }));
    expect(screen.getByText("payment successful")).toBeInTheDocument();
    expect(screen.queryByText("welcome aboard")).not.toBeInTheDocument();
  });

  it("opens the row and routes by entity", async () => {
    renderWithSession(<Router />, "/notifications", "student-token");
    await screen.findByText("payment successful");

    /* unread row navigates to its order and marks itself read */
    fireEvent.click(screen.getByText("payment successful"));
    expect(await screen.findByText("order not found")).toBeInTheDocument();
  });
});
