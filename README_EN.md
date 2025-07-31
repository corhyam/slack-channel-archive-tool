# Slack Private Channel Archive Tool

<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](README_EN.md)
[![中文](https://img.shields.io/badge/Language-中文-green?style=for-the-badge)](README.md)

</div>

Slack Private Channel Archive Tool helps users securely archive Slack private channels. This tool provides OAuth authorization, channel list management, batch selection, and archive operations. 

## Default Configuration

**The current default version archives Private Channels and only filters channels created by the authorized user. For specific needs to operate on private channels or public channels, you can configure according to your requirements.**

> 💡 **Configuration Tip**: To modify channel types or filtering conditions, please refer to the [Configuration Guide](CONFIGURATION.md) for custom settings.

## Features

- 🔐 **Secure OAuth Authorization** - Uses Slack OAuth 2.0 flow, no manual token input required
- 📋 **Channel List Management** - Displays all private channels with member count, creation time, and other information (configurable for public channels, but public channels can be managed via bot token in daily operations)
- ✅ **Batch Selection** - Supports select all/deselect all for convenient batch operations
- 🗄️ **One-Click Archive** - Securely archive selected channels
- 📊 **Operation Result Feedback** - Detailed success/failure result display
- 🎨 **Modern UI** - Responsive design, mobile-friendly
- ⚡ **Real-time Status** - Shows channel status (active/archived)

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript + CSS3
- **API**: Slack Web API
- **Styling**: Modern CSS + Font Awesome icons

## Environment Requirements

- **Node.js**: >= 18.17.0
- **npm**: >= 8.0.0

## Installation and Configuration

### 1. Clone the Repository

```bash
git clone <repository-url>
cd slack-channel-archive-tool
```

### 2. Install Dependencies

**Ensure you're using a supported Node.js version**:

```bash
# Check Node.js version
node --version  # Should display v18.17.0 or higher

# Install dependencies
npm install
```

### 3. Configure Slack App

1. Visit [Slack API website](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Enter app name and select workspace
4. Configure in "OAuth & Permissions" page:
   - **Redirect URLs**: `https://localhost:3000/auth/callback` ⚠️ **Must use HTTPS**
   - **Scopes**: Add the following permissions
     - `channels:read` - Read public channel information
     - `groups:read` - Read private channel information
     - `channels:write` - Manage public channels
     - `groups:write` - Manage private channels

**Important**: Slack OAuth 2.0 requires callback URLs to use HTTPS protocol.

### 4. Configure Environment Variables

#### Local Development Environment
Copy `env.local.example` to `.env`:

```bash
cp env.local.example .env
```

#### Production Environment
Copy `env.example` to `.env`:

```bash
cp env.example .env
```

Edit the `.env` file with your Slack App configuration:

**Local Development Configuration**:
```env
# Slack App Configuration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=https://localhost:3000/auth/callback

# Server Configuration
PORT=3000
NODE_ENV=development
USE_HTTPS=true
```

**Production Environment Configuration**:
```env
# Slack App Configuration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=https://your-domain.com/auth/callback

# Server Configuration
PORT=3000
NODE_ENV=production
USE_HTTPS=false
```

**Note**: 
- For local development, use `https://localhost:3000/auth/callback` for `SLACK_REDIRECT_URI`
- For production, use your actual domain for `SLACK_REDIRECT_URI`
- Set `USE_HTTPS=true` for local development, `false` for production

### 5. Configure SSL Certificate (Local Development Only)

**Local Development Environment**: Since Slack OAuth 2.0 requires HTTPS callbacks, you need to generate a local SSL certificate:

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

**Production Environment**: If using Cloudflare or other proxy services, no local certificate is needed, just set `USE_HTTPS=false`.

**Note**: 
- Generated `key.pem` and `cert.pem` files are ignored by `.gitignore` and won't be uploaded to version control
- This is a necessary step for local development, production environments handle HTTPS through proxy services

### 6. Start the Application

```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

Visit `https://localhost:3000` to start using the application.

**Note**: The browser may display a security warning due to the self-signed certificate. Click "Advanced" → "Continue to localhost" to proceed.

## Usage Instructions

### 1. Authorize Access
- Click the "Authorize Slack Access" button
- Confirm permissions on the Slack authorization page
- Automatically return to the application after successful authorization

### 2. Select Channels
- View all private channel lists
- Use checkboxes to select channels to archive
- Support select all/deselect all operations
- Can refresh the list to get the latest data

### 3. Confirm Archive
- Review the selected channel list
- Confirm the operation (irreversible)
- Click "Confirm Archive" to execute the operation

### 4. View Results
- Display archive success/failure statistics
- Detailed operation results for each channel
- Can start a new archive session

## API Endpoints

### Authentication
- `GET /auth/slack` - Start OAuth authorization flow
- `GET /auth/callback` - OAuth callback handling

### Channel Management
- `GET /api/channels?token_id=<id>` - Get private channel list
- `POST /api/archive` - Archive selected channels

## Security Considerations

- Uses OAuth 2.0 flow, no need to store user passwords
- Tokens are temporarily stored and automatically expire after 1 hour
- Regular cleanup of expired tokens
- All API calls are authenticated

## Development Guide

### Project Structure
```
slack-channel-archive-tool/
├── server.js              # Express HTTPS server
├── package.json           # Project configuration
├── package-lock.json      # Dependency lock file
├── .gitignore             # Git ignore file
├── env.example            # Environment variables example
├── env.local.example      # Local environment variables example
├── README.md              # Project documentation
├── README_EN.md           # English documentation
├── QUICKSTART.md          # Quick start guide
├── QUICKSTART_EN.md       # English quick start guide
├── DEPLOYMENT.md          # Deployment guide
├── LICENSE                # License file
└── public/                # Static files
    ├── index.html         # Main page
    ├── styles.css         # Style file
    └── script.js          # Frontend logic
```

### Important File Notes

- **`.env`**: Environment variables file (not committed to version control)
- **`key.pem` & `cert.pem`**: SSL certificate files (not committed to version control)
- **`node_modules/`**: Dependency package directory (not committed to version control)

### Custom Configuration

#### Modify Port
Edit the `PORT` variable in the `.env` file.

#### Modify OAuth Redirect URL
1. Update `SLACK_REDIRECT_URI` in the `.env` file
2. Update the corresponding redirect URL in Slack App settings

#### Custom Styling
Edit the `public/styles.css` file to customize interface styles.

#### Channel Type Configuration
The current default configuration only displays private channels and only shows channels created by the authorized user. To adjust this, you can modify the relevant configuration in `server.js`:

**Channel List Retrieval Configuration** (around lines 150-160):
```javascript
// Get private channel list
const channelsResponse = await axios.get('https://slack.com/api/conversations.list', {
  headers: {
    'Authorization': `Bearer ${decryptedToken}`
  },
  params: {
    types: 'private_channel',  // Can be changed to 'public_channel' or 'private_channel,public_channel'
    exclude_archived: true
  }
});

// Filter channels (around lines 170-175)
const filteredChannels = channelsResponse.data.channels.filter(channel => {
  return channel.creator === currentUserId;  // Remove this condition to show all channels
});
```

**Configuration Options**:
- `types: 'private_channel'` - Private channels only
- `types: 'public_channel'` - Public channels only
- `types: 'private_channel,public_channel'` - Both private and public channels
- `channel.creator === currentUserId` - Only show channels created by current user
- Remove filter condition - Show all channels

## Troubleshooting

### Common Issues

1. **Node.js Version Issues**
   - Ensure you're using Node.js 18.17.0 or higher
   - If you encounter npm syntax errors, please upgrade Node.js version
   - Use `node --version` to check current version

2. **OAuth Authorization Failure**
   - Check if Slack App configuration is correct
   - Confirm redirect URL matches
   - Verify Client ID and Secret

3. **Unable to Get Channel List**
   - Confirm the App has correct permission scopes
   - Check if user has permission to access private channels

4. **Archive Operation Failure**
   - Confirm user has permission to archive channels
   - Check if channels are already archived

### Debug Mode

Add debug information when starting:

```bash
DEBUG=* npm start
```

## License

MIT License 