// 全局变量
let currentTokenId = null;
let channels = [];
let selectedChannels = new Set();

// DOM 元素
const authSection = document.getElementById('auth-section');
const channelsSection = document.getElementById('channels-section');
const archiveSection = document.getElementById('archive-section');
const resultsSection = document.getElementById('results-section');

const authBtn = document.getElementById('auth-btn');
const refreshBtn = document.getElementById('refresh-btn');
const backBtn = document.getElementById('back-btn');
const archiveBtn = document.getElementById('archive-btn');
const newSessionBtn = document.getElementById('new-session-btn');
const confirmSelectionBtn = document.getElementById('confirm-selection-btn');

const channelsList = document.getElementById('channels-list');
const loadingChannels = document.getElementById('loading-channels');
const summary = document.getElementById('summary');
const selectedCount = document.getElementById('selected-count');
const selectedChannelsSummary = document.getElementById('selected-channels-summary');
const resultsContent = document.getElementById('results-content');

// 确认弹框相关元素
const confirmArchiveModal = document.getElementById('confirm-archive-modal');
const confirmMessage = document.getElementById('confirm-message');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查 URL 参数中是否有 token_id
    const urlParams = new URLSearchParams(window.location.search);
    const tokenId = urlParams.get('token_id');
    
    if (tokenId) {
        currentTokenId = tokenId;
        showChannelsSection();
        loadChannels();
    }
    
    // 绑定事件监听器
    bindEventListeners();
});

// 绑定事件监听器
function bindEventListeners() {
    authBtn.addEventListener('click', startAuth);
    refreshBtn.addEventListener('click', loadChannels);
    backBtn.addEventListener('click', showChannelsSection);
    archiveBtn.addEventListener('click', archiveSelectedChannels);
    newSessionBtn.addEventListener('click', startNewSession);
    confirmSelectionBtn.addEventListener('click', showArchiveSection);
}

// 开始授权流程
function startAuth() {
    window.location.href = '/auth';
}

// 显示频道列表部分
function showChannelsSection() {
    authSection.style.display = 'none';
    channelsSection.style.display = 'block';
    archiveSection.style.display = 'none';
    resultsSection.style.display = 'none';
}

// 显示归档确认部分
function showArchiveSection() {
    channelsSection.style.display = 'none';
    archiveSection.style.display = 'block';
}

// 显示结果部分
function showResultsSection() {
    archiveSection.style.display = 'none';
    resultsSection.style.display = 'block';
}

// 加载频道列表
async function loadChannels() {
    if (!currentTokenId) {
        showError('Token ID missing');
        return;
    }

    showLoading(true);
    
    try {
        const response = await fetch(`/api/channels?token_id=${currentTokenId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get channel list');
        }
        
        channels = data.channels;
        renderChannelsList();
        updateSummary();
        
    } catch (error) {
        console.error('Failed to load channel list:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// 显示/隐藏加载状态
function showLoading(show) {
    loadingChannels.style.display = show ? 'flex' : 'none';
    channelsList.style.display = show ? 'none' : 'grid';
}

// 渲染频道列表
function renderChannelsList() {
    if (channels.length === 0) {
            channelsList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6b7280;">
            <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
            <p>No private channels found</p>
        </div>
    `;
        return;
    }

    channelsList.innerHTML = channels.map(channel => `
        <div class="channel-item ${selectedChannels.has(channel.id) ? 'selected' : ''}" 
             onclick="toggleChannelSelection('${channel.id}')">
            <input type="checkbox" 
                   ${selectedChannels.has(channel.id) ? 'checked' : ''}
                   onclick="toggleChannelSelection('${channel.id}'); event.stopPropagation()">
            <div class="channel-info">
                <div class="channel-name">#${channel.name}</div>
                <div class="channel-meta">
                    <div class="channel-status ${channel.is_archived ? 'archived' : 'active'}">
                        <i class="fas ${channel.is_archived ? 'fa-archive' : 'fa-circle'}"></i>
                        ${channel.is_archived ? 'Archived' : 'Active'}
                    </div>
                    <div>
                        <i class="fas fa-users"></i>
                        ${channel.num_members} members
                    </div>
                    <div>
                        <i class="fas fa-calendar"></i>
                        Created: ${formatDate(channel.created)}
                    </div>
                    <div>
                        <i class="fas fa-user"></i>
                        Creator: ${channel.creator || 'Unknown'}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// 切换频道选择状态
function toggleChannelSelection(channelId) {
    if (selectedChannels.has(channelId)) {
        selectedChannels.delete(channelId);
    } else {
        selectedChannels.add(channelId);
    }
    
    renderChannelsList();
    updateSummary();
}



// 更新摘要信息
function updateSummary() {
    // 始终更新计数，无论是否有选中
    selectedCount.textContent = selectedChannels.size;
    
    // 控制确定按钮的显示
    if (selectedChannels.size > 0) {
        confirmSelectionBtn.style.display = 'inline-block';
        
        // 更新归档确认部分的选中频道摘要
        const selectedChannelsList = Array.from(selectedChannels).map(id => {
            const channel = channels.find(c => c.id === id);
            return channel ? `#${channel.name}` : id;
        });
        
        selectedChannelsSummary.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h4>Channels to be archived:</h4>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 10px;">
                    ${selectedChannelsList.map(name => `<span style="display: inline-block; background: #e5e7eb; padding: 4px 8px; border-radius: 4px; margin: 2px;">${name}</span>`).join('')}
                </div>
            </div>
        `;
    } else {
        confirmSelectionBtn.style.display = 'none';
    }
}

// 归档选中的频道
async function archiveSelectedChannels() {
    if (selectedChannels.size === 0) {
        showError('Please select channels to archive first');
        return;
    }

    // 显示确认弹框
    showConfirmModal();
}

// 显示确认弹框
function showConfirmModal() {
    confirmMessage.textContent = `Are you sure you want to archive ${selectedChannels.size} selected channels? This operation is irreversible!`;
    confirmArchiveModal.style.display = 'flex';
}

// 关闭确认弹框
function closeConfirmModal() {
    confirmArchiveModal.style.display = 'none';
}

// 确认归档操作
async function confirmArchive() {
    closeConfirmModal();
    
    archiveBtn.disabled = true;
            archiveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Archiving...';
    
    try {
        const response = await fetch('/api/archive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token_id: currentTokenId,
                channel_ids: Array.from(selectedChannels)
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '归档操作失败');
        }
        
        showArchiveResults(data.results);
        
    } catch (error) {
        console.error('归档操作错误:', error);
        showError(error.message);
    } finally {
        archiveBtn.disabled = false;
        archiveBtn.innerHTML = '<i class="fas fa-archive"></i> Confirm Archive Selected Channels';
    }
}

// 显示归档结果
function showArchiveResults(results) {
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;
    
    let resultsHtml = `
        <div style="margin-bottom: 20px;">
            <h4>Archive Results Summary:</h4>
            <div style="display: flex; gap: 20px; margin-top: 10px;">
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; flex: 1;">
                    <div style="color: #059669; font-weight: 600; font-size: 1.2rem;">${successCount}</div>
                    <div>Successfully Archived</div>
                </div>
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; flex: 1;">
                    <div style="color: #dc2626; font-weight: 600; font-size: 1.2rem;">${errorCount}</div>
                    <div>Archive Failed</div>
                </div>
            </div>
        </div>
    `;
    
    if (results.length > 0) {
        resultsHtml += '<h4>Detailed Results:</h4>';
        results.forEach(result => {
            const channel = channels.find(c => c.id === result.channel_id);
            const channelName = channel ? `#${channel.name}` : result.channel_id;
            
            resultsHtml += `
                <div class="result-item ${result.success ? 'success' : 'error'}">
                    <i class="fas ${result.success ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                    <div>
                        <div style="font-weight: 600;">${channelName}</div>
                        ${result.error ? `<div style="font-size: 0.9rem; color: #6b7280;">${result.error}</div>` : ''}
                    </div>
                </div>
            `;
        });
    }
    
    resultsContent.innerHTML = resultsHtml;
    showResultsSection();
}

// 开始新的会话
function startNewSession() {
    // 清除当前状态
    currentTokenId = null;
    channels = [];
    selectedChannels.clear();
    
    // 重置页面状态
    authSection.style.display = 'block';
    channelsSection.style.display = 'none';
    archiveSection.style.display = 'none';
    resultsSection.style.display = 'none';
    
    // 清除 URL 参数
    window.history.replaceState({}, document.title, window.location.pathname);
}

// 显示错误信息
function showError(message) {
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
}

// 关闭错误模态框
function closeErrorModal() {
    document.getElementById('error-modal').style.display = 'none';
}

// 格式化日期
function formatDate(timestamp) {
    console.log('formatDate called with timestamp:', timestamp, 'type:', typeof timestamp);
    
    if (!timestamp) {
        console.log('timestamp is falsy, returning Unknown');
        return 'Unknown';
    }
    
    try {
        // 检查时间戳是否为数字
        const numTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
        console.log('parsed timestamp:', numTimestamp);
        
        // 如果时间戳是秒级的，转换为毫秒
        const date = new Date(numTimestamp * 1000);
        console.log('created date object:', date);
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
            console.log('date is invalid');
            return 'Invalid Date';
        }
        
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        console.log('formatted date:', formattedDate);
        return formattedDate;
    } catch (error) {
        console.error('Date formatting error:', error, 'timestamp:', timestamp);
        return 'Date Error';
    }
}

// 点击模态框背景关闭
document.getElementById('error-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeErrorModal();
    }
}); 