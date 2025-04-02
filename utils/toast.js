/**
 * Toast提示工具
 * 可在content script和页面脚本中使用
 */

// Toast默认配置
const DEFAULT_CONFIG = {
  duration: 3000,         // 显示时长(ms)
  position: 'top-right',  // 位置
  bgColor: '#1890ff',     // 背景色
  textColor: '#ffffff',   // 文字颜色
  fontSize: '14px',       // 字体大小
  borderRadius: '4px',    // 圆角
  zIndex: 9999,           // 层级
  padding: '10px 15px'    // 内边距
}

/**
 * 创建并显示一个toast提示
 * @param {string} message - 显示的消息内容
 * @param {Object} options - 自定义配置选项
 * @param {string} options.type - 类型: 'success', 'error', 'warning', 'info'
 * @param {number} options.duration - 显示时长(ms)
 * @param {string} options.position - 位置: 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
 * @returns {HTMLElement} 返回创建的toast元素
 */
export const showToast = (message, options = {}) => {
  // 合并默认配置和自定义配置
  const config = { ...DEFAULT_CONFIG, ...options }
  
  // 根据类型设置颜色
  switch (options.type) {
    case 'success':
      config.bgColor = '#52c41a'
      break
    case 'error':
      config.bgColor = '#ff4d4f'
      break
    case 'warning':
      config.bgColor = '#faad14'
      break
    case 'info':
      config.bgColor = '#1890ff'
      break
  }
  
  // 创建toast元素
  const toast = document.createElement('div')
  
  // 设置基础样式
  Object.assign(toast.style, {
    position: 'fixed',
    backgroundColor: config.bgColor,
    color: config.textColor,
    padding: config.padding,
    borderRadius: config.borderRadius,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: config.zIndex,
    transition: 'all 0.3s ease-out',
    opacity: '0',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    fontSize: config.fontSize,
    maxWidth: '80%',
    wordWrap: 'break-word'
  })
  
  // 根据位置设置定位
  switch (config.position) {
    case 'top-right':
      Object.assign(toast.style, { top: '20px', right: '20px' })
      break
    case 'top-left':
      Object.assign(toast.style, { top: '20px', left: '20px' })
      break
    case 'bottom-right':
      Object.assign(toast.style, { bottom: '20px', right: '20px' })
      break
    case 'bottom-left':
      Object.assign(toast.style, { bottom: '20px', left: '20px' })
      break
    case 'top-center':
      Object.assign(toast.style, { top: '20px', left: '50%', transform: 'translateX(-50%)' })
      break
    case 'bottom-center':
      Object.assign(toast.style, { bottom: '20px', left: '50%', transform: 'translateX(-50%)' })
      break
  }
  
  // 设置内容
  toast.textContent = message
  
  // 添加到页面
  document.body.appendChild(toast)
  
  // 触发重绘，然后设置透明度为1以显示toast
  setTimeout(() => {
    toast.style.opacity = '1'
  }, 10)
  
  // 设置定时器，在指定时间后隐藏并移除toast
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform += ' translateY(-10px)'
    
    // 过渡完成后移除元素
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 300)
  }, config.duration)
  
  return toast
}

/**
 * 成功提示
 * @param {string} message - 显示的消息内容
 * @param {Object} options - 自定义配置选项
 */
export const showSuccess = (message, options = {}) => {
  return showToast(message, { ...options, type: 'success' })
}

/**
 * 错误提示
 * @param {string} message - 显示的消息内容
 * @param {Object} options - 自定义配置选项
 */
export const showError = (message, options = {}) => {
  return showToast(message, { ...options, type: 'error' })
}

/**
 * 警告提示
 * @param {string} message - 显示的消息内容
 * @param {Object} options - 自定义配置选项
 */
export const showWarning = (message, options = {}) => {
  return showToast(message, { ...options, type: 'warning' })
}

/**
 * 信息提示
 * @param {string} message - 显示的消息内容
 * @param {Object} options - 自定义配置选项
 */
export const showInfo = (message, options = {}) => {
  return showToast(message, { ...options, type: 'info' })
}

/**
 * 创建用于注入到页面主世界的toast脚本字符串
 * 在使用script标签注入时使用此函数生成的代码
 * @returns {string} 返回可注入的JavaScript代码字符串
 */
export const createInjectableToastScript = () => {
  // 将toast代码转换为字符串形式，用于注入
  return `
    (function() {
      // 避免重复定义
      if (window.JNBeesToast) return;
      
      // 创建全局toast对象
      window.JNBeesToast = {
        // 默认配置
        defaultConfig: {
          duration: 3000,
          position: 'top-right',
          bgColor: '#1890ff',
          textColor: '#ffffff',
          fontSize: '14px',
          borderRadius: '4px',
          zIndex: 9999,
          padding: '10px 15px'
        },
        
        // 显示toast
        show: function(message, options = {}) {
          const config = Object.assign({}, this.defaultConfig, options);
          
          // 根据类型设置颜色
          switch (options.type) {
            case 'success': config.bgColor = '#52c41a'; break;
            case 'error': config.bgColor = '#ff4d4f'; break;
            case 'warning': config.bgColor = '#faad14'; break;
            case 'info': config.bgColor = '#1890ff'; break;
          }
          
          // 创建toast元素
          const toast = document.createElement('div');
          
          // 设置基础样式
          Object.assign(toast.style, {
            position: 'fixed',
            backgroundColor: config.bgColor,
            color: config.textColor,
            padding: config.padding,
            borderRadius: config.borderRadius,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: config.zIndex,
            transition: 'all 0.3s ease-out',
            opacity: '0',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: config.fontSize,
            maxWidth: '80%',
            wordWrap: 'break-word'
          });
          
          // 根据位置设置定位
          switch (config.position) {
            case 'top-right': 
              Object.assign(toast.style, { top: '20px', right: '20px' });
              break;
            case 'top-left':
              Object.assign(toast.style, { top: '20px', left: '20px' });
              break;
            case 'bottom-right':
              Object.assign(toast.style, { bottom: '20px', right: '20px' });
              break;
            case 'bottom-left':
              Object.assign(toast.style, { bottom: '20px', left: '20px' });
              break;
            case 'top-center':
              Object.assign(toast.style, { top: '20px', left: '50%', transform: 'translateX(-50%)' });
              break;
            case 'bottom-center':
              Object.assign(toast.style, { bottom: '20px', left: '50%', transform: 'translateX(-50%)' });
              break;
          }
          
          // 设置内容
          toast.textContent = message;
          
          // 添加到页面
          document.body.appendChild(toast);
          
          // 触发重绘，然后设置透明度为1以显示toast
          setTimeout(() => {
            toast.style.opacity = '1';
          }, 10);
          
          // 设置定时器，在指定时间后隐藏并移除toast
          setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform += ' translateY(-10px)';
            
            // 过渡完成后移除元素
            setTimeout(() => {
              if (document.body.contains(toast)) {
                document.body.removeChild(toast);
              }
            }, 300);
          }, config.duration);
          
          return toast;
        },
        
        // 成功提示
        success: function(message, options = {}) {
          return this.show(message, Object.assign({}, options, { type: 'success' }));
        },
        
        // 错误提示
        error: function(message, options = {}) {
          return this.show(message, Object.assign({}, options, { type: 'error' }));
        },
        
        // 警告提示
        warning: function(message, options = {}) {
          return this.show(message, Object.assign({}, options, { type: 'warning' }));
        },
        
        // 信息提示
        info: function(message, options = {}) {
          return this.show(message, Object.assign({}, options, { type: 'info' }));
        }
      };
      
      console.log('JNBeesToast 已加载');
    })();
  `;
}

export default {
  showToast,
  showSuccess,
  showError, 
  showWarning,
  showInfo,
  createInjectableToastScript
} 