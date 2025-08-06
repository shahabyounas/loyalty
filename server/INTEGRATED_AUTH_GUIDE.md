# Integrated User Authentication System

This document explains how the integrated authentication system works, combining Supabase Auth for authentication and our PostgreSQL database for user profiles and business logic.

## Architecture Overview

The system uses a **dual-storage approach**:

1. **Supabase Auth**: Handles authentication, passwords, sessions, and JWT tokens
2. **PostgreSQL Database**: Stores user profiles, roles, permissions, and business data

### Data Flow

```
User Registration:
1. Create user in Supabase Auth → Get auth_user_id
2. Create user profile in PostgreSQL → Link via auth_user_id

User Authentication:
1. Sign in via Supabase Auth → Get JWT token
2. Use token to get user profile from PostgreSQL
3. Return combined user data
```

## Key Components

### 1. SupabaseAuthService (`src/services/supabase-auth.service.js`)
Handles all Supabase Auth operations:
- User creation (`supabase.auth.admin.createUser`)
- Sign in/out
- Token verification
- Password management
- Session management

### 2. UserAuthService (`src/services/user-auth.service.js`)
**Integrated service** that combines Supabase Auth with database operations:
- Creates users in both systems
- Manages the link between auth and database
- Handles profile updates across both systems
- Provides unified authentication interface

### 3. User Model (`src/models/user.model.js`)
Database model with:
- `auth_user_id` field linking to Supabase Auth
- Role-based permissions
- Tenant isolation
- Business logic methods

## User Creation Process

### Step 1: Create in Supabase Auth
```javascript
const authResult = await SupabaseAuthService.signUp(
  email,
  password,
  {
    firstName: userData.first_name,
    lastName: userData.last_name,
    role: role,
  }
);
```

### Step 2: Create in Database
```javascript
const dbUser = await User.create({
  auth_user_id: authResult.user.id,  // Link to Supabase Auth
  tenant_id: tenantId,
  email: userData.email,
  first_name: userData.first_name,
  last_name: userData.last_name,
  role: role,
  // ... other fields
});
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID NOT NULL,           -- Supabase Auth user ID
    tenant_id UUID REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL,            -- 'super_admin', 'tenant_admin', etc.
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    permissions JSONB DEFAULT '{}',       -- Role-based permissions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (auth_user_id),
    UNIQUE (tenant_id, email)
);
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `POST /api/auth/refresh` - Refresh session
- `GET /api/auth/me` - Get current user

### User Management
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password
- `GET /api/auth/tenants/:tenant_id/users` - Get tenant users (admin)
- `POST /api/auth/tenants/:tenant_id/users` - Create tenant user (admin)

## Usage Examples

### Creating a Customer User
```javascript
const userData = {
  email: "customer@example.com",
  password: "SecurePassword123!",
  first_name: "John",
  last_name: "Doe",
  phone: "+44 7123 456789",
};

const result = await UserAuthService.createCustomer(userData, tenantId);
// Returns: { auth_user, db_user, session }
```

### Signing In
```javascript
const result = await UserAuthService.signIn(email, password);
// Returns: { auth_user, db_user, session }
```

### Getting User by Token
```javascript
const result = await UserAuthService.getUserByToken(accessToken);
// Returns: { auth_user, db_user }
```

### Updating Profile
```javascript
const updates = {
  first_name: "John Updated",
  phone: "+44 7123 456789",
};

const result = await UserAuthService.updateUser(authUserId, updates);
// Updates both Supabase Auth and database
```

## Security Features

### 1. Row-Level Security (RLS)
```sql
-- Users can only access their own tenant's data
CREATE POLICY users_tenant_policy ON users 
FOR ALL USING (tenant_id IS NOT NULL OR role = 'super_admin');
```

### 2. Role-Based Permissions
```javascript
// Check permissions
if (user.hasPermission("user_manage")) {
  // Allow user management
}

// Role-based permission sets
const permissions = {
  super_admin: ["*"],
  tenant_admin: ["tenant_manage", "user_manage", "store_manage"],
  store_manager: ["store_manage", "staff_manage", "stamp_scan"],
  staff: ["stamp_scan", "purchase_process"],
  customer: ["profile_view", "loyalty_view", "reward_redeem"],
};
```

### 3. JWT Token Verification
```javascript
// Verify token with Supabase Auth
const authUser = await SupabaseAuthService.getUser(accessToken);

// Get user profile from database
const dbUser = await User.findByAuthUserId(authUser.id);
```

## Error Handling

The system provides comprehensive error handling:

```javascript
try {
  const result = await UserAuthService.createUser(userData, role, tenantId);
} catch (error) {
  // Handle specific error types
  if (error.message.includes("Auth creation failed")) {
    // Supabase Auth error
  } else if (error.message.includes("User not found in database")) {
    // Database error
  }
}
```

## Testing

Run the integrated test:
```bash
node test-user-auth.js
```

This test demonstrates:
- User creation in both systems
- Authentication flow
- Token verification
- Permission checking
- Profile updates

## Benefits of This Approach

1. **Security**: Supabase Auth handles secure authentication
2. **Flexibility**: Database stores business-specific user data
3. **Scalability**: Separate concerns for auth and business logic
4. **Multi-tenancy**: Proper tenant isolation
5. **Role-based Access**: Granular permission system
6. **Audit Trail**: Track user actions and changes

## Configuration

### Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

### Database Setup
```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Or run both
npm run db:setup
```

## Migration from Old System

If migrating from a different auth system:

1. **Export users** from old system
2. **Create users** in Supabase Auth
3. **Import profiles** into database with `auth_user_id` links
4. **Update application** to use new integrated service

## Troubleshooting

### Common Issues

1. **User not found in database**
   - Check if user was created in both systems
   - Verify `auth_user_id` link

2. **Permission denied**
   - Check user role and permissions
   - Verify tenant isolation

3. **Token verification failed**
   - Check Supabase configuration
   - Verify token format and expiration

### Debug Mode
Enable detailed logging:
```javascript
logger.level = 'debug';
```

## Future Enhancements

1. **Social Login**: Integrate with Google, Facebook, etc.
2. **MFA**: Multi-factor authentication
3. **SSO**: Single sign-on for enterprise
4. **Audit Logging**: Track all user actions
5. **User Groups**: Advanced permission management 