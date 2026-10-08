import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

/* home reads live module state, capped and scoped */
describe("dashboard", () => {
  it("shows stats, shelves, and shortcuts", async () => {
    renderWithSession(<Router />, "/dashboard", "student-token");

    expect(await screen.findByText("here is campus today")).toBeInTheDocument();
    expect(screen.getByText("active listings")).toBeInTheDocument();
    expect(screen.getByText("fresh on the market")).toBeInTheDocument();
    expect(screen.getByText("campus talking")).toBeInTheDocument();
    expect(screen.getByText("neighbours need a hand")).toBeInTheDocument();

    /* seeded shelf and threads show up */
    expect(screen.getByText("calculus textbook")).toBeInTheDocument();
    expect(screen.getByText("quiet thread")).toBeInTheDocument();
    expect(screen.getByText("need dinner tonight")).toBeInTheDocument();

    /* shortcuts walk somewhere real */
    expect(screen.getByRole("link", { name: /browse the market/i })).toHaveAttribute("href", "/market");
    expect(screen.getByRole("link", { name: /sell something/i })).toHaveAttribute("href", "/market/new");
  });

  it("hides the matches section with no pairs", async () => {
    renderWithSession(<Router />, "/dashboard", "student-token");

    await screen.findByText("here is campus today");
    expect(screen.queryByText("possible matches")).not.toBeInTheDocument();
  });
});
