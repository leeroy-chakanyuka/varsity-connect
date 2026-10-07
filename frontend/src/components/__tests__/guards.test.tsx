import { act, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Router } from "../../app/router";
import { RoleRoute } from "../../components/RoleRoute";
import { renderWithSession } from "../../test-utils";

describe("route guards", () => {
  it("redirects to login when logged out", async () => {
    renderWithSession(<Router />, "/dashboard");

    expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
  });

  it("renders the page when logged in", async () => {
    renderWithSession(<Router />, "/dashboard", "student-token");

    expect(await screen.findByText(/hi, test/i)).toBeInTheDocument();
  });

  it("blocks the wrong role", async () => {
    renderWithSession(
      <RoleRoute allow={["ADMIN"]}>
        <p>secret admin stuff</p>
      </RoleRoute>,
      "/",
      "vendor-token",
    );

    expect(await screen.findByText(/not allowed/i)).toBeInTheDocument();
    expect(screen.queryByText("secret admin stuff")).not.toBeInTheDocument();
  });

  it("lets the right role through", async () => {
    renderWithSession(
      <RoleRoute allow={["ADMIN"]}>
        <p>secret admin stuff</p>
      </RoleRoute>,
      "/",
      "admin-token",
    );

    expect(await screen.findByText("secret admin stuff")).toBeInTheDocument();
  });

  it("splash moves to role selection on its timer", async () => {
    vi.useFakeTimers();
    try {
      renderWithSession(<Router />, "/");
      expect(screen.queryByText(/join as/i)).not.toBeInTheDocument();
      /* fake timers hang waitFor, so assert synchronously after advancing */
      await act(async () => {
        vi.advanceTimersByTime(1600);
      });
      expect(screen.getByText(/join as/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
