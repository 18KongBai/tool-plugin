// popup 向 content 发送消息
export const sendMessageToContent = ({ type, message }) => {
  console.log("发送消息", type)
  // 获取当前活动标签页
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTabId = tabs[0]?.id
    console.log(tabs, "tabs")
    if (activeTabId) {
      // 发送消息给 content script
      chrome.tabs.sendMessage(activeTabId, {
        type,
        message
      })
    }
  })
}

// content环境之间的消息传递
export const sendMessage = ({ type, data }) => {
  window.postMessage(
    {
      type,
      data
    },
    "*"
  )
}

export function simulateTyping(inputSelector, text, delay = 100) {
  const input = document.querySelector(inputSelector)
  if (!input) {
    console.error("Input element not found!")
    return
  }
  let index = 0
  const typeCharacter = () => {
    if (index < text.length) {
      const char = text[index]
      const keydownEvent = new KeyboardEvent("keydown", { key: char })
      const inputEvent = new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: char
      })
      const keyupEvent = new KeyboardEvent("keyup", { key: char })
      input.dispatchEvent(keydownEvent)
      input.value += char
      input.dispatchEvent(inputEvent)
      input.dispatchEvent(keyupEvent)
      index++
      setTimeout(typeCharacter, delay)
    } else {
      console.log("Typing simulation completed!")
    }
  }
  typeCharacter()
}

// 导出插件数据
export const exportPluginData = async (storage) => {
  try {
    // 获取所有存储的数据
    const config = await storage.get("config") || {}
    
    // 构造导出的数据结构（只导出脚本和项目数据，不包含环境和token）
    const exportData = {
      version: "1.0.0",
      exportTime: new Date().toISOString(),
      data: {
        otherList: config.otherList || [],
        codeList: config.codeList || []
      }
    }
    
    // 转换为JSON字符串
    const jsonData = JSON.stringify(exportData, null, 2)
    
    // 创建下载链接
    const blob = new Blob([jsonData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    
    // 创建下载链接并触发下载
    const a = document.createElement("a")
    a.href = url
    a.download = `tool-plugin-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    // 清理URL对象
    URL.revokeObjectURL(url)
    
    return {
      success: true,
      message: "数据导出成功"
    }
  } catch (error) {
    console.error("导出数据失败:", error)
    return {
      success: false,
      message: "数据导出失败: " + error.message
    }
  }
}

// 导入插件数据
export const importPluginData = async (file, storage, setConfig) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target.result)
        
        // 验证数据格式
        if (!importData.data || typeof importData.data !== 'object') {
          throw new Error("导入文件格式不正确")
        }
        
        // 合并数据（保留现有的环境设置和token，增量导入脚本和项目数据）
        const currentConfig = await storage.get("config") || {}
        
        // 增量合并 otherList（脚本列表）
        const currentOtherList = currentConfig.otherList || []
        const importOtherList = importData.data.otherList || []
        const mergedOtherList = [...currentOtherList]
        
        // 去重添加新脚本（根据名称判断是否重复）
        importOtherList.forEach(importScript => {
          const exists = currentOtherList.find(existing => existing.name === importScript.name)
          if (!exists) {
            // 重新生成key避免冲突
            mergedOtherList.push({
              ...importScript,
              key: `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            })
          }
        })
        
        // 增量合并 codeList（项目列表）
        const currentCodeList = currentConfig.codeList || []
        const importCodeList = importData.data.codeList || []
        const mergedCodeList = [...currentCodeList]
        
        // 去重添加新项目（根据名称判断是否重复）
        importCodeList.forEach(importProject => {
          const exists = currentCodeList.find(existing => existing.name === importProject.name)
          if (!exists) {
            // 重新生成key避免冲突
            mergedCodeList.push({
              ...importProject,
              key: `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            })
          }
        })
        
        const newConfig = {
          ...currentConfig,
          otherList: mergedOtherList,
          codeList: mergedCodeList
        }
        
        // 保存新配置
        await storage.set("config", newConfig)
        setConfig(newConfig)
        
        // 计算实际新增的数量
        const newScriptsCount = mergedOtherList.length - currentOtherList.length
        const newProjectsCount = mergedCodeList.length - currentCodeList.length
        
        resolve({
          success: true,
          message: `数据导入成功，新增 ${newScriptsCount} 个脚本，${newProjectsCount} 个项目`
        })
      } catch (error) {
        console.error("导入数据失败:", error)
        resolve({
          success: false,
          message: "数据导入失败: " + error.message
        })
      }
    }
    reader.readAsText(file)
  })
}
