# 快速启动指南

## 环境要求

- **Node.js**: >= 18.17.0
- **npm**: >= 8.0.0

## 环境说明

本工具支持两种部署模式：
- **本地开发**：使用自签名 HTTPS 证书
- **生产环境**：使用 Cloudflare 等代理服务处理 HTTPS

## 本地开发

### 1. 检查环境
```bash
# 检查 Node.js 版本
node --version  # 应该显示 v18.17.0 或更高版本

# 检查 npm 版本
npm --version
```

### 2. 安装依赖
```bash
npm install
```

### 2. 生成 SSL 证书
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### 3. 配置环境变量
```bash
cp env.local.example .env
# 编辑 .env 文件，填入您的 Slack App 配置
```

### 4. 启动服务器
```bash
npm run dev
```

### 5. 访问应用
打开浏览器访问：`https://localhost:3000`

## 生产环境部署

### 1. 检查环境
```bash
# 检查 Node.js 版本
node --version  # 应该显示 v18.17.0 或更高版本
```

### 2. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp env.example .env
# 编辑 .env 文件，设置 USE_HTTPS=false
```

### 3. 启动服务器
```bash
npm start
```

### 4. 配置代理
通过 Cloudflare 等代理服务访问您的域名

## 重要提醒

- 🔒 Slack OAuth 2.0 强制要求 HTTPS 回调
- 🌐 本地开发使用自签名证书，生产环境由代理处理
- 📋 确保 Slack App 的回调 URL 配置正确
- ⚙️ 通过 `USE_HTTPS` 环境变量控制 HTTPS 模式

## 文件说明

- `server.js` - 服务器文件（支持 HTTP/HTTPS 模式）
- `key.pem` & `cert.pem` - SSL 证书文件（仅本地开发需要）
- `.env` - 环境变量文件（不提交到 Git）
- `node_modules/` - 依赖包目录（不提交到 Git） 