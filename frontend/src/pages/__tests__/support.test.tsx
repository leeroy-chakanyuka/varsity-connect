import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

/* survival flows against the mock api */
describe("request help form", () => {
  it("validates the fields", async () => {
    renderWithSession(<Router />, "/survival/new", "student-token");
    await screen.findByLabelText(/^title$/i);

    fireEvent.click(screen.getByRole("button", { name: /send request/i }));

    expect(await screen.findByText("title is required")).toBeInTheDocument();
    expect(screen.getByText("description is required")).toBeInTheDocument();
  });

  it("creates and opens the request", async () => {
    renderWithSession(<Router />, "/survival/new", "student-token");
    await screen.findByLabelText(/^title$/i);

    fireEvent.change(screen.getByLabelText(/^type$/i), { target: { value: "FOOD" } });
    fireEvent.change(screen.getByLabelText(/^title$/i), { target: { value: "need dinner tonight" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "stipend late" } });
    fireEvent.change(screen.getByLabelText(/^location$/i), { target: { value: "res block c" } });
    fireEvent.change(screen.getByLabelText(/^urgency$/i), { target: { value: "HIGH" } });
    fireEvent.click(screen.getByRole("button", { name: /send request/i }));

    expect(await screen.findByText("need dinner tonight")).toBeInTheDocument();
  });
});

describe("request details", () => {
  it("shows requester tools to the owner only", async () => {
    /* seed request belongs to the student */
    renderWithSession(<Router />, "/survival/sup-seed-1", "student-token");
    await screen.findByText("need dinner tonight");

    expect(screen.getByRole("button", { name: /mark resolved/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel request/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /offer help/i })).not.toBeInTheDocument();
  });

  it("offers help to strangers instead", async () => {
    renderWithSession(<Router />, "/survival/sup-seed-1", "vendor-token");
    await screen.findByText("need dinner tonight");

    expect(screen.getByRole("button", { name: /offer help/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark resolved/i })).not.toBeInTheDocument();
  });

  it("runs the full two-user lifecycle", async () => {
    /* A asks */
    const create = renderWithSession(<Router />, "/survival/new", "student-token");
    await screen.findByLabelText(/^title$/i);
    fireEvent.change(screen.getByLabelText(/^type$/i), { target: { value: "FOOD" } });
    fireEvent.change(screen.getByLabelText(/^title$/i), { target: { value: "need a ride" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "missed the last bus" } });
    fireEvent.change(screen.getByLabelText(/^location$/i), { target: { value: "main gate" } });
    fireEvent.change(screen.getByLabelText(/^urgency$/i), { target: { value: "HIGH" } });
    fireEvent.click(screen.getByRole("button", { name: /send request/i }));
    await screen.findByText("need a ride");
    create.unmount();

    /* B offers a hand */
    const detail = renderWithSession(<Router />, "/survival/sup-new-1", "vendor-token");
    fireEvent.click(await screen.findByRole("button", { name: /offer help/i }));
    fireEvent.change(screen.getByLabelText(/how can you help/i), {
      target: { value: "driving past at six" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send offer/i }));
    expect(await screen.findByRole("button", { name: /withdraw my offer/i })).toBeInTheDocument();
    detail.unmount();

    /* A accepts, in progress shows */
    const mine = renderWithSession(<Router />, "/survival/sup-new-1", "student-token");
    fireEvent.click(await screen.findByRole("button", { name: /^accept$/i }));
    /* status shares its pill with the type, so match the whole pill */
    const pill = async (text: string) =>
      screen.findByText(
        (_, el) => el?.tagName === "P" && (el.textContent ?? "").includes(text),
        {},
        { timeout: 5000 },
      );
    expect(await pill("in progress")).toBeInTheDocument();
    mine.unmount();

    /* A resolves, request closes out */
    renderWithSession(<Router />, "/survival/sup-new-1", "student-token");
    fireEvent.click(await screen.findByRole("button", { name: /mark resolved/i }));
    expect(
      await screen.findByText((_, el) => el?.tagName === "P" && (el.textContent ?? "").includes("resolved")),
    ).toBeInTheDocument();
  }, 20000);
});

describe("emergency button", () => {
  it("dials the configured number", async () => {
    vi.stubEnv("VITE_CPUT_EMERGENCY_PHONE", "+27123456789");
    try {
      renderWithSession(<Router />, "/survival", "student-token");
      const link = await screen.findByRole("link", { name: /call campus emergency/i });
      expect(link).toHaveAttribute("href", "tel:+27123456789");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("warns when no number is configured", async () => {
    vi.stubEnv("VITE_CPUT_EMERGENCY_PHONE", "");
    try {
      renderWithSession(<Router />, "/survival", "student-token");
      expect(await screen.findByText(/not configured/i)).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /call campus emergency/i })).not.toBeInTheDocument();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
