# 工具插件 (Tool Plugin)

一个功能强大的Chrome浏览器扩展程序，提供多种开发辅助工具和自动化功能。

## 功能特点

- **环境切换功能**：快速切换APP、微信和其他环境，自动修改页面的环境判断逻辑
- **Code Design管理**：保存和管理项目链接和登录凭据，支持一键登录功能
- **自定义脚本执行**：创建、管理和执行自定义JavaScript脚本，实现页面自动化操作
- **Token管理**：便捷获取、设置和清除页面Token
- **数据同步**：所有配置自动存储在浏览器扩展的存储空间中，确保数据持久化

## 安装步骤

### 开发模式安装

1. 克隆此仓库到本地：
   ```bash
   git clone [仓库地址]
   cd tool-plugin
   ```

2. 安装依赖：
   ```bash
   pnpm install
   # 或者使用npm
   npm install
   ```

3. 启动开发服务器：
   ```bash
   pnpm dev
   # 或者使用npm
   npm run dev
   ```

4. 在Chrome浏览器中加载扩展：
   - 打开Chrome，导航到 `chrome://extensions/`
   - 启用"开发者模式"（右上角的开关）
   - 点击"加载已解压的扩展程序"
   - 选择项目中的 `build/chrome-mv3-dev` 目录

### 生产模式安装

1. 构建生产版本：
   ```bash
   pnpm build
   # 或者使用npm
   npm run build
   ```

2. 打包扩展：
   ```bash
   pnpm package
   # 或者使用npm
   npm run package
   ```

3. 安装打包好的扩展：
   - 在Chrome中导航到 `chrome://extensions/`
   - 启用"开发者模式"
   - 将生成的 `.zip` 文件拖放到浏览器窗口中，或者点击"加载已解压的扩展程序"并选择 `build/chrome-mv3-prod` 目录

## 使用指南

### 环境切换

1. 点击扩展图标打开弹出窗口
2. 选择环境选项（APP/微信/其他）
3. 点击"设置环境"按钮
4. 页面环境参数将被自动修改

### Code Design管理

1. 点击"查看数据"按钮显示项目数据管理界面
2. 点击"新增项目"添加项目信息（名称、链接和密码）
3. 在已保存项目的页面上，点击"一键登录"按钮自动填充密码

### 自定义脚本

1. 点击"新增脚本"按钮创建新的JavaScript脚本
2. 为脚本提供名称和代码
3. 保存后，可以通过脚本列表中的执行按钮运行脚本
4. 脚本直接在页面主环境中执行，可以访问和修改页面DOM和JavaScript对象

### Token管理

通过工具栏按钮快速：
- 获取当前页面的Token
- 设置指定的Token
- 清除Token

## 项目结构

```
tool-plugin/
├── components/            # React组件目录
│   ├── Tool.jsx           # 主要工具组件
│   ├── CodeDesign.jsx     # 代码设计管理组件
│   └── OtherLogin.jsx     # 脚本管理组件
├── contents/              # 内容脚本目录
│   ├── index.js           # 主世界内容脚本
│   ├── bridge.js          # 隔离世界与主世界的桥接脚本
│   └── messages/          # 消息处理器
├── utils/                 # 工具函数目录
│   ├── index.js           # 通用工具函数
│   └── toast.js           # Toast提示工具
├── popup/                 # 弹出窗口目录
│   └── index.jsx          # 弹出窗口入口
├── background/            # 后台脚本目录
│   └── index.ts           # 后台服务工作线程
├── package.json           # 项目配置
└── README.md              # 项目说明文档
```

## 技术栈

- [Plasmo](https://docs.plasmo.com/) - 浏览器扩展开发框架
- [React](https://react.dev/) - 用户界面库
- [Ant Design](https://ant.design/) - UI组件库
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/reference/) - 浏览器扩展API

## 贡献指南

欢迎提交Pull Request或Issue来改进此项目。请确保:

1. 代码遵循项目的编码规范
2. 添加适当的测试
3. 更新相关文档

## 许可证

[MIT](LICENSE)
