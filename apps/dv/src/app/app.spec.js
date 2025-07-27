import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./app";

// Wrapper component to provide router context for testing
function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

describe("App", () => {
  it("should render the app header", () => {
    render(<AppWithRouter />);
    expect(screen.getByText("Your App")).toBeTruthy();
  });

  it("should render navigation links", () => {
    render(<AppWithRouter />);
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("Components")).toBeTruthy();
    expect(screen.getByText("Colors")).toBeTruthy();
    expect(screen.getByText("About")).toBeTruthy();
  });

  it("should show home page content by default", () => {
    render(<AppWithRouter />);
    expect(screen.getByText("Welcome to Your App")).toBeTruthy();
    expect(screen.getByText("Color Palette Demo")).toBeTruthy();
  });

  it("should display color palette items", () => {
    render(<AppWithRouter />);
    expect(screen.getByText("Primary")).toBeTruthy();
    expect(screen.getByText("Secondary")).toBeTruthy();
    expect(screen.getByText("Success")).toBeTruthy();
    expect(screen.getByText("Warning")).toBeTruthy();
    expect(screen.getByText("Error")).toBeTruthy();
  });
});
