import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "../../app/router";
import { renderWithSession } from "../../test-utils";

/* registration form against the mock api */
describe("register page", () => {
  it("validates mismatched passwords and missing student number", async () => {
    renderWithSession(<Router />, "/register");

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "test user" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "new@cput.ac.za" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "different1" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("passwords do not match")).toBeInTheDocument();
    expect(screen.getByText("student number is required for students")).toBeInTheDocument();
    expect(screen.getByText("terms must be accepted")).toBeInTheDocument();
  });

  it("shows backend errors for a duplicate email", async () => {
    renderWithSession(<Router />, "/register");

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "test user" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "dup@cput.ac.za" } });
    fireEvent.change(screen.getByLabelText(/student number/i), { target: { value: "220000009" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByLabelText(/i accept the campus terms/i));
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("email is already registered")).toBeInTheDocument();
    expect(await screen.findByText("that email is already registered, try logging in")).toBeInTheDocument();
  });

  it("registers, shows success, then hands off to login", async () => {
    renderWithSession(<Router />, "/register");

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "test user" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "fresh@cput.ac.za" } });
    fireEvent.change(screen.getByLabelText(/student number/i), { target: { value: "220000007" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByLabelText(/i accept the campus terms/i));
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/you are in/i)).toBeInTheDocument();
    /* success timer hands off to login */
    expect(await screen.findByText(/welcome back/i, {}, { timeout: 4000 })).toBeInTheDocument();
  }, 10000);
});
