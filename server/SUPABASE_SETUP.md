# Supabase Setup Guide

Follow these steps to connect your backend to Supabase PostgreSQL.

## 🗄️ Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `loyalty-app` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be provisioned (2-3 minutes)

## 🔑 Step 2: Get Database Connection Details

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to "Connection string" section
3. Copy these details:

### Connection Details
- **Host**: `db.your-project-ref.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: The password you created in step 1

### Example Connection String
```
postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
```

## ⚙️ Step 3: Update Environment Variables

1. Open the `.env` file in your `server` directory
2. Replace the placeholder values with your actual Supabase details:

```env
# Supabase PostgreSQL Configuration
SUPABASE_HOST=db.your-project-ref.supabase.co
SUPABASE_PORT=5432
SUPABASE_DATABASE=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your-actual-database-password
```

### Example (replace with your actual values):
```env
SUPABASE_HOST=db.abcdefghijklmnop.supabase.co
SUPABASE_PORT=5432
SUPABASE_DATABASE=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=MyStrongPassword123!
```

## 🔒 Step 4: Configure Database Access

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to "Connection pooling" section
3. Note the connection pooler settings (optional for development)

## 🚀 Step 5: Test the Connection

1. Run the migration to create tables:
   ```bash
   npm run db:migrate
   ```

2. Check migration status:
   ```bash
   npm run db:migrate:status
   ```

3. Seed the database with test data:
   ```bash
   npm run db:seed
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

5. Test the API:
   ```bash
   # Health check
   curl http://localhost:3000/health
   
   # Test login with seeded user
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@loyalty.com",
       "password": "Admin123!"
     }'
   ```

## 🔧 Step 6: Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_HOST` | Your Supabase database host | `db.abcdefghijklmnop.supabase.co` |
| `SUPABASE_PORT` | Database port (usually 5432) | `5432` |
| `SUPABASE_DATABASE` | Database name (usually postgres) | `postgres` |
| `SUPABASE_USER` | Database user (usually postgres) | `postgres` |
| `SUPABASE_PASSWORD` | Your database password | `MyStrongPassword123!` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | JWT signing secret | Auto-generated |
| `LOG_LEVEL` | Logging level | `info` |

## 🛡️ Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for your database
3. **Enable SSL** in production (already configured)
4. **Restrict database access** by IP if needed
5. **Rotate JWT secrets** regularly in production

## 🐛 Troubleshooting

### Connection Issues

**Error: "connection refused"**
- Check if the host and port are correct
- Verify your IP is not blocked by Supabase

**Error: "authentication failed"**
- Double-check username and password
- Ensure you're using the database password, not your Supabase account password

**Error: "SSL connection required"**
- SSL is enabled by default for production
- For local development, SSL is disabled

### Migration Issues

**Error: "table already exists"**
- Run `npm run db:migrate:status` to check current state
- The migration will handle existing tables

**Error: "permission denied"**
- Ensure your database user has proper permissions
- Check if you're using the correct database credentials

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Documentation](https://node-postgres.com/)

## 🎯 Next Steps

After setting up the connection:

1. **Test the API endpoints** with the seeded users
2. **Create your own users** through the registration endpoint
3. **Monitor the database** in Supabase dashboard
4. **Set up production environment** with proper secrets
5. **Configure CI/CD** with environment variables 