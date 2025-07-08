import { Button, Flex, Form, message, Radio, Tooltip, Upload } from "antd"
import React, { useEffect, useRef } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import {
  exportPluginData,
  importPluginData,
  sendMessageToContent
} from "../utils"

export default function Tool() {
  const [config, setConfig] = useStorage("config", (value) => value || {})
  const [form] = Form.useForm()
  const storage = new Storage()

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

  // 处理数据导出
  const handleExportData = async () => {
    try {
      const result = await exportPluginData(storage)
      if (result.success) {
        message.success(result.message)
      } else {
        message.error(result.message)
      }
    } catch (error) {
      message.error("导出失败：" + error.message)
    }
  }

  // 处理数据导入
  const handleImportData = async (file) => {
    try {
      const result = await importPluginData(file, storage, setConfig)
      if (result.success) {
        message.success(result.message)
      } else {
        message.error(result.message)
      }
    } catch (error) {
      message.error("导入失败：" + error.message)
    }
    return false // 阻止Upload组件的默认上传行为
  }

  const renderSelectEnvironment = () => {
    return (
      <div>
        <Form
          form={form}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 14 }}
          layout="horizontal"
          initialValues={{ environment: config.environment }}
          onValuesChange={onValuesChange}
          style={{ maxWidth: 600 }}>
          <Form.Item label="环境切换" name="environment">
            <Radio.Group>
              <Radio value="APP">APP</Radio>
              <Radio value="WECHAT">微信</Radio>
              <Radio value="OTHER">其他</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="token设置">
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
                onClick={() => {
                  sendMessageToContent({
                    type: "setCustomToken"
                  })
                }}>
                自定义token
              </Button>
              <Button
                onClick={() => sendMessageToContent({ type: "clearToken" })}>
                清空token
              </Button>
            </Flex>
          </Form.Item>
          <Form.Item label="数据管理">
            <Flex gap="small" wrap>
              <Tooltip title="导出自定义脚本和项目配置数据，保存为JSON文件">
                <Button type="primary" onClick={handleExportData}>
                  导出数据
                </Button>
              </Tooltip>
              <Upload
                accept=".json"
                showUploadList={false}
                beforeUpload={handleImportData}>
                <Tooltip title="从之前导出的JSON文件中增量导入脚本和项目数据，同名项目不会重复添加">
                  <Button>导入数据</Button>
                </Tooltip>
              </Upload>
            </Flex>
          </Form.Item>
        </Form>
      </div>
    )
  }

  return <div>{renderSelectEnvironment()}</div>
}
