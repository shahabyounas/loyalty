# Loyalty API Server

A comprehensive Node.js/Express backend API for the Loyalty application with JWT authentication, role-based access control, and enterprise-grade security features.

## 🏗️ Architecture

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # Database configuration
│   │   └── jwt.js        # JWT configuration
│   ├── controllers/      # Request handlers
│   │   └── auth.controller.js
│   ├── middleware/       # Custom middleware
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── notFound.middleware.js
│   │   └── validation.middleware.js
│   ├── models/          # Data models
│   │   └── user.model.js
│   ├── routes/          # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   └── loyalty.routes.js
│   ├── services/        # Business logic
│   │   └── auth.service.js
│   ├── utils/           # Utility functions
│   │   ├── logger.js
│   │   └── response.js
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── tests/              # Test files
│   ├── unit/
│   └── integration/
├── logs/               # Application logs
├── package.json
└── README.md
```

## 🚀 Features

- **JWT Authentication** with access and refresh tokens
- **Role-based Access Control** (RBAC)
- **Input Validation** using express-validator
- **Rate Limiting** to prevent abuse
- **Security Headers** with Helmet
- **CORS Configuration** for frontend integration
- **Structured Logging** with Winston
- **Error Handling** with custom error middleware
- **API Response Standardization**
- **Graceful Shutdown** handling
- **Health Check** endpoint

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env` file

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:4200

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=loyalty-api
JWT_AUDIENCE=loyalty-users

# Database Configuration (for future use)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loyalty_dev
DB_USER=postgres
DB_PASSWORD=password
DB_DIALECT=postgres

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🏃‍♂️ Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Testing
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/change-password` - Change password (authenticated)
- `POST /api/auth/logout` - User logout (authenticated)
- `GET /api/auth/profile` - Get user profile (authenticated)

### Health Check
- `GET /health` - Server health status

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login** to get access and refresh tokens
2. **Include access token** in Authorization header: `Bearer <token>`
3. **Use refresh token** to get new access token when expired

### Token Structure
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "user"
}
```

## 🛡️ Security Features

- **Password Hashing** with bcrypt (12 salt rounds)
- **JWT Token Security** with issuer and audience validation
- **Rate Limiting** to prevent brute force attacks
- **Security Headers** with Helmet
- **CORS Protection** with configurable origins
- **Input Validation** and sanitization
- **Error Handling** without exposing sensitive information

## 📝 API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧪 Testing

The application includes comprehensive testing setup:

- **Unit Tests** for individual functions
- **Integration Tests** for API endpoints
- **Test Coverage** reporting
- **Supertest** for HTTP assertions

## 📊 Logging

Structured logging with Winston:

- **Console logging** in development
- **File logging** in production
- **Error tracking** with stack traces
- **Request/response logging** for debugging

## 🔄 Database Integration

The application is prepared for database integration:

- **Database configuration** for multiple environments
- **Model structure** ready for ORM integration
- **Connection pooling** configuration
- **Migration support** structure

## 🚀 Deployment

### Docker
```bash
docker build -t loyalty-api .
docker run -p 3000:3000 loyalty-api
```

### Environment Variables
Ensure all required environment variables are set in production.

### Health Checks
Use the `/health` endpoint for load balancer health checks.

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Follow security best practices

## 📄 License

MIT License - see LICENSE file for details 