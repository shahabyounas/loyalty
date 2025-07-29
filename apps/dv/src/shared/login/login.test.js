import { render, screen } from "@testing-library/react";
import { Login } from "./login";

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("should render the landing page container", () => {
      render(<Login />);

      const landingContainer = screen
        .getByText(/welcome to our app/i)
        .closest(".landing-page");
      expect(landingContainer).toBeInTheDocument();
    });

    test("should display the welcome heading", () => {
      render(<Login />);

      const welcomeHeading = screen.getByRole("heading", {
        name: /welcome to our app/i,
      });
      expect(welcomeHeading).toBeInTheDocument();
      expect(welcomeHeading).toHaveTextContent("Welcome to Our App");
    });

    test("should display the landing page description", () => {
      render(<Login />);

      const description = screen.getByText(/this is the landing page/i);
      expect(description).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    test("should have the correct CSS class", () => {
      render(<Login />);

      const landingElement = screen
        .getByText(/welcome to our app/i)
        .closest(".landing-page");
      expect(landingElement).toBeInTheDocument();
    });

    test("should render heading as h1 element", () => {
      render(<Login />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H1");
    });
  });
});
