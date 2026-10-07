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

async function reportAs(token: string, type: "LOST" | "FOUND", name: string): Promise<string> {
  const page = renderLostFound("/lost-found/new", token);
  await screen.findByLabelText(/^item name$/i);
  if (type === "FOUND") {
    fireEvent.click(screen.getByText("i found it"));
  }
  fireEvent.change(screen.getByLabelText(/^item name$/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/^category$/i), { target: { value: "OTHER" } });
  fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "black leather wallet with student card" } });
  fireEvent.change(screen.getByLabelText(/^location$/i), { target: { value: "library steps" } });
  fireEvent.change(screen.getByLabelText(/incident date/i), { target: { value: "2026-10-06" } });
  fireEvent.click(screen.getByRole("button", { name: /report it/i }));
  await screen.findByText("black leather wallet with student card");
  /* in-router path carries the fresh id (memory router never touches window) */
  const id =
    screen
      .getByTestId("location")
      .textContent?.split("?")[0]
      .split("/")
      .pop() ?? "";
  page.unmount();
  return id;
}

describe("potential matches", () => {
  it("pairs similar reports with a score", async () => {
    await reportAs("student-token", "LOST", "black wallet");
    const foundId = await reportAs("vendor-token", "FOUND", "black wallet");

    /* found side sees the pairs right away */
    renderLostFound(`/lost-found/${foundId}`, "vendor-token");
    const pills = await screen.findAllByText(/potential match/i);
    expect(pills.length).toBeGreaterThanOrEqual(1);
    /* identical pair scores a perfect hundred */
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  }, 15000);

  it("accepts from both sides into confirmation", async () => {
    const lostId = await reportAs("student-token", "LOST", "black wallet");
    const foundId = await reportAs("vendor-token", "FOUND", "black wallet");

    const lost = renderLostFound(`/lost-found/${lostId}`, "student-token");
    /* first card is the fresh pair, the seed wallet may pair too */
    const firstAccepts = await screen.findAllByRole("button", { name: /^accept$/i });
    fireEvent.click(firstAccepts[0]);
    expect(await screen.findByText(/you accepted this one/i)).toBeInTheDocument();
    lost.unmount();

    /* found side accepts the same pair too — both accepted shows */
    renderLostFound(`/lost-found/${foundId}`, "vendor-token");
    const secondAccepts = await screen.findAllByRole("button", { name: /^accept$/i });
    fireEvent.click(secondAccepts[0]);
    expect(await screen.findByText(/both accepted/i)).toBeInTheDocument();
  }, 20000);
});

describe("report detail", () => {
  it("shows owner controls only to the reporter", async () => {
    renderLostFound("/lost-found/rep-lost-wallet", "student-token");
    await screen.findByText("black wallet");

    expect(screen.getByRole("button", { name: /edit report/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close report/i })).toBeInTheDocument();
  });

  it("hides owner controls from strangers", async () => {
    renderLostFound("/lost-found/rep-lost-wallet", "vendor-token");
    await screen.findByText("black wallet");

    expect(screen.queryByRole("button", { name: /edit report/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /close report/i })).not.toBeInTheDocument();
  });

  it("closes with a confirm step and leaves the feed", async () => {
    renderLostFound("/lost-found/rep-lost-wallet", "student-token");
    await screen.findByRole("button", { name: /^close report$/i });

    fireEvent.click(screen.getByRole("button", { name: /^close report$/i }));
    fireEvent.click(await screen.findByRole("button", { name: /yes, close it/i }));

    expect(await screen.findByText("lost & found")).toBeInTheDocument();
    expect(screen.queryByText("black wallet")).not.toBeInTheDocument();
  });
});
