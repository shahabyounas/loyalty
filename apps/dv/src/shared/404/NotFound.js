import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">
          <span className="error-code">404</span>
        </div>
        
        <h1 className="not-found-title">Page Not Found</h1>
        
        <p className="not-found-message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="not-found-actions">
          <button 
            className="btn btn-primary not-found-btn"
            onClick={handleGoHome}
          >
            Go to Home
          </button>
          
          <button 
            className="btn btn-secondary not-found-btn"
            onClick={handleGoBack}
          >
            Go Back
          </button>
        </div>
        
        <div className="not-found-suggestions">
          <p>You might want to:</p>
          <ul>
            <li>Check the URL for typos</li>
            <li>Return to the homepage</li>
            <li>Use the navigation menu</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
