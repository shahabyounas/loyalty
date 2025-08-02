import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ParticleBackground } from "../../../../../libs/animations";
import dimonvape from "../../assets/images/dimonvape.png";
import { Login } from "../login/login";
import { Signup } from "../signup/signup";
import "../login/login.css";
import "../signup/signup.css";
import "./LandingPage.css";

function LandingPage() {
  const heroRef = useRef(null);
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="landing-page">
        <ParticleBackground />
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Don't render the full landing page for authenticated users
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <ParticleBackground />

      {/* Hero Section with Auth Forms */}

      <section className="hero-section" ref={heroRef}>
        <div className="container">
          <div className="hero-content">
            <div className="hero-visual">
              <img
                src={dimonvape}
                alt="Diamond Vape Company"
                className="company-image"
              />
            </div>

            <div>
              <div className="auth-container">
                {showLogin ? (
                  <Login
                    onToggleToSignup={() => setShowLogin(false)}
                    isEmbedded={true}
                  />
                ) : (
                  <Signup
                    onToggleToLogin={() => setShowLogin(true)}
                    isEmbedded={true}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Diamond Vape?</h2>
            <p className="section-subtitle">
              Your trusted partner for premium vaping products and exceptional
              service across the UK
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3>Fast UK Delivery</h3>
              <p>
                Next-day delivery across the UK with tracked shipping and secure
                packaging for all your vaping essentials.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3>Premium Quality</h3>
              <p>
                Authentic products from leading brands with quality assurance
                and compliance with UK vaping regulations.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3>Competitive Prices</h3>
              <p>
                Best prices guaranteed with regular deals, loyalty rewards, and
                bulk purchase discounts for all customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Products</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24hr</div>
              <div className="stat-label">Delivery</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">4.9★</div>
              <div className="stat-label">Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Experience Premium Vaping?</h2>
            <p>
              Join thousands of satisfied customers across the UK who trust
              Diamond Vape for their vaping needs
            </p>
            <div className="cta-actions">
              <button
                className="btn-primary btn-large"
                onClick={() => navigate("/home")}
              >
                Shop Now
              </button>
              <button className="btn-outline btn-large">Contact Support</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
