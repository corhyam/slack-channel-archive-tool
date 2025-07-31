# Quick Start Guide

## Environment Requirements

- **Node.js**: >= 18.17.0
- **npm**: >= 8.0.0

## Environment Overview

This tool supports two deployment modes:
- **Local Development**: Uses self-signed HTTPS certificates
- **Production Environment**: Uses Cloudflare or other proxy services to handle HTTPS

## Local Development

### 1. Check Environment
```bash
# Check Node.js version
node --version  # Should display v18.17.0 or higher

# Check npm version
npm --version
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate SSL Certificate
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### 4. Configure Environment Variables
```bash
cp env.local.example .env
# Edit .env file with your Slack App configuration
```

### 5. Start Server
```bash
npm run dev
```

### 6. Access Application
Open browser and visit: `https://localhost:3000`

## Production Environment Deployment

### 1. Check Environment
```bash
# Check Node.js version
node --version  # Should display v18.17.0 or higher
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp env.example .env
# Edit .env file, set USE_HTTPS=false
```

### 4. Start Server
```bash
npm start
```

### 5. Configure Proxy
Access your domain through Cloudflare or other proxy services

## Important Notes

- 🔒 Slack OAuth 2.0 requires HTTPS callback URLs
- 🌐 Local development uses self-signed certificates, production environments handle HTTPS through proxies
- 📋 Ensure Slack App callback URL is configured correctly
- ⚙️ Control HTTPS mode through `USE_HTTPS` environment variable

## File Descriptions

- `server.js` - Server file (supports HTTP/HTTPS modes)
- `key.pem` & `cert.pem` - SSL certificate files (only needed for local development)
- `.env` - Environment variables file (not committed to Git)
- `node_modules/` - Dependency package directory (not committed to Git)

## Common Commands

### Development
```bash
# Start development server
npm run dev

# Direct start
node server.js
```

### Production
```bash
# Start production server
npm start

# Using PM2
pm2 start server.js --name "slack-archive-tool"
```

### Environment Variables
```bash
# Local development
USE_HTTPS=true
NODE_ENV=development

# Production
USE_HTTPS=false
NODE_ENV=production
```

## Troubleshooting

### SSL Certificate Issues
- Ensure `key.pem` and `cert.pem` exist in project root
- Check file permissions
- Regenerate certificates if needed

### Port Issues
- Check if port 3000 is available
- Modify `PORT` in `.env` file if needed

### OAuth Issues
- Verify Slack App configuration
- Check callback URL matches exactly
- Ensure HTTPS is properly configured 