# Railway Deployment Guide

This guide explains how to deploy your Next.js health kiosk application to Railway.

## Prerequisites

1. [Railway CLI](https://docs.railway.app/develop/cli) installed
2. Railway account created
3. Git repository connected to Railway

## Deployment Files

The following files have been configured for Railway deployment:

### `railway.json`
Main Railway configuration file specifying build and deployment settings.

### `Procfile`
Process file defining the web process command.

### `nixpacks.toml`
Nixpacks configuration for customizing the build environment.

## Environment Variables

Set the following environment variables in your Railway project dashboard:

### Required Variables
```env
NEXT_PUBLIC_API_BASE_URL=https://kiosk-be2-production.up.railway.app/api
NEXT_PUBLIC_HOST_DOMAIN=https://kiosk-fe-production.up.railway.app
DATABASE_URI=your-mongodb-connection-string
PAYLOAD_SECRET=your-payload-secret-key
NODE_ENV=production
PORT=3000
```

### Optional Variables
```env
NEXT_PUBLIC_PARTNER_LOGO_URL=your-logo-url
```

## Deployment Steps

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Set Environment Variables**: Configure all required environment variables
3. **Deploy**: Railway will automatically build and deploy your application

### Manual Deployment via CLI
```bash
# Login to Railway
railway login

# Link project
railway link

# Set environment variables
railway variables set NEXT_PUBLIC_API_BASE_URL=https://kiosk-be2-production.up.railway.app/api
railway variables set DATABASE_URI=your-mongodb-connection-string
railway variables set PAYLOAD_SECRET=your-secret-key

# Deploy
railway up
```

## Build Process

Railway will automatically:
1. Detect Node.js application
2. Install dependencies with `npm ci`
3. Build the application with `npm run build`
4. Start the production server with `npm run start`

## Health Checks

The application includes a health check endpoint at `/` that Railway will use to verify deployment success.

## Troubleshooting

### Common Issues

1. **Build Failures**: Check Node.js version compatibility (requires >= 18.0.0)
2. **Environment Variables**: Ensure all required variables are set
3. **Database Connection**: Verify MongoDB URI is accessible from Railway
4. **API Connectivity**: Confirm backend API is running at the specified URL

### Logs
View deployment logs in Railway dashboard or via CLI:
```bash
railway logs
```

## Production Considerations

- [ ] Configure proper MongoDB database
- [ ] Set strong PAYLOAD_SECRET
- [ ] Verify CORS settings for production domain
- [ ] Test API connectivity between frontend and backend
- [ ] Set up monitoring and error tracking
- [ ] Configure custom domain (optional)

## Support

For Railway-specific issues, consult:
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)