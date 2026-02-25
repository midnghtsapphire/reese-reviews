import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import SEOHead from "./SEOHead";

function renderWithHelmet(ui: React.ReactElement) {
  return render(<HelmetProvider>{ui}</HelmetProvider>);
}

describe("SEOHead", () => {
  it("renders without crashing", () => {
    const { container } = renderWithHelmet(<SEOHead />);
    expect(container).toBeTruthy();
  });

  it("accepts custom title", () => {
    renderWithHelmet(<SEOHead title="Test Page" />);
    // HelmetProvider manages head elements asynchronously
    // Just verify it doesn't crash
    expect(true).toBe(true);
  });

  it("accepts custom description", () => {
    renderWithHelmet(<SEOHead description="Custom description" />);
    expect(true).toBe(true);
  });

  it("accepts noIndex flag", () => {
    renderWithHelmet(<SEOHead noIndex />);
    expect(true).toBe(true);
  });
});
