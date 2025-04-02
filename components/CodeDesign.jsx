import { EyeOutlined, SearchOutlined } from "@ant-design/icons"
import {
  Button,
  Collapse,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table
} from "antd"
import React, { useRef, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import { sendMessageToContent } from "../utils"

export default function CodeDesign() {
  const [config, setConfig] = useStorage(
    "config",
    (value) => value || { codeList: [] }
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDataList, setShowDataList] = useState(false) // 控制整个数据区域的显示
  const [activeKeys, setActiveKeys] = useState(["1"]) // 控制Collapse的展开状态
  const [editingRecord, setEditingRecord] = useState(null)
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
    setSearchedColumn("") // 清除搜索列，这样就不会高亮任何内容
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
          placeholder={`搜索项目名称`}
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
      searchedColumn === dataIndex && searchText ? ( // 添加searchText检查，确保只有在有搜索文本时才高亮
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
  const showModal = (record = null) => {
    setEditingRecord(record)

    if (record) {
      // 编辑模式，设置表单初始值
      form.setFieldsValue({
        name: record.name,
        link: record.link,
        password: record.password || ""
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
        if (editingRecord) {
          // 编辑现有记录
          handleEdit(values)
        } else {
          // 添加新记录
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

  // 添加记录
  const handleAdd = (values) => {
    const codeList = config.codeList || []
    const newData = {
      ...values,
      key: `code-${Date.now()}`
    }

    setConfig({
      ...config,
      codeList: [...codeList, newData]
    })

    message.success("添加成功")
  }

  // 编辑记录
  const handleEdit = (values) => {
    const codeList = config.codeList || []
    const newList = codeList.map((item) => {
      if (item.key === editingRecord.key) {
        return { ...item, ...values }
      }
      return item
    })

    setConfig({
      ...config,
      codeList: newList
    })

    message.success("修改成功")
  }

  // 删除记录
  const handleDelete = (record) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除"${record.name}"吗？`,
      onOk() {
        const codeList = config.codeList || []
        const newList = codeList.filter((item) => item.key !== record.key)

        setConfig({
          ...config,
          codeList: newList
        })

        message.success("删除成功")
      }
    })
  }

  const loginCodeDesign = () => {
    console.log("登录")
    sendMessageToContent({
      type: "codeDesignLogin"
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

  // 渲染表格
  const renderTable = () => {
    return (
      <>
        <Button
          onClick={() => showModal()}
          type="primary"
          style={{
            marginBottom: 16
          }}>
          新增项目
        </Button>

        <Table
          columns={columns}
          dataSource={config?.codeList || []}
          rowKey="key"
          pagination={{ pageSize: 5 }}
          scroll={{ x: "max-content" }}
          style={{ overflowX: "auto" }}
        />
      </>
    )
  }

  // 渲染数据列表
  const renderDataList = () => {
    return (
      <Table
        columns={[
          {
            title: "项目名称",
            dataIndex: "name",
            key: "name",
            width: "25%"
          },
          {
            title: "链接",
            dataIndex: "link",
            key: "link",
            width: "45%",
            render: (text) => (
              <a href={text} target="_blank" rel="noopener noreferrer">
                {text}
              </a>
            )
          },
          {
            title: "密码",
            dataIndex: "password",
            key: "password",
            width: "30%"
          }
        ]}
        dataSource={config?.codeList || []}
        rowKey="key"
        pagination={false}
        size="small"
      />
    )
  }

  // 表格列定义
  const columns = [
    {
      title: "项目",
      dataIndex: "name",
      key: "name",
      width: 150,
      ellipsis: true,
      ...getColumnSearchProps("name"),
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["ascend", "descend"]
    },
    {
      title: "链接",
      dataIndex: "link",
      key: "link",
      width: 250,
      ellipsis: true,
      render: (text) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      )
    },
    {
      title: "密码",
      dataIndex: "password",
      key: "password",
      width: 150,
      ellipsis: true,
      render: (text) => (
        <span style={{ color: "#999" }}>{text ? text : "未设置"}</span>
      )
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => showModal(record)}>编辑</a>
          <a onClick={() => handleDelete(record)} style={{ color: "#ff4d4f" }}>
            删除
          </a>
        </Space>
      )
    }
  ]

  // 折叠面板项
  const items = [
    {
      key: "1",
      label: "code design对应的项目与密码",
      children: renderTable()
    }
  ]

  return (
    <div>
      <Form.Item label="code design">
        <Space>
          <Button
            onClick={() => loginCodeDesign()}
            type="primary"
            style={{
              marginBottom: 16
            }}>
            一键登录
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
        title={editingRecord ? "编辑项目" : "新增项目"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        maskClosable={false}
        destroyOnClose={true}>
        <Form form={form} layout="vertical" name="codeDesignForm">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: "请输入项目名称" }]}>
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="link"
            label="项目链接"
            rules={[
              { required: true, message: "请输入项目链接" },
              { type: "url", message: "请输入有效的URL" }
            ]}>
            <Input placeholder="请输入项目链接" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input placeholder="请输入密码（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
