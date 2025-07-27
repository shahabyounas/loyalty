import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import "./app.module.css";

// Page Components
function HomePage() {
  return (
    <div className="home-section">
      <h1>Welcome to Your App</h1>
      <p className="text-center mb-3">
        This is a basic React application with a comprehensive color palette
        system.
      </p>
      <div className="color-demo">
        <h3>Color Palette Demo</h3>
        <div className="color-grid">
          <div className="color-item primary">
            <div className="color-swatch"></div>
            <span>Primary</span>
          </div>
          <div className="color-item secondary">
            <div className="color-swatch"></div>
            <span>Secondary</span>
          </div>
          <div className="color-item success">
            <div className="color-swatch"></div>
            <span>Success</span>
          </div>
          <div className="color-item warning">
            <div className="color-swatch"></div>
            <span>Warning</span>
          </div>
          <div className="color-item error">
            <div className="color-swatch"></div>
            <span>Error</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComponentsPage() {
  return (
    <div className="components-section">
      <h2>Component Examples</h2>
      <div className="component-grid">
        <div className="card">
          <h3>Card Component</h3>
          <p>This is a card component using the color system.</p>
          <button className="btn-primary">Primary Button</button>
        </div>
        <div className="card">
          <h3>Form Elements</h3>
          <input type="text" placeholder="Text input" className="mb-2" />
          <button className="btn-secondary">Secondary Button</button>
        </div>
        <div className="card">
          <h3>Typography</h3>
          <h4>Heading 4</h4>
          <h5>Heading 5</h5>
          <p>Regular paragraph text with secondary color.</p>
        </div>
      </div>
    </div>
  );
}

function ColorsPage() {
  return (
    <div className="colors-section">
      <h2>Color System</h2>
      <div className="color-system">
        <div className="color-family">
          <h3>Primary Colors</h3>
          <div className="color-shades">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
              <div
                key={shade}
                className="color-shade"
                style={{ backgroundColor: `var(--primary-${shade})` }}
              >
                <span>{shade}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="color-family">
          <h3>Neutral Colors</h3>
          <div className="color-shades">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
              <div
                key={shade}
                className="color-shade"
                style={{ backgroundColor: `var(--neutral-${shade})` }}
              >
                <span>{shade}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="about-section">
      <h2>About This App</h2>
      <div className="card">
        <h3>Color Palette System</h3>
        <p>
          This application demonstrates a comprehensive color palette system
          built with CSS custom properties. The color system includes:
        </p>
        <ul>
          <li>Primary colors (blue shades)</li>
          <li>Secondary colors (gray shades)</li>
          <li>Success colors (green shades)</li>
          <li>Warning colors (yellow/orange shades)</li>
          <li>Error colors (red shades)</li>
          <li>Neutral colors (black/white shades)</li>
        </ul>
        <p>
          Each color family has 10 shades (50-950) that can be used throughout
          the application for consistent theming and design.
        </p>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1>Your App</h1>
          <nav className="navigation">
            <Link
              to="/"
              className={`nav-btn ${location.pathname === "/" ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              to="/components"
              className={`nav-btn ${
                location.pathname === "/components" ? "active" : ""
              }`}
            >
              Components
            </Link>
            <Link
              to="/colors"
              className={`nav-btn ${
                location.pathname === "/colors" ? "active" : ""
              }`}
            >
              Colors
            </Link>
            <Link
              to="/about"
              className={`nav-btn ${
                location.pathname === "/about" ? "active" : ""
              }`}
            >
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/components" element={<ComponentsPage />} />
            <Route path="/colors" element={<ColorsPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
