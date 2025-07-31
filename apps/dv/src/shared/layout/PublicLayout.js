import React from "react";
import "./PublicLayout.css";
import dmlogo from "../../assets/images/dmlogo.png";

function PublicLayout({ children }) {
  return (
    <div className="public-layout">
      {/* Simple header for public pages */}
      <header className="public-header flex justify-between items-center">
        <div>
          <img src={dmlogo} alt="Diamond Vape Logo" className="h-12 w-auto" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-white">Diamond Vape</h1>
          <h6 className="text-sm text-white/80 font-medium">
            The best vape shop in the UK
          </h6>
        </div>
      </header>

      {/* Main content area */}
      <main className="public-main">{children}</main>

      {/* Simple footer */}
      <footer className="public-footer">
        <div className="container">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted">© 2025 Diamond Vape</span>
              <span className="text-xs text-muted">•</span>
              <span className="text-xs text-muted">v1.0.0</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-xs text-link hover:underline">
                Help
              </a>
              <a href="#" className="text-xs text-link hover:underline">
                Support
              </a>
              <a href="#" className="text-xs text-link hover:underline">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
