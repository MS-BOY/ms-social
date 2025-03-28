#!/usr/bin/env node

/**
 * This script helps you set up your environment variables for Vercel deployment
 * Run this with Node.js: node vercel-env-setup.js
 */

const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Generate a random session secret
const sessionSecret = crypto.randomBytes(32).toString('hex');

console.log('='.repeat(80));
console.log('MS Social - Vercel Environment Variables Setup');
console.log('='.repeat(80));
console.log('\nThis script will help you collect the necessary environment variables for deploying to Vercel.\n');

const envVars = {
  'CLOUDINARY_CLOUD_NAME': '',
  'CLOUDINARY_API_KEY': '',
  'CLOUDINARY_API_SECRET': '',
  'SESSION_SECRET': sessionSecret,
  'DATABASE_URL': null
};

// Ask for environment variables
function askForEnvVars(keys, index = 0) {
  if (index >= keys.length) {
    // We're done, print the results
    printResults();
    rl.close();
    return;
  }

  const key = keys[index];
  
  // Skip variables that already have default values
  if (envVars[key] !== '' && envVars[key] !== null) {
    askForEnvVars(keys, index + 1);
    return;
  }

  // Special handling for optional values
  if (key === 'DATABASE_URL') {
    rl.question(`Do you want to use a PostgreSQL database? (yes/no, default: no): `, (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        rl.question(`${key} (PostgreSQL connection string): `, (value) => {
          envVars[key] = value;
          askForEnvVars(keys, index + 1);
        });
      } else {
        console.log('Using in-memory storage instead of PostgreSQL.');
        askForEnvVars(keys, index + 1);
      }
    });
    return;
  }

  // For regular variables
  rl.question(`${key}: `, (value) => {
    envVars[key] = value;
    askForEnvVars(keys, index + 1);
  });
}

// Print the results in a format that can be copied to Vercel
function printResults() {
  console.log('\n='.repeat(80));
  console.log('Your environment variables are ready!');
  console.log('='.repeat(80));
  console.log('\nManually add these to your Vercel project settings:\n');
  
  for (const [key, value] of Object.entries(envVars)) {
    if (value !== null) {
      console.log(`${key}=${value}`);
    }
  }
  
  console.log('\n='.repeat(80));
  console.log('Instructions:');
  console.log('1. Go to your Vercel project dashboard');
  console.log('2. Navigate to "Settings" > "Environment Variables"');
  console.log('3. Copy each variable above and add it to your project');
  console.log('='.repeat(80));
}

// Start asking for variables
const keys = Object.keys(envVars);
askForEnvVars(keys);