#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting Loyalty Development Environment...\n");

// Start API Server
console.log("📡 Starting API Server...");
const apiServer = spawn("npm", ["run", "dev"], {
  cwd: path.join(__dirname, "server"),
  stdio: "inherit",
  shell: true,
});

// Wait a bit for API server to start
setTimeout(() => {
  console.log("\n🌐 Starting Frontend...");
  const frontend = spawn("npx", ["nx", "serve", "dv"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });

  // Handle process termination
  const cleanup = () => {
    console.log("\n🛑 Shutting down development servers...");
    apiServer.kill();
    frontend.kill();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Handle server crashes
  apiServer.on("close", (code) => {
    console.log(`\n❌ API Server exited with code ${code}`);
    cleanup();
  });

  frontend.on("close", (code) => {
    console.log(`\n❌ Frontend exited with code ${code}`);
    cleanup();
  });
}, 3000);

console.log("\n📋 Development URLs:");
console.log("   Frontend: http://localhost:4200");
console.log("   API Server: http://localhost:3001");
console.log("   API Health: http://localhost:3001/api/health");
console.log("\n🔐 Demo Users:");
console.log("   User: demo@example.com / password");
console.log("   Admin: admin@example.com / password");
console.log("\n⏹️  Press Ctrl+C to stop all servers\n");
