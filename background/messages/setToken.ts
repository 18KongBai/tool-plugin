import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(req, "setToken")
  inject(req?.body?.tabId)
}

const inject = async (tabId: number) => {
  console.log(tabId, "tabId")
  chrome.scripting.executeScript(
    {
      target: {
        tabId
      },
      world: "MAIN", // MAIN in order to access the window object
      func: () => {
        console.log("windowChanger")
      }
    },
    () => {
      console.log("Background script got callback after injection")
    }
  )
}

export default handler
