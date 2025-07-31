# 配置说明 / Configuration Guide

## 频道类型配置 / Channel Type Configuration

### 当前默认配置 / Current Default Configuration

当前工具默认配置为：
- 仅显示私有频道（Private Channels）
- 仅显示授权用户创建的频道
- 排除已归档的频道

The current tool is configured by default to:
- Only display private channels
- Only show channels created by the authorized user
- Exclude archived channels

### 配置选项 / Configuration Options

#### 1. 频道类型选择 / Channel Type Selection

在 `server.js` 文件中找到以下代码段（约第 150-160 行）：

```javascript
const channelsResponse = await axios.get('https://slack.com/api/conversations.list', {
  headers: {
    'Authorization': `Bearer ${decryptedToken}`
  },
  params: {
    types: 'private_channel',  // 修改此参数
    exclude_archived: true
  }
});
```

**可选的 types 参数值 / Available types parameter values:**

| 配置值 | 说明 | Description |
|--------|------|-------------|
| `'private_channel'` | 仅私有频道 | Private channels only |
| `'public_channel'` | 仅公共频道 | Public channels only |
| `'private_channel,public_channel'` | 私有和公共频道 | Both private and public channels |

#### 2. 频道过滤条件 / Channel Filtering

在 `server.js` 文件中找到以下代码段（约第 170-175 行）：

```javascript
// 过滤出频道创建者和当前授权用户一致的频道
const filteredChannels = channelsResponse.data.channels.filter(channel => {
  return channel.creator === currentUserId;  // 修改此条件
});
```

**过滤选项 / Filtering Options:**

| 配置方式 | 说明 | Description |
|----------|------|-------------|
| `channel.creator === currentUserId` | 仅显示当前用户创建的频道 | Only show channels created by current user |
| `true` | 显示所有频道 | Show all channels |
| `channel.num_members > 1` | 仅显示多人频道 | Only show channels with multiple members |
| `!channel.is_archived` | 排除已归档频道 | Exclude archived channels |

#### 3. 高级过滤示例 / Advanced Filtering Examples

**示例 1：显示所有私有频道（不限创建者）**
```javascript
const filteredChannels = channelsResponse.data.channels.filter(channel => {
  return true; // 显示所有频道
});
```

**示例 2：显示所有公共频道**
```javascript
const channelsResponse = await axios.get('https://slack.com/api/conversations.list', {
  headers: {
    'Authorization': `Bearer ${decryptedToken}`
  },
  params: {
    types: 'public_channel',
    exclude_archived: true
  }
});
```

**示例 3：显示所有频道（私有+公共）**
```javascript
const channelsResponse = await axios.get('https://slack.com/api/conversations.list', {
  headers: {
    'Authorization': `Bearer ${decryptedToken}`
  },
  params: {
    types: 'private_channel,public_channel',
    exclude_archived: true
  }
});
```

**示例 4：显示成员数量大于 5 的频道**
```javascript
const filteredChannels = channelsResponse.data.channels.filter(channel => {
  return channel.num_members > 5;
});
```

### 权限要求 / Permission Requirements

根据不同的配置，需要确保 Slack App 有相应的权限：

| 频道类型 | 所需权限 | Required Scopes |
|----------|----------|-----------------|
| 私有频道 | `groups:read`, `groups:write` | `groups:read`, `groups:write` |
| 公共频道 | `channels:read`, `channels:write` | `channels:read`, `channels:write` |

### 注意事项 / Important Notes

1. **权限限制 / Permission Limitations**
   - 用户只能看到他们有权限访问的频道
   - 用户只能归档他们有权限管理的频道

2. **API 限制 / API Limitations**
   - Slack API 有速率限制
   - 大量频道可能需要分页处理

3. **安全考虑 / Security Considerations**
   - 确保只显示用户有权限操作的频道
   - 避免暴露敏感信息

### 配置后重启 / Restart After Configuration

修改配置后需要重启服务器：

```bash
# 开发模式
npm run dev

# 生产模式
npm start
``` 