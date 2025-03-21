# ChatBot V1.0


## 功能特点

- 实时聊天对话
- 文件上传（支持拖拽）
- 用户认证
- 响应式设计
- 多种上传方式（文件、文本、URL）

---

## 📦 依赖环境

### **🔹 生产依赖（Dependencies）**
| 依赖包 | 版本 |
|--------|------|
| **[@clerk/nextjs](https://www.npmjs.com/package/@clerk/nextjs)** | `^6.12.4` |
| **[@prisma/client](https://www.npmjs.com/package/@prisma/client)** | `^6.4.1` |
| **[autoprefixer](https://www.npmjs.com/package/autoprefixer)** | `^10.4.21` |
| **[next](https://www.npmjs.com/package/next)** | `15.2.1` |
| **[next-auth](https://www.npmjs.com/package/next-auth)** | `^5.0.0-beta.25` |
| **[postcss](https://www.npmjs.com/package/postcss)** | `^8.5.3` |
| **[react](https://www.npmjs.com/package/react)** | `^19.0.0` |
| **[react-dom](https://www.npmjs.com/package/react-dom)** | `^19.0.0` |
| **[react-icons](https://www.npmjs.com/package/react-icons)** | `^5.5.0` |
| **[tailwind-merge](https://www.npmjs.com/package/tailwind-merge)** | `^2.5.5` |
| **[tailwindcss-animate](https://www.npmjs.com/package/tailwindcss-animate)** | `^1.0.7` |

---

### **🔹 开发依赖（Dev Dependencies）**
| 依赖包 | 版本 |
|--------|------|
| **[@eslint/eslintrc](https://www.npmjs.com/package/@eslint/eslintrc)** | `^3` |
| **[@tailwindcss/postcss](https://www.npmjs.com/package/@tailwindcss/postcss)** | `^4` |
| **[@types/node](https://www.npmjs.com/package/@types/node)** | `^20` |
| **[@types/react](https://www.npmjs.com/package/@types/react)** | `^19` |
| **[@types/react-dom](https://www.npmjs.com/package/@types/react-dom)** | `^19` |
| **[eslint](https://www.npmjs.com/package/eslint)** | `^9` |
| **[eslint-config-next](https://www.npmjs.com/package/eslint-config-next)** | `15.2.1` |
| **[tailwindcss](https://www.npmjs.com/package/tailwindcss)** | `^4.0.12` |
| **[typescript](https://www.npmjs.com/package/typescript)** | `^5` |

---

## 📂 项目结构
主要文件结构
```
src/
├── app/
│   ├── (main)/              # 主要路由
│   │   ├── layout.tsx       # 主布局
│   │   ├── playground/      # 聊天页面
│   │   └── source/         # 文件上传页面
│   ├── components/          # 可复用组件
│   │   ├── ChatBox.tsx     # 聊天框组件
│   │   ├── ChatInput.tsx   # 聊天输入组件
│   │   ├── ChatMessage.tsx # 消息显示组件
│   │   ├── FileUpload.tsx  # 文件上传组件
│   │   ├── SideNavigation.tsx  # 侧边导航组件
│   │   └── TopNavigation.tsx   # 顶部导航组件
│   └── globals.css         # 全局样式
└── lib/                    # 工具函数和配置
```


## 主要功能说明
### login
1. 第三方github登陆
2. test路由登陆（预设admin用户）

### playground对话
1. 多回合显示
2. 回答md格式显示
3. 流式输出
4. 等待动画
### source上传
1. file文件上传
2. 单次单文件
3. 上传时禁止多次点击
4. 上传成功提示
5. 成功后跳转至playground对话



## 备注
1. 暂未实现基于文件对话功能
2. 仍在尝试不同的大模型api，目前的智力较低，容易出现幻觉
3. 暂未数据库存储


## API 接口

### 聊天接口
- 端点：`http://192.168.105.22:8000/chatbot`
- 方法：GET
- 参数：query（查询文本）

### 文件上传接口
- 端点：`http://192.168.105.22:8000/chatbot/upload/text`
- 方法：POST
- 参数：file（文件数据）