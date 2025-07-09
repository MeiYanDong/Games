// 游戏页面专用JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initGamePage();
    setupGameIframe();
    initGameControls();
    setupKeyboardShortcuts();
});

// 初始化游戏页面
function initGamePage() {
    // 隐藏加载动画
    setTimeout(() => {
        hideLoadingOverlay();
    }, 2000);
    
    // 检测游戏页面类型
    const pageTitle = document.title;
    if (pageTitle.includes('萝卜')) {
        window.currentGame = 'carrot-defense';
    } else if (pageTitle.includes('水果')) {
        window.currentGame = 'fruit-defense';
    }
    
    // 添加页面标识
    document.body.setAttribute('data-game', window.currentGame);
}

// 设置游戏iframe
function setupGameIframe() {
    const iframe = document.getElementById('gameFrame');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    if (iframe) {
        // iframe加载完成事件
        iframe.addEventListener('load', () => {
            hideLoadingOverlay();
            trackGameLoad();
        });
        
        // iframe错误处理
        iframe.addEventListener('error', () => {
            showGameError();
        });
        
        // 设置iframe沙盒权限
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-pointer-lock');
    }
}

// 隐藏加载覆盖层
function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 300);
    }
}

// 显示游戏错误
function showGameError() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.innerHTML = `
            <div class="loading-spinner">
                <div class="error-icon">⚠️</div>
                <p>游戏加载失败</p>
                <button class="retry-btn" onclick="reloadGame()">重试</button>
            </div>
        `;
    }
}

// 初始化游戏控制功能
function initGameControls() {
    // 开始游戏功能
    window.startGame = function() {
        const gameSection = document.querySelector('.game-section');
        if (gameSection) {
            gameSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
        trackGameStart();
    };
    
    // 重新加载游戏
    window.reloadGame = function() {
        const iframe = document.getElementById('gameFrame');
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        if (iframe) {
            // 显示加载动画
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
                loadingOverlay.style.opacity = '1';
                loadingOverlay.innerHTML = `
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>重新加载游戏...</p>
                    </div>
                `;
            }
            
            // 重新加载iframe
            iframe.src = iframe.src;
            
            // 显示通知
            showNotification('游戏重新加载中...', 'info');
            trackGameReload();
        }
    };
    
    // 全屏功能
    window.toggleFullscreen = function() {
        const gameContainer = document.querySelector('.game-iframe-container');
        
        if (!gameContainer) return;
        
        if (!document.fullscreenElement) {
            // 进入全屏
            gameContainer.requestFullscreen().then(() => {
                gameContainer.classList.add('fullscreen-mode');
                showNotification('按ESC退出全屏', 'info');
                trackFullscreenEnter();
            }).catch(err => {
                console.error('无法进入全屏模式:', err);
                showNotification('全屏模式不可用', 'warning');
            });
        } else {
            // 退出全屏
            document.exitFullscreen().then(() => {
                gameContainer.classList.remove('fullscreen-mode');
                trackFullscreenExit();
            });
        }
    };
    
    // 监听全屏变化
    document.addEventListener('fullscreenchange', () => {
        const gameContainer = document.querySelector('.game-iframe-container');
        if (!document.fullscreenElement && gameContainer) {
            gameContainer.classList.remove('fullscreen-mode');
        }
    });
    
    // 显示帮助
    window.showHelp = function() {
        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            helpModal.classList.add('active');
            helpModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            trackHelpOpen();
        }
    };
    
    // 关闭帮助
    window.closeHelp = function() {
        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            helpModal.classList.remove('active');
            helpModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
    
    // 分享游戏
    window.shareGame = function() {
        const gameTitle = document.querySelector('.game-title').textContent.trim();
        const gameUrl = window.location.href;
        
        if (navigator.share) {
            // 使用原生分享API
            navigator.share({
                title: gameTitle,
                text: `来玩这个有趣的塔防游戏：${gameTitle}`,
                url: gameUrl
            }).then(() => {
                trackGameShare('native');
            }).catch(err => {
                console.log('分享取消:', err);
            });
        } else {
            // 复制链接到剪贴板
            navigator.clipboard.writeText(gameUrl).then(() => {
                showNotification('游戏链接已复制到剪贴板！', 'success');
                trackGameShare('clipboard');
            }).catch(err => {
                // 降级方案
                fallbackCopyTextToClipboard(gameUrl);
            });
        }
    };
}

// 降级复制方案
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('游戏链接已复制！', 'success');
            trackGameShare('fallback');
        } else {
            showNotification('复制失败，请手动复制链接', 'warning');
        }
    } catch (err) {
        showNotification('您的浏览器不支持自动复制', 'warning');
    }
    
    document.body.removeChild(textArea);
}

// 设置键盘快捷键
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // ESC - 退出全屏或关闭帮助
        if (e.key === 'Escape') {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                closeHelp();
            }
        }
        
        // F11 - 全屏切换
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
        
        // Ctrl/Cmd + R - 重新加载游戏
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            reloadGame();
        }
        
        // H - 显示帮助
        if (e.key === 'h' || e.key === 'H') {
            if (!document.activeElement || document.activeElement.tagName !== 'INPUT') {
                showHelp();
            }
        }
    });
}

// 点击帮助模态框外部关闭
document.addEventListener('click', (e) => {
    const helpModal = document.getElementById('helpModal');
    if (helpModal && e.target === helpModal) {
        closeHelp();
    }
});

// 性能监控和统计
function trackGameLoad() {
    // 记录游戏加载时间
    const loadTime = performance.now();
    console.log(`游戏加载时间: ${loadTime.toFixed(2)}ms`);
    
    // 可以发送到分析服务
    if (window.gtag) {
        gtag('event', 'game_load', {
            game_name: window.currentGame,
            load_time: Math.round(loadTime)
        });
    }
}

function trackGameStart() {
    console.log('游戏开始');
    if (window.gtag) {
        gtag('event', 'game_start', {
            game_name: window.currentGame
        });
    }
}

function trackGameReload() {
    console.log('游戏重新加载');
    if (window.gtag) {
        gtag('event', 'game_reload', {
            game_name: window.currentGame
        });
    }
}

function trackFullscreenEnter() {
    console.log('进入全屏模式');
    if (window.gtag) {
        gtag('event', 'fullscreen_enter', {
            game_name: window.currentGame
        });
    }
}

function trackFullscreenExit() {
    console.log('退出全屏模式');
    if (window.gtag) {
        gtag('event', 'fullscreen_exit', {
            game_name: window.currentGame
        });
    }
}

function trackHelpOpen() {
    console.log('打开游戏帮助');
    if (window.gtag) {
        gtag('event', 'help_open', {
            game_name: window.currentGame
        });
    }
}

function trackGameShare(method) {
    console.log(`游戏分享: ${method}`);
    if (window.gtag) {
        gtag('event', 'share', {
            method: method,
            content_type: 'game',
            item_id: window.currentGame
        });
    }
}

// 游戏性能优化
function optimizeGamePerformance() {
    // 预加载其他游戏页面
    const otherGameLinks = document.querySelectorAll('a[href$=".html"]');
    otherGameLinks.forEach(link => {
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = link.href;
        document.head.appendChild(prefetchLink);
    });
    
    // 延迟加载非关键资源
    setTimeout(() => {
        // 可以在这里加载分析脚本、社交媒体widget等
    }, 3000);
}

// 页面可见性变化处理
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时暂停某些功能
        console.log('页面隐藏');
    } else {
        // 页面显示时恢复功能
        console.log('页面显示');
    }
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('页面错误:', e.error);
    // 可以发送错误报告到服务器
});

// 页面离开前的清理
window.addEventListener('beforeunload', () => {
    // 清理定时器、事件监听器等
    console.log('页面即将离开');
});

// 初始化完成后的优化
setTimeout(() => {
    optimizeGamePerformance();
}, 1000);

// 响应式游戏尺寸调整
function adjustGameSize() {
    const gameContainer = document.querySelector('.game-iframe-container');
    const iframe = document.getElementById('gameFrame');
    
    if (gameContainer && iframe) {
        const containerWidth = gameContainer.offsetWidth;
        const aspectRatio = 16 / 9; // 假设游戏是16:9比例
        
        // 在移动设备上调整游戏高度
        if (window.innerWidth <= 768) {
            gameContainer.style.height = `${containerWidth / aspectRatio}px`;
        }
    }
}

// 窗口大小变化时调整游戏尺寸
window.addEventListener('resize', debounce(adjustGameSize, 250));

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 页面加载完成后调整游戏尺寸
window.addEventListener('load', adjustGameSize);

// 添加额外的CSS样式
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #E74C3C;
    }
    
    .retry-btn {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        margin-top: 1rem;
        transition: all 0.3s ease;
    }
    
    .retry-btn:hover {
        background: #e55a2e;
        transform: translateY(-1px);
    }
    
    /* 游戏控制按钮激活状态 */
    .control-btn:active {
        transform: scale(0.95);
    }
    
    /* 帮助模态框动画 */
    .help-modal {
        animation: fadeIn 0.3s ease;
    }
    
    .help-content {
        animation: slideInUp 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* 全屏模式下的特殊样式 */
    .fullscreen-mode .loading-overlay {
        background: rgba(0, 0, 0, 0.9);
        color: white;
    }
    
    .fullscreen-mode .spinner {
        border-color: rgba(255, 255, 255, 0.1);
        border-left-color: white;
    }
`;

document.head.appendChild(additionalStyles); 