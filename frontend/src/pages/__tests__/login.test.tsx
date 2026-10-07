import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

/* login form against the mock api */
describe("login page", () => {
  it("shows validation errors on empty submit", async () => {
    renderWithSession(<Router />, "/login");

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("email or student number is required")).toBeInTheDocument();
    expect(screen.getByText("password is required")).toBeInTheDocument();
  });

  it("shows an invalid-credentials state on wrong password", async () => {
    renderWithSession(<Router />, "/login");

    fireEvent.change(screen.getByLabelText(/email or student number/i), {
      target: { value: "student@cput.ac.za" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid credentials/i);
  });

  it("logs in and lands on the dashboard", async () => {
    renderWithSession(<Router />, "/login");

    fireEvent.change(screen.getByLabelText(/email or student number/i), {
      target: { value: "student@cput.ac.za" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    /* dashboard greets by first name from the real /auth/me payload */
    expect(await screen.findByText(/hi, test/i)).toBeInTheDocument();
    expect(sessionStorage.getItem("vc.token")).toBe("student-token");
  });
});
