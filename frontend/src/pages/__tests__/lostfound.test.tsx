import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLocation, useSearchParams } from "react-router-dom";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

/* memory router never touches window.location, so tests read it from inside */
function LocationProbe() {
  const location = useLocation();
  const [params] = useSearchParams();
  return <p data-testid="location">{`${location.pathname}?${params.toString()}`}</p>;
}

function renderLostFound(route: string, token?: string) {
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

/* lost and found flows against the mock api */
describe("lost and found page", () => {
  it("opens on lost with tabs that sync the url", async () => {
    renderLostFound("/lost-found", "student-token");

    expect(await screen.findByText("black wallet")).toBeInTheDocument();
    expect(screen.queryByText("silver laptop")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /found/i }));
    expect(await screen.findByText("silver laptop")).toBeInTheDocument();
    expect(location()).toContain("type=FOUND");
    expect(screen.queryByText("black wallet")).not.toBeInTheDocument();
  });

  it("searches across names and descriptions", async () => {
    renderLostFound("/lost-found", "student-token");
    await screen.findByText("black wallet");

    fireEvent.change(screen.getByLabelText(/search reports/i), { target: { value: "laptop" } });
    /* wrong tab for laptops, flip over and it appears */
    fireEvent.click(screen.getByRole("tab", { name: /found/i }));
    expect(await screen.findByText("silver laptop")).toBeInTheDocument();
  });
});

describe("create report", () => {
  it("validates the form", async () => {
    renderLostFound("/lost-found/new", "student-token");
    await screen.findByLabelText(/^item name$/i);

    fireEvent.click(screen.getByRole("button", { name: /report it/i }));

    expect(await screen.findByText("item name is required")).toBeInTheDocument();
    expect(screen.getByText("description is required")).toBeInTheDocument();
  });

  it("reports and opens the new card", async () => {
    const page = renderLostFound("/lost-found/new", "student-token");
    await screen.findByLabelText(/^item name$/i);

    fireEvent.change(screen.getByLabelText(/^item name$/i), { target: { value: "lost keys" } });
    fireEvent.change(screen.getByLabelText(/^category$/i), { target: { value: "OTHER" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "bunch of keys" } });
    fireEvent.change(screen.getByLabelText(/^location$/i), { target: { value: "res lobby" } });
    fireEvent.change(screen.getByLabelText(/incident date/i), { target: { value: "2026-10-06" } });
    fireEvent.click(screen.getByRole("button", { name: /report it/i }));

    expect(await screen.findByText("bunch of keys")).toBeInTheDocument();
    page.unmount();

    /* still there on a fresh visit */
    renderLostFound("/lost-found", "student-token");
    expect(await screen.findByText("lost keys")).toBeInTheDocument();
  });
});
