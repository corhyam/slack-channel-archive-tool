# Slack 私有频道归档工具

一个现代化的 Web 应用，帮助用户安全地归档 Slack 私有频道。该工具提供了直观的用户界面，支持 OAuth 授权、频道列表查看、批量选择和归档操作。

## 功能特性

- 🔐 **安全的 OAuth 授权** - 使用 Slack OAuth 2.0 流程，无需手动输入 token
- 📋 **频道列表管理** - 显示所有私有频道，包含成员数量、创建时间等信息、（可配置 public channel，但日常 public channel 可通过 bot token 进行管理）
- ✅ **批量选择** - 支持全选/取消全选，方便批量操作
- 🗄️ **一键归档** - 安全地归档选中的频道
- 📊 **操作结果反馈** - 详细的成功/失败结果展示
- 🎨 **现代化 UI** - 响应式设计，支持移动端访问
- ⚡ **实时状态** - 显示频道状态（活跃/已归档）

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 JavaScript + CSS3
- **API**: Slack Web API
- **样式**: 现代化 CSS + Font Awesome 图标

## 安装和配置

### 1. 克隆项目

```bash
git clone <repository-url>
cd slack-archive-tool
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 Slack App

1. 访问 [Slack API 网站](https://api.slack.com/apps)
2. 点击 "Create New App" → "From scratch"
3. 输入应用名称和选择工作区
4. 在 "OAuth & Permissions" 页面配置：
   - **Redirect URLs**: `http://localhost:3000/auth/callback`
   - **Scopes**: 添加以下权限
     - `channels:read` - 读取公开频道信息
     - `groups:read` - 读取私有频道信息
     - `channels:write` - 管理公开频道
     - `groups:write` - 管理私有频道

### 4. 配置环境变量

复制 `env.example` 文件为 `.env`：

```bash
cp env.example .env
```

编辑 `.env` 文件，填入您的 Slack App 配置：

```env
# Slack App 配置
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=https://localhost:3000/auth/callback

# 服务器配置
PORT=3000

# 加密密钥（可选，不设置会自动生成）
# ENCRYPTION_KEY=your_32_byte_encryption_key
```

### 5. 配置 SSL 证书（本地开发）

由于 Slack OAuth 要求 HTTPS 回调，您需要生成本地 SSL 证书：

```bash
# 生成自签名证书
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

**注意**: 生成的 `key.pem` 和 `cert.pem` 文件已被 `.gitignore` 忽略，不会上传到版本控制。

### 6. 启动应用

```bash
# 启动 HTTPS 服务器（推荐）
node server-https.js

# 或启动 HTTP 服务器（仅用于测试）
node server.js
```

访问 `https://localhost:3000` 开始使用。

**注意**: 浏览器可能会显示安全警告，因为使用的是自签名证书。点击"高级"→"继续访问"即可。

## 使用说明

### 1. 授权访问
- 点击 "授权 Slack 访问" 按钮
- 在 Slack 授权页面确认权限
- 授权成功后自动返回应用

### 2. 选择频道
- 查看所有私有频道列表
- 使用复选框选择要归档的频道
- 支持全选/取消全选操作
- 可以刷新列表获取最新数据

### 3. 确认归档
- 查看选中的频道列表
- 确认操作（不可逆）
- 点击 "确认归档" 执行操作

### 4. 查看结果
- 显示归档成功/失败统计
- 详细的每个频道操作结果
- 可以开始新的归档会话

## API 端点

### 认证相关
- `GET /auth/slack` - 启动 OAuth 授权流程
- `GET /auth/callback` - OAuth 回调处理

### 频道管理
- `GET /api/channels?token_id=<id>` - 获取私有频道列表
- `POST /api/archive` - 归档选中的频道

## 安全考虑

- 使用 OAuth 2.0 流程，无需存储用户密码
- Token 临时存储，1小时后自动过期
- 定期清理过期的 token
- 所有 API 调用都经过验证

## 开发说明

### 项目结构
```
slack-archive-tool/
├── server.js              # HTTP 服务器（开发用）
├── server-https.js        # HTTPS 服务器（生产用）
├── package.json           # 项目配置
├── package-lock.json      # 依赖锁定文件
├── .gitignore            # Git 忽略文件
├── env.example           # 环境变量示例
├── env.local.example     # 本地环境变量示例
├── README.md             # 项目说明
├── DEPLOYMENT.md         # 部署说明
├── LICENSE               # 许可证文件
└── public/               # 静态文件
    ├── index.html        # 主页面
    ├── styles.css        # 样式文件
    └── script.js         # 前端逻辑
```

### 重要文件说明

- **`.env`**: 环境变量文件（不提交到版本控制）
- **`key.pem` & `cert.pem`**: SSL 证书文件（不提交到版本控制）
- **`node_modules/`**: 依赖包目录（不提交到版本控制）

### 自定义配置

#### 修改端口
编辑 `.env` 文件中的 `PORT` 变量。

#### 修改 OAuth 重定向 URL
1. 更新 `.env` 文件中的 `SLACK_REDIRECT_URI`
2. 在 Slack App 设置中更新对应的重定向 URL

#### 自定义样式
编辑 `public/styles.css` 文件来自定义界面样式。

## 故障排除

### 常见问题

1. **OAuth 授权失败**
   - 检查 Slack App 配置是否正确
   - 确认重定向 URL 匹配
   - 验证 Client ID 和 Secret

2. **无法获取频道列表**
   - 确认 App 有正确的权限范围
   - 检查用户是否有访问私有频道的权限

3. **归档操作失败**
   - 确认用户有归档频道的权限
   - 检查频道是否已经被归档

### 调试模式

启动时添加调试信息：

```bash
DEBUG=* npm start
```

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个工具。

## 许可证

MIT License

## 免责声明

此工具仅用于合法的频道管理目的。请确保您有权限对相关频道执行归档操作。使用本工具产生的任何后果由用户自行承担。 