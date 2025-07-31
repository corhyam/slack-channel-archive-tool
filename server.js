const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 环境检测
const NODE_ENV = process.env.NODE_ENV || 'development';
const USE_HTTPS = process.env.USE_HTTPS === 'true' || NODE_ENV === 'development';

// SSL 证书配置（仅本地开发时使用）
let httpsOptions = null;
if (USE_HTTPS && NODE_ENV === 'development') {
  try {
    httpsOptions = {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./cert.pem')
    };
  } catch (error) {
    console.warn('⚠️  未找到 SSL 证书文件，请运行以下命令生成：');
    console.warn('   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes');
    console.warn('   或者设置 USE_HTTPS=false 使用 HTTP 模式');
  }
}

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 加密密钥
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

// Token 存储
const tokenStore = new Map();

// 加密函数
function encryptToken(token) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

// 解密函数
function decryptToken(encryptedData) {
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(encryptedData.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 生成安全的 token ID
function generateSecureTokenId() {
  return crypto.randomBytes(32).toString('hex');
}

// 安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 主页
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// OAuth 授权页面
app.get('/auth', (req, res) => {
  const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
  const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI;
  
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}&user_scope=channels:read,groups:read,groups:write`;
  
  res.redirect(authUrl);
});

// OAuth 回调处理
app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: '授权码缺失' });
    }

    const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
    const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
    const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI;

    // 交换访问令牌
    const tokenResponse = await axios.post('https://slack.com/api/oauth.v2.access', 
      new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code: code,
        redirect_uri: SLACK_REDIRECT_URI
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!tokenResponse.data.ok) {
      console.error('Slack OAuth 错误:', tokenResponse.data);
      return res.status(400).json({ error: 'OAuth 授权失败', details: tokenResponse.data.error });
    }

    console.log('✅ OAuth 授权成功!');
    
    const { authed_user, team } = tokenResponse.data;
    
    // User Token 在 authed_user.access_token 中
    const access_token = authed_user?.access_token;
    
    if (!access_token) {
      console.error('❌ 没有获取到 access_token');
      return res.status(400).json({ error: 'OAuth 授权失败 - 没有获取到 token' });
    }
    
    console.log('User ID:', authed_user?.id);
    console.log('✅ 授权成功，正在处理...');
    
    // 加密 token 并生成安全 ID
    const encryptedToken = encryptToken(access_token);
    const secureTokenId = generateSecureTokenId();
    
    tokenStore.set(secureTokenId, {
      encryptedToken,
      team_id: team?.id,
      user_id: authed_user?.id, // 保存用户ID
      expires_at: Date.now() + 300000, // 5分钟过期
      created_at: Date.now()
    });

    console.log('✅ 安全 Token ID 已生成');
    res.redirect(`/?token_id=${secureTokenId}`);
  } catch (error) {
    console.error('OAuth 回调错误:', error);
    res.status(500).json({ error: '授权处理失败' });
  }
});

// 获取私有频道列表
app.get('/api/channels', async (req, res) => {
  try {
    const { token_id } = req.query;
    
    if (!token_id) {
      return res.status(400).json({ error: 'Token ID 缺失' });
    }

    const tokenData = tokenStore.get(token_id);
    if (!tokenData) {
      return res.status(401).json({ error: 'Token 无效或已过期' });
    }

    if (Date.now() > tokenData.expires_at) {
      tokenStore.delete(token_id);
      return res.status(401).json({ error: 'Token 已过期' });
    }

    const decryptedToken = decryptToken(tokenData.encryptedToken);
    
    console.log('🔍 正在获取频道列表...');
    const channelsResponse = await axios.get('https://slack.com/api/conversations.list', {
      headers: {
        'Authorization': `Bearer ${decryptedToken}`
      },
      params: {
        types: 'private_channel',
        exclude_archived: true
      }
    });

    if (!channelsResponse.data.ok) {
      console.error('获取频道列表失败:', channelsResponse.data.error);
      return res.status(400).json({ error: '获取频道列表失败', details: channelsResponse.data.error });
    }

    // 过滤出频道创建者和当前授权用户一致的频道
    const currentUserId = tokenData.user_id;
    const filteredChannels = channelsResponse.data.channels.filter(channel => {
      return channel.creator === currentUserId;
    });

    const channels = filteredChannels.map(channel => ({
      id: channel.id,
      name: channel.name,
      num_members: channel.num_members,
      is_archived: channel.is_archived,
      creator: channel.creator,
      created: channel.created
    }));

    console.log('📊 总频道数量:', channelsResponse.data.channels.length);
    console.log('📋 当前用户创建的频道数量:', filteredChannels.length);
    res.json({ channels });
  } catch (error) {
    console.error('获取频道列表错误:', error);
    res.status(500).json({ error: '获取频道列表失败' });
  }
});

// 归档选中的频道
app.post('/api/archive', async (req, res) => {
  try {
    const { token_id, channel_ids } = req.body;
    
    if (!token_id || !channel_ids || !Array.isArray(channel_ids)) {
      return res.status(400).json({ error: '参数无效' });
    }

    const tokenData = tokenStore.get(token_id);
    if (!tokenData) {
      return res.status(401).json({ error: 'Token 无效或已过期' });
    }

    if (Date.now() > tokenData.expires_at) {
      tokenStore.delete(token_id);
      return res.status(401).json({ error: 'Token 已过期' });
    }

    const decryptedToken = decryptToken(tokenData.encryptedToken);
    const results = [];

    for (const channelId of channel_ids) {
      try {
        const archiveResponse = await axios.post('https://slack.com/api/conversations.archive', 
          { channel: channelId },
          {
            headers: {
              'Authorization': `Bearer ${decryptedToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        results.push({
          channel_id: channelId,
          success: archiveResponse.data.ok,
          error: archiveResponse.data.error || null
        });
      } catch (error) {
        results.push({
          channel_id: channelId,
          success: false,
          error: 'Archive operation failed for this channel'
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('归档频道错误:', error);
    res.status(500).json({ error: '归档频道失败' });
  }
});

// 调试端点 - 仅在开发环境可用
if (NODE_ENV === 'development') {
  app.get('/debug/token/:tokenId', (req, res) => {
    const { tokenId } = req.params;
    const tokenData = tokenStore.get(tokenId);
    
    if (!tokenData) {
      return res.status(404).json({ error: 'Token 不存在' });
    }
    
    // 只返回基本信息，不暴露敏感数据
    res.json({
      team_id: tokenData.team_id,
      user_id: tokenData.user_id,
      created_at: tokenData.created_at,
      expires_at: tokenData.expires_at,
      is_valid: Date.now() < tokenData.expires_at
    });
  });
}

// 定期清理过期的 token
setInterval(() => {
  const now = Date.now();
  for (const [tokenId, tokenData] of tokenStore.entries()) {
    if (now > tokenData.expires_at) {
      tokenStore.delete(tokenId);
    }
  }
}, 300000); // 每5分钟清理一次

// 根据环境启动服务器
if (USE_HTTPS && httpsOptions) {
  // 本地开发 HTTPS 模式
  const httpsServer = https.createServer(httpsOptions, app);
  
  httpsServer.listen(PORT, () => {
    console.log(`🚀 Slack 频道归档工具已启动`);
    console.log(`🔒 HTTPS 服务器运行在 https://localhost:${PORT}`);
    console.log('📋 请确保已配置 .env 文件中的 Slack App 凭据');
    console.log('⚠️  注意：浏览器可能会显示安全警告，请点击"高级"→"继续访问"');
    console.log('🔗 访问 https://localhost:3000 开始使用');
  });

  // 处理进程退出
  process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    httpsServer.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  });
} else {
  // 生产环境 HTTP 模式（由 Cloudflare 等代理处理 HTTPS）
  app.listen(PORT, () => {
    console.log(`🚀 Slack 频道归档工具已启动`);
    console.log(`🌐 HTTP 服务器运行在 http://localhost:${PORT}`);
    console.log('📋 请确保已配置 .env 文件中的 Slack App 凭据');
    console.log('🔗 通过 Cloudflare 代理访问您的域名');
    console.log(`💡 本地访问: http://localhost:${PORT}`);
  });

  // 处理进程退出
  process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    process.exit(0);
  });
} 