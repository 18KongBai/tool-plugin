import { sendMessage, simulateTyping } from "../utils"
import { showToast } from "../utils/toast"

// 定义content script配置
export const config = {
  matches: ["<all_urls>"],
  world: "MAIN"
}

function init() {
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

  // 处理codedesign 的自动登录
  const handleCodeDesignAutoLogin = async (codeList) => {
    const currentLink = window.location.href
    const currentItem = codeList?.find((item) =>
      currentLink.includes(item.link)
    )
    // 没有自动登录直接返回
    if (!currentItem?.autoRun) {
      return
    }
    // 可能页面上还未加载出元素
    setTimeout(() => {
      simulateTyping(".t-input__inner", currentItem.password, 200)
    }, 500)
  }

  // 自动执行脚本
  const handleExecuteScript = (scriptList) => {
    if (!scriptList || !Array.isArray(scriptList) || scriptList.length === 0) {
      return
    }

    const currentUrl = window.location.href

    // 遍历所有脚本，检查是否需要自动执行
    scriptList.forEach((script) => {
      // 检查脚本是否启用了自动运行
      if (!script.autoRun) {
        return
      }

      // 检查是否满足自动运行条件
      if (script.autoRunCondition) {
        // 将条件拆分为多行，每行作为一个独立条件
        const conditions = script.autoRunCondition
          .split("\n")
          .filter((line) => line.trim() !== "")

        // 检查是否满足任一条件
        const matchesAnyCondition = conditions.some((condition) =>
          currentUrl.includes(condition.trim())
        )

        // 如果没有满足任何条件，则不执行
        if (!matchesAnyCondition) {
          return
        }
      }

      // 符合条件，执行脚本
      try {
        eval(script.code)
      } catch (error) {
        showToast(`自动执行脚本 ${script.name} 失败: ${error.message}`, {
          type: "error"
        })
      }
    })
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
    console.log(data, "data")
    const { environment, codeList, otherList } = data
    executeEnvironmentAction(environment)
    handleCodeDesignAutoLogin(codeList)
    handleExecuteScript(otherList)
  }
}

window.addEventListener("load", () => {
  init()
})
