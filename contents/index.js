import { sendMessage } from "../utils"
import { showToast } from "../utils/toast"

// 定义content script配置
export const config = {
  matches: ["<all_urls>"],
  world: "MAIN"
}

// 向隔离世界发送消息，证明主世界已加载
sendMessage({ type: "contentScriptLoaded" })

// 执行环境相关操作
const executeEnvironmentAction = (environment) => {
  if (!window.JNBees) return

  try {
    // 根据不同环境执行不同的修改逻辑
    switch (environment) {
      case "APP": // APP环境
        window.JNBees.isApp = () => true
        window.JNBees.isWeChat = () => false
        break
      case "WECHAT": // 微信环境
        window.JNBees.isApp = () => false
        window.JNBees.isWeChat = () => true
        break
      default:
        window.JNBees.isApp = () => false
        window.JNBees.isWeChat = () => false
    }
  } catch (error) {
    console.error("执行环境操作失败:", error)
  }
}

// 监听来自隔离世界的响应
window.addEventListener("message", (event) => {
  if (event.data.type === "STORAGE_RESULT") {
    handleMessage(event?.data?.data || {})
  }
  if (event.data.type === "clearToken") {
    try {
      window.JNBees.clearToken()
      showToast("移除token成功")
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      showToast("移除token失败", { type: "error" })
    }
  }
  if (event.data.type === "setToken") {
    try {
      window._jn._updateToken(event.data.data)
      showToast("设置token成功")
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      showToast(`设置token失败:${error}`, { type: "error" })
    }
  }
  if (event.data.type === "executeScript") {
    const { name, code } = event.data.data
    try {
      eval(code)
    } catch (error) {
      showToast(`执行脚本${name}失败`, { type: "error" })
    }
  }
})

const handleMessage = (data) => {
  const { environment } = data
  executeEnvironmentAction(environment)
}
