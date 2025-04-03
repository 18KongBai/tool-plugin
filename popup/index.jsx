import { Collapse } from "antd"

import QuickLogin from "../components/QuickLogin"
import Tool from "../components/Tool"
import styles from "./popup.module.css"

function IndexPopup() {
  const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`

  const items = [
    {
      key: "1",
      label: "绩牛工具",
      children: <Tool />
    },
    {
      key: "2",
      label: "快捷登录",
      children: <QuickLogin />
    }
  ]

  const onChange = (key) => {
    console.log(key)
  }

  return (
    <div className={styles.container}>
      <Collapse
        items={items}
        defaultActiveKey={["1", "2"]}
        onChange={onChange}
      />
    </div>
  )
}

export default IndexPopup
