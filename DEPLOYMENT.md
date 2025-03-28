# Deployment Guide

This document provides instructions for deploying the Social Media Platform to different hosting environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deployment Options](#deployment-options)
  - [Traditional VPS/Server](#traditional-vpsserver)
  - [Docker](#docker)
  - [Heroku](#heroku)
  - [Vercel](#vercel)
  - [Netlify](#netlify)
  - [Railway](#railway)
  - [Render](#render)

## Prerequisites

Before deploying, make sure you have:

1. Built the application with `npm run build`
2. Set up all required environment variables
3. Tested the application locally

## Environment Variables

The application requires the following environment variables:

- `PORT` - The port the server will run on (default: 5000)
- `NODE_ENV` - The environment ('development' or 'production')
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
- `SESSION_SECRET` - Secret for encrypting sessions

## Deployment Options

### Traditional VPS/Server

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/social-media-platform.git
   cd social-media-platform
   ```

2. Install dependencies and build
   ```bash
   npm install
   npm run build
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the server
   ```bash
   npm start
   ```

5. (Optional) Use a process manager like PM2
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name "social-media"
   pm2 save
   ```

### Docker

1. Build the Docker image
   ```bash
   ./docker-scripts.sh build
   ```

2. Run the Docker container
   ```bash
   ./docker-scripts.sh run
   ```

3. Alternatively, use Docker Compose
   ```bash
   ./docker-scripts.sh compose-up
   ```

### Heroku

1. Create a Heroku app
   ```bash
   heroku create your-app-name
   ```

2. Set environment variables
   ```bash
   heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
   heroku config:set CLOUDINARY_API_KEY=your_api_key
   heroku config:set CLOUDINARY_API_SECRET=your_api_secret
   heroku config:set SESSION_SECRET=your_session_secret
   ```

3. Deploy the app
   ```bash
   git push heroku main
   ```

4. Open the app
   ```bash
   heroku open
   ```

### Vercel

1. Install Vercel CLI
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel
   ```bash
   vercel
   ```

3. Set environment variables in the Vercel dashboard or using the CLI
   ```bash
   vercel env add CLOUDINARY_CLOUD_NAME
   vercel env add CLOUDINARY_API_KEY
   vercel env add CLOUDINARY_API_SECRET
   vercel env add SESSION_SECRET
   ```

### Netlify

1. Install Netlify CLI
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy to Netlify
   ```bash
   netlify deploy
   ```

3. Set environment variables in the Netlify dashboard or using the CLI
   ```bash
   netlify env:set CLOUDINARY_CLOUD_NAME your_cloud_name
   netlify env:set CLOUDINARY_API_KEY your_api_key
   netlify env:set CLOUDINARY_API_SECRET your_api_secret
   netlify env:set SESSION_SECRET your_session_secret
   ```

### Railway

1. Install Railway CLI
   ```bash
   npm install -g @railway/cli
   ```

2. Log in to Railway
   ```bash
   railway login
   ```

3. Link to an existing project or create a new one
   ```bash
   railway link
   # or
   railway init
   ```

4. Deploy to Railway
   ```bash
   railway up
   ```

5. Set environment variables using the Railway dashboard

### Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use the following settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Set environment variables in the Render dashboard

## Post-Deployment Steps

After deploying to any platform:

1. Verify the application is running correctly
2. Test user registration and login
3. Test media uploads with Cloudinary
4. Monitor logs for any errors

## Troubleshooting

If you encounter issues during deployment:

1. Check the logs of your hosting platform
2. Verify all environment variables are set correctly
3. Ensure the build process completed successfully
4. Check for any port conflicts (if applicable)