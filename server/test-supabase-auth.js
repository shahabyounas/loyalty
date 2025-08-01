require("dotenv").config();
const SupabaseAuthService = require("./src/services/supabase-auth.service");
const { logger } = require("./src/utils/logger");

async function testSupabaseAuth() {
  console.log("🧪 Testing Supabase Auth Integration...\n");

  try {
    // Test 1: Check if Supabase configuration is loaded
    console.log("1. Checking Supabase configuration...");
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "Missing Supabase configuration. Please check your .env file."
      );
    }
    console.log("✅ Supabase configuration loaded successfully");

    // Test 2: Create a test user
    console.log("\n2. Creating test user...");
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = "TestPassword123!";

    const signUpResult = await SupabaseAuthService.signUp(
      testEmail,
      testPassword,
      {
        firstName: "Test",
        lastName: "User",
        role: "user",
      }
    );

    console.log("✅ Test user created successfully");
    console.log(`   User ID: ${signUpResult.user.id}`);
    console.log(`   Email: ${signUpResult.user.email}`);

    // Test 3: Sign in the test user
    console.log("\n3. Testing user sign in...");
    const signInResult = await SupabaseAuthService.signIn(
      testEmail,
      testPassword
    );

    console.log("✅ User signed in successfully");
    console.log(
      `   Access Token: ${signInResult.session.access_token.substring(
        0,
        20
      )}...`
    );
    console.log(
      `   Refresh Token: ${signInResult.session.refresh_token.substring(
        0,
        20
      )}...`
    );

    // Test 4: Verify token
    console.log("\n4. Testing token verification...");
    const user = await SupabaseAuthService.verifyToken(
      signInResult.session.access_token
    );

    console.log("✅ Token verified successfully");
    console.log(`   Verified User ID: ${user.id}`);
    console.log(`   User Role: ${user.user_metadata?.role}`);

    // Test 5: Update user profile
    console.log("\n5. Testing profile update...");
    const updatedUser = await SupabaseAuthService.updateUser(user.id, {
      first_name: "Updated",
      last_name: "Name",
    });

    console.log("✅ Profile updated successfully");
    console.log(
      `   Updated Name: ${updatedUser.user_metadata?.first_name} ${updatedUser.user_metadata?.last_name}`
    );

    // Test 6: Get all users (admin function)
    console.log("\n6. Testing get all users...");
    const allUsers = await SupabaseAuthService.getAllUsers();

    console.log("✅ Retrieved all users successfully");
    console.log(`   Total Users: ${allUsers.length}`);

    // Test 7: Sign out
    console.log("\n7. Testing user sign out...");
    await SupabaseAuthService.signOut(signInResult.session.access_token);

    console.log("✅ User signed out successfully");

    // Test 8: Clean up - Delete test user
    console.log("\n8. Cleaning up test user...");
    await SupabaseAuthService.deleteUser(user.id);

    console.log("✅ Test user deleted successfully");

    console.log("\n🎉 All Supabase Auth tests passed successfully!");
    console.log("\nYour Supabase Auth integration is working correctly.");
    console.log("\nNext steps:");
    console.log(
      "1. Update your .env file with your actual Supabase credentials"
    );
    console.log("2. Start your server: npm run dev");
    console.log("3. Test the API endpoints with curl or Postman");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("\nTroubleshooting:");
    console.error(
      "1. Check your .env file has the correct Supabase credentials"
    );
    console.error("2. Ensure your Supabase project is active");
    console.error("3. Verify your API keys are correct");
    console.error("4. Check the Supabase Auth settings in your dashboard");
  }
}

// Run the test
testSupabaseAuth();
