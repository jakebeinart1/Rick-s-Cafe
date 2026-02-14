#!/usr/bin/env node

/**
 * Setup script for Rick's Cafe Sanity project.
 *
 * Usage:
 *   1. Run: npx sanity login
 *   2. Run: node scripts/setup-sanity.mjs
 *
 * This script will:
 *   - Create a new Sanity project
 *   - Create a production dataset
 *   - Write .env.local with the project ID
 *   - Add CORS origin for localhost
 */

import { execSync } from "child_process";
import { writeFileSync, existsSync } from "fs";

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

console.log("\n🏝️  Rick's Cafe — Sanity Setup\n");

// Check login
try {
  run("npx sanity projects list");
} catch {
  console.error("❌ Not logged in. Run: npx sanity login");
  process.exit(1);
}

// Create project
console.log("Creating Sanity project...");
let projectId;
try {
  const output = run(
    'npx sanity projects create "Ricks Cafe" --output-json'
  );
  const parsed = JSON.parse(output);
  projectId = parsed.projectId || parsed.id;
  console.log(`✅ Project created: ${projectId}`);
} catch (e) {
  console.error("❌ Failed to create project:", e.message);
  process.exit(1);
}

// Create dataset
console.log("Creating production dataset...");
try {
  run(
    `npx sanity dataset create production --project ${projectId} --visibility public`
  );
  console.log("✅ Dataset created: production");
} catch (e) {
  // Dataset might already exist
  console.log("⚠️  Dataset may already exist, continuing...");
}

// Add CORS origin
console.log("Adding localhost CORS origin...");
try {
  run(
    `npx sanity cors add http://localhost:3000 --project ${projectId} --no-credentials`
  );
  console.log("✅ CORS origin added: http://localhost:3000");
} catch {
  console.log("⚠️  CORS origin may already exist, continuing...");
}

// Write .env.local
const envContent = `NEXT_PUBLIC_SANITY_PROJECT_ID=${projectId}
NEXT_PUBLIC_SANITY_DATASET=production
`;

writeFileSync(".env.local", envContent);
console.log("✅ .env.local written");

console.log(`
🎉 Setup complete!

   Project ID: ${projectId}
   Dataset:    production
   Studio:     http://localhost:3000/studio
   Frontend:   http://localhost:3000

   Run: npm run dev
`);
