# JWT Authentication Implementation

This document describes the complete JWT authentication system implemented for the Loyalty application.

## 🏗️ Architecture Overview

The authentication system consists of:

### Frontend (React)
- **JWT Utilities** (`apps/dv/src/utils/jwt.js`) - Token management and validation
- **API Utilities** (`apps/dv/src/utils/api.js`) - HTTP requests with automatic token handling
- **AuthContext** (`apps/dv/src/contexts/AuthContext.js`) - React context for authentication state
- **Protected Routes** (`apps/dv/src/shared/ProtectedRoute.js`) - Route protection components

### Backend (Express.js)
- **API Server** (`server/server.js`) - Express server with JWT endpoints
- **Security Middleware** - Rate limiting, CORS, input validation
- **JWT Authentication** - Token generation, validation, and refresh

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Start Development Environment

```bash
# Start both frontend and backend servers
node start-dev.js
```

Or start them separately:

```bash
# Terminal 1: Start API server
cd server
npm run dev

# Terminal 2: Start frontend
npx nx serve dv
```

### 3. Test Authentication

1. Open http://localhost:4200
2. Use the login/signup forms on the landing page
3. Try the demo credentials:
   - **User**: `demo@example.com` / `password`
   - **Admin**: `admin@example.com` / `password`

## 🔐 JWT Token System

### Token Types

1. **Access Token** (1 hour expiry)
   - Used for API authentication
   - Contains: `{ id, email, role, iat, exp }`

2. **Refresh Token** (7 days expiry)
   - Used to get new access tokens
   - Contains: `{ id, email, iat, exp }`

### Token Flow

```
Login → Access Token + Refresh Token
  ↓
API Requests → Bearer Token in Authorization Header
  ↓
Token Expires → Automatic Refresh (4 minutes before expiry)
  ↓
Refresh Fails → Logout User
```

## 📁 File Structure

```
loyalty/
├── apps/dv/src/
│   ├── utils/
│   │   ├── jwt.js          # JWT token utilities
│   │   └── api.js          # API request utilities
│   ├── contexts/
│   │   └── AuthContext.js  # React authentication context
│   ├── shared/
│   │   ├── ProtectedRoute.js  # Route protection components
│   │   ├── login/
│   │   │   ├── login.js    # Login component
│   │   │   └── login.css   # Login styles
│   │   └── signup/
│   │       ├── signup.js   # Signup component
│   │       └── signup.css  # Signup styles
│   └── userUI/
│       ├── Dashboard.js    # User dashboard
│       └── Dashboard.css   # Dashboard styles
├── server/
│   ├── server.js           # Express API server
│   ├── package.json        # Server dependencies
│   └── README.md           # Server documentation
└── start-dev.js            # Development startup script
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in the `server` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:4200
```

### API Configuration

Update `apps/dv/src/utils/api.js` if needed:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 10000; // 10 seconds
```

## 🛡️ Security Features

### Frontend Security
- **Token Validation** - Automatic token expiry checking
- **Secure Storage** - Tokens stored in localStorage with error handling
- **Automatic Refresh** - Tokens refreshed 4 minutes before expiry
- **Route Protection** - Protected routes with role-based access
- **Input Validation** - Form validation and sanitization

### Backend Security
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **CORS Protection** - Configured for specific frontend origin
- **Input Validation** - Express-validator for all endpoints
- **Password Hashing** - bcrypt with 12 rounds
- **JWT Signing** - Secure token generation with expiry
- **Security Headers** - Helmet.js for HTTP security headers

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### Password Management
- `POST /api/auth/change-password` - Change password (authenticated)
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/verify-reset-token` - Verify reset token
- `POST /api/auth/set-new-password` - Set new password with token

### User Profile
- `GET /api/auth/profile` - Get user profile (authenticated)
- `PUT /api/auth/profile` - Update user profile (authenticated)

### Health Check
- `GET /api/health` - Server health status

## 🎯 Usage Examples

### Login Component
```javascript
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const { login } = useAuth();
  
  const handleSubmit = async (email, password) => {
    try {
      await login(email, password);
      // User is now authenticated
    } catch (error) {
      // Handle login error
    }
  };
}
```

### Protected Route
```javascript
import { ProtectedRoute } from '../shared/ProtectedRoute';

function App() {
  return (
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute allowedRoles={['user', 'admin']}>
          <Dashboard />
        </ProtectedRoute>
      }
    />
  );
}
```

### API Request with Auth
```javascript
import { api } from '../utils/api';

// Automatic token handling
const userData = await api.get('/auth/profile');
const updatedUser = await api.put('/auth/profile', { firstName: 'John' });
```

## 🔄 Token Refresh Flow

1. **Automatic Check** - Every 4 minutes, check if token expires soon
2. **API Refresh** - Try to refresh via `/api/auth/refresh` endpoint
3. **Local Refresh** - If API fails, try local token refresh
4. **Logout** - If both fail, logout user and redirect to login

## 🧪 Testing

### Manual Testing
1. **Login Flow**
   - Try valid credentials
   - Try invalid credentials
   - Test account lockout (5 failed attempts)

2. **Token Expiry**
   - Wait for token to expire (1 hour)
   - Test automatic refresh
   - Test manual refresh

3. **Route Protection**
   - Try accessing protected routes without auth
   - Test role-based access
   - Test redirect after login

### API Testing with curl
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password"}'

# Get profile with token
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🚨 Error Handling

### Common Errors
- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Token expired or insufficient permissions
- **429 Too Many Requests** - Rate limit exceeded
- **400 Bad Request** - Invalid input data

### Error Recovery
- **Token Expired** - Automatic refresh or redirect to login
- **Network Error** - Retry with exponential backoff
- **Server Error** - Show user-friendly error message

## 🔧 Customization

### Adding New Protected Routes
```javascript
// In app.js
<Route
  path="/admin/users"
  element={
    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <AdminUsersPage />
    </ProtectedRoute>
  }
/>
```

### Custom API Endpoints
```javascript
// In api.js
export const customAPI = {
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`)
};
```

### Custom Token Validation
```javascript
// In jwt.js
export const customTokenValidation = (token) => {
  const payload = decodeToken(token);
  // Add custom validation logic
  return payload && payload.customField === 'expectedValue';
};
```

## 🚀 Production Deployment

### Frontend
1. Set `REACT_APP_API_URL` environment variable
2. Update CORS settings in backend
3. Use HTTPS in production
4. Implement proper error monitoring

### Backend
1. Use strong JWT secret
2. Enable HTTPS
3. Add database for user storage
4. Implement token blacklisting
5. Add logging and monitoring
6. Configure rate limiting for production

## 📚 Additional Resources

- [JWT.io](https://jwt.io/) - JWT token debugger
- [Express.js Security](https://expressjs.com/en/advanced/best-practices-security.html)
- [React Router Authentication](https://reactrouter.com/docs/en/v6/examples/auth)
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js/) - Password hashing

## 🤝 Contributing

When adding new authentication features:

1. Update JWT utilities if needed
2. Add corresponding API endpoints
3. Update AuthContext with new methods
4. Add proper error handling
5. Update documentation
6. Add tests

## 📄 License

This authentication system is part of the Loyalty project and follows the same license terms. 