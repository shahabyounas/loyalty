# Supabase Auth Setup Guide

This guide will help you set up Supabase Auth for your backend application.

## 🗄️ Step 1: Get Supabase API Keys

1. Go to your Supabase dashboard
2. Navigate to **Settings** → **API**
3. Copy the following keys:

### Required Keys:
- **Project URL**: `https://your-project-ref.supabase.co`
- **Anon Key**: Public key for client-side operations
- **Service Role Key**: Private key for server-side operations (keep this secret!)

## ⚙️ Step 2: Update Environment Variables

Add these variables to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 🔧 Step 3: Configure Supabase Auth Settings

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure the following:

### Site URL
Set to your frontend URL: `http://localhost:4200` (development)

### Redirect URLs
Add your frontend URLs:
- `http://localhost:4200/auth/callback`
- `http://localhost:4200/auth/reset-password`

### Email Templates (Optional)
Customize email templates for:
- Email confirmation
- Password reset
- Magic link

## 🚀 Step 4: Test the Integration

### 1. Start the server:
```bash
npm run dev
```

### 2. Test user registration:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 3. Test user login:
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

### 4. Test protected endpoint:
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📡 API Endpoints

### Public Endpoints
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - User login
- `POST /api/auth/refresh-token` - Refresh access token

### Protected Endpoints
- `POST /api/auth/signout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Admin Endpoints
- `GET /api/auth/users` - Get all users (admin only)
- `DELETE /api/auth/users/:userId` - Delete user (admin only)

## 🔐 Authentication Flow

### 1. User Registration
```javascript
// Frontend
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});
```

### 2. User Login
```javascript
// Frontend
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### 3. Token Management
```javascript
// Access token for API calls
const accessToken = data.session.access_token;

// Refresh token for getting new access tokens
const refreshToken = data.session.refresh_token;
```

### 4. Making Authenticated Requests
```javascript
// Frontend
const response = await fetch('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

## 🛡️ Security Features

### Built-in Security
- **JWT Tokens**: Automatically handled by Supabase
- **Token Refresh**: Automatic token refresh
- **Password Hashing**: Secure password storage
- **Rate Limiting**: Built-in protection
- **Email Verification**: Optional email confirmation

### Role-Based Access Control
```javascript
// Check user role in middleware
const userRole = req.user.user_metadata?.role || 'user';

// Protect admin routes
if (userRole !== 'admin') {
  return res.status(403).json({ error: 'Admin access required' });
}
```

## 🔄 Token Refresh

### Automatic Refresh
Supabase handles token refresh automatically. When a token expires:

1. **Frontend**: Supabase client automatically refreshes the token
2. **Backend**: Use the refresh token endpoint if needed

### Manual Refresh
```javascript
// Backend
const result = await SupabaseAuthService.refreshToken(refreshToken);
const newAccessToken = result.session.access_token;
```

## 📊 User Management

### User Metadata
Store additional user information in `user_metadata`:

```javascript
// During registration
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password123',
  user_metadata: {
    first_name: 'John',
    last_name: 'Doe',
    role: 'user'
  }
});
```

### User Roles
- **user**: Regular user
- **admin**: Administrator
- **moderator**: Moderator (optional)

## 🐛 Troubleshooting

### Common Issues

**1. "Invalid API key" error**
- Check that your API keys are correct
- Ensure you're using the right key (anon vs service role)

**2. "JWT token expired" error**
- Implement token refresh logic
- Check token expiration settings

**3. "User not found" error**
- Verify user exists in Supabase Auth
- Check user metadata structure

**4. CORS errors**
- Configure CORS settings in Supabase
- Check frontend URL configuration

### Debug Mode
Enable debug logging:

```javascript
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
});
```

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [JWT Token Guide](https://supabase.com/docs/guides/auth/tokens)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Next Steps

1. **Configure Row Level Security** (RLS) for your database tables
2. **Set up email templates** for better user experience
3. **Implement social auth** (Google, GitHub, etc.)
4. **Add two-factor authentication** (2FA)
5. **Set up audit logging** for security monitoring 