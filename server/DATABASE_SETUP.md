# Database Setup Guide

This guide will help you set up your Supabase PostgreSQL database with the Loyalty API.

## 🗄️ Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be provisioned

### 2. Get Database Connection Details

1. Go to your project dashboard
2. Navigate to **Settings** → **Database**
3. Copy the following details:
   - **Host**: `db.your-project-ref.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: Your database password

### 3. Environment Variables

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

# Supabase PostgreSQL Configuration
SUPABASE_HOST=db.your-project-ref.supabase.co
SUPABASE_PORT=5432
SUPABASE_DATABASE=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your-database-password

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Database Setup Commands

### 1. Run Migrations

Create the database tables:

```bash
npm run db:migrate
```

### 2. Check Migration Status

View which migrations have been applied:

```bash
npm run db:migrate:status
```

### 3. Seed the Database

Add sample data (optional):

```bash
npm run db:seed
```

## 📊 Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Database Utilities

### Connection Pool

The application uses a connection pool for efficient database connections:

- **Max connections**: 20 (development), 5 (test)
- **Idle timeout**: 30 seconds
- **Connection timeout**: 2 seconds

### Database Functions

The `db` object provides these utility functions:

```javascript
// Execute a query with parameters
await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// Get a single row
const user = await db.getOne('SELECT * FROM users WHERE id = $1', [userId]);

// Get multiple rows
const users = await db.getMany('SELECT * FROM users WHERE role = $1', ['admin']);

// Execute a transaction
await db.transaction(async (client) => {
  await client.query('INSERT INTO users (email) VALUES ($1)', ['user@example.com']);
  await client.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', 'user@example.com']);
});
```

## 🧪 Testing the Connection

### 1. Start the Server

```bash
npm run dev
```

### 2. Test the Health Endpoint

```bash
curl http://localhost:3000/health
```

### 3. Test User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit your `.env` file to version control
2. **Database Password**: Use a strong, unique password for your database
3. **SSL**: SSL is enabled by default for production connections
4. **Connection Pooling**: Prevents connection exhaustion
5. **Parameterized Queries**: Prevents SQL injection attacks

## 🐛 Troubleshooting

### Connection Issues

1. **Check environment variables**: Ensure all Supabase connection details are correct
2. **Network access**: Make sure your IP is allowed in Supabase dashboard
3. **SSL**: For local development, SSL might need to be disabled

### Migration Issues

1. **Check migration status**: `npm run db:migrate:status`
2. **Reset migrations**: Delete the `migrations` table and re-run migrations
3. **Check logs**: Look for detailed error messages in the console

### Performance Issues

1. **Connection pool**: Monitor connection pool usage
2. **Query optimization**: Use indexes for frequently queried columns
3. **Database monitoring**: Use Supabase dashboard to monitor performance

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Documentation](https://node-postgres.com/) 