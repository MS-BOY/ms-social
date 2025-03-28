# Deployment Guide for MS Social

This guide provides instructions on how to deploy MS Social to Vercel.

## Prerequisites

Before deploying, make sure you have:

1. A [Vercel](https://vercel.com) account
2. A [Cloudinary](https://cloudinary.com) account for media storage
3. (Optional) A [Neon PostgreSQL](https://neon.tech) database

## Deploying to Vercel

### Method 1: Using the Vercel Dashboard

1. **Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Login with your account or create a new one

2. **Import Your Repository**
   - Click "Add New..." → "Project"
   - Connect your GitHub, GitLab, or Bitbucket account
   - Select the repository containing MS Social
   - If you don't have your code in a repository, you can upload your project directly

3. **Configure Project**
   - Project Name: Choose a name for your deployment
   - Framework Preset: Select "Other"
   - Root Directory: Leave as is
   
4. **Environment Variables**
   - You can use the included helper script to prepare your environment variables:
     ```bash
     node vercel-env-setup.js
     ```
   - Alternatively, manually add the following variables in the Vercel dashboard:
     - `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
     - `CLOUDINARY_API_KEY` - Your Cloudinary API key
     - `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
     - `SESSION_SECRET` - A random string for securing sessions
     - (Optional) `DATABASE_URL` - Your PostgreSQL connection string

5. **Deploy**
   - Click "Deploy"
   - Wait for the build and deployment to complete

### Method 2: Using Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**
   ```bash
   cd path/to/ms-social
   vercel
   ```

4. **Follow the interactive prompts**
   - Set up environment variables when prompted
   - Confirm deployment settings

## Post-Deployment

After successful deployment:

1. **Test Your Application**
   - Visit the provided Vercel URL to ensure your app is working
   - Test all features including login, posts, messaging, etc.

2. **Set Up a Custom Domain (Optional)**
   - In your Vercel project dashboard, go to "Settings" → "Domains"
   - Add your custom domain and follow instructions

## Troubleshooting

If you encounter issues:

1. **Check Logs**
   - Go to your project in the Vercel dashboard
   - Navigate to "Deployments" → select your deployment → "Functions"
   - Check the logs for any errors

2. **Verify Environment Variables**
   - Make sure all required environment variables are correctly set

3. **Check Build Output**
   - Review the build logs for any compilation errors
   
4. **WebSocket Issues**
   - If real-time features aren't working:
     - Make sure Vercel's WebSocket support is enabled in your project settings
     - Check that the `/ws` route in `vercel.json` is correctly configured
     - Verify that the WebSocket URLs in the client code are using the correct protocol (`wss:` for HTTPS)

## Keeping Your Deployment Updated

When you make changes to your project:

1. Push the changes to your repository
2. Vercel will automatically redeploy your application
3. To manually trigger a redeploy, run `vercel --prod` with the CLI or use the "Redeploy" button in the dashboard

---

For more detailed information, refer to [Vercel's documentation](https://vercel.com/docs).