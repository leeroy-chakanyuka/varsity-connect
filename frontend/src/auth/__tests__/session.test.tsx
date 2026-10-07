import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "../../app/router";
import { useAuth } from "../../auth/AuthContext";
import { renderWithSession } from "../../test-utils";

function WhoAmI() {
  const { user } = useAuth();
  return <p>{user ? user.email : "logged out"}</p>;
}

describe("session handling", () => {
  it("clears a stale session on 401", async () => {
    renderWithSession(<WhoAmI />, "/", "stale-token");

    /* mock api rejects the token, provider drops it */
    expect(await screen.findByText("logged out")).toBeInTheDocument();
    expect(sessionStorage.getItem("vc.token")).toBeNull();
  });

  it("stays logged in with a good token", async () => {
    renderWithSession(<WhoAmI />, "/", "student-token");

    expect(await screen.findByText("student@cput.ac.za")).toBeInTheDocument();
    expect(sessionStorage.getItem("vc.token")).toBe("student-token");
  });

  it("logout clears the token and leaves the dashboard", async () => {
    renderWithSession(<Router />, "/dashboard", "student-token");

    expect(await screen.findByText(/hi, test/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
    expect(sessionStorage.getItem("vc.token")).toBeNull();
  });
});
