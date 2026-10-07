import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { useSearchParams } from "react-router-dom";
import { Router } from "../../app/router";
import { server } from "../../mocks/server";
import { renderWithSession } from "../../test-utils";

/* memory router never touches window.location, so tests read it from inside */
function LocationProbe() {
  const [params] = useSearchParams();
  return <p data-testid="location">{params.toString()}</p>;
}

function renderMarket(route: string, token?: string) {
  return renderWithSession(
    <>
      <Router />
      <LocationProbe />
    </>,
    route,
    token,
  );
}

const location = () => screen.getByTestId("location").textContent ?? "";

/* marketplace flows against the mock api */
describe("marketplace page", () => {
  it("renders listings from the api", async () => {
    renderMarket("/market", "student-token");

    expect(await screen.findByText("calculus textbook")).toBeInTheDocument();
    expect(screen.getByText("dell laptop")).toBeInTheDocument();
    expect(screen.getByText(/R\s?350/)).toBeInTheDocument();
  });

  it("search updates the url and narrows the grid", async () => {
    renderMarket("/market", "student-token");
    await screen.findByText("calculus textbook");

    fireEvent.change(screen.getByLabelText(/search listings/i), { target: { value: "laptop" } });

    /* debounce lands it in the url, the grid follows */
    await waitFor(() => expect(location()).toContain("q=laptop"));
    await waitFor(() => expect(screen.queryByText("calculus textbook")).not.toBeInTheDocument());
    expect(await screen.findByText("dell laptop")).toBeInTheDocument();
  });

  it("category filter updates the url and narrows the grid", async () => {
    renderMarket("/market", "student-token");
    await screen.findByText("calculus textbook");

    fireEvent.change(screen.getByLabelText(/category filter/i), { target: { value: "TEXTBOOKS" } });

    await waitFor(() => expect(location()).toContain("category=TEXTBOOKS"));
    await waitFor(() => expect(screen.queryByText("dell laptop")).not.toBeInTheDocument());
    expect(screen.getByText("calculus textbook")).toBeInTheDocument();
  });

  it("shows the empty state with a working reset", async () => {
    renderMarket("/market", "student-token");
    await screen.findByText("calculus textbook");

    fireEvent.change(screen.getByLabelText(/search listings/i), { target: { value: "zzz-no-match" } });
    expect(await screen.findByText("nothing found")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /clear search and filters/i }));
    expect(await screen.findByText("calculus textbook")).toBeInTheDocument();
  });

  it("shows an error state that can retry", async () => {
    server.use(http.get("*/marketplace/listings", () => HttpResponse.json({}, { status: 500 }), { once: true }));
    renderMarket("/market", "student-token");

    expect(await screen.findByText("listings failed to load")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText("calculus textbook")).toBeInTheDocument();
  });
});

describe("create listing", () => {
  it("validates the form", async () => {
    renderMarket("/market/new", "student-token");
    await screen.findByLabelText(/^title$/i);

    fireEvent.click(screen.getByRole("button", { name: /list it/i }));

    expect(await screen.findByText("title must be at least 3 characters")).toBeInTheDocument();
    expect(screen.getByText("description is required")).toBeInTheDocument();
  });

  it("creates and opens the new listing", async () => {
    renderMarket("/market/new", "student-token");
    await screen.findByLabelText(/^title$/i);

    fireEvent.change(screen.getByLabelText(/^title$/i), { target: { value: "chem textbook" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "organic chem guide" } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: "320" } });
    fireEvent.change(screen.getByLabelText(/^category$/i), { target: { value: "TEXTBOOKS" } });
    fireEvent.change(screen.getByLabelText(/^condition$/i), { target: { value: "GOOD" } });
    fireEvent.click(screen.getByRole("button", { name: /list it/i }));

    /* lands on the fresh detail page */
    expect(await screen.findByText("organic chem guide")).toBeInTheDocument();
  });
});

describe("listing detail", () => {
  it("shows owner controls only to the seller", async () => {
    renderWithSession(<Router />, "/market/listing-calc", "student-token");
    expect(await screen.findByRole("link", { name: /edit listing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /archive/i })).toBeInTheDocument();
  });

  it("hides owner controls from strangers", async () => {
    renderWithSession(<Router />, "/market/listing-calc", "vendor-token");
    await screen.findByText("calculus textbook");

    expect(screen.queryByRole("link", { name: /edit listing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /archive/i })).not.toBeInTheDocument();
  });

  it("archives with a confirm step and leaves the grid", async () => {
    renderWithSession(<Router />, "/market/listing-calc", "student-token");
    await screen.findByRole("button", { name: /^archive$/i });

    fireEvent.click(screen.getByRole("button", { name: /^archive$/i }));
    fireEvent.click(await screen.findByRole("button", { name: /yes, archive it/i }));

    /* back on the grid without the archived card */
    expect(await screen.findByText("dell laptop")).toBeInTheDocument();
    expect(screen.queryByText("calculus textbook")).not.toBeInTheDocument();
  });
});

describe("edit listing", () => {
  it("prefills and saves", async () => {
    renderWithSession(<Router />, "/market/listing-calc/edit", "student-token");

    const title = await screen.findByDisplayValue("calculus textbook");
    fireEvent.change(title, { target: { value: "calculus textbook 9th ed" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("calculus textbook 9th ed")).toBeInTheDocument();
  });
});
