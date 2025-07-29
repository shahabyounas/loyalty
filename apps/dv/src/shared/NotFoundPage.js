import React from "react";
import { Link } from "react-router-dom";
import "./NotFoundPage.css";

function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        {/* Animated SVG 404 */}
        <div className="svg-container">
          <svg
            viewBox="0 0 400 300"
            className="not-found-svg"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background circle */}
            <circle
              cx="200"
              cy="150"
              r="120"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="2"
              className="bg-circle"
            />

            {/* 404 Text */}
            <text x="200" y="140" className="error-text" textAnchor="middle">
              4
            </text>
            <text x="200" y="140" className="error-text" textAnchor="middle">
              0
            </text>
            <text x="200" y="140" className="error-text" textAnchor="middle">
              4
            </text>

            {/* Floating elements */}
            <circle
              cx="100"
              cy="80"
              r="8"
              fill="#8b5cf6"
              className="floating-dot dot-1"
            />
            <circle
              cx="300"
              cy="120"
              r="6"
              fill="#06b6d4"
              className="floating-dot dot-2"
            />
            <circle
              cx="80"
              cy="200"
              r="4"
              fill="#10b981"
              className="floating-dot dot-3"
            />
            <circle
              cx="320"
              cy="220"
              r="10"
              fill="#f59e0b"
              className="floating-dot dot-4"
            />

            {/* Search icon */}
            <g className="search-icon" transform="translate(200, 200)">
              <circle
                cx="0"
                cy="0"
                r="15"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                className="search-circle"
              />
              <line
                x1="10"
                y1="10"
                x2="20"
                y2="20"
                stroke="#64748b"
                strokeWidth="2"
                className="search-line"
              />
            </g>

            {/* Decorative lines */}
            <line
              x1="50"
              y1="50"
              x2="100"
              y2="100"
              stroke="#e2e8f0"
              strokeWidth="1"
              className="decorative-line line-1"
            />
            <line
              x1="350"
              y1="80"
              x2="320"
              y2="120"
              stroke="#e2e8f0"
              strokeWidth="1"
              className="decorative-line line-2"
            />
            <line
              x1="60"
              y1="250"
              x2="120"
              y2="220"
              stroke="#e2e8f0"
              strokeWidth="1"
              className="decorative-line line-3"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="not-found-content">
          <h1 className="not-found-title">Page Not Found</h1>
          <p className="not-found-description">
            Oops! The page you're looking for seems to have wandered off into
            the digital wilderness.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn-primary">
              <svg
                className="btn-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-secondary"
            >
              <svg
                className="btn-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
