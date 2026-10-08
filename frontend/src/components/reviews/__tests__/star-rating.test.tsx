import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StarRating } from "../StarRating";
import { renderWithSession } from "../../../test-utils";

/* five stars, honest buttons */
describe("star rating", () => {
  it("calls back with the chosen star", () => {
    const onChange = vi.fn();
    renderWithSession(<StarRating value={0} onChange={onChange} />, "/");

    fireEvent.click(screen.getByRole("radio", { name: /rate 4 stars/i }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("reads back the current value", () => {
    const onChange = vi.fn();
    renderWithSession(<StarRating value={3} onChange={onChange} />, "/");

    expect(screen.getByRole("radio", { name: /rate 3 stars/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("renders plain text when readonly", () => {
    renderWithSession(<StarRating value={4} />, "/");

    expect(screen.getByLabelText(/rated 4 out of 5/i)).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});
