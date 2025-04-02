import { Storage } from "@plasmohq/storage"

import { sendMessage, simulateTyping } from "../utils"
import { showToast } from "../utils/toast"

let contentScriptLoaded = false

export const config = {
  matches: ["<all_urls>"]
}

const storage = new Storage()
// 一些配置初始化就需要发送给主世界
storage.get("config").then((res) => {
  sendMessage(res)
})

const getStorageData = async (key) => {
  return await storage.get(key)
}

// 监听storage的变化，发送消息给隔离世界
storage.watch({
  config: (c) => {
    sendMessage({ type: "STORAGE_RESULT", data: c.newValue })
  }
})

window.addEventListener("message", (event) => {
  // 证明主世界已加载
  if (event.data.type === "contentScriptLoaded") {
    // 主要是为了加载自定义脚本的时候，只能在主世界加载
    contentScriptLoaded = true
  }
})

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  const { type } = request
  if (type === "getToken") {
    try {
      const tokenArr = document.cookie.split(";")
      const tokenIndex = tokenArr.findIndex((item) => {
        return item.includes("INIU_DATA_PRODUCT_CMS_TOKEN")
      })
      token = tokenArr[tokenIndex].split("=")[1]
      storage.set("token", token)
      showToast("获取token成功")
    } catch (error) {
      showToast("获取token失败", { type: "error" })
    }
  }
  if (type === "setToken") {
    sendMessage({
      type: "setToken",
      data: await getStorageData("token")
    })
  }
  if (type === "clearToken") {
    sendMessage({
      type: "clearToken"
    })
  }

  // codeDesignLogin
  if (type === "codeDesignLogin") {
    const { codeList } = await getStorageData("config")
    console.log(codeList, window.location.href, "codeDesignLogin")
    const currentItem = codeList.find((item) =>
      window.location.href.includes(item.link)
    )
    if (!currentItem?.password) {
      showToast("密码为空", { type: "error" })
      return
    }
    simulateTyping(".t-input__inner", currentItem.password, 200)
    console.log(currentItem, "currentItem")
  }

  if (type === "executeScript") {
    // 隔离脚本不能执行，需要发送到主世界
    if (!contentScriptLoaded) {
      showToast("当前环境不支持加载脚本", { type: "error" })
      return
    }
    const code = request.message.code
    const name = request.message.name
    sendMessage({ type: "executeScript", data: { name, code } })
  }
})
