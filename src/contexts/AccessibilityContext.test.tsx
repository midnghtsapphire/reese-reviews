import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AccessibilityProvider, useAccessibility } from "./AccessibilityContext";

function TestConsumer() {
  const { mode, setMode } = useAccessibility();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button onClick={() => setMode("neurodivergent")}>Set Neurodivergent</button>
      <button onClick={() => setMode("adhd")}>Set ADHD</button>
      <button onClick={() => setMode("dyslexic")}>Set Dyslexic</button>
      <button onClick={() => setMode("eco")}>Set ECO</button>
      <button onClick={() => setMode("no-blue-light")}>Set No Blue Light</button>
      <button onClick={() => setMode("default")}>Set Default</button>
    </div>
  );
}

describe("AccessibilityContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-a11y-mode");
  });

  it("starts with default mode", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );
    expect(screen.getByTestId("mode").textContent).toBe("default");
  });

  it("switches to neurodivergent mode", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );
    fireEvent.click(screen.getByText("Set Neurodivergent"));
    expect(screen.getByTestId("mode").textContent).toBe("neurodivergent");
    expect(localStorage.getItem("reese-a11y-mode")).toBe("neurodivergent");
  });

  it("switches to eco mode", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );
    fireEvent.click(screen.getByText("Set ECO"));
    expect(screen.getByTestId("mode").textContent).toBe("eco");
  });

  it("switches to no-blue-light mode", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );
    fireEvent.click(screen.getByText("Set No Blue Light"));
    expect(screen.getByTestId("mode").textContent).toBe("no-blue-light");
  });

  it("switches to adhd mode", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );
    fireEvent.click(screen.getByText("Set ADHD"));
    expect(screen.getByTestId("mode").textContent).toBe("adhd");
    expect(localStorage.getItem("reese-a11y-mode")).toBe("adhd");
  });

  it("switches to dyslexic mode", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );
    fireEvent.click(screen.getByText("Set Dyslexic"));
    expect(screen.getByTestId("mode").textContent).toBe("dyslexic");
    expect(localStorage.getItem("reese-a11y-mode")).toBe("dyslexic");
  });

  it("persists mode to localStorage", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );
    fireEvent.click(screen.getByText("Set ECO"));
    expect(localStorage.getItem("reese-a11y-mode")).toBe("eco");
  });

  it("renders live region for screen reader announcements", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );
    const liveRegion = document.getElementById("a11y-live-region");
    expect(liveRegion).toBeTruthy();
    expect(liveRegion?.getAttribute("aria-live")).toBe("polite");
  });
});
