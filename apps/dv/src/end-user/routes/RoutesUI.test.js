import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import RoutesUI from "./RoutesUI";

// Wrapper component to provide router context for testing
function RoutesUIWithRouter() {
  return (
    <BrowserRouter>
      <RoutesUI />
    </BrowserRouter>
  );
}

describe("RoutesUI Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("should render the routes UI container", () => {
      render(<RoutesUIWithRouter />);

      const routesContainer = screen
        .getByRole("heading", { name: /application routes/i })
        .closest("div");
      expect(routesContainer).toBeInTheDocument();
    });

    test("should display the main heading", () => {
      render(<RoutesUIWithRouter />);

      const heading = screen.getByRole("heading", {
        name: /application routes/i,
      });
      expect(heading).toBeInTheDocument();
    });

    test("should display the current route information", () => {
      render(<RoutesUIWithRouter />);

      const currentRoute = screen.getByText(/current route/i);
      expect(currentRoute).toBeInTheDocument();
    });
  });

  describe("Route Categories", () => {
    test("should display all route categories", () => {
      render(<RoutesUIWithRouter />);

      // Use getAllByText and find specific elements
      const publicElements = screen.getAllByText(/public/i);
      const authElements = screen.getAllByText(/authentication/i);
      const protectedElements = screen.getAllByText(/protected/i);
      const adminElements = screen.getAllByText(/admin/i);

      // Find category titles specifically
      const publicCategory = publicElements.find((el) => el.tagName === "H2");
      const authCategory = authElements.find((el) => el.tagName === "H2");
      const protectedCategory = protectedElements.find(
        (el) => el.tagName === "H2"
      );
      const adminCategory = adminElements.find((el) => el.tagName === "H2");

      expect(publicCategory).toBeInTheDocument();
      expect(authCategory).toBeInTheDocument();
      expect(protectedCategory).toBeInTheDocument();
      expect(adminCategory).toBeInTheDocument();
    });

    test("should display route cards for each category", () => {
      render(<RoutesUIWithRouter />);

      // Check for some specific routes (now with icons) - use getAllByText and find specific elements
      const landingElements = screen.getAllByText(/landing page/i);
      const loginElements = screen.getAllByText(/login/i);
      const dashboardElements = screen.getAllByText(/dashboard/i);
      const adminDashboardElements = screen.getAllByText(/admin dashboard/i);

      // Find route names specifically (h3 elements)
      const landingPage = landingElements.find((el) => el.tagName === "H3");
      const loginPage = loginElements.find((el) => el.tagName === "H3");
      const dashboardPage = dashboardElements.find((el) => el.tagName === "H3");
      const adminDashboard = adminDashboardElements.find(
        (el) => el.tagName === "H3"
      );

      expect(landingPage).toBeInTheDocument();
      expect(loginPage).toBeInTheDocument();
      expect(dashboardPage).toBeInTheDocument();
      expect(adminDashboard).toBeInTheDocument();
    });
  });

  describe("Route Information", () => {
    test("should display route paths", () => {
      render(<RoutesUIWithRouter />);

      // Use getAllByText for paths that might appear multiple times
      const homePaths = screen.getAllByText("/");
      const loginPath = screen.getByText("/auth/login");
      const dashboardPath = screen.getByText("/dashboard");

      expect(homePaths.length).toBeGreaterThan(0);
      expect(loginPath).toBeInTheDocument();
      expect(dashboardPath).toBeInTheDocument();
    });

    test("should display route descriptions", () => {
      render(<RoutesUIWithRouter />);

      const landingDescription = screen.getByText(
        /welcome page for the application/i
      );
      const loginDescription = screen.getByText(/user authentication page/i);

      expect(landingDescription).toBeInTheDocument();
      expect(loginDescription).toBeInTheDocument();
    });
  });

  describe("Navigation Links", () => {
    test("should render navigation links for each route", () => {
      render(<RoutesUIWithRouter />);

      const navigateLinks = screen.getAllByText(/navigate/i);
      expect(navigateLinks.length).toBeGreaterThan(0);
    });

    test("should have correct href attributes for navigation links", () => {
      render(<RoutesUIWithRouter />);

      // Get the first navigate link (there are multiple)
      const navigateLinks = screen.getAllByText(/navigate/i);
      const firstLink = navigateLinks[0];
      expect(firstLink).toHaveAttribute("href");
    });
  });

  describe("Statistics", () => {
    test("should display total routes count", () => {
      render(<RoutesUIWithRouter />);

      const totalRoutes = screen.getByText(/total routes/i);
      expect(totalRoutes).toBeInTheDocument();
    });

    test("should display categories count", () => {
      render(<RoutesUIWithRouter />);

      const categoriesCount = screen.getByText(/categories/i);
      expect(categoriesCount).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    test("should have proper CSS classes", () => {
      render(<RoutesUIWithRouter />);

      // Use getAllByText to get all elements with the text, then find the one in the routes-ui container
      const elements = screen.getAllByText(/application routes/i);
      const routesUI = elements.find((element) =>
        element.closest(".routes-ui")
      );
      expect(routesUI).toBeInTheDocument();
    });

    test("should render route cards with proper structure", () => {
      render(<RoutesUIWithRouter />);

      const routeCards = screen.getAllByText(/landing page|login|dashboard/i);
      expect(routeCards.length).toBeGreaterThan(0);
    });
  });
});
