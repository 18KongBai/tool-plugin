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
