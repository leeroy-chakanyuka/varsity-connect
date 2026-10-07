import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

const VENDOR_ID = "22222222-2222-2222-2222-222222222222";

/* profile pages against the mock api */
describe("my profile page", () => {
  it("shows saved data with the edit form prefilled", async () => {
    renderWithSession(<Router />, "/profile", "student-token");

    expect(await screen.findByText("informatics and design")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test user")).toBeInTheDocument();
    expect(screen.getByText("no reviews yet")).toBeInTheDocument();
  });

  it("updates and shows a success message", async () => {
    renderWithSession(<Router />, "/profile", "student-token");

    fireEvent.change(await screen.findByDisplayValue("test user"), {
      target: { value: "renamed user" },
    });
    fireEvent.change(screen.getByLabelText(/bio/i), { target: { value: "final year dev" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("profile updated")).toBeInTheDocument();
    expect(await screen.findByText("renamed user")).toBeInTheDocument();
  });

  it("keeps changes across a fresh visit", async () => {
    const first = renderWithSession(<Router />, "/profile", "student-token");

    fireEvent.change(await screen.findByDisplayValue("test user"), {
      target: { value: "persistent user" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await screen.findByText("profile updated");
    first.unmount();

    /* brand-new mount, same session — the server kept it */
    renderWithSession(<Router />, "/profile", "student-token");
    expect(await screen.findByText("persistent user")).toBeInTheDocument();
  });
});

describe("public profile page", () => {
  it("shows another user's card with no edit form", async () => {
    renderWithSession(<Router />, `/profile/${VENDOR_ID}`, "student-token");

    expect(await screen.findByText("vendor user")).toBeInTheDocument();
    expect(screen.getByText("vendor@cput.ac.za")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();
  });

  it("shows a not-found state for a bad id", async () => {
    renderWithSession(<Router />, "/profile/nope-not-a-user", "student-token");

    expect(await screen.findByText("user not found")).toBeInTheDocument();
  });
});
