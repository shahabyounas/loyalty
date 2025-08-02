import React from "react";
import { BrowserRouter as Router } from "react-router";
import { AuthProvider } from "../contexts/AuthContext";
import { AppRoutes } from "../routes";
import "./app.module.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
