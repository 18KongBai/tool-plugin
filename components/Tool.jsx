import { Button, Flex, Form, Radio } from "antd"
import React, { useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { sendMessage, sendMessageToContent } from "../utils"

export default function Tool() {
  const [config, setConfig] = useStorage("config", (value) => value || {})
  const [form] = Form.useForm()
  console.log(config, "config")

  // 初始化表单值
  useEffect(() => {
    form.setFieldsValue({
      environment: config.environment
    })
  }, [config])

  // 处理表单值变化
  const onValuesChange = (changedValues, allValues) => {
    console.log("表单值变化:", changedValues, allValues)
    // 直接保存到storage
    setConfig({
      ...config,
      ...allValues
    })
  }

  const renderSelectEnvironment = () => {
    return (
      <div>
        <Form
          form={form}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 14 }}
          layout="horizontal"
          initialValues={{ environment: config.environment || 1 }}
          onValuesChange={onValuesChange}
          style={{ maxWidth: 600 }}>
          <Form.Item label="环境切换" name="environment">
            <Radio.Group>
              <Radio value="APP">APP</Radio>
              <Radio value="WECHAT">微信</Radio>
              <Radio value="OTHER">其他</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="token设置" name="environment">
            <Flex gap="small" wrap>
              {/* 事件都发送到隔离世界脚本 */}
              <Button
                onClick={() => {
                  sendMessageToContent({
                    type: "getToken"
                  })
                }}>
                获取token
              </Button>
              <Button
                onClick={() => {
                  sendMessageToContent({
                    type: "setToken"
                  })
                }}>
                设置token
              </Button>
              <Button
                onClick={() => sendMessageToContent({ type: "clearToken" })}>
                清空token
              </Button>
            </Flex>
          </Form.Item>
        </Form>
      </div>
    )
  }

  return <div>{renderSelectEnvironment()}</div>
}
