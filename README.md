# 基于uni-app的心理健康教育与咨询中心线上平台小程序的设计与实现
心理健康教育与咨询中心线上平台（小程序端）
基于 uni-app 开发的心理健康服务小程序，为学生、咨询师和管理员提供便捷的咨询工单管理、互动评价与站内信沟通等功能。

本项目是心理健康教育与咨询中心线上平台的前端部分，采用前后端分离架构，后端基于 Spring Boot 提供 RESTful API，数据库使用 MySQL。小程序端利用 uni-app 实现一套代码多端发布（支持微信小程序、H5 等），为用户提供流畅的移动端体验。

功能特性
用户管理
支持学生、咨询师、管理员三类角色的注册、登录和基本信息管理；基于 RBAC 模型控制前端菜单和操作权限。

咨询服务工单（核心）
工单的全生命周期管理：学生提交工单 → 咨询师受理 → 咨询中 → 已完成/已关闭。每个状态变更都会记录操作人和时间，确保流程可追溯。

评价与互动
工单完成后，学生可对服务进行一次性评分和文字评价，评价内容直接展示在工单详情页。

点赞功能
支持对工单或文章进行点赞/取消点赞，记录用户行为。

站内私信
采用站内信模式，用户之间可发送私信，系统在数据库中存储消息，登录后拉取未读消息列表。

技术栈
核心框架：uni-app（Vue 语法）

状态管理：Vuex（或 Pinia，视项目配置而定）

UI 组件：uni-ui（来自 uni_modules）及自定义组件

网络请求：uni.request 封装

样式预处理器：SCSS（uni.scss 及 common.scss）

代码规范：ESLint + Prettier（可选）

前置要求
HBuilderX（推荐，或使用 VS Code + uni-app 插件）

Node.js（12.x 或更高版本）

微信开发者工具（如需运行到微信小程序）

了解 Vue 和 uni-app 基础

安装与运行
1. 克隆代码
bash
git clone https://github.com/meseelet993-prog/xk.git
cd uni-app-mental-health
2. 打开项目
使用 HBuilderX 打开项目根目录，或使用命令行工具。

3. 安装依赖（如使用 npm 管理依赖）
如果项目依赖 npm 包（例如项目中有 package.json），执行：

bash
npm install
4. 配置后端 API 地址
在项目中找到 API 配置文件（通常在 api/config.js 或 common/config.js），修改 baseURL 为你的后端服务地址。例如：

javascript
export const baseURL = 'http://localhost:8082/api'; // 开发环境
5. 运行项目
运行到微信小程序：
在 HBuilderX 中，点击工具栏“运行” -> “运行到小程序模拟器” -> “微信开发者工具”。确保已打开微信开发者工具并登录。

运行到 H5：
点击“运行” -> “运行到浏览器”。

6. 预览与调试
成功运行后，可在小程序模拟器或浏览器中预览效果。如需真机调试，可使用微信开发者工具的“真机调试”功能。

目录结构说明
text
uni-app-mental-health/
├── pages/                  # 页面文件
│   ├── index/              # 首页
│   ├── login/              # 登录页
│   ├── order/              # 工单列表/详情
│   ├── message/            # 私信列表/聊天
│   └── profile/            # 个人中心
├── components/             # 公共组件
│   ├── consultant-card/    # 咨询师卡片
│   └── notice-item/        # 通知项
├── api/                    # API 接口封装
│   ├── authApi.js          # 认证相关接口
│   ├── consultantApi.js    # 咨询师相关接口
│   └── orderApi.js         # 工单相关接口
├── static/                 # 静态资源
│   ├── images/             # 图片资源
│   │   ├── banners/        # 轮播图
│   │   ├── icons/          # 图标
│   │   └── avatars/        # 默认头像
│   └── styles/             # 全局样式
│       └── common.scss     # 通用样式
├── uni_modules/            # uni-app 插件市场模块
│   └── uni-ui/             # uni-ui 官方组件库
├── App.vue                 # 应用入口组件
├── main.js                 # 应用入口文件
├── manifest.json           # 应用配置文件（应用ID、权限等）
├── pages.json              # 页面路由配置
└── uni.scss                # 全局样式变量
开发规范
命名规范

文件夹、文件使用小写字母加连字符（kebab-case），如 consultant-card。

Vue 组件名使用多单词，避免与 HTML 元素冲突。

API 函数名使用 camelCase，如 getOrderList。

样式规范

优先使用 flex 布局。

全局颜色、字体变量统一在 uni.scss 中定义，避免魔法数字。

组件样式尽量使用 scoped 防止污染。

状态管理

用户信息、token 等全局状态存放在 Vuex 中，并持久化到 storage。

页面间传参优先使用路由 query 或状态管理，避免滥用全局事件。

接口调用

所有 API 请求统一放在 api/ 目录下，每个模块单独文件。

请求前自动添加 token，响应时统一处理错误码（如 401 跳转登录）。

构建与部署
构建微信小程序
在 HBuilderX 中点击“发行” -> “小程序-微信”。

填写小程序名称和 AppID，点击“发行”。

生成的代码位于 unpackage/dist/build/mp-weixin，使用微信开发者工具打开该目录，上传代码即可。

构建 H5
点击“发行” -> “网站-H5手机版”，生成静态文件后部署到 Web 服务器。
