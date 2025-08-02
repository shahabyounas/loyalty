import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import App from "./app";

// Wrapper component to provide router context for testing
function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

describe("App Component", () => {
  beforeEach(() => {
    // Clear any previous renders
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("should render the main app container", () => {
      render(<AppWithRouter />);

      const appContainer = screen.getByRole("main");
      expect(appContainer).toBeInTheDocument();
    });

    test("should render the main header with app title", () => {
      render(<AppWithRouter />);

      // Get all headings and find the one with "Main App"
      const headings = screen.getAllByRole("heading");
      const mainAppHeading = headings.find(
        (heading) => heading.textContent === "Main App"
      );

      expect(mainAppHeading).toBeInTheDocument();
      expect(mainAppHeading).toHaveTextContent("Main App");
    });
  });

  describe("Navigation", () => {
    test("should render all main navigation links", () => {
      render(<AppWithRouter />);

      const homeLink = screen.getByRole("link", { name: /home/i });
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      const loginLink = screen.getByRole("link", { name: /login/i });

      expect(homeLink).toBeInTheDocument();
      expect(dashboardLink).toBeInTheDocument();
      expect(loginLink).toBeInTheDocument();
    });

    test("should have correct href attributes for navigation links", () => {
      render(<AppWithRouter />);

      const homeLink = screen.getByRole("link", { name: /home/i });
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      const loginLink = screen.getByRole("link", { name: /login/i });

      expect(homeLink).toHaveAttribute("href", "/");
      expect(dashboardLink).toHaveAttribute("href", "/dashboard");
      expect(loginLink).toHaveAttribute("href", "/auth/login");
    });
  });

  describe("Default Route Content", () => {
    test("should display landing page content when accessing root route", () => {
      render(<AppWithRouter />);

      const welcomeHeading = screen.getByRole("heading", {
        name: /welcome to our app/i,
      });
      const landingText = screen.getByText(/this is the landing page/i);

      expect(welcomeHeading).toBeInTheDocument();
      expect(landingText).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    test("should render app with proper CSS class", () => {
      render(<AppWithRouter />);

      const appElement = screen.getByRole("main").closest(".app");
      expect(appElement).toBeInTheDocument();
    });

    test("should render main layout structure", () => {
      render(<AppWithRouter />);

      const header = screen.getByRole("banner");
      const main = screen.getByRole("main");

      expect(header).toBeInTheDocument();
      expect(main).toBeInTheDocument();
    });
  });
});
