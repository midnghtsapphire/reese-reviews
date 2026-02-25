import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StarRating from "./StarRating";

describe("StarRating", () => {
  it("renders the correct number of stars", () => {
    render(<StarRating rating={3} />);
    const stars = screen.getAllByRole("img");
    expect(stars.length).toBe(1); // single img role container
    expect(stars[0]).toHaveAttribute("aria-label", "3 out of 5 stars");
  });

  it("renders with custom max rating", () => {
    render(<StarRating rating={3} maxRating={10} />);
    const container = screen.getByRole("img");
    expect(container).toHaveAttribute("aria-label", "3 out of 10 stars");
  });

  it("shows label when showLabel is true", () => {
    render(<StarRating rating={4} showLabel />);
    expect(screen.getByText("4/5")).toBeInTheDocument();
  });

  it("calls onRate when interactive star is clicked", () => {
    const onRate = vi.fn();
    render(<StarRating rating={0} interactive onRate={onRate} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[2]); // Click 3rd star
    expect(onRate).toHaveBeenCalledWith(3);
  });

  it("renders non-interactive stars without buttons", () => {
    render(<StarRating rating={3} />);
    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBe(0);
  });
});
