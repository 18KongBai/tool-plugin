import {
  Button,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Switch,
  Tooltip,
  Typography,
  Upload
} from "antd"
import JSZip from "jszip"
import React, { useEffect, useState } from "react"

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

  const [tinifyKey, setTinifyKey] = useStorage("tinifyKey", "")
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const [fileList, setFileList] = useState([])
  const [compressing, setCompressing] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState([])

  // 直传服务器所需的配置状态
  const [enableUpload, setEnableUpload] = useStorage("enableUpload", false)
  const [serverUrl, setServerUrl] = useStorage("serverUrl", "")
  const [serverToken, setServerToken] = useStorage("serverToken", "")

  // --- 服务端上传三部曲 ---

  const preUpload = async (server, token, fileName) => {
    const url = `${server}/files/upload/pre?originalName=${encodeURIComponent(fileName)}`
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Auth-Token": token
      }
    })
    const json = await res.json()
    if (!json.success)
      throw new Error(`预上传失败: ${json.message || "未知错误"}`)
    return json.result
  }

  const uploadToServer = async (
    server,
    token,
    fileBlob,
    fileName,
    uuid,
    type
  ) => {
    let url =
      type === "public"
        ? `${server}/files/common/${uuid}`
        : `${server}/files/${uuid}`
    const formData = new FormData()
    formData.append("file", fileBlob, fileName)

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Auth-Token": token
      },
      body: formData
    })
    const json = await res.json()
    if (!json.success)
      throw new Error(`上传失败: ${json.message || "未知错误"}`)
    return json.result
  }

  const uploadToCos = async (cosUrl, fileBlob) => {
    const res = await fetch(cosUrl, {
      method: "PUT",
      body: fileBlob
    })
    if (!res.ok) throw new Error("COS 直传失败")
  }

  const confirmUpload = async (server, token, uuid) => {
    const url = `${server}/files/confirm?uuid=${uuid}`
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Auth-Token": token
      }
    })
    const json = await res.json()
    if (!json.success)
      throw new Error(`确认上传失败: ${json.message || "未知错误"}`)
    return json.result
  }

  const processFileUpload = async (blob, fileName) => {
    const {
      uuid,
      url: uploadUrl,
      uploadLocation
    } = await preUpload(serverUrl, serverToken, fileName)
    let finalUrl
    if (uploadLocation === "cos") {
      await uploadToCos(uploadUrl, blob)
      finalUrl = await confirmUpload(serverUrl, serverToken, uuid)
    } else {
      finalUrl = await uploadToServer(
        serverUrl,
        serverToken,
        blob,
        fileName,
        uuid,
        "private"
      )
    }
    return finalUrl
  }

  // 批量压缩并打包下载
  const handleCompressAll = async () => {
    if (fileList.length === 0) {
      message.warning("请先选择需要压缩的图片")
      return
    }
    if (!tinifyKey) {
      message.error("请先配置 Tinify API Key")
      return
    }
    if (enableUpload && (!serverUrl || !serverToken)) {
      message.error("开启了自动上传，但 Server URL 或 Token 未配置")
      return
    }

    setCompressing(true)
    setUploadedUrls([]) // 清空上次的上传记录
    const zip = new JSZip()
    let successCount = 0
    let currentUploadedUrls = []

    // 显示总进度提示
    const hideLoading = message.loading(`正在压缩... (0/${fileList.length})`, 0)

    try {
      for (let i = 0; i < fileList.length; i++) {
        const fileItem = fileList[i]
        const file = fileItem.originFileObj || fileItem

        // 更新进度条 UI 或通过 message 显示进度
        hideLoading()
        message.loading(
          `正在压缩第 ${i + 1}/${fileList.length} 张: ${file.name}...`,
          0
        )

        try {
          // 调用 TinyPNG
          const response = await fetch("https://api.tinify.com/shrink", {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa("api:" + tinifyKey)}`
            },
            body: file
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(
              errorData.message || "压缩失败，请检查 API Key 或网络"
            )
          }

          const data = await response.json()

          // 获取压缩后图片的二进制流
          const imgRes = await fetch(data.output.url)
          if (!imgRes.ok) throw new Error("获取压缩后图片失败")
          const blob = await imgRes.blob()

          const extIndex = file.name.lastIndexOf(".")
          const name = file.name.substring(0, extIndex)
          const ext = file.name.substring(extIndex)
          const finalFileName = `${name}_compressed${ext}`

          // 核心分流：加入 ZIP 还是上传服务器
          if (enableUpload) {
            hideLoading()
            message.loading(
              `正在上传第 ${i + 1}/${fileList.length} 张: ${finalFileName}...`,
              0
            )
            const uploadedUrl = await processFileUpload(blob, finalFileName)
            currentUploadedUrls.push({ name: finalFileName, url: uploadedUrl })
          } else {
            // 不开启上传的情况，则依然放入 JSZip 中以便之后统一下载
            zip.file(finalFileName, blob)
          }
          successCount++

          // 将当前文件状标为 "done" 以便在界面上反映
          setFileList((prev) => {
            const next = [...prev]
            next[i].status = "done"
            return next
          })
        } catch (err) {
          console.error(`图片 ${file.name} 压缩出错:`, err)
          message.error(`${file.name} 压缩失败: ${err.message}`)

          setFileList((prev) => {
            const next = [...prev]
            next[i].status = "error"
            return next
          })
        }
      }

      hideLoading()
      if (successCount > 0) {
        if (!enableUpload) {
          message.loading("压缩完成，正在打包ZIP...", 0)
          const zipContent = await zip.generateAsync({ type: "blob" })

          const url = URL.createObjectURL(zipContent)
          const a = document.createElement("a")
          a.href = url
          a.download = `compressed_images_${Date.now()}.zip`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          message.destroy()
          message.success(`成功打包导出 ${successCount} 张图片！`)
        } else {
          setUploadedUrls(currentUploadedUrls)
          message.destroy()
          message.success(`成功压缩并直传了 ${successCount} 张图片到服务器！`)
        }
      } else {
        message.destroy()
        message.error("所有图片压缩均失败。")
      }
    } catch (e) {
      hideLoading()
      message.error("压缩流程出现异常：" + e.message)
    } finally {
      setCompressing(false)
    }
  }

  const onUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList)
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
          <Form.Item label="图片直传">
            <Flex vertical gap="small">
              <Flex gap="small" align="center">
                <span>压缩后是否自动上传至服务器？</span>
                <Switch
                  checked={enableUpload}
                  onChange={setEnableUpload}
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                />
              </Flex>
              {enableUpload && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: "#f5f5f5",
                    borderRadius: 8
                  }}>
                  <Flex vertical gap="small">
                    <Input
                      placeholder="Server Base URL (形如: http://xxx.com/api)"
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                    />
                    <Input.Password
                      placeholder="鉴权 Token (X-Auth-Token)"
                      value={serverToken}
                      onChange={(e) => setServerToken(e.target.value)}
                    />
                  </Flex>
                </div>
              )}
            </Flex>
          </Form.Item>
          <Form.Item label="图片压缩">
            <Flex vertical gap="small">
              <Button onClick={() => setIsKeyModalOpen(true)}>
                设置 Tinify API Key
              </Button>
              <Upload
                accept="image/png, image/jpeg, image/webp"
                multiple
                fileList={fileList}
                onChange={onUploadChange}
                beforeUpload={() => false}>
                <Button>选择图片</Button>
              </Upload>
              {fileList.length > 0 && (
                <Button
                  type="primary"
                  onClick={handleCompressAll}
                  loading={compressing}
                  style={{ marginTop: 8 }}>
                  {enableUpload ? "压缩图片并直传服务器" : "打包压缩并导出 ZIP"}
                </Button>
              )}
              {uploadedUrls.length > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    border: "1px solid #d9d9d9",
                    borderRadius: 8
                  }}>
                  <div style={{ marginBottom: 8, fontWeight: "bold" }}>
                    📤 上传结果：
                  </div>
                  {uploadedUrls.map((item, index) => (
                    <Flex
                      key={index}
                      align="center"
                      justify="space-between"
                      style={{ marginBottom: 4 }}>
                      <span style={{ color: "#666", marginRight: 8 }}>
                        {item.name}:
                      </span>
                      <Typography.Text
                        copyable={{ text: item.url }}
                        style={{ maxWidth: 220 }}
                        ellipsis>
                        <a href={item.url} target="_blank" rel="noreferrer">
                          {item.url}
                        </a>
                      </Typography.Text>
                    </Flex>
                  ))}
                </div>
              )}
            </Flex>
          </Form.Item>
        </Form>
        <Modal
          title="设置 Tinify API Key"
          open={isKeyModalOpen}
          onOk={() => setIsKeyModalOpen(false)}
          onCancel={() => setIsKeyModalOpen(false)}
          okText="确认"
          cancelText="关闭">
          <p style={{ marginBottom: 12 }}>
            请在下方输入您的 TinyPNG(Tinify) 开发平台 API Key：
          </p>
          <Input.Password
            placeholder="例如: dF8x9B..."
            value={tinifyKey}
            onChange={(e) => setTinifyKey(e.target.value)}
          />
        </Modal>
      </div>
    )
  }

  return <div>{renderSelectEnvironment()}</div>
}
