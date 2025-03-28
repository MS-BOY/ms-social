#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('┌──────────────────────────────────────────┐');
console.log('│  Social Media Platform - Setup Assistant  │');
console.log('└──────────────────────────────────────────┘');
console.log('\nThis script will help you set up the project environment.');

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✓ Created uploads directory');
}

// Create .env file if it doesn't exist
const envExample = path.join(process.cwd(), '.env.example');
const envFile = path.join(process.cwd(), '.env');

if (!fs.existsSync(envFile)) {
  fs.copyFileSync(envExample, envFile);
  console.log('✓ Created .env file from template');
  
  rl.question('\nWould you like to configure your .env file now? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      console.log('\nPlease provide the following information:');
      
      const questions = [
        { key: 'CLOUDINARY_CLOUD_NAME', message: 'Cloudinary Cloud Name: ' },
        { key: 'CLOUDINARY_API_KEY', message: 'Cloudinary API Key: ' },
        { key: 'CLOUDINARY_API_SECRET', message: 'Cloudinary API Secret: ' },
        { key: 'SESSION_SECRET', message: 'Session Secret (or press Enter for a random one): ' }
      ];
      
      // Generate a random session secret if needed
      const generateSessionSecret = () => {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
      };
      
      const askQuestion = (index) => {
        if (index >= questions.length) {
          console.log('\n✓ Environment variables configured');
          finishSetup();
          return;
        }
        
        const question = questions[index];
        rl.question(question.message, (answer) => {
          let value = answer.trim();
          
          // For session secret, generate random if empty
          if (question.key === 'SESSION_SECRET' && !value) {
            value = generateSessionSecret();
            console.log(`Generated random session secret: ${value}`);
          }
          
          if (value) {
            let envContent = fs.readFileSync(envFile, 'utf8');
            envContent = envContent.replace(
              new RegExp(`${question.key}=.*`, 'g'), 
              `${question.key}=${value}`
            );
            fs.writeFileSync(envFile, envContent);
          }
          
          askQuestion(index + 1);
        });
      };
      
      askQuestion(0);
    } else {
      console.log('\n⚠️  Don\'t forget to update your .env file with your credentials before running the application.');
      finishSetup();
    }
  });
} else {
  console.log('✓ .env file already exists');
  finishSetup();
}

function finishSetup() {
  console.log('\n🚀 Setup completed successfully!');
  console.log('\nTo start the development server, run:');
  console.log('  npm run dev');
  console.log('\nTo build for production, run:');
  console.log('  npm run build');
  console.log('  npm start');
  
  rl.close();
}

// Handle events for readline interface
rl.on('close', () => {
  console.log('\nThank you for setting up the Social Media Platform!\n');
  process.exit(0);
});