import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

/* the moderation desk, admins only */
describe("admin desk", () => {
  it("shows all four sections to admins", async () => {
    renderWithSession(<Router />, "/admin", "admin-token");

    expect(await screen.findByText("moderation desk")).toBeInTheDocument();
    expect(screen.getByText("users")).toBeInTheDocument();
    expect(screen.getByText("shelf")).toBeInTheDocument();
    expect(screen.getByText("threads")).toBeInTheDocument();
    expect(screen.getByText("help requests")).toBeInTheDocument();

    /* canned campus rows show up */
    expect(await screen.findByText("test user")).toBeInTheDocument();
    expect(await screen.findByText("calculus textbook")).toBeInTheDocument();
    expect(await screen.findByText("quiet thread")).toBeInTheDocument();
    expect(await screen.findByText("need dinner tonight")).toBeInTheDocument();
  });

  it("disables and re-enables an account", async () => {
    renderWithSession(<Router />, "/admin", "admin-token");
    await screen.findByText("moderation desk");

    fireEvent.click(await screen.findByRole("button", { name: /disable test user/i }));
    expect(await screen.findByRole("button", { name: /enable test user/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /enable test user/i }));
    expect(await screen.findByRole("button", { name: /disable test user/i })).toBeInTheDocument();
  });

  it("archives a listing with a confirm step", async () => {
    renderWithSession(<Router />, "/admin", "admin-token");
    await screen.findByText("moderation desk");

    fireEvent.click(await screen.findByRole("button", { name: /archive calculus textbook/i }));
    fireEvent.click(await screen.findByRole("button", { name: /yes, archive/i }));

    /* still listed, now stamped archived */
    expect(await screen.findByText(/· archived/i)).toBeInTheDocument();
  });

  it("refuses students with a plain message", async () => {
    renderWithSession(<Router />, "/admin", "student-token");

    expect(await screen.findByText("not allowed")).toBeInTheDocument();
    expect(screen.queryByText("moderation desk")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^desk$/i })).not.toBeInTheDocument();
  });

  it("shows the desk link to admins only", async () => {
    renderWithSession(<Router />, "/dashboard", "admin-token");

    expect(await screen.findByRole("link", { name: /^desk$/i })).toHaveAttribute("href", "/admin");
  });
});
