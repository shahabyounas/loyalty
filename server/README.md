# Loyalty API Server

A demo Express.js API server with JWT authentication for testing the frontend authentication system.

## Features

- 🔐 JWT-based authentication
- 🔄 Automatic token refresh
- 🛡️ Security middleware (Helmet, CORS, Rate limiting)
- ✅ Input validation
- 🔒 Password hashing with bcrypt
- 📧 Password reset functionality
- 👤 User profile management
- 🎭 Role-based access control

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (optional):
```bash
cp .env.example .env
```

4. Start the server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:4200
```

## Demo Users

The server comes with pre-configured demo users:

| Email | Password | Role |
|-------|----------|------|
| `demo@example.com` | `password` | user |
| `admin@example.com` | `password` | admin |

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "demo@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "demo@example.com",
    "firstName": "Demo",
    "lastName": "User",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/api/auth/register`
Register a new user.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "User"
}
```

#### POST `/api/auth/logout`
Logout user (requires authentication).

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Password Management

#### POST `/api/auth/change-password`
Change user password (requires authentication).

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

#### POST `/api/auth/reset-password`
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### POST `/api/auth/verify-reset-token`
Verify password reset token.

**Request:**
```json
{
  "token": "reset-token-here"
}
```

#### POST `/api/auth/set-new-password`
Set new password with reset token.

**Request:**
```json
{
  "token": "reset-token-here",
  "newPassword": "newpassword123"
}
```

### User Profile

#### GET `/api/auth/profile`
Get current user profile (requires authentication).

#### PUT `/api/auth/profile`
Update user profile (requires authentication).

**Request:**
```json
{
  "firstName": "Updated",
  "lastName": "Name"
}
```

### Health Check

#### GET `/api/health`
Check server status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "API server is running"
}
```

## Authentication

### JWT Token Structure

The server issues two types of tokens:

1. **Access Token** (1 hour expiry)
   - Used for API authentication
   - Contains user ID, email, and role

2. **Refresh Token** (7 days expiry)
   - Used to get new access tokens
   - Contains user ID and email

### Authorization Header

Include the access token in the Authorization header:

```
Authorization: Bearer <access-token>
```

### Error Responses

#### 401 Unauthorized
```json
{
  "message": "Access token required"
}
```

#### 403 Forbidden
```json
{
  "message": "Invalid or expired token"
}
```

#### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Security Features

### Rate Limiting
- 100 requests per 15 minutes per IP
- Applied to all `/api/` routes

### Input Validation
- Email format validation
- Password length requirements
- Required field validation

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Content-Type validation

### Password Security
- bcrypt hashing (12 rounds)
- Minimum 6 character passwords

## Development

### Running Tests
```bash
npm test
```

### API Testing with curl

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password"}'
```

#### Get Profile (with token)
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Production Considerations

1. **Database**: Replace in-memory storage with a proper database
2. **JWT Secret**: Use a strong, unique secret key
3. **HTTPS**: Enable HTTPS in production
4. **Logging**: Add proper logging middleware
5. **Monitoring**: Add health checks and monitoring
6. **Email Service**: Integrate with a real email service for password resets
7. **Token Blacklisting**: Implement token blacklisting for logout
8. **Rate Limiting**: Adjust rate limits based on your needs

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check `FRONTEND_URL` in environment variables
2. **Token Expired**: Use refresh token to get new access token
3. **Validation Errors**: Check request body format and required fields
4. **Server Not Starting**: Check if port 3001 is available

### Logs

The server logs important events to the console:
- Server startup
- Authentication attempts
- Password reset tokens (for demo purposes)
- Errors and exceptions

## License

MIT License - see LICENSE file for details. 