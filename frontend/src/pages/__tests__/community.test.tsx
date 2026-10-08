import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSearchParams } from "react-router-dom";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

function LocationProbe() {
  const [params] = useSearchParams();
  return <p data-testid="location">{params.toString()}</p>;
}

function renderCommunity(route: string, token?: string) {
  return renderWithSession(
    <>
      <Router />
      <LocationProbe />
    </>,
    route,
    token,
  );
}

/* wall flows against the mock api */
describe("community page", () => {
  it("searches the feed", async () => {
    renderCommunity("/community", "student-token");
    await screen.findByText("nsfas allowance dates");

    fireEvent.change(screen.getByLabelText(/search threads/i), { target: { value: "allowance" } });
    await waitFor(() => expect(screen.queryByText("quiet thread")).not.toBeInTheDocument());
    expect(await screen.findByText("nsfas allowance dates")).toBeInTheDocument();
  });

  it("switches latest and trending through the url", async () => {
    renderCommunity("/community", "student-token");
    await screen.findByText("nsfas allowance dates");

    fireEvent.click(screen.getByRole("tab", { name: /trending/i }));
    expect(screen.getByTestId("location").textContent).toContain("sort=trending");
    expect(screen.getByRole("tab", { name: /trending/i })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("tab", { name: /latest/i }));
    expect(screen.getByTestId("location").textContent).not.toContain("sort=trending");
  });

  it("ranks the loudest thread first on trending", async () => {
    /* two replies on the quiet thread */
    const detail = renderCommunity("/community/post-quiet", "student-token");
    await screen.findByText("quiet thread");
    for (const words of ["first reply here", "second reply here"]) {
      fireEvent.change(screen.getByLabelText(/write a reply/i), { target: { value: words } });
      fireEvent.click(screen.getByRole("button", { name: /^reply$/i }));
      expect(await screen.findByText(words)).toBeInTheDocument();
    }
    detail.unmount();

    renderCommunity("/community?sort=trending", "student-token");
    const cards = await screen.findAllByText(/quiet thread|nsfas allowance dates/);
    /* quiet thread bubbles to the top with its two replies */
    expect(cards[0]).toHaveTextContent("quiet thread");
  });
});

describe("create post", () => {
  it("validates the form", async () => {
    renderCommunity("/community/new", "student-token");
    await screen.findByLabelText(/^title$/i);

    fireEvent.click(screen.getByRole("button", { name: /post thread/i }));

    expect(await screen.findByText("title is required")).toBeInTheDocument();
    expect(screen.getByText("say something first")).toBeInTheDocument();
  });

  it("posts and opens the thread", async () => {
    const page = renderCommunity("/community/new", "student-token");
    await screen.findByLabelText(/^title$/i);

    fireEvent.change(screen.getByLabelText(/^title$/i), { target: { value: "res wifi down" } });
    fireEvent.change(screen.getByLabelText(/^body$/i), { target: { value: "anyone else offline" } });
    fireEvent.click(screen.getByRole("button", { name: /post thread/i }));

    expect(await screen.findByText("anyone else offline")).toBeInTheDocument();
    page.unmount();

    /* still there on a fresh visit */
    renderCommunity("/community", "student-token");
    expect(await screen.findByText("res wifi down")).toBeInTheDocument();
  });
});

describe("thread detail", () => {
  it("comments as another user and shows it", async () => {
    renderCommunity("/community/post-nsfas", "student-token");
    await screen.findByText("nsfas allowance dates");

    fireEvent.change(screen.getByLabelText(/write a reply/i), { target: { value: "same here" } });
    fireEvent.click(screen.getByRole("button", { name: /^reply$/i }));

    expect(await screen.findByText("same here")).toBeInTheDocument();
  });

  it("edits its own reply", async () => {
    renderCommunity("/community/post-nsfas", "student-token");
    await screen.findByText("nsfas allowance dates");

    fireEvent.change(screen.getByLabelText(/write a reply/i), { target: { value: "fixable words" } });
    fireEvent.click(screen.getByRole("button", { name: /^reply$/i }));

    /* the edit affordance only exists on a posted reply, never on the draft box */
    fireEvent.click(await screen.findByRole("button", { name: /^edit$/i }));
    fireEvent.change(screen.getByLabelText(/edit reply/i), { target: { value: "fixed words" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    /* editor closes on success, the saved words stay on the card */
    await waitFor(() => expect(screen.queryByLabelText(/edit reply/i)).not.toBeInTheDocument());
    expect(screen.getByText("fixed words")).toBeInTheDocument();
  });

  it("removes its reply with a confirm step", async () => {
    renderCommunity("/community/post-nsfas", "student-token");
    await screen.findByText("nsfas allowance dates");

    fireEvent.change(screen.getByLabelText(/write a reply/i), { target: { value: "regretful words" } });
    fireEvent.click(screen.getByRole("button", { name: /^reply$/i }));

    fireEvent.click(await screen.findByRole("button", { name: /remove reply by test user/i }));
    fireEvent.click(await screen.findByRole("button", { name: /yes, remove/i }));

    /* draft box cleared on submit, so absence means really gone */
    await waitFor(() => expect(screen.queryByText("regretful words")).not.toBeInTheDocument());
  });

  it("shows owner controls only to the author", async () => {
    /* nsfas belongs to the vendor */
    renderCommunity("/community/post-nsfas", "vendor-token");
    await screen.findByText("nsfas allowance dates");
    expect(screen.getByRole("button", { name: /delete thread/i })).toBeInTheDocument();
  });

  it("hides owner controls from strangers", async () => {
    renderCommunity("/community/post-nsfas", "student-token");
    await screen.findByText("nsfas allowance dates");
    expect(screen.queryByRole("button", { name: /delete thread|edit thread/i })).not.toBeInTheDocument();
  });

  it("shows the admin moderation control", async () => {
    renderCommunity("/community/post-nsfas", "admin-token");
    await screen.findByText("nsfas allowance dates");
    expect(screen.getByRole("button", { name: /remove thread \(admin\)/i })).toBeInTheDocument();
  });
});
