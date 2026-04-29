import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Navbar from "./Navbar";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock("./AccessibilityToggle", () => ({
  default: () => null,
}));

describe("Navbar", () => {
  it("renders a single Business link in the desktop nav", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Navbar />
      </MemoryRouter>
    );

    const businessLinks = screen.getAllByRole("menuitem", { name: "Business" });
    expect(businessLinks).toHaveLength(1);
    expect(businessLinks[0]).toHaveAttribute("href", "/business");
  });
});
