# IELTS Speaking AI Practice App

基于大语言模型（LLM）的雅思口语备考 Web 应用。支持用户自定义题库、AI 引导生成个性化语料、以及全真模拟考试交互。

---

## 📁 项目结构

```
ielts-speak-learning/
├── frontend/          # 前端 - Vite + React
├── backend/           # 后端 - Python FastAPI
├── README.md          # 项目启动指南（本文件）
├── DEPLOY.md          # 项目部署指南
└── 雅思口语AI备考应用设计.md  # 产品设计文档
```

---

## 🛠️ 环境要求

| 依赖 | 最低版本 | 推荐版本 |
|------|---------|---------|
| **Node.js** | 18.x | 22.x |
| **npm** | 8.x | 10.x |
| **Python** | 3.9 | 3.11+ |
| **pip** | 21.x | 最新 |

---

## 🚀 快速启动

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd ielts-speak-learning
```

### 2. 启动后端

```bash
# 进入后端目录
cd backend

# (推荐) 创建 Python 虚拟环境
uv venv --python 3.12
source .venv/bin/activate       # macOS / Linux
# venv\Scripts\activate         # Windows

# 安装依赖
uv pip install -r requirements.txt

# 启动开发服务器 (端口 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

启动成功后你会看到：

```
✅ Database initialized and seeded
INFO:     Uvicorn running on http://0.0.0.0:8000
```

> 💡 首次启动时，数据库会自动创建并填充示例雅思题目数据。

### 3. 启动前端

打开 **另一个终端窗口**：

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器 (端口 5173)
npm run dev
```

启动成功后你会看到：

```
VITE v8.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### 4. 开始使用

1. 浏览器打开 **http://localhost:5173**
2. 进入 **Settings（设置）** 页面
3. 输入你的 **OpenAI API Key**（或兼容的 API Key）
4. 选择模型和目标分数
5. 回到 **Practice** 或 **Exam** 开始练习！

---

## 📋 功能模块

| 模块 | 路径 | 说明 |
|------|------|------|
| **Practice (练习)** | `/practice` | AI 引导生成个性化答案 + 语音对练 |
| **Bank (题库)** | `/bank` | 题目管理、导入导出 |
| **Exam (模考)** | `/exam` | 全真 IELTS 口语模拟考试 + 评分报告 |
| **Settings (设置)** | `/settings` | API Key、模型选择、目标分数配置 |

---

## ⚙️ 配置说明

### API Key 配置

应用支持 **OpenAI 兼容接口**。你可以使用以下服务商的 API Key：

| 服务商 | 模型示例 | Base URL |
|--------|---------|----------|
| OpenAI | gpt-4o-mini, gpt-4o | 留空（默认） |
| DeepSeek | deepseek-chat | `https://api.deepseek.com/v1` |
| 其他兼容服务 | 各自模型名 | 填写对应 Base URL |

在 Settings 页面配置完毕后，API Key 会保存在浏览器 **LocalStorage** 中，不会发送到我们的服务器。

### 目标分数

滑动条设置范围：**5.5 - 8.0**

AI 会根据目标分数自动调整：
- 词汇难度和语法复杂度
- 回答长度
- 评分标准严格程度

---

## 🗄️ 后端 API 文档

后端启动后，访问以下地址查看自动生成的 API 文档：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 主要 API 端点

```
GET  /api/questions/topics           # 获取所有话题列表
GET  /api/questions/topics/{id}      # 获取话题详情（含问题和答案）
POST /api/questions/topics           # 创建话题
POST /api/questions/import           # 批量导入题库 (JSON)
PUT  /api/questions/answers          # 保存个人答案

POST /api/practice/random-topics     # 随机抽题
POST /api/practice/generate-answer   # AI 生成个性化答案
POST /api/practice/compare           # 口语对比评估

POST /api/exam/start                 # 开始模拟考试
POST /api/exam/respond               # 发送考生回答
POST /api/exam/transition-part       # 切换考试 Part
POST /api/exam/end                   # 结束考试并获取评分报告
```

---

## 📦 题库导入格式

支持通过 JSON 批量导入题库，格式如下：

```json
{
  "topics": [
    {
      "title": "Hometown",
      "part": "part1",
      "questions": [
        { "text": "Where is your hometown?" },
        { "text": "What do you like most about your hometown?" }
      ]
    },
    {
      "title": "Describe a memorable trip",
      "part": "part2_3",
      "questions": [
        { "text": "Describe a memorable trip you have taken. You should say: where you went, who you went with, what you did, and explain why it was memorable." },
        { "text": "Why do people enjoy traveling?" }
      ]
    }
  ]
}
```

`part` 字段取值：`part1` 或 `part2_3`

---

## 🔧 常见问题

### Q: 前端启动报 `command not found: vite`

使用 `npx vite` 或 `npm run dev` 启动，不要直接运行 `vite` 命令。

### Q: 后端启动报 `command not found: uvicorn`

确保已在虚拟环境中安装依赖，或检查 pip 安装路径是否在 PATH 中：

```bash
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Q: API 调用报错 401 / Invalid API Key

检查 Settings 页面中的 API Key 是否正确配置。如果使用非 OpenAI 服务，需要同时填写正确的 Base URL。

### Q: 语音识别不工作

Web Speech API 需要：
- 使用 **Chrome / Edge** 浏览器
- 允许 **麦克风权限**
- **HTTPS 连接**（localhost 开发环境下可正常使用）

---

## 📄 License

MIT
