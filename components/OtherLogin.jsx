import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  SearchOutlined
} from "@ant-design/icons"
import {
  Button,
  Collapse,
  Form,
  Input,
  message,
  Modal,
  Space,
  Switch,
  Table,
  Typography
} from "antd"
import React, { useRef, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { sendMessageToContent } from "../utils"

const { TextArea } = Input
const { Text } = Typography

export default function OtherLogin() {
  const [config, setConfig] = useStorage(
    "config",
    (value) => value || { otherList: [] }
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDataList, setShowDataList] = useState(true)
  const [activeKeys, setActiveKeys] = useState(["1"])
  const [editingScript, setEditingScript] = useState(null)
  const [searchText, setSearchText] = useState("")
  const [searchedColumn, setSearchedColumn] = useState("")
  const searchInput = useRef(null)
  const [form] = Form.useForm()

  // 处理搜索功能
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    setSearchText(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }

  // 重置函数，完全清除搜索条件和高亮效果
  const handleReset = (clearFilters, confirm) => {
    clearFilters()
    setSearchText("")
    setSearchedColumn("")
    confirm()
  }

  // 获取列搜索属性
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`搜索脚本名称`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}>
            搜索
          </Button>
          <Button
            onClick={() => {
              clearFilters && handleReset(clearFilters, confirm)
            }}
            size="small"
            style={{ width: 90 }}>
            重置
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close()
            }}>
            关闭
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : "",
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100)
      }
    },
    render: (text) =>
      searchedColumn === dataIndex && searchText ? (
        <span>
          {text
            .toString()
            .split(new RegExp(`(?<=${searchText})|(?=${searchText})`, "i"))
            .map((fragment, i) =>
              fragment.toLowerCase() === searchText.toLowerCase() ? (
                <span key={i} style={{ backgroundColor: "#ffc069" }}>
                  {fragment}
                </span>
              ) : (
                <span key={i}>{fragment}</span>
              )
            )}
        </span>
      ) : (
        <span>{text}</span>
      )
  })

  // 打开添加/编辑模态框
  const showModal = (script = null) => {
    setEditingScript(script)

    if (script) {
      // 编辑模式，设置表单初始值
      form.setFieldsValue({
        name: script.name,
        code: script.code,
        autoRun: script.autoRun || false,
        autoRunCondition: script.autoRunCondition || ""
      })
    } else {
      // 添加模式，重置表单
      form.resetFields()
    }

    setIsModalOpen(true)
  }

  // 处理模态框确认
  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        if (editingScript) {
          // 编辑现有脚本
          handleEdit(values)
        } else {
          // 添加新脚本
          handleAdd(values)
        }
        setIsModalOpen(false)
      })
      .catch((info) => {
        console.log("验证失败:", info)
      })
  }

  // 关闭模态框
  const handleCancel = () => {
    setIsModalOpen(false)
  }

  // 添加脚本
  const handleAdd = (values) => {
    const otherList = config.otherList || []
    const newScript = {
      ...values,
      key: `script-${Date.now()}`,
      autoRun: values.autoRun || false
    }

    setConfig({
      ...config,
      otherList: [...otherList, newScript]
    })

    message.success("添加成功")
  }

  // 编辑脚本
  const handleEdit = (values) => {
    const otherList = config.otherList || []
    const newList = otherList.map((item) => {
      if (item.key === editingScript.key) {
        return { ...item, ...values }
      }
      return item
    })

    setConfig({
      ...config,
      otherList: newList
    })

    message.success("修改成功")
  }

  // 删除脚本
  const handleDelete = (script) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除脚本"${script.name}"吗？`,
      onOk() {
        const otherList = config.otherList || []
        const newList = otherList.filter((item) => item.key !== script.key)

        setConfig({
          ...config,
          otherList: newList
        })

        message.success("删除成功")
      }
    })
  }

  // 执行脚本
  const executeScript = (script) => {
    // 发送到隔离环境中
    sendMessageToContent({
      type: "executeScript",
      message: {
        name: script.name,
        code: script.code
      }
    })
  }

  // 切换数据显示状态
  const toggleDataView = () => {
    setShowDataList(!showDataList)
  }

  // 处理Collapse面板变化
  const handleCollapseChange = (keys) => {
    setActiveKeys(keys)
  }

  // 处理自动运行切换
  const handleAutoRunChange = (key, checked) => {
    const otherList = config.otherList || []
    const newList = otherList.map((item) => {
      if (item.key === key) {
        return { ...item, autoRun: checked }
      }
      return item
    })

    setConfig({
      ...config,
      otherList: newList
    })
  }

  // 渲染表格
  const renderTable = () => {
    return (
      <Table
        columns={columns}
        dataSource={config?.otherList || []}
        rowKey="key"
        pagination={{ pageSize: 5 }}
        scroll={{ x: "max-content" }}
        style={{ overflowX: "auto" }}
      />
    )
  }

  // 表格列定义
  const columns = [
    {
      title: "脚本名称",
      dataIndex: "name",
      key: "name",
      width: 100,
      ellipsis: true,
      ...getColumnSearchProps("name")
    },
    {
      title: "自动运行",
      dataIndex: "autoRun",
      key: "autoRun",
      width: 100,
      render: (text, record) => (
        <Switch
          checked={!!text}
          onChange={(checked) => handleAutoRunChange(record.key, checked)}
        />
      )
    },
    {
      title: "运行条件",
      dataIndex: "autoRunCondition",
      key: "autoRunCondition",
      width: 200,
      render: (text) => {
        if (!text) return <span>无</span>

        // 将多行内容转换为逗号分隔的形式显示
        const conditions = text.split("\n").filter((line) => line.trim() !== "")

        if (conditions.length === 0) {
          return <span>无</span>
        }

        // 显示为链接列表
        return (
          <div style={{ width: "100%" }}>
            {conditions.map((condition, index) => {
              // 构造完整URL (如果不是完整URL则加上https://)
              const fullUrl = condition.startsWith("http")
                ? condition
                : `https://${condition}`

              return (
                <div
                  key={index}
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center"
                  }}>
                  <span style={{ marginRight: 4, fontSize: 10 }}>•</span>
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                    title={condition}>
                    {condition}
                  </a>
                </div>
              )
            })}
          </div>
        )
      }
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<PlayCircleOutlined />}
            style={{ color: "#52c41a" }}
            onClick={() => executeScript(record)}
            title="执行脚本"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            style={{ color: "#1890ff" }}
            onClick={() => showModal(record)}
            title="编辑脚本"
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            style={{ color: "#ff4d4f" }}
            onClick={() => handleDelete(record)}
            title="删除脚本"
          />
        </Space>
      )
    }
  ]

  // 折叠面板项
  const items = [
    {
      key: "1",
      label: "自定义脚本管理",
      children: renderTable()
    }
  ]

  return (
    <div>
      <Form.Item label="脚本管理">
        <Space>
          <Button
            onClick={() => showModal()}
            type="primary"
            style={{
              marginBottom: 16
            }}>
            新增脚本
          </Button>
          <Button
            onClick={toggleDataView}
            type="default"
            icon={<EyeOutlined />}
            style={{
              marginBottom: 16
            }}>
            {showDataList ? "隐藏列表" : "查看列表"}
          </Button>
        </Space>

        {showDataList && (
          <Collapse
            items={items}
            activeKey={activeKeys}
            onChange={handleCollapseChange}
          />
        )}
      </Form.Item>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingScript ? "编辑脚本" : "新增脚本"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        maskClosable={false}
        destroyOnClose={true}
        width={600}>
        <Form form={form} layout="vertical" name="scriptForm">
          <Form.Item
            name="name"
            label="脚本名称"
            rules={[{ required: true, message: "请输入脚本名称" }]}>
            <Input placeholder="请输入脚本名称" />
          </Form.Item>
          <Form.Item name="autoRun" label="自动运行" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="autoRunCondition"
            label="自动运行条件（URL包含指定内容时运行）"
            tooltip="当页面URL包含此内容时自动运行脚本，留空则在所有页面运行。多个条件请每行输入一个，满足任一条件即可运行。">
            <TextArea
              placeholder="例如：github.com/login&#10;example.com/dashboard&#10;每行输入一个URL条件，满足任一条件即可运行"
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </Form.Item>
          <Form.Item
            name="code"
            label="脚本代码"
            rules={[{ required: true, message: "请输入脚本代码" }]}>
            <TextArea
              placeholder="请输入JavaScript代码"
              autoSize={{ minRows: 6, maxRows: 12 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
