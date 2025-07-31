# Slack Archive Tool 部署指南

## 生产环境部署

### 1. 环境要求
- Node.js 16+ 
- npm 或 yarn

### 2. 安装依赖
```bash
npm install
```

### 3. 环境变量配置
创建 `.env` 文件并配置以下变量：

```env
# Slack App 配置
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=https://your-domain.com/auth/callback

# 加密密钥（可选，建议设置）
ENCRYPTION_KEY=your_secure_encryption_key

# 端口配置（可选，默认3000）
PORT=3000
```

### 4. 启动服务

#### 开发环境
```bash
npm run dev
```

#### 生产环境
```bash
npm start
```

### 5. 部署选项

#### 选项 1: 直接部署
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name "slack-archive-tool"

# 查看状态
pm2 status

# 查看日志
pm2 logs slack-archive-tool
```

#### 选项 2: Docker 部署
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

#### 选项 3: 云平台部署
- **Heroku**: 直接推送代码，自动检测 Node.js
- **Vercel**: 支持 Node.js 函数
- **Railway**: 支持 Node.js 应用
- **DigitalOcean App Platform**: 支持 Node.js

### 6. 反向代理配置（推荐）

使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. SSL 配置

#### 使用 Let's Encrypt
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 8. 安全建议

1. **环境变量**: 确保所有敏感信息都通过环境变量配置
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **防火墙**: 只开放必要端口
4. **日志**: 配置适当的日志记录
5. **监控**: 设置应用监控和告警

### 9. 故障排除

#### 常见问题

1. **端口被占用**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **权限问题**
   ```bash
   sudo chown -R $USER:$USER /path/to/app
   ```

3. **内存不足**
   ```bash
   # 增加 Node.js 内存限制
   node --max-old-space-size=2048 server.js
   ```

### 10. 性能优化

1. **启用压缩**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **缓存静态文件**
   ```javascript
   app.use(express.static('public', {
     maxAge: '1d',
     etag: true
   }));
   ```

3. **数据库存储**（可选）
   - 使用 Redis 存储临时 token
   - 使用 PostgreSQL 存储用户会话

### 11. 监控和日志

```javascript
// 添加请求日志
app.use(morgan('combined'));

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
```

## 本地开发

### 使用 HTTPS（仅开发环境）
```bash
npm run dev-https
```

### 使用 HTTP（推荐）
```bash
npm run dev
```

访问: http://localhost:3000 